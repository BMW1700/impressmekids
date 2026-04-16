// Edge function counterpart to check-student-signin-rate.
// Marks the most recent failed attempt as succeeded for the same bucket.
// Called AFTER signInWithPassword resolves successfully.
//
// Per FERPA/COPPA mandate: NO IP collection, NO hashing, NO salt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
        JSON.stringify({ ok: false, error: "Invalid Student ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { error } = await supabase.rpc("record_student_id_signin_success", {
      p_ip_hash: NO_IP_BUCKET,
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
