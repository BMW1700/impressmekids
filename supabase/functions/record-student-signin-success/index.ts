// Edge function counterpart to check-student-signin-rate.
// Marks the most recent failed attempt as succeeded for the same IP-hash.
// Called AFTER signInWithPassword resolves successfully.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get("SIGNIN_IP_SALT") ?? "nl-default-salt-change-me";
  const data = new TextEncoder().encode(`${salt}|${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const studentId = String(body?.student_id ?? "").trim();

    if (!/^\d{8}$/.test(studentId)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid Student ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ip = getClientIp(req);
    const ipHash = await hashIp(ip);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { error } = await supabase.rpc("record_student_id_signin_success", {
      p_ip_hash: ipHash,
      p_student_id_attempt: studentId,
    });

    if (error) {
      console.warn("[record-student-signin-success] RPC error:", error);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[record-student-signin-success] unexpected:", e);
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
