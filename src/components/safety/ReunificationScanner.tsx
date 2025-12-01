import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CheckCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReunificationScannerProps {
  reunificationEventId: string;
  onPickupComplete: () => void;
}

export function ReunificationScanner({ reunificationEventId, onPickupComplete }: ReunificationScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  const handleManualEntry = () => {
    // In production, this would open a camera scanner
    // For demo, we'll show a manual entry form
    setScanning(true);
  };

  const verifyQRCode = async (qrData: string) => {
    try {
      const data = JSON.parse(qrData);
      
      // Verify parent-student link
      const { data: link, error } = await supabase
        .from('parent_student_links')
        .select('*')
        .eq('student_id', data.student_id)
        .eq('parent_id', data.parent_id)
        .eq('approved', true)
        .single();

      if (error || !link) {
        toast({
          title: "Verification Failed",
          description: "Invalid QR code or unauthorized guardian",
          variant: "destructive",
        });
        return;
      }

      // Get student and parent details separately
      const { data: student } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.student_id)
        .single();

      const { data: parent } = await supabase
        .from('parent_accounts')
        .select('full_name')
        .eq('id', data.parent_id)
        .single();

      setVerificationData({
        student_id: data.student_id,
        parent_id: data.parent_id,
        student_name: student?.full_name || 'Unknown Student',
        parent_name: parent?.full_name || 'Unknown Parent',
        relationship: 'Parent/Guardian'
      });

      setShowConfirmDialog(true);
      setScanning(false);
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Could not parse QR code data",
        variant: "destructive",
      });
    }
  };

  const confirmPickup = async () => {
    if (!verificationData) return;

    try {
      const { data } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('student_pickups')
        .insert({
          reunification_event_id: reunificationEventId,
          student_id: verificationData.student_id,
          picked_up_by: verificationData.parent_id,
          relationship: verificationData.relationship,
          released_by_teacher_id: data.session?.user.id || null,
          qr_verified: true,
          location: pickupLocation,
          notes: pickupNotes
        });

      if (error) throw error;

      toast({
        title: "Pickup Confirmed",
        description: `${verificationData.student_name} released to ${verificationData.parent_name}`,
      });

      setShowConfirmDialog(false);
      setVerificationData(null);
      setPickupLocation("");
      setPickupNotes("");
      onPickupComplete();
    } catch (error) {
      console.error('Error confirming pickup:', error);
      toast({
        title: "Error",
        description: "Failed to record pickup",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="text-center">
          <QrCode className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Scan Guardian QR Code</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Ask parent/guardian to show their student pickup QR code
          </p>

          {!scanning ? (
            <Button onClick={handleManualEntry} size="lg">
              <QrCode className="mr-2 h-5 w-5" />
              Start Scanner
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">
                  Camera scanner would appear here in production
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  For demo: Enter QR data manually
                </p>
                <Textarea
                  placeholder='{"student_id":"...","parent_id":"...","verification_hash":"..."}'
                  className="font-mono text-xs"
                  rows={4}
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      verifyQRCode(e.target.value);
                    }
                  }}
                />
              </div>
              <Button variant="outline" onClick={() => setScanning(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirm Student Pickup
            </DialogTitle>
            <DialogDescription>
              Verify the information below before releasing the student
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-semibold">Student:</span>
                  <p className="text-lg">{verificationData?.student_name}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold">Guardian:</span>
                  <p className="text-lg">{verificationData?.parent_name}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold">Relationship:</span>
                  <p>{verificationData?.relationship}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="location">Pickup Location</Label>
              <Input
                id="location"
                placeholder="e.g., Main Entrance, Gymnasium"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                rows={2}
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmPickup} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Pickup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
