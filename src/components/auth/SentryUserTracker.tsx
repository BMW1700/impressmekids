import { useEffect } from 'react';
import { setUserContext, clearUserContext } from '@/lib/sentry';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tracks user authentication state and syncs with Sentry for error context.
 * This component should be placed near the root of the app.
 * 
 * CRITICAL: The onAuthStateChange callback MUST be synchronous to prevent
 * deadlocks. Any async operations (like fetching role) must be deferred
 * with setTimeout(0).
 */
export const SentryUserTracker = () => {
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      clearUserContext();
      return;
    }

    setUserContext(user.id, undefined, isProfileLoading ? undefined : profile?.role ?? undefined);
  }, [user, profile?.role, isLoading, isProfileLoading]);

  return null;
};
