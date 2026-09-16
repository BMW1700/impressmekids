// Super admin access management: list / search / grant / revoke.
//
// The caller's JWT is verified with the service-role client (never with an
// RLS-scoped anon client) so role checks can't be blocked by row policies.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !serviceKey) {
      console.error("manage-super-admin: missing SUPABASE_URL or service role key");
      return json({ error: "Server is not configured" }, 500);
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      console.error("manage-super-admin: no authorization header");
      return json({ error: "You are signed out. Please sign in again." }, 401);
    }

    const { data: userData, error: authError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (authError || !user) {
      console.error("manage-super-admin: token rejected", authError?.message);
      return json({ error: "Your session expired. Please sign in again." }, 401);
    }

    // Role check with service role (bypasses RLS entirely).
    const [{ data: roleRows }, { data: callerProfile }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id),
      admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    ]);

    const isSuperAdmin =
      (roleRows ?? []).some((r: { role: string }) => r.role === "super_admin") ||
      callerProfile?.role === "super_admin";

    if (!isSuperAdmin) {
      console.error("manage-super-admin: caller is not a super admin", user.id);
      return json({ error: "Super admin access required" }, 403);
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const action = String((body as { action?: string }).action ?? "");
    const query = (body as { query?: string }).query;
    const targetUserId = (body as { targetUserId?: string }).targetUserId;

    if (action === "list") {
      const { data: roles, error } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin");
      if (error) throw error;

      const ids = [...new Set((roles ?? []).map((r: { user_id: string }) => r.user_id))];
      if (ids.length === 0) return json({ admins: [] });

      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ids);

      return json({
        admins: ids.map((id) => {
          const p = profiles?.find((x: { id: string }) => x.id === id);
          return { id, email: p?.email ?? "(unknown)", full_name: p?.full_name ?? "" };
        }),
      });
    }

    if (action === "search") {
      const term = String(query ?? "").trim().replace(/[%,()]/g, "");
      if (term.length < 2) return json({ results: [] });

      const { data, error } = await admin
        .from("profiles")
        .select("id, email, full_name, role")
        .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
        .limit(15);
      if (error) throw error;

      const ids = (data ?? []).map((p: { id: string }) => p.id);
      const { data: roles } = ids.length
        ? await admin.from("user_roles").select("user_id, role").in("user_id", ids)
        : { data: [] as { user_id: string; role: string }[] };

      return json({
        results: (data ?? []).map((p: { id: string; role?: string | null }) => ({
          ...p,
          current_role: roles?.find((r) => r.user_id === p.id)?.role ?? p.role ?? null,
          is_super_admin:
            roles?.some((r) => r.user_id === p.id && r.role === "super_admin") ?? false,
        })),
      });
    }

    if (action === "grant") {
      if (!targetUserId) return json({ error: "Pick a person first" }, 400);

      const { data: existingRows } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId);
      const existingRole = existingRows?.[0]?.role ?? null;

      if (existingRole === "super_admin") return json({ success: true, alreadyGranted: true });

      const { error: grantLogError } = await admin.from("super_admin_grants").upsert(
        { user_id: targetUserId, previous_role: existingRole, granted_by: user.id },
        { onConflict: "user_id" },
      );
      if (grantLogError) console.error("grant log failed (non-fatal):", grantLogError.message);

      const { error } = await admin
        .from("user_roles")
        .upsert({ user_id: targetUserId, role: "super_admin" }, { onConflict: "user_id" });
      if (error) throw error;

      await admin.from("profiles").update({ role: "super_admin" }).eq("id", targetUserId);

      return json({ success: true });
    }

    if (action === "revoke") {
      if (!targetUserId) return json({ error: "Pick a person first" }, 400);
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

      await admin.from("profiles").update({ role: previous }).eq("id", targetUserId);
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
