// Edge function: real per-IP rate-limit check for Student ID sign-in.
// Reads the actual client IP from x-forwarded-for (set by Supabase's edge proxy)
// instead of trusting a localStorage device id, which is trivially bypassable.
//
// Returns { allowed: boolean, error?: string } — same shape as the DB RPC,
// so the client can swap them transparently.
//
// verify_jwt = false because this is called BEFORE sign-in (no session yet).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hash an IP with a server-side salt so we never store raw IPs.
async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get("SIGNIN_IP_SALT") ?? "nl-default-salt-change-me";
  const data = new TextEncoder().encode(`${salt}|${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string {
  // Supabase edge proxy sets x-forwarded-for; first entry is the real client.
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
        JSON.stringify({ allowed: false, error: "Invalid Student ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ip = getClientIp(req);
    const ipHash = await hashIp(ip);

    // Use service-role client to call the existing rate-limit RPC.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase.rpc("check_student_id_signin_rate", {
      p_ip_hash: ipHash,
      p_student_id_attempt: studentId,
    });

    if (error) {
      console.error("[check-student-signin-rate] RPC error:", error);
      // Fail-open so we don't lock real students out on an infra hiccup.
      return new Response(
        JSON.stringify({ allowed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ...(data as object), ip_hash: ipHash }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[check-student-signin-rate] unexpected:", e);
    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
