import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Reactive boolean: is the current signed-in user a super_admin?
 * Returns { isSuperAdmin, loading }.
 */
export function useIsSuperAdmin() {
  const { user, isLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.id) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const check = async () => {
      setIsSuperAdmin(false);
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      if (!cancelled) {
        setIsSuperAdmin(!error && !!data);
        setLoading(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoading]);

  return { isSuperAdmin, loading };
}
