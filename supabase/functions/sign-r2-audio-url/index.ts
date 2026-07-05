// Mint a short-lived Cloudflare R2 presigned URL for a private aura-audio object.
//
// FERPA gate: we first ask the existing `get_signed_audio_url` RPC to sign the
// same path in Supabase Storage. That RPC does the full access check (student
// themselves, their teacher, their parent with recording consent) using the
// caller's JWT. If it returns a URL, access is authorized — we discard the
// Supabase URL and instead mint an R2 presigned URL for the same object key.
// Net effect: identical authorization, zero egress cost.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT") ?? "";
const R2_BUCKET = "nabulearn-media";
const AURA_BUCKET = "aura-audio";
const MAX_TTL = 60 * 60; // 1 hour cap
const DEFAULT_TTL = 15 * 60; // 15 min default

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return json({ error: "server misconfigured" }, 500);
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
      return json({ error: "r2 not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const studentId = String(body.studentId || "").trim();
    const rawPath = String(body.path || "").trim().replace(/^\/+/, "");
    const ttl = Math.min(Math.max(Number(body.ttl) || DEFAULT_TTL, 60), MAX_TTL);
    if (!studentId || !rawPath || rawPath.includes("..")) {
      return json({ error: "invalid arguments" }, 400);
    }

    // Client scoped to the caller's JWT so RPC-level auth checks work.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    // Access check delegated to the same RPC the Supabase-Storage path uses.
    // If access is denied, the RPC returns an error or an empty string.
    const { data: authorized, error: accessErr } = await userClient.rpc("get_signed_audio_url", {
      p_student_id: studentId,
      p_audio_path: rawPath,
      p_expires_in: 60, // any positive value — we discard this URL
    });
    if (accessErr) return json({ error: "access denied" }, 403);
    if (!authorized || typeof authorized !== "string") return json({ error: "access denied" }, 403);

    // Mint R2 presigned URL for the same object.
    const r2 = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });
    const r2Key = `${AURA_BUCKET}/${rawPath}`;
    const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${r2Key}`);
    url.searchParams.set("X-Amz-Expires", String(ttl));
    const signed = await r2.sign(url.toString(), {
      method: "GET",
      aws: { signQuery: true },
    });

    return json({ url: signed.url, ttl });
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
