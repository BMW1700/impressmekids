import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RotateCcw, Loader2 } from 'lucide-react';

/**
 * Emergency reset button for auth state.
 * Clears all auth state and reloads the page.
 * Useful for demos and recovering from stuck states.
 */
export const AuthResetButton = () => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear auth-related localStorage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') ||
          key.includes('auth') ||
          key.includes('sb-')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage
      sessionStorage.clear();
      
      // Force reload to clear any in-memory state
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleReset}
      disabled={isResetting}
      className="text-white/50 hover:text-white hover:bg-white/10 text-xs"
    >
      {isResetting ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <RotateCcw className="h-3 w-3 mr-1" />
      )}
      Reset Login
    </Button>
  );
};
