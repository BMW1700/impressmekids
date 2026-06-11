import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reactive boolean: is the current signed-in user a super_admin?
 * Returns { isSuperAdmin, loading }.
 */
export function useIsSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        if (!cancelled) {
          setIsSuperAdmin(false);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "super_admin")
        .maybeSingle();
      if (!cancelled) {
        setIsSuperAdmin(!error && !!data);
        setLoading(false);
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isSuperAdmin, loading };
}
