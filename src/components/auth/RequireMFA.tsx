import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LongLoadNotice } from "@/components/system/LongLoadNotice";

/**
 * RequireMFA — gates sensitive routes (teacher / admin / district / parent)
 * behind a verified MFA factor. Students and Game Mode players are not
 * affected by this guard.
 *
 * Behavior:
 *   - If the user has at least one verified MFA factor → renders <Outlet/>.
 *   - If not → shows an in-app enrollment prompt with a link to /account/mfa.
 *
 * The server-side equivalent is the `public.has_verified_mfa(uid)`
 * security-definer function, which RLS policies can reference for
 * defense-in-depth.
 */
export function RequireMFA() {
  const location = useLocation();
  const { session, isLoading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasMFA, setHasMFA] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!session) {
        setChecking(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (cancelled) return;
        if (error) {
          console.warn("[RequireMFA] listFactors failed:", error.message);
          setHasMFA(false);
        } else {
          const verified = (data?.all ?? []).some((f) => f.status === "verified");
          setHasMFA(verified);
        }
      } catch (err) {
        console.warn("[RequireMFA] check error:", err);
        if (!cancelled) setHasMFA(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="mt-4 text-sm text-muted-foreground">Verifying security…</div>
        <LongLoadNotice />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (!hasMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="max-w-lg w-full">
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <CardTitle>Two-factor authentication required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This area handles student records and is restricted by our
              FERPA / SOC 2 controls. You must enroll a second factor before
              you can continue.
            </p>
            <p>
              It takes about 60 seconds — you'll scan a QR code with an
              authenticator app (Google Authenticator, 1Password, Authy).
            </p>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <a href="/account/mfa">Enroll now</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/game">Back to safe area</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
