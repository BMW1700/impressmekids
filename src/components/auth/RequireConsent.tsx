import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * RequireConsent — COPPA gate.
 *
 * Hard-blocks student usage when:
 *   - the student is under 13 AND
 *   - no verified parental consent exists.
 *
 * Server-side equivalent: `public.is_coppa_blocked(uid)` is referenced
 * by RESTRICTIVE RLS policies on `aura_records`, `reading_sessions`,
 * and `assignment_submissions` for defense-in-depth.
 *
 * Wrap student-data-producing routes (StudentDashboard, AuraPractice,
 * CompleteAssignment) when ready to hard-enforce. Game Mode is
 * unaffected — it's anonymous play.
 */
export function RequireConsent() {
  const location = useLocation();
  const { session, isLoading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!session) {
        setChecking(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc("is_coppa_blocked", {
          _user_id: session.user.id,
        });
        if (cancelled) return;
        if (error) {
          // Fail-closed: if we can't verify, assume blocked for safety.
          console.warn("[RequireConsent] is_coppa_blocked failed:", error.message);
          setBlocked(true);
        } else {
          setBlocked(Boolean(data));
        }
      } catch (err) {
        console.warn("[RequireConsent] check error:", err);
        if (!cancelled) setBlocked(true);
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
        <div className="mt-4 text-sm text-muted-foreground">Verifying…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="max-w-lg w-full">
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle>Parent permission needed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              To follow the federal Children's Online Privacy Protection
              Act (COPPA), we need a parent or guardian to confirm your
              account before you can use this part of YubiLearn.
            </p>
            <p>
              Ask your parent to check their email for a message from
              YubiLearn — or visit our parent permission page below.
            </p>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <a href="/game">Play Game Mode (no account needed)</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/game/legal/coppa">Parent info</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
