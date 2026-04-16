// Edge function: per-Student-ID rate-limit check for Student ID sign-in.
//
// Per FERPA/COPPA & literacy-team mandate: this function collects ZERO
// network identifiers (no IP read, no hashing, no salt). The only
// rate-limit signal is the 8-digit Student ID itself, which is not PPI
// on its own. The DB RPC's per-IP bucket is fed a constant ('none') so
// only the per-Student-ID limit (5 failures / 5 minutes) is enforced.
//
// verify_jwt = false because this is called BEFORE sign-in (no session yet).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Fixed bucket — we do NOT collect IPs. Sized >= 8 chars to satisfy the
// existing RPC's input validation without leaking any client signal.
const NO_IP_BUCKET = "no-ip-collected";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase.rpc("check_student_id_signin_rate", {
      p_ip_hash: NO_IP_BUCKET,
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
      JSON.stringify(data),
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
