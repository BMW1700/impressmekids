import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { getMicDiagnostics, ensureMicrophoneAccess, testSpeechRecognition, MicDiagnostics, MicAccessResult } from "@/lib/micDiagnostics";

interface MicTroubleshooterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastError?: string;
  onRetry?: () => void;
}

export const MicTroubleshooterModal = ({
  open,
  onOpenChange,
  lastError,
  onRetry
}: MicTroubleshooterModalProps) => {
  const [diagnostics, setDiagnostics] = useState<MicDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'mic' | 'speech'; success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      runDiagnostics();
    }
  }, [open]);

  const runDiagnostics = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const diag = await getMicDiagnostics();
      setDiagnostics(diag);
      console.log('[MicTroubleshooter] Diagnostics:', diag);
    } catch (err) {
      console.error('[MicTroubleshooter] Failed to get diagnostics:', err);
    }
    setLoading(false);
  };

  const handleTestMic = async () => {
    setTestResult(null);
    const result = await ensureMicrophoneAccess(false);
    setTestResult({
      type: 'mic',
      success: result.success,
      message: result.success ? 'Microphone access granted!' : (result.error?.userMessage || 'Failed to access microphone')
    });
    // Refresh diagnostics after test
    runDiagnostics();
  };

  const handleTestSpeech = async () => {
    setTestResult(null);
    const result = await testSpeechRecognition();
    setTestResult({
      type: 'speech',
      success: result.success,
      message: result.success ? 'Speech recognition is working!' : (result.error || 'Speech recognition failed')
    });
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const getPrimaryIssue = (): { issue: string; action: string; severity: 'error' | 'warning' | 'info' } | null => {
    if (!diagnostics) return null;

    if (diagnostics.isEmbedded) {
      return {
        issue: "App is running in an embedded frame (like Lovable preview)",
        action: "Click 'Open in New Tab' below - microphone often requires a full browser tab",
        severity: 'error'
      };
    }

    if (!diagnostics.isSecureContext) {
      return {
        issue: "Page is not served over HTTPS",
        action: "Microphone requires a secure connection. Please use HTTPS.",
        severity: 'error'
      };
    }

    if (!diagnostics.hasSpeechRecognition) {
      return {
        issue: "Your browser doesn't support Speech Recognition",
        action: "Please use Chrome, Edge, or Safari for speech features.",
        severity: 'error'
      };
    }

    if (diagnostics.permissionState === 'denied') {
      return {
        issue: "Microphone permission was previously denied",
        action: "Click the lock/site-settings icon in your browser's address bar and allow microphone access, then refresh.",
        severity: 'error'
      };
    }

    if (diagnostics.audioInputDevices === 0) {
      return {
        issue: "No microphone detected",
        action: "Please connect a microphone and refresh the page.",
        severity: 'error'
      };
    }

    if (lastError?.includes('not-allowed') || lastError?.includes('NotAllowed')) {
      return {
        issue: "Browser blocked microphone access",
        action: "Check your browser and OS settings to allow microphone for this site.",
        severity: 'warning'
      };
    }

    return null;
  };

  const primaryIssue = getPrimaryIssue();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Microphone Troubleshooter
          </DialogTitle>
          <DialogDescription>
            Let's figure out why the microphone isn't working
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Primary Issue Alert */}
          {primaryIssue && (
            <div className={`p-4 rounded-lg border ${
              primaryIssue.severity === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
              primaryIssue.severity === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' :
              'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  primaryIssue.severity === 'error' ? 'text-red-600' :
                  primaryIssue.severity === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div>
                  <p className="font-medium text-sm">{primaryIssue.issue}</p>
                  <p className="text-sm text-muted-foreground mt-1">{primaryIssue.action}</p>
                </div>
              </div>
            </div>
          )}

          {/* Last Error */}
          {lastError && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Last Error:</p>
              <p className="text-sm font-mono">{lastError}</p>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              testResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
            }`}>
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <p className="text-sm">{testResult.message}</p>
            </div>
          )}

          {/* Diagnostics Grid */}
          {diagnostics && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DiagnosticItem 
                label="Secure Context (HTTPS)" 
                value={diagnostics.isSecureContext} 
              />
              <DiagnosticItem 
                label="Full Browser Tab" 
                value={!diagnostics.isEmbedded} 
                warning={diagnostics.isEmbedded}
              />
              <DiagnosticItem 
                label="getUserMedia Support" 
                value={diagnostics.hasGetUserMedia} 
              />
              <DiagnosticItem 
                label="Speech Recognition" 
                value={diagnostics.hasSpeechRecognition} 
              />
              <DiagnosticItem 
                label="Microphones Found" 
                value={diagnostics.audioInputDevices > 0}
                text={`${diagnostics.audioInputDevices} device(s)`}
              />
              <DiagnosticItem 
                label="Permission State" 
                value={diagnostics.permissionState === 'granted'}
                text={diagnostics.permissionState || 'unknown'}
                warning={diagnostics.permissionState === 'denied'}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {diagnostics?.isEmbedded && (
              <Button onClick={handleOpenNewTab} className="w-full" variant="default">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab (Recommended)
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleTestMic} variant="outline" className="flex-1">
                <Mic className="h-4 w-4 mr-2" />
                Test Microphone
              </Button>
              <Button onClick={handleTestSpeech} variant="outline" className="flex-1">
                <Mic className="h-4 w-4 mr-2" />
                Test Speech
              </Button>
            </div>

            <Button onClick={runDiagnostics} variant="ghost" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Diagnostics
            </Button>

            {onRetry && testResult?.success && (
              <Button onClick={() => { onOpenChange(false); onRetry(); }} className="w-full">
                Try Again
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p><strong>Common fixes:</strong></p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Open in a new browser tab (not embedded preview)</li>
              <li>Check browser address bar for blocked mic icon</li>
              <li>On Mac: System Settings → Privacy → Microphone → Allow browser</li>
              <li>On iOS: Settings → Safari → Microphone → Allow</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface DiagnosticItemProps {
  label: string;
  value: boolean;
  text?: string;
  warning?: boolean;
}

const DiagnosticItem = ({ label, value, text, warning }: DiagnosticItemProps) => (
  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
    <span className="text-muted-foreground">{label}</span>
    {text ? (
      <Badge variant={warning ? "destructive" : value ? "default" : "secondary"}>
        {text}
      </Badge>
    ) : (
      value ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className={`h-4 w-4 ${warning ? 'text-red-600' : 'text-muted-foreground'}`} />
      )
    )}
  </div>
);
