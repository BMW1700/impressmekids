// Deletes an orphaned synthetic student auth.users row when post-signup steps
// fail (e.g. profile insert collides on unique student_id). Hard-refuses any
// non-synthetic email so this can never delete a real teacher/parent account.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STUDENT_INTERNAL_DOMAIN = "student.yubilearn.internal";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id || typeof user_id !== "string") {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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
        JSON.stringify({ error: "Refusing to delete a non-synthetic account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(user_id);
    if (delErr) {
      return new Response(
        JSON.stringify({ error: delErr.message }),
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
