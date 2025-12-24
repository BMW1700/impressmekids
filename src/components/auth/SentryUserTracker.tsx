import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext, clearUserContext } from '@/lib/sentry';

/**
 * Tracks user authentication state and syncs with Sentry for error context.
 * This component should be placed near the root of the app.
 * 
 * CRITICAL: The onAuthStateChange callback MUST be synchronous to prevent
 * deadlocks. Any async operations (like fetching role) must be deferred
 * with setTimeout(0).
 */
export const SentryUserTracker = () => {
  useEffect(() => {
    // Set initial user context if already logged in
    const initializeUserContext = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Set basic context immediately
          setUserContext(session.user.id, session.user.email);
          
          // Fetch role separately (non-blocking)
          fetchAndSetRole(session.user.id);
        }
      } catch (error) {
        console.error('SentryUserTracker init error:', error);
      }
    };

    initializeUserContext();

    // Listen for auth changes - MUST BE SYNCHRONOUS
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Synchronous state updates only
      if (event === 'SIGNED_IN' && session?.user) {
        // Set basic context immediately (no async)
        setUserContext(session.user.id, session.user.email);
        
        // Defer role fetch to prevent deadlock
        setTimeout(() => {
          fetchAndSetRole(session.user.id);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        clearUserContext();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};

/**
 * Fetches user role and updates Sentry context.
 * This is called outside the auth callback to prevent deadlocks.
 */
async function fetchAndSetRole(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_user_profile', { _user_id: userId });
    
    if (!error && data && data.length > 0) {
      const role = data[0]?.role;
      if (role) {
        // Re-set context with role included
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserContext(session.user.id, session.user.email, role);
        }
      }
    }
  } catch (error) {
    // Silent fail - Sentry context is optional
    console.error('Failed to fetch role for Sentry:', error);
  }
}
