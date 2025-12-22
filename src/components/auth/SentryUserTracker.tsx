import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext, clearUserContext } from '@/lib/sentry';

/**
 * Tracks user authentication state and syncs with Sentry for error context.
 * This component should be placed near the root of the app.
 */
export const SentryUserTracker = () => {
  useEffect(() => {
    // Set initial user context if already logged in
    const initializeUserContext = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setUserContext(
          session.user.id,
          session.user.email,
          profile?.role
        );
      }
    };

    initializeUserContext();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setUserContext(
          session.user.id,
          session.user.email,
          profile?.role
        );
      } else if (event === 'SIGNED_OUT') {
        clearUserContext();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null; // This component doesn't render anything
};
