import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

export default function ConsentVerification() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [consentData, setConsentData] = useState<{
    studentEmail: string;
    parentName: string;
  } | null>(null);

  useEffect(() => {
    verifyConsent();
  }, [token]);

  const verifyConsent = async () => {
    if (!token) {
      setStatus('error');
      return;
    }

    try {
      // Fetch consent request
      const { data: consent, error: fetchError } = await supabase
        .from('student_signup_consents')
        .select('*')
        .eq('consent_token', token)
        .single();

      if (fetchError || !consent) {
        setStatus('error');
        return;
      }

      // Check if already verified
      if (consent.consent_given) {
        setConsentData({
          studentEmail: consent.student_email,
          parentName: consent.parent_name,
        });
        setStatus('success');
        toast.info("This consent has already been verified");
        return;
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(consent.expires_at);
      if (now > expiresAt) {
        setStatus('expired');
        return;
      }

      setConsentData({
        studentEmail: consent.student_email,
        parentName: consent.parent_name,
      });

      // Update consent status
      const { error: updateError } = await supabase
        .from('student_signup_consents')
        .update({
          consent_given: true,
          consent_date: new Date().toISOString(),
        })
        .eq('consent_token', token);

      if (updateError) throw updateError;

      setStatus('success');
      toast.success("Parental consent verified successfully!");
    } catch (error: any) {
      console.error('Error verifying consent:', error);
      setStatus('error');
      toast.error("Failed to verify consent");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="rounded-full bg-primary/10 p-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            )}
            {(status === 'error' || status === 'expired') && (
              <div className="rounded-full bg-destructive/10 p-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && "Verifying Consent..."}
            {status === 'success' && "Consent Verified!"}
            {status === 'expired' && "Consent Link Expired"}
            {status === 'error' && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && "Please wait while we verify your consent"}
            {status === 'success' && "Your child can now complete their account setup"}
            {status === 'expired' && "This verification link has expired"}
            {status === 'error' && "We couldn't verify this consent request"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && consentData && (
            <>
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Consent Details</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Parent/Guardian:</span>{" "}
                    <span className="font-medium">{consentData.parentName}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Student Email:</span>{" "}
                    <span className="font-medium">{consentData.studentEmail}</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Your child can now return to the signup page and complete their account creation.
              </p>
            </>
          )}

          {status === 'expired' && (
            <p className="text-sm text-muted-foreground text-center">
              The verification link expires after 48 hours. Please request a new verification email from the signup page.
            </p>
          )}

          {status === 'error' && (
            <p className="text-sm text-muted-foreground text-center">
              The verification link may be invalid or already used. If you continue to have issues, please contact support.
            </p>
          )}

          <Button
            onClick={() => navigate('/auth')}
            className="w-full"
            disabled={status === 'loading'}
          >
            {status === 'success' ? 'Go to Login' : 'Back to Signup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
