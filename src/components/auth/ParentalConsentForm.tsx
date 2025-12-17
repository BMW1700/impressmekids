import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";

interface ParentalConsentFormProps {
  open: boolean;
  studentEmail: string;
  onConsentRequested: (parentEmail: string) => void;
  onCancel: () => void;
}

export function ParentalConsentForm({ open, studentEmail, onConsentRequested, onCancel }: ParentalConsentFormProps) {
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [consentsChecked, setConsentsChecked] = useState({
    dataCollection: false,
    coppaCompliance: false,
    parentalRights: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const allConsentsChecked = Object.values(consentsChecked).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allConsentsChecked) {
      toast.error("Please check all consent boxes to continue");
      return;
    }

    setIsLoading(true);

    try {
      // Check if consent request already exists
      const { data: existingRequest } = await supabase
        .from('student_signup_consents')
        .select('id, consent_given')
        .eq('student_email', studentEmail)
        .maybeSingle();

      // If consent already given, inform user
      if (existingRequest?.consent_given) {
        toast.info("Parental consent has already been verified for this email.");
        setIsLoading(false);
        return;
      }

      // Generate new consent token
      const consentToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      if (existingRequest) {
        // UPDATE existing record with new token and info
        const { error: dbError } = await supabase
          .from('student_signup_consents')
          .update({
            parent_email: parentEmail,
            parent_name: parentName,
            consent_token: consentToken,
            expires_at: expiresAt,
          })
          .eq('id', existingRequest.id);

        if (dbError) throw dbError;
      } else {
        // INSERT new record
        const { error: dbError } = await supabase
          .from('student_signup_consents')
          .insert({
            student_email: studentEmail,
            parent_email: parentEmail,
            parent_name: parentName,
            consent_token: consentToken,
          });

        if (dbError) throw dbError;
      }

      // Send verification email
      const { data, error: emailError } = await supabase.functions.invoke('send-parent-consent-email', {
        body: {
          parentEmail,
          parentName,
          studentEmail,
          consentToken,
        },
      });

      // Check both the invoke error AND any error in the response body
      if (emailError) throw emailError;
      if (data?.error) throw new Error(data.error);

      toast.success("Verification email sent! Please check your parent's inbox.");
      onConsentRequested(parentEmail);
    } catch (error: any) {
      console.error('Error requesting consent:', error);
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Parental Consent Required</DialogTitle>
          </div>
          <DialogDescription>
            Students under 13 need parental consent to create an account. We'll send a verification email to your parent or guardian.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name *</Label>
              <Input
                id="parentName"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Enter parent's full name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent/Guardian Email *</Label>
              <Input
                id="parentEmail"
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <p className="font-semibold text-sm">COPPA Consent Agreement</p>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="dataCollection"
                checked={consentsChecked.dataCollection}
                onCheckedChange={(checked) =>
                  setConsentsChecked((prev) => ({ ...prev, dataCollection: checked as boolean }))
                }
                disabled={isLoading}
              />
              <label htmlFor="dataCollection" className="text-sm leading-relaxed cursor-pointer">
                I understand that ImpressMe Kids will collect my child's name, email, assignment data, and reading analytics for educational purposes only.
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="coppaCompliance"
                checked={consentsChecked.coppaCompliance}
                onCheckedChange={(checked) =>
                  setConsentsChecked((prev) => ({ ...prev, coppaCompliance: checked as boolean }))
                }
                disabled={isLoading}
              />
              <label htmlFor="coppaCompliance" className="text-sm leading-relaxed cursor-pointer">
                I certify that I am the parent or legal guardian of the student signing up, and I consent to the collection, use, and disclosure of my child's information as described in the Privacy Policy.
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="parentalRights"
                checked={consentsChecked.parentalRights}
                onCheckedChange={(checked) =>
                  setConsentsChecked((prev) => ({ ...prev, parentalRights: checked as boolean }))
                }
                disabled={isLoading}
              />
              <label htmlFor="parentalRights" className="text-sm leading-relaxed cursor-pointer">
                I understand my rights to review, request deletion, or revoke consent for my child's data at any time by contacting support.
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!allConsentsChecked || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Email...
                </>
              ) : (
                'Send Verification Email'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
