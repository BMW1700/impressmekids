import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { LongLoadNotice } from "@/components/system/LongLoadNotice";

/**
 * Blocks protected routes until auth is resolved.
 * Prevents pages from getting stuck on local `loading=true` when the user is signed out.
 */
export function RequireAuth() {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="mt-4 text-sm text-muted-foreground">Checking your session…</div>
        <LongLoadNotice />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
