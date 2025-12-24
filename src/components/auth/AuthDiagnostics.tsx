import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

/**
 * Hidden auth diagnostics panel.
 * Visible when ?debug=1 is in the URL.
 * Helps diagnose network vs logic issues.
 */
export const AuthDiagnostics = () => {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<{
    online: boolean;
    origin: string;
    supabaseUrl: boolean;
    authPing: 'idle' | 'loading' | 'success' | 'error';
    authError?: string;
    sessionExists: boolean;
  }>({
    online: navigator.onLine,
    origin: window.location.origin,
    supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    authPing: 'idle',
    sessionExists: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVisible(params.get('debug') === '1');
    
    // Check session
    supabase.auth.getSession().then(({ data }) => {
      setStatus(s => ({ ...s, sessionExists: !!data.session }));
    });

    // Listen for online/offline
    const handleOnline = () => setStatus(s => ({ ...s, online: true }));
    const handleOffline = () => setStatus(s => ({ ...s, online: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pingAuth = async () => {
    setStatus(s => ({ ...s, authPing: 'loading', authError: undefined }));
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`,
        { 
          method: 'GET',
          signal: controller.signal,
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          }
        }
      );
      
      clearTimeout(timeout);
      
      if (response.ok) {
        setStatus(s => ({ ...s, authPing: 'success' }));
      } else {
        setStatus(s => ({ 
          ...s, 
          authPing: 'error', 
          authError: `HTTP ${response.status}` 
        }));
      }
    } catch (error: any) {
      setStatus(s => ({ 
        ...s, 
        authPing: 'error', 
        authError: error.name === 'AbortError' ? 'Timeout (5s)' : error.message 
      }));
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white text-xs p-3 rounded-lg border border-white/20 space-y-2 z-50 max-w-xs">
      <div className="font-bold text-yellow-400 mb-2">Auth Diagnostics</div>
      
      <div className="flex items-center gap-2">
        {status.online ? (
          <CheckCircle className="h-3 w-3 text-green-400" />
        ) : (
          <XCircle className="h-3 w-3 text-red-400" />
        )}
        <span>Network: {status.online ? 'Online' : 'Offline'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {status.supabaseUrl ? (
          <CheckCircle className="h-3 w-3 text-green-400" />
        ) : (
          <XCircle className="h-3 w-3 text-red-400" />
        )}
        <span>Backend Config: {status.supabaseUrl ? 'Present' : 'Missing'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {status.sessionExists ? (
          <CheckCircle className="h-3 w-3 text-green-400" />
        ) : (
          <XCircle className="h-3 w-3 text-yellow-400" />
        )}
        <span>Session: {status.sessionExists ? 'Active' : 'None'}</span>
      </div>
      
      <div className="text-white/60 truncate">
        Origin: {status.origin}
      </div>
      
      <Button
        size="sm"
        variant="outline"
        onClick={pingAuth}
        disabled={status.authPing === 'loading'}
        className="w-full h-7 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        {status.authPing === 'loading' ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3 mr-1" />
        )}
        Ping Auth
      </Button>
      
      {status.authPing === 'success' && (
        <div className="text-green-400">✓ Auth reachable</div>
      )}
      {status.authPing === 'error' && (
        <div className="text-red-400">✗ {status.authError}</div>
      )}
    </div>
  );
};
