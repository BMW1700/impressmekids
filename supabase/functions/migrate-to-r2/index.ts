// Migrate Supabase Storage files to Cloudflare R2 (S3-compatible)
// Super-admin only. Async scan via EdgeRuntime.waitUntil. Idempotent.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT") ?? "";
const R2_BUCKET = "nabulearn-media";
const MIGRATABLE_BUCKETS = new Set([
  "prek-level-videos",
  "prek-level-audio",
  "world-backgrounds",
  "campaign-assets",
  "avatars",
  "email-assets",
  // Private student audio (FERPA). Reads always go through sign-r2-audio-url,
  // never a public CDN URL — see supabase/functions/sign-r2-audio-url.
  "aura-audio",
]);

function getR2() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
    throw new Error("R2 credentials not configured");
  }
  return new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
}

interface WalkedFile {
  bucket: string;
  path: string;
  size: number | null;
  contentType: string | null;
}

async function walkBucket(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  prefix = "",
  out: WalkedFile[] = [],
): Promise<WalkedFile[]> {
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const entry of data) {
      const isFolder = entry.id === null;
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (isFolder) {
        await walkBucket(admin, bucket, fullPath, out);
      } else {
        out.push({
          bucket,
          path: fullPath,
          size: entry.metadata?.size ?? null,
          contentType: entry.metadata?.mimetype ?? null,
        });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

async function scanInBackground(admin: ReturnType<typeof createClient>) {
  try {
    await admin.from("r2_migration_status").upsert({
      id: 1,
      state: "scanning",
      last_error: null,
      discovered: 0,
      started_at: new Date().toISOString(),
      finished_at: null,
      updated_at: new Date().toISOString(),
    });

    const { data: buckets, error } = await admin.storage.listBuckets();
    if (error) throw error;
    let discovered = 0;
    for (const b of buckets ?? []) {
      const files = await walkBucket(admin, (b as any).name);
      if (files.length === 0) continue;
      const rows = files.map((f) => ({
        bucket: f.bucket,
        path: f.path,
        size: f.size,
        content_type: f.contentType,
        status: "pending",
      }));
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error: upErr } = await admin
          .from("r2_migration_log")
          .upsert(chunk, { onConflict: "bucket,path", ignoreDuplicates: true });
        if (upErr) throw upErr;
      }
      discovered += files.length;
      // Progress update
      await admin.from("r2_migration_status").update({
        discovered,
        updated_at: new Date().toISOString(),
      }).eq("id", 1);
    }

    await admin.from("r2_migration_status").update({
      state: "idle",
      discovered,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
  } catch (e: any) {
    await admin.from("r2_migration_status").update({
      state: "failed",
      last_error: String(e?.message || e).slice(0, 1000),
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
  }
}

async function copyOne(
  admin: ReturnType<typeof createClient>,
  row: { id: string; bucket: string; path: string; content_type: string | null },
) {
  const { data: blob, error: dlErr } = await admin.storage
    .from(row.bucket)
    .download(row.path);
  if (dlErr || !blob) throw new Error(`download failed: ${dlErr?.message}`);

  const r2 = getR2();
  const r2Key = `${row.bucket}/${row.path}`;
  const url = `${R2_ENDPOINT}/${R2_BUCKET}/${r2Key}`;
  const body = new Uint8Array(await blob.arrayBuffer());
  const resp = await r2.fetch(url, {
    method: "PUT",
    body,
    headers: {
      "Content-Type": row.content_type || blob.type || "application/octet-stream",
      "Content-Length": String(body.byteLength),
      // 1 year immutable — files never mutate in place; new versions get new keys.
      // This is THE header that lets Cloudflare hold cache indefinitely at the edge.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`R2 PUT ${resp.status}: ${t.slice(0, 200)}`);
  }
  return { r2Key, size: body.byteLength };
}

function validateCopyPathBody(body: any) {
  const bucket = String(body.bucket || "").trim();
  const path = String(body.path || "").trim().replace(/^\/+/, "");
  const contentType = typeof body.contentType === "string" ? body.contentType.slice(0, 255) : null;
  const size = Number.isFinite(Number(body.size)) ? Number(body.size) : null;
  if (!MIGRATABLE_BUCKETS.has(bucket)) throw new Error("bucket is not R2-enabled");
  if (!path || path.includes("..") || path.startsWith("/")) throw new Error("invalid path");
  return { bucket, path, contentType, size };
}

async function copySinglePath(admin: ReturnType<typeof createClient>, body: any) {
  const { bucket, path, contentType, size } = validateCopyPathBody(body);
  const now = new Date().toISOString();
  const { data: row, error: upsertErr } = await admin
    .from("r2_migration_log")
    .upsert({
      bucket,
      path,
      size,
      content_type: contentType,
      status: "pending",
      error: null,
      updated_at: now,
    }, { onConflict: "bucket,path" })
    .select("id, bucket, path, content_type, attempts")
    .maybeSingle();
  if (upsertErr || !row) throw new Error(`migration log upsert failed: ${upsertErr?.message}`);

  try {
    const copied = await copyOne(admin, row as any);
    await admin
      .from("r2_migration_log")
      .update({
        status: "copied",
        r2_key: copied.r2Key,
        size: copied.size,
        copied_at: now,
        error: null,
        updated_at: now,
      })
      .eq("id", (row as any).id);
    return { copied: true, ...copied };
  } catch (e: any) {
    await admin
      .from("r2_migration_log")
      .update({
        status: "failed",
        attempts: Number((row as any).attempts || 0) + 1,
        error: String(e?.message || e).slice(0, 500),
        updated_at: now,
      })
      .eq("id", (row as any).id);
    throw e;
  }
}

async function migrateBatch(admin: ReturnType<typeof createClient>, batchSize: number) {
  const { data: pending, error } = await admin
    .from("r2_migration_log")
    .select("id, bucket, path, content_type, attempts")
    .in("status", ["pending", "failed"])
    .lt("attempts", 5)
    .order("created_at", { ascending: true })
    .limit(batchSize);
  if (error) throw error;

  let ok = 0;
  let failed = 0;
  for (const row of pending ?? []) {
    try {
      const { r2Key, size } = await copyOne(admin, row as any);
      await admin
        .from("r2_migration_log")
        .update({
          status: "copied",
          r2_key: r2Key,
          size,
          copied_at: new Date().toISOString(),
          error: null,
        })
        .eq("id", (row as any).id);
      ok++;
    } catch (e: any) {
      failed++;
      await admin
        .from("r2_migration_log")
        .update({
          status: "failed",
          attempts: Number((row as any).attempts || 0) + 1,
          error: String(e?.message || e).slice(0, 500),
        })
        .eq("id", (row as any).id);
    }
  }
  return { attempted: pending?.length ?? 0, ok, failed };
}

// Re-PUT metadata (Cache-Control) on already-migrated files via R2 CopyObject.
// Uses x-amz-copy-source with x-amz-metadata-directive: REPLACE so we do NOT
// re-download from Supabase — a pure R2-internal copy, near-zero cost.
async function repatchHeadersBatch(
  admin: ReturnType<typeof createClient>,
  batchSize: number,
  cursor: string | null,
) {
  let q = admin
    .from("r2_migration_log")
    .select("id, bucket, path, content_type, r2_key")
    .eq("status", "copied")
    .order("id", { ascending: true })
    .limit(batchSize);
  if (cursor) q = q.gt("id", cursor);
  const { data: rows, error } = await q;
  if (error) throw error;

  const r2 = getR2();
  let ok = 0;
  let failed = 0;
  let lastId: string | null = null;
  for (const row of rows ?? []) {
    lastId = (row as any).id;
    const r2Key = (row as any).r2_key || `${(row as any).bucket}/${(row as any).path}`;
    const url = `${R2_ENDPOINT}/${R2_BUCKET}/${r2Key}`;
    try {
      const resp = await r2.fetch(url, {
        method: "PUT",
        headers: {
          "x-amz-copy-source": `/${R2_BUCKET}/${r2Key}`,
          "x-amz-metadata-directive": "REPLACE",
          "Content-Type": (row as any).content_type || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`R2 COPY ${resp.status}: ${t.slice(0, 200)}`);
      }
      ok++;
    } catch (e: any) {
      failed++;
      await admin
        .from("r2_migration_log")
        .update({ error: `repatch: ${String(e?.message || e).slice(0, 400)}` })
        .eq("id", (row as any).id);
    }
  }
  return { attempted: rows?.length ?? 0, ok, failed, nextCursor: lastId };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "no auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: "server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isSuper } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "super_admin",
    });
    if (!isSuper) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "stats";

    if (action === "scan") {
      // @ts-ignore - EdgeRuntime is available in Supabase Edge runtime
      EdgeRuntime.waitUntil(scanInBackground(admin));
      return new Response(
        JSON.stringify({ ok: true, status: "scanning" }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (action === "batch") {
      const size = Math.min(Number(body.size) || 25, 50);
      const result = await migrateBatch(admin, size);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "repatch-headers") {
      const size = Math.min(Number(body.size) || 100, 250);
      const cursor = typeof body.cursor === "string" ? body.cursor : null;
      const result = await repatchHeadersBatch(admin, size, cursor);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "copy-path") {
      const result = await copySinglePath(admin, body);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "stats") {
      const { data: rows } = await admin
        .from("r2_migration_log")
        .select("status");
      const counts: Record<string, number> = {};
      for (const r of rows ?? []) counts[(r as any).status] = (counts[(r as any).status] ?? 0) + 1;
      const { data: status } = await admin
        .from("r2_migration_status")
        .select("state, last_error, discovered, started_at, finished_at")
        .eq("id", 1)
        .maybeSingle();
      return new Response(
        JSON.stringify({
          ok: true,
          counts,
          total: rows?.length ?? 0,
          scan: status ?? { state: "idle" },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
