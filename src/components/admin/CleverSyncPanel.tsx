import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function CleverSyncPanel() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null);
  const [lastSyncMessage, setLastSyncMessage] = useState<string>("");

  const handleCleverSync = () => {
    const cleverClientId = 'afb863b57be9112271e5';
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-sync-callback`;
    const cleverAuthUrl = `https://clever.com/oauth/authorize?response_type=code&client_id=${cleverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&district_id=`;
    
    toast.info("Redirecting to Clever for authorization...");
    window.location.href = cleverAuthUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Clever Integration
        </CardTitle>
        <CardDescription>
          Sync student, teacher, and classroom data from your district's SIS via Clever
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">What Clever Syncs:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Student accounts with grades and enrollment</li>
            <li>Teacher accounts</li>
            <li>Classroom sections with automatic student enrollment</li>
            <li>District information</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={handleCleverSync}
            disabled={isSyncing}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync with Clever
              </>
            )}
          </Button>
        </div>

        {lastSyncStatus && (
          <div className={`flex items-start gap-2 p-3 rounded-lg border ${
            lastSyncStatus === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {lastSyncStatus === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <div className="text-sm">
              <p className="font-medium">
                {lastSyncStatus === 'success' ? 'Sync Successful' : 'Sync Failed'}
              </p>
              {lastSyncMessage && (
                <p className="mt-1 text-xs opacity-80">{lastSyncMessage}</p>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>District admin installs "ImpressMe Kids" from Clever Library</li>
            <li>Click "Sync with Clever" button above</li>
            <li>Authorize data access in Clever portal</li>
            <li>Students/teachers sign in with "Sign in with Clever" button</li>
          </ol>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Clever integration requires your district to have installed the ImpressMe Kids app in their Clever dashboard. 
            Contact your district IT administrator if you don't see ImpressMe Kids in your Clever apps.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
