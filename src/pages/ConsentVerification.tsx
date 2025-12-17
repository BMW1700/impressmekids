import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Loader2, Shield, UserCheck, FileText, Scale } from "lucide-react";

type ConsentStatus = 'loading' | 'awaiting_confirmation' | 'confirming' | 'creating_account' | 'success' | 'error' | 'expired';

interface ConsentData {
  studentEmail: string;
  parentName: string;
  fullName: string;
  districtId: string | null;
  passwordTemp: string | null;
  studentRole: string | null;
}

export default function ConsentVerification() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConsentStatus>('loading');
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  
  // Consent checkboxes
  const [dataCollectionConsent, setDataCollectionConsent] = useState(false);
  const [parentGuardianConsent, setParentGuardianConsent] = useState(false);
  const [parentalRightsConsent, setParentalRightsConsent] = useState(false);

  const allConsentsChecked = dataCollectionConsent && parentGuardianConsent && parentalRightsConsent;

  useEffect(() => {
    loadConsentData();
  }, [token]);

  const loadConsentData = async () => {
    if (!token) {
      setStatus('error');
      return;
    }

    try {
      // Fetch consent request with signup data
      const { data: consent, error: fetchError } = await supabase
        .from('student_signup_consents')
        .select('*')
        .eq('consent_token', token)
        .single();

      if (fetchError || !consent) {
        setStatus('error');
        return;
      }

      // Check if already verified and account created
      if (consent.consent_given) {
        setConsentData({
          studentEmail: consent.student_email,
          parentName: consent.parent_name,
          fullName: consent.full_name || '',
          districtId: consent.district_id,
          passwordTemp: null,
          studentRole: consent.student_role,
        });
        setAccountCreated(true);
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

      // Store consent data and show confirmation form
      setConsentData({
        studentEmail: consent.student_email,
        parentName: consent.parent_name,
        fullName: consent.full_name || '',
        districtId: consent.district_id,
        passwordTemp: consent.password_temp,
        studentRole: consent.student_role,
      });
      setStatus('awaiting_confirmation');
    } catch (error: any) {
      console.error('Error loading consent data:', error);
      setStatus('error');
      toast.error("Failed to load consent request");
    }
  };

  const handleConfirmConsent = async () => {
    if (!token || !consentData || !allConsentsChecked) return;

    setStatus('confirming');

    try {
      // Update consent status
      const { error: updateError } = await supabase
        .from('student_signup_consents')
        .update({
          consent_given: true,
          consent_date: new Date().toISOString(),
        })
        .eq('consent_token', token);

      if (updateError) throw updateError;

      // Check if we have signup data to create the account
      if (consentData.passwordTemp && consentData.fullName) {
        setStatus('creating_account');
        
        // Create the student account
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: consentData.studentEmail,
          password: consentData.passwordTemp,
          options: {
            data: {
              full_name: consentData.fullName,
              role: consentData.studentRole || 'student',
            },
            emailRedirectTo: window.location.origin + '/auth',
          },
        });

        if (signupError) {
          console.error('Error creating account:', signupError);
          toast.error("Consent verified but account creation failed: " + signupError.message);
          setStatus('success');
          return;
        }

        // Clear the temporary password for security
        await supabase
          .from('student_signup_consents')
          .update({ password_temp: null })
          .eq('consent_token', token);

        // If we have district_id, update the profile and create verification request
        if (signupData.user && consentData.districtId) {
          // Wait for trigger to create profile
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Update profile with district_id and ensure is_verified is false
          await supabase
            .from('profiles')
            .update({ 
              district_id: consentData.districtId,
              is_verified: false 
            })
            .eq('id', signupData.user.id);

          // Fetch district name for the verification request
          const { data: districtData } = await supabase
            .from('districts')
            .select('name')
            .eq('district_code', consentData.districtId)
            .single();

          const districtName = districtData?.name || consentData.districtId;

          // Create account verification request for district admin approval
          const { error: verificationError } = await supabase
            .from('account_verification_requests')
            .insert({
              user_id: signupData.user.id,
              profile_id: signupData.user.id,
              district_id: consentData.districtId,
              district_name: districtName,
              full_name: consentData.fullName,
              email: consentData.studentEmail,
              requested_role: 'student',
              status: 'pending'
            });

          if (verificationError) {
            console.error('Error creating verification request:', verificationError);
          }
        }

        setAccountCreated(true);
        toast.success("Account created! Pending district admin approval before the student can sign in.");
      } else {
        toast.success("Parental consent verified! The student can now complete signup.");
      }

      setStatus('success');
    } catch (error: any) {
      console.error('Error verifying consent:', error);
      setStatus('error');
      toast.error("Failed to verify consent");
    }
  };

  const renderConsentForm = () => (
    <div className="space-y-6">
      {/* Consent Details */}
      <div className="rounded-lg bg-muted p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Consent Request Details</span>
        </div>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Parent/Guardian:</span>{" "}
            <span className="font-medium">{consentData?.parentName}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Student Email:</span>{" "}
            <span className="font-medium">{consentData?.studentEmail}</span>
          </p>
          {consentData?.fullName && (
            <p>
              <span className="text-muted-foreground">Student Name:</span>{" "}
              <span className="font-medium">{consentData.fullName}</span>
            </p>
          )}
        </div>
      </div>

      {/* COPPA Consent Statements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Scale className="h-4 w-4 text-primary" />
          <span>COPPA Parental Consent Agreement</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          As required by the Children's Online Privacy Protection Act (COPPA), please review and confirm the following consent statements:
        </p>

        {/* Consent 1: Data Collection */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Checkbox
            id="data-collection"
            checked={dataCollectionConsent}
            onCheckedChange={(checked) => setDataCollectionConsent(checked === true)}
          />
          <label htmlFor="data-collection" className="text-sm leading-relaxed cursor-pointer">
            <span className="font-medium">Data Collection Consent:</span>{" "}
            I consent to the collection of my child's name, email address, assignment data, and reading analytics for educational purposes.
          </label>
        </div>

        {/* Consent 2: Parent/Guardian Certification */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Checkbox
            id="parent-guardian"
            checked={parentGuardianConsent}
            onCheckedChange={(checked) => setParentGuardianConsent(checked === true)}
          />
          <label htmlFor="parent-guardian" className="text-sm leading-relaxed cursor-pointer">
            <span className="font-medium">Parent/Guardian Certification:</span>{" "}
            I certify that I am the parent or legal guardian of this child and have read and agree to the{" "}
            <a 
              href="/policies" 
              target="_blank" 
              className="text-primary underline hover:no-underline"
            >
              Privacy Policy
            </a>.
          </label>
        </div>

        {/* Consent 3: Parental Rights */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Checkbox
            id="parental-rights"
            checked={parentalRightsConsent}
            onCheckedChange={(checked) => setParentalRightsConsent(checked === true)}
          />
          <label htmlFor="parental-rights" className="text-sm leading-relaxed cursor-pointer">
            <span className="font-medium">Parental Rights Acknowledgment:</span>{" "}
            I understand I can review my child's data, request deletion, or revoke this consent at any time by contacting support.
          </label>
        </div>
      </div>

      {/* Confirm Button */}
      <Button
        onClick={handleConfirmConsent}
        className="w-full"
        disabled={!allConsentsChecked}
        size="lg"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        I Confirm My Consent
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By clicking "I Confirm My Consent", you are providing verifiable parental consent as required by COPPA for your child to use ImpressMe Kids.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {(status === 'loading' || status === 'confirming' || status === 'creating_account') && (
              <div className="rounded-full bg-primary/10 p-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            )}
            {status === 'awaiting_confirmation' && (
              <div className="rounded-full bg-primary/10 p-4">
                <FileText className="h-12 w-12 text-primary" />
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
            {status === 'loading' && "Loading Consent Request..."}
            {status === 'awaiting_confirmation' && "Confirm Parental Consent"}
            {status === 'confirming' && "Processing Consent..."}
            {status === 'creating_account' && "Creating Account..."}
            {status === 'success' && (accountCreated ? "Account Created!" : "Consent Verified!")}
            {status === 'expired' && "Consent Link Expired"}
            {status === 'error' && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && "Please wait while we load the consent request"}
            {status === 'awaiting_confirmation' && "Please review and confirm the COPPA consent agreement below"}
            {status === 'confirming' && "Verifying your consent..."}
            {status === 'creating_account' && "Setting up your child's account..."}
            {status === 'success' && (accountCreated ? "Your child's account is pending district admin approval" : "Your child can now complete their account setup")}
            {status === 'expired' && "This verification link has expired"}
            {status === 'error' && "We couldn't verify this consent request"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'awaiting_confirmation' && consentData && renderConsentForm()}

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
                {accountCreated 
                  ? "Your child's account has been created and is awaiting district admin approval. Once approved, they can sign in with their email and password."
                  : "Your child can now return to the signup page and complete their account creation."}
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

          {status !== 'awaiting_confirmation' && (
            <Button
              onClick={() => navigate('/auth')}
              className="w-full"
              disabled={status === 'loading' || status === 'confirming' || status === 'creating_account'}
            >
              {status === 'success' ? (accountCreated ? 'Go to Sign In' : 'Go to Signup') : 'Back to Signup'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
