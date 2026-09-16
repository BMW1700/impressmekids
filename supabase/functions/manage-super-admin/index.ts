import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: callerRole } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!callerRole) return json({ error: "Super admin access required" }, 403);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { action, query, targetUserId } = await req.json();

    if (action === "list") {
      const { data: roles, error } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin");
      if (error) throw error;

      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return json({ admins: [] });

      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ids);

      return json({
        admins: ids.map((id) => {
          const p = profiles?.find((x) => x.id === id);
          return { id, email: p?.email ?? "(unknown)", full_name: p?.full_name ?? "" };
        }),
      });
    }

    if (action === "search") {
      const term = String(query ?? "").trim();
      if (term.length < 2) return json({ results: [] });

      const { data, error } = await admin
        .from("profiles")
        .select("id, email, full_name, role")
        .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
        .limit(15);
      if (error) throw error;

      const ids = (data ?? []).map((p) => p.id);
      const { data: roles } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

      return json({
        results: (data ?? []).map((p) => ({
          ...p,
          current_role: roles?.find((r) => r.user_id === p.id)?.role ?? p.role ?? null,
          is_super_admin: roles?.some((r) => r.user_id === p.id && r.role === "super_admin") ?? false,
        })),
      });
    }

    if (action === "grant") {
      if (!targetUserId) return json({ error: "targetUserId is required" }, 400);

      const { data: existing } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (existing?.role === "super_admin") return json({ success: true, alreadyGranted: true });

      await admin.from("super_admin_grants").upsert(
        {
          user_id: targetUserId,
          previous_role: existing?.role ?? null,
          granted_by: user.id,
        },
        { onConflict: "user_id" },
      );

      const { error } = await admin
        .from("user_roles")
        .upsert({ user_id: targetUserId, role: "super_admin" }, { onConflict: "user_id" });
      if (error) throw error;

      return json({ success: true });
    }

    if (action === "revoke") {
      if (!targetUserId) return json({ error: "targetUserId is required" }, 400);
      if (targetUserId === user.id) {
        return json({ error: "You cannot remove your own super admin access" }, 400);
      }

      const { data: grant } = await admin
        .from("super_admin_grants")
        .select("previous_role")
        .eq("user_id", targetUserId)
        .maybeSingle();

      const previous = grant?.previous_role ?? "teacher";

      const { error } = await admin
        .from("user_roles")
        .upsert({ user_id: targetUserId, role: previous }, { onConflict: "user_id" });
      if (error) throw error;

      await admin.from("super_admin_grants").delete().eq("user_id", targetUserId);

      return json({ success: true, restoredRole: previous });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("manage-super-admin error:", error);
    return json({ error: message }, 400);
  }
});
