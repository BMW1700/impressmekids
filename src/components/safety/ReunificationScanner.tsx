import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CheckCircle, Camera, CameraOff, AlertTriangle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setCameraError(null);

    try {
      // Small delay to ensure DOM element is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setCameraError(err.message || "Failed to access camera. Please ensure camera permissions are granted.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanner immediately to prevent multiple scans
    await stopScanner();
    verifyQRCode(decodedText);
  };

  const onScanFailure = (error: string) => {
    // This fires frequently when no QR code is detected - ignore
  };

  const verifyQRCode = async (qrData: string) => {
    try {
      const data = JSON.parse(qrData);

      // Check if QR code has expired
      if (data.expires_at && Date.now() > data.expires_at) {
        toast({
          title: "QR Code Expired",
          description: "This QR code has expired. Please ask the guardian to generate a new one.",
          variant: "destructive",
        });
        return;
      }
      
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

      // Get student and parent details
      const [studentRes, parentRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', data.student_id).single(),
        supabase.from('parent_accounts').select('full_name').eq('id', data.parent_id).single()
      ]);

      setVerificationData({
        student_id: data.student_id,
        parent_id: data.parent_id,
        student_name: studentRes.data?.full_name || 'Unknown Student',
        parent_name: parentRes.data?.full_name || 'Unknown Parent',
        relationship: 'Parent/Guardian',
        scanned_at: new Date().toISOString()
      });

      setShowConfirmDialog(true);
    } catch (error) {
      console.error("QR verification error:", error);
      toast({
        title: "Invalid QR Code",
        description: "Could not parse QR code data. Please try again.",
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
            <div className="space-y-4">
              <Button onClick={startScanner} size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Start Camera Scanner
              </Button>
              
              {cameraError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Camera Error</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-[300px]">
                <div 
                  id={scannerContainerId} 
                  className="rounded-lg overflow-hidden border-2 border-primary"
                />
                <div className="absolute inset-0 pointer-events-none border-4 border-primary/30 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                Point camera at the QR code...
              </p>
              <Button variant="outline" onClick={stopScanner}>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Scanner
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
