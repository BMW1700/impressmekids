// Auto-confirms ONLY synthetic student emails (@student.nabulearn.internal).
// Called by the client immediately after signUp() for Student-ID accounts so
// K-5 students can sign in without an email verification step they can't complete.
// Real teacher/parent emails MUST go through the normal verification flow.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STUDENT_INTERNAL_DOMAIN = "student.nabulearn.internal";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email } = await req.json();

    if (!user_id || typeof user_id !== "string") {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!email || typeof email !== "string" || !email.endsWith(`@${STUDENT_INTERNAL_DOMAIN}`)) {
      // Hard refuse: this endpoint will never confirm a real email.
      return new Response(
        JSON.stringify({ error: "Only synthetic student emails may be auto-confirmed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the user record matches and is in fact a synthetic email
    const { data: userResp, error: getErr } = await admin.auth.admin.getUserById(user_id);
    if (getErr || !userResp?.user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dbEmail = userResp.user.email ?? "";
    if (!dbEmail.endsWith(`@${STUDENT_INTERNAL_DOMAIN}`)) {
      return new Response(
        JSON.stringify({ error: "Refusing to confirm a non-synthetic account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(user_id, {
      email_confirm: true,
    });
    if (updErr) {
      return new Response(
        JSON.stringify({ error: updErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
