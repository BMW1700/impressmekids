import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { LongLoadNotice } from "@/components/system/LongLoadNotice";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Blocks protected routes until auth is resolved.
 * Uses centralized AuthContext to avoid duplicate getSession() calls.
 */
export function RequireAuth() {
  const location = useLocation();
  const { session, isLoading } = useAuth();

  if (isLoading) {
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
