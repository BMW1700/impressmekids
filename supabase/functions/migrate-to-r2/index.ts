// Migrate Supabase Storage files to Cloudflare R2 (S3-compatible)
// Super-admin only. Batches 25 files per invocation. Idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!; // https://<acct>.r2.cloudflarestorage.com
const R2_BUCKET = "nabulearn-media";

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

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

async function scan(admin: ReturnType<typeof createClient>) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  let discovered = 0;
  for (const b of buckets ?? []) {
    const files = await walkBucket(admin, b.name);
    if (files.length === 0) continue;
    const rows = files.map((f) => ({
      bucket: f.bucket,
      path: f.path,
      size: f.size,
      content_type: f.contentType,
      status: "pending",
    }));
    // Upsert in chunks of 500
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error: upErr } = await admin
        .from("r2_migration_log")
        .upsert(chunk, { onConflict: "bucket,path", ignoreDuplicates: true });
      if (upErr) throw upErr;
    }
    discovered += files.length;
  }
  return discovered;
}

async function copyOne(
  admin: ReturnType<typeof createClient>,
  row: { id: string; bucket: string; path: string; content_type: string | null },
) {
  // Download from Supabase Storage (service role bypasses RLS)
  const { data: blob, error: dlErr } = await admin.storage
    .from(row.bucket)
    .download(row.path);
  if (dlErr || !blob) throw new Error(`download failed: ${dlErr?.message}`);

  const r2Key = `${row.bucket}/${row.path}`;
  const url = `${R2_ENDPOINT}/${R2_BUCKET}/${r2Key}`;
  const body = new Uint8Array(await blob.arrayBuffer());
  const resp = await r2.fetch(url, {
    method: "PUT",
    body,
    headers: {
      "Content-Type": row.content_type || blob.type || "application/octet-stream",
      "Content-Length": String(body.byteLength),
    },
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`R2 PUT ${resp.status}: ${t.slice(0, 200)}`);
  }
  return { r2Key, size: body.byteLength };
}

async function migrateBatch(admin: ReturnType<typeof createClient>, batchSize: number) {
  const { data: pending, error } = await admin
    .from("r2_migration_log")
    .select("id, bucket, path, content_type")
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
          attempts: 1, // reset on success not important; just mark
        })
        .eq("id", (row as any).id);
      ok++;
    } catch (e: any) {
      failed++;
      await admin.rpc("noop_ignore").catch(() => {});
      await admin
        .from("r2_migration_log")
        .update({
          status: "failed",
          error: String(e?.message || e).slice(0, 500),
        })
        .eq("id", (row as any).id);
      await admin
        .from("r2_migration_log")
        .update({ attempts: ((row as any).attempts ?? 0) + 1 })
        .eq("id", (row as any).id);
    }
  }
  return { attempted: pending?.length ?? 0, ok, failed };
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
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    // Verify caller is super_admin
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
    const action = body.action || "batch";

    if (action === "scan") {
      const discovered = await scan(admin);
      return new Response(JSON.stringify({ ok: true, discovered }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "batch") {
      const size = Math.min(Number(body.size) || 25, 50);
      const result = await migrateBatch(admin, size);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "stats") {
      const { data } = await admin
        .from("r2_migration_log")
        .select("status");
      const counts: Record<string, number> = {};
      for (const r of data ?? []) counts[(r as any).status] = (counts[(r as any).status] ?? 0) + 1;
      return new Response(JSON.stringify({ ok: true, counts, total: data?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
