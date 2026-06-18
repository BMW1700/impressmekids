import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  // null means "not loaded" (avoid false redirects)
  is_verified: boolean | null;
  school_id: string | null;
  district_id: string | null;
  student_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean; // True only while session is being determined
  isProfileLoading: boolean; // True while profile is being fetched (UI can render)
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Session loading only
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const fetchProfile = async (userId: string): Promise<UserProfile | null | undefined> => {
    try {
      // Run both queries in parallel to halve profile load time.
      const [rpcResult, verificationResult] = await Promise.all([
        supabase.rpc('get_user_profile', { _user_id: userId }),
        supabase
          .from('profiles')
          .select('is_verified, school_id, district_id, email, student_id')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      const { data, error } = rpcResult;
      const { data: verificationData, error: verificationError } = verificationResult;

      // Keep existing profile on transient backend errors to prevent redirect loops.
      if (error) {
        console.error('Error fetching profile via RPC:', error);
        return undefined;
      }

      if (!data || data.length === 0) {
        // RPC returned no row (e.g. student-ID login where get_user_profile
        // doesn't surface a row). Fall back to a minimal profile built from
        // the verification select so the UI never strands `profile = null`
        // for a signed-in user (which made the dashboard say "Adventurer").
        if (verificationData) {
          return {
            id: userId,
            email: verificationData.email ?? null,
            full_name: null,
            role: null,
            is_verified: verificationData.is_verified ?? null,
            school_id: verificationData.school_id ?? null,
            district_id: verificationData.district_id ?? null,
            student_id: verificationData.student_id ?? null,
          };
        }
        return null;
      }

      const profileData = data[0];

      if (verificationError) {
        console.error('Error fetching verification data:', verificationError);
      }

      return {
        id: profileData.id,
        email: verificationData?.email ?? null,
        full_name: profileData.full_name,
        role: profileData.role,
        // If we can't read it for any reason, keep null so the UI doesn't force a pending redirect.
        is_verified: verificationData?.is_verified ?? null,
        school_id: verificationData?.school_id ?? null,
        district_id: verificationData?.district_id ?? null,
        student_id: verificationData?.student_id ?? null,
      };
    } catch (error) {
      // Keep previous profile during unexpected fetch errors (especially on tab return token refresh).
      console.error('Error fetching profile:', error);
      return undefined;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const syncSession = (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);

      if (!nextSession?.user) {
        setProfile(null);
        setIsProfileLoading(false);
      }
    };

    // Auth listener only syncs session/user state.
    // Profile fetching is handled in a separate effect to avoid auth callback timing issues.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        syncSession(null);
        return;
      }

      syncSession(nextSession);
    });

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        syncSession(initialSession);
      })
      .catch((error) => {
        console.error('Error getting initial session:', error);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async (userId: string) => {
      setIsProfileLoading(true);
      const nextProfile = await fetchProfile(userId);
      if (!isActive) return;

      if (nextProfile !== undefined) {
        setProfile(nextProfile);
      }

      setIsProfileLoading(false);
    };

    if (!user?.id) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    loadProfile(user.id);

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsProfileLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isProfileLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
