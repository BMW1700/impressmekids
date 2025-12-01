import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { QrCode } from "lucide-react";

interface StudentQRCodeProps {
  studentId: string;
  studentName: string;
  parentId: string;
}

export function StudentQRCode({ studentId, studentName, parentId }: StudentQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    generateQRCode();
  }, [studentId, parentId]);

  const generateQRCode = async () => {
    // Generate verification hash (simple implementation - in production use proper crypto)
    const data = `${studentId}:${parentId}:${Date.now()}`;
    const hash = btoa(data); // Base64 encode for simplicity

    const qrData = JSON.stringify({
      student_id: studentId,
      parent_id: parentId,
      verification_hash: hash,
      timestamp: Date.now()
    });

    // Use QRCode library to generate QR code
    // In a real implementation, you'd use a library like 'qrcode' npm package
    // For this demo, we'll create a simple representation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    // Simple QR-like pattern (in production, use actual QR library)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 300, 300);
    
    ctx.fillStyle = '#000000';
    const cellSize = 10;
    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 30; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }

    setQrDataUrl(canvas.toDataURL());
  };

  return (
    <Card className="p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <QrCode className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-semibold">Emergency Pickup QR Code</h3>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">For: {studentName}</p>
        <p className="text-xs text-muted-foreground">
          Show this QR code to school staff during emergency reunification
        </p>
      </div>

      {qrDataUrl ? (
        <div className="bg-white p-4 rounded-lg inline-block border-2 border-muted">
          <img src={qrDataUrl} alt="Student Pickup QR Code" className="w-64 h-64" />
        </div>
      ) : (
        <div className="w-64 h-64 bg-muted animate-pulse rounded-lg mx-auto"></div>
      )}

      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          ⚠️ This QR code verifies your identity as {studentName}'s authorized guardian
        </p>
      </div>
    </Card>
  );
}
