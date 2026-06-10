import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, ShieldAlert, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * /account/mfa — enroll a TOTP authenticator factor.
 *
 * Flow: enroll → render QR + manual secret → user types the first 6-digit
 * code → verify → factor becomes status=verified, which satisfies the
 * `has_verified_mfa(uid)` server-side helper and the <RequireMFA/> guard.
 */
export default function AccountMFA() {
  const { session, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [factors, setFactors] = useState<Array<{ id: string; status: string; friendly_name?: string | null }>>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [pending, setPending] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function refresh() {
    setLoadingFactors(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      setFactors(data.all ?? []);
    }
    setLoadingFactors(false);
  }

  useEffect(() => {
    if (session) refresh();
  }, [session]);

  async function startEnroll() {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
    });
    setEnrolling(false);
    if (error || !data) {
      toast({ title: "Couldn't start enrollment", description: error?.message, variant: "destructive" });
      return;
    }
    setPending({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify() {
    if (!pending || code.trim().length < 6) return;
    setVerifying(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: pending.factorId });
    if (cErr || !challenge) {
      setVerifying(false);
      toast({ title: "Challenge failed", description: cErr?.message, variant: "destructive" });
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: pending.factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setVerifying(false);
    if (vErr) {
      toast({ title: "Code incorrect", description: vErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "MFA enabled", description: "Your account is now protected by a second factor." });
    setPending(null);
    setCode("");
    refresh();
  }

  async function unenroll(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast({ title: "Couldn't remove factor", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Factor removed" });
    refresh();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    navigate("/auth");
    return null;
  }

  const verified = factors.filter((f) => f.status === "verified");
  const unverified = factors.filter((f) => f.status !== "verified");

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Two-factor authentication</h1>
          <p className="text-sm text-muted-foreground">
            Required for teacher, admin, district and parent accounts. Use any TOTP
            authenticator (Google Authenticator, 1Password, Authy, Bitwarden).
          </p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            {verified.length > 0 ? (
              <ShieldCheck className="h-5 w-5 text-primary" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-base">
              {verified.length > 0 ? "MFA enabled" : "MFA not yet enabled"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFactors ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading factors…
              </div>
            ) : (
              <>
                {verified.length > 0 && (
                  <ul className="space-y-2">
                    {verified.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span>{f.friendly_name ?? "Authenticator"}</span>
                        <Button variant="ghost" size="sm" onClick={() => unenroll(f.id)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {unverified.length > 0 && !pending && (
                  <p className="text-xs text-muted-foreground">
                    You have {unverified.length} unverified factor(s). Start a fresh enrollment below.
                  </p>
                )}
                {!pending && (
                  <Button onClick={startEnroll} disabled={enrolling}>
                    {enrolling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {verified.length > 0 ? "Add another authenticator" : "Enroll authenticator"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {pending && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan this QR code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center bg-white p-4 rounded-md">
                <img src={pending.qr} alt="MFA QR code" className="h-48 w-48" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Or paste this secret manually</Label>
                <div className="flex gap-2">
                  <Input readOnly value={pending.secret} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(pending.secret);
                      toast({ title: "Copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="code">6-digit code from your app</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={verify} disabled={verifying || code.length < 6}>
                  {verifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Verify & enable
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await supabase.auth.mfa.unenroll({ factorId: pending.factorId });
                    setPending(null);
                    setCode("");
                    refresh();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
