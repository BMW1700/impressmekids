import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, RefreshCw } from "lucide-react";
import QRCode from "qrcode";

interface StudentQRCodeProps {
  studentId: string;
  studentName: string;
  parentId: string;
}

export function StudentQRCode({ studentId, studentName, parentId }: StudentQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQRCode();
  }, [studentId, parentId]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Create expiration timestamp (24 hours from now)
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 24);
      setExpiresAt(expiration);

      // Generate verification data with timestamp for security
      const qrData = JSON.stringify({
        student_id: studentId,
        parent_id: parentId,
        timestamp: Date.now(),
        expires_at: expiration.getTime()
      });

      // Generate real QR code using qrcode library
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H' // High error correction for better scanning
      });

      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `pickup-qr-${studentName.replace(/\s+/g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const formatExpirationTime = () => {
    if (!expiresAt) return '';
    return expiresAt.toLocaleString();
  };

  return (
    <Card className="p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <QrCode className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-semibold">Emergency Pickup QR Code</h3>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">For: <span className="font-medium text-foreground">{studentName}</span></p>
        <p className="text-xs text-muted-foreground">
          Show this QR code to school staff during emergency reunification
        </p>
      </div>

      {isGenerating ? (
        <div className="w-64 h-64 bg-muted animate-pulse rounded-lg mx-auto flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : qrDataUrl ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg inline-block border-2 border-muted shadow-sm">
            <img 
              src={qrDataUrl} 
              alt="Student Pickup QR Code" 
              className="w-64 h-64"
            />
          </div>
          
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadQRCode}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={generateQRCode}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-64 h-64 bg-muted rounded-lg mx-auto flex items-center justify-center">
          <p className="text-muted-foreground">Failed to generate QR code</p>
        </div>
      )}

      {expiresAt && (
        <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">
            Valid until: <span className="font-medium">{formatExpirationTime()}</span>
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          ⚠️ This QR code verifies your identity as {studentName}'s authorized guardian
        </p>
      </div>
    </Card>
  );
}
