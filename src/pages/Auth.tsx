import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Chrome, Building2, BookOpen, Eye, EyeOff, UserCheck, ArrowLeft, Info, Hash } from "lucide-react";
import { toSyntheticEmail, isStudentId, isSyntheticStudentEmail } from "@/lib/studentIdAuth";
import { detectUserTypeFromEmail } from "@/lib/districtDetection";
import { RoleSelectionModal } from "@/components/auth/RoleSelectionModal";
import { DistrictCombobox } from "@/components/auth/DistrictCombobox";
import { AgeVerificationModal } from "@/components/auth/AgeVerificationModal";
import { ParentalConsentForm } from "@/components/auth/ParentalConsentForm";
import { ConsentPending } from "@/components/auth/ConsentPending";
import { useQuery } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import { AuthResetButton } from "@/components/auth/AuthResetButton";
import { AuthDiagnostics } from "@/components/auth/AuthDiagnostics";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"teacher" | "student" | "parent" | "admin">("student");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [pendingDistrictName, setPendingDistrictName] = useState("");
  const [pendingDistrictId, setPendingDistrictId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<('teacher' | 'student' | 'parent')[]>(['student', 'parent']);

  // Removed withTimeout - was causing login issues

  // District code for teacher/admin signup
  const [districtCode, setDistrictCode] = useState("");
  const [districtInfo, setDistrictInfo] = useState<{district_code: string, name: string} | null>(null);

  // Admin type selection (district admin vs school admin)
  const [adminType, setAdminType] = useState<'district_admin' | 'school_admin' | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [schoolsInDistrict, setSchoolsInDistrict] = useState<Array<{id: string, name: string}>>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // District selection for student/parent signup
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  // COPPA consent flow state
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showParentalConsentForm, setShowParentalConsentForm] = useState(false);
  const [showConsentPending, setShowConsentPending] = useState(false);
  const [parentEmailForConsent, setParentEmailForConsent] = useState("");
  const [isUnder13, setIsUnder13] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState<string>("signin");
  const [loginMode, setLoginMode] = useState<"email" | "studentId">("email");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [duplicateEmailPrompt, setDuplicateEmailPrompt] = useState(false);

  // Substitute teacher mode
  const [isSubstituteMode, setIsSubstituteMode] = useState(false);
  const [substituteCode, setSubstituteCode] = useState("");

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Fetch all districts for dropdown
  const { data: districts } = useQuery({
    queryKey: ['districts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('districts')
        .select('id, name, district_code')
        .eq('is_visible', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const redirectToDashboard = (userRole: string) => {
    if (userRole === 'district_manager') {
      navigate('/district-manager/dashboard');
    } else if (userRole === 'teacher') {
      navigate('/teacher/dashboard');
    } else if (userRole === 'parent') {
      navigate('/parent/dashboard');
    } else if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const [hasCheckedUser, setHasCheckedUser] = useState(false);

  useEffect(() => {
    // Prevent multiple runs - use ref pattern to avoid dependency issues
    if (hasCheckedUser) return;
    setHasCheckedUser(true); // Set immediately to prevent re-runs
    
    // Handle Clever login success/error from URL params
    const cleverLogin = searchParams.get('clever_login');
    const cleverError = searchParams.get('error');

    const clearCleverParams = () => {
      if (searchParams.has('clever_login') || searchParams.has('error')) {
        // Clear params via router so history state stays consistent
        setSearchParams({}, { replace: true });
      }
    };

    if (cleverError) {
      toast({
        title: "Clever login failed",
        description: cleverError,
        variant: "destructive",
      });
      clearCleverParams();
      return;
    }

    if (cleverLogin === 'success') {
      toast({
        title: "Success!",
        description: "Successfully signed in with Clever",
      });
      clearCleverParams();
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return;
        }

        // Check verification status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.is_verified === false) {
          navigate('/pending-verification', { replace: true });
          return;
        }

        // Check if this is an OAuth callback that needs role selection
        const isOAuthCallback = searchParams.get('code') || searchParams.get('access_token');

        if (isOAuthCallback && session.user.email) {
          const district = await detectUserTypeFromEmail(session.user.email);

          if (!district.districtCode) {
            setShowDistrictModal(true);
            setAvailableRoles(district.availableRoles);
            return;
          }

          if (district.requiresRoleSelection) {
            setPendingDistrictName(district.districtName || "");
            setPendingDistrictId(district.districtCode);
            setAvailableRoles(district.availableRoles);
            setShowRoleModal(true);
            return;
          }
        }

        // Get user profile with role
        const { data: profileData, error: rpcError } = await supabase.rpc('get_user_profile', { _user_id: session.user.id });

        if (rpcError) {
          console.error('Profile fetch error:', rpcError);
          return;
        }

        if (profileData && profileData.length > 0 && profileData[0]?.role) {
          redirectToDashboard(profileData[0].role);
        }
      } catch (err) {
        console.error('checkUser error:', err);
      }
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleverSignIn = () => {
    const cleverClientId = import.meta.env.VITE_CLEVER_CLIENT_ID || '';
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-sync-callback`;
    // Generate cryptographic state parameter for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem('clever_oauth_state', state);
    const cleverAuthUrl = `https://clever.com/oauth/authorize?response_type=code&client_id=${cleverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    window.location.href = cleverAuthUrl;
  };

  const validateDistrictCode = async (code: string) => {
    if (code.length !== 12) return;
    
    const { data, error } = await supabase
      .from('districts')
      .select('district_code, name')
      .eq('district_code', code)
      .single();
      
    if (data) {
      setDistrictInfo(data);
      toast({
        title: "District Found",
        description: `${data.name}`,
      });
      
      // If school admin, fetch schools for this district
      if (adminType === 'school_admin') {
        await fetchSchoolsForDistrict(data.district_code);
      }
    } else {
      setDistrictInfo(null);
      setSchoolsInDistrict([]);
      toast({
        title: "Invalid Code",
        description: "District code not found. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const fetchSchoolsForDistrict = async (districtCode: string) => {
    setLoadingSchools(true);
    try {
      const { data: schools, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('district_id', districtCode)
        .order('name');
      
      if (error) throw error;
      setSchoolsInDistrict(schools || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
      setSchoolsInDistrict([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleDistrictSelection = async (districtId: string) => {
    const selectedDistrict = districts?.find(d => d.district_code === districtId);
    if (selectedDistrict) {
      setPendingDistrictId(selectedDistrict.district_code);
      setPendingDistrictName(selectedDistrict.name);
      setShowDistrictModal(false);
      setShowRoleModal(true);
    }
  };

  const handleRoleSelection = async (selectedRole: 'teacher' | 'student' | 'parent') => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Authentication error. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update profile with district info (role stored in user_roles table for security)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          district_id: pendingDistrictId,
          district_name: pendingDistrictName,
          is_verified: false
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Insert role into user_roles table (secure role storage)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.id,
          role: selectedRole
        }, { onConflict: 'user_id,role' });

      if (roleError) throw roleError;

      // Create verification request
      const { error: requestError } = await supabase
        .from('account_verification_requests')
        .insert({
          user_id: user.id,
          profile_id: user.id,
          district_id: pendingDistrictId!,
          district_name: pendingDistrictName,
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email || '',
          requested_role: selectedRole,
          status: 'pending'
        });

      if (requestError) throw requestError;

      setShowRoleModal(false);
      toast({
        title: "Account Created",
        description: "Your account is pending approval from your district administrator.",
      });
      navigate('/pending-verification');
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to set role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine actual email for signup
    const isStudentIdMode = loginMode === 'studentId' && role === 'student';
    const signupEmail = isStudentIdMode ? toSyntheticEmail(studentIdInput) : email;
    
    // For students, show age verification first (skip for Student ID mode — school-managed)
    if (role === 'student' && !isStudentIdMode && !showAgeVerification && !isUnder13 && !showParentalConsentForm) {
      setShowAgeVerification(true);
      return;
    }
    
    setIsLoading(true);

    try {
      // Block district_manager signups completely (hidden role)
      if (role === 'district_manager' as any) {
        toast({
          title: "Invalid Role",
          description: "District Manager accounts cannot be created through signup.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // For students under 13, check if parental consent is verified
      if (role === 'student' && isUnder13) {
        const { data: consent, error: consentError } = await supabase
          .from('student_signup_consents')
          .select('consent_given')
          .eq('student_email', email.toLowerCase().trim())
          .eq('consent_given', true)
          .single();
        
        if (consentError || !consent) {
          toast({
            title: "Parental Consent Required",
            description: "Please wait for your parent to verify consent via email before completing signup.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Validation for teacher signup
      if (role === 'teacher') {
        if (!districtCode || districtCode.length !== 12 || !districtInfo) {
          toast({
            title: "District Code Required",
            description: "Please enter a valid 12-digit district code.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Validation for admin signup
      if (role === 'admin') {
        if (!adminType) {
          toast({
            title: "Admin Type Required",
            description: "Please select whether you are a District Admin or School Admin.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (!districtCode || districtCode.length !== 12 || !districtInfo) {
          toast({
            title: "District Code Required",
            description: "Please enter a valid 12-digit district code.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (adminType === 'school_admin' && !selectedSchoolId) {
          toast({
            title: "School Selection Required",
            description: "Please select the school you will be administering.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Validation for student/parent signup
      if ((role === 'student' || role === 'parent') && !selectedDistrictId) {
        toast({
          title: "District Selection Required",
          description: "Please select your school district.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if email exists
      const { data: profileCheck, error: checkError } = await supabase
        .rpc('check_email_exists_secure', { p_email: email.toLowerCase().trim() });
      
      if (profileCheck === true) {
        setDuplicateEmailPrompt(true);
        setIsLoading(false);
        return;
      }

      // Clear any existing sessions
      await supabase.auth.signOut();

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: window.location.origin + '/auth',
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('User creation failed');

      // Wait for trigger to create profile - with retry verification
      let profileExists = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!profileExists && attempts < maxAttempts) {
        attempts++;
        
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (existingProfile) {
          profileExists = true;
        } else {
          // Wait 500ms before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!profileExists) {
        // Profile trigger failed - clean up auth user
        await supabase.auth.signOut();
        throw new Error('Account setup failed. Please try again.');
      }

      // Get district info
      const districtId = (role === 'teacher' || role === 'admin') 
        ? districtInfo?.district_code 
        : selectedDistrictId;
      
      const districtName = (role === 'teacher' || role === 'admin')
        ? districtInfo?.name
        : districts?.find(d => d.district_code === selectedDistrictId)?.name;

      // For admins, mark as verified immediately (they'll create the first admin manually)
      const isVerified = role === 'admin';

      // Build profile update data
      const profileUpdateData: Record<string, any> = {
        district_id: districtId,
        district_name: districtName,
        is_verified: isVerified
      };

      // Add school_id for school admins
      if (role === 'admin' && adminType === 'school_admin' && selectedSchoolId) {
        profileUpdateData.school_id = selectedSchoolId;
      }

      // Update profile with district info and verification status
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', data.user.id)
        .select();

      if (profileError) throw profileError;
      if (!updatedProfile || updatedProfile.length === 0) {
        throw new Error('Failed to update profile. Please try again.');
      }

      // Insert role into user_roles table (secure role storage)
      const { error: roleInsertError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: data.user.id,
          role: role
        }, { onConflict: 'user_id,role' });

      if (roleInsertError) {
        console.error('Failed to insert role:', roleInsertError);
        // Don't fail signup - the profile trigger may have already created the role
      }

      // Create verification request for all non-admin roles
      if (role === 'teacher' || role === 'student' || role === 'parent') {
        // Validate district_id before creating verification request
        if (!districtId) {
          // Clean up orphan profile if district validation fails
          await supabase.from('profiles').delete().eq('id', data.user.id);
          throw new Error('District ID is required. Please select a valid district.');
        }

        const { error: requestError } = await supabase
          .from('account_verification_requests')
          .insert({
            user_id: data.user.id,
            profile_id: data.user.id,
            district_id: districtId,
            district_name: districtName || '',
            full_name: fullName,
            email: email,
            requested_role: role,
            status: 'pending'
          });

        if (requestError) {
          // Clean up orphan profile if verification request fails
          console.error('Verification request failed, cleaning up profile:', requestError);
          await supabase.from('profiles').delete().eq('id', data.user.id);
          throw new Error('Failed to create verification request. Please try again.');
        }

        toast({
          title: "Account Created",
          description: "Your account is pending approval from your district administrator.",
        });

        navigate('/pending-verification');
      } else {
        toast({
          title: "Admin Account Created",
          description: `Welcome! You can now access the admin dashboard.`,
        });

        redirectToDashboard('admin');
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = error.message || "Failed to create account";
      
      if (error.message?.includes('already registered') || error.message?.includes('duplicate')) {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.message?.includes('password')) {
        errorMessage = "Password must be at least 6 characters long.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth',
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Determine the actual email to use
    const signInEmail = loginMode === 'studentId' 
      ? toSyntheticEmail(studentIdInput) 
      : email;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: signInEmail, password });
      if (error) throw error;
      if (!data.user) throw new Error("Sign in failed");

      // Best-effort verification check (never block sign-in if this fails)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile && profile.is_verified === false) {
          navigate('/pending-verification', { replace: true });
          return;
        }
      } catch {
        // ignore
      }

      // Determine role with fallbacks so login never gets stuck on a missing/broken RPC.
      let userRole: string | null = null;

      try {
        const { data: profileData } = await supabase.rpc('get_user_profile', { _user_id: data.user.id });
        userRole = profileData?.[0]?.role ?? null;
      } catch {
        // ignore
      }

      if (!userRole) {
        try {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id);

          userRole = rolesData?.[0]?.role ?? null;
        } catch {
          // ignore
        }
      }

      if (!userRole) {
        userRole = (data.user.user_metadata as any)?.role ?? null;
      }

      if (!userRole) {
        userRole = 'student';
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      redirectToDashboard(userRole);
    } catch (error: any) {
      console.error('Signin error:', error);

      let errorMessage = error?.message || "Failed to sign in";

      if (errorMessage?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (errorMessage?.includes('Email not confirmed')) {
        errorMessage = "Please confirm your email address before signing in.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubstituteAccess = async () => {
    if (!email.trim() || !substituteCode.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both your email and the access code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_substitute_access', {
        p_email: email.toLowerCase().trim(),
        p_access_code: substituteCode.trim().toUpperCase()
      });
      
      if (error) throw error;
      
      // Cast to expected type
      const result = data as {
        success: boolean;
        error?: string;
        classroom_id?: string;
        permissions?: Record<string, boolean>;
        access_end?: string;
        substitute_name?: string;
        link_id?: string;
      };
      
      if (!result.success) {
        toast({
          title: "Access Denied",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }
      
      // Store substitute session in sessionStorage
      sessionStorage.setItem('substituteAccess', JSON.stringify({
        classroomId: result.classroom_id,
        permissions: result.permissions,
        accessEnd: result.access_end,
        substituteName: result.substitute_name,
        email: email.toLowerCase().trim(),
        linkId: result.link_id
      }));
      
      toast({
        title: "Access Granted!",
        description: `Welcome, ${result.substitute_name || 'Substitute Teacher'}!`,
      });
      
      // Navigate directly to the classroom
      navigate(`/classrooms/${result.classroom_id}`);
    } catch (error: any) {
      console.error('Substitute access error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to validate access code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative z-0 overflow-hidden p-4">
      {/* Fixed background so gradient is identical regardless of tab/content height */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-gradient-hero pointer-events-none" />
      
      {/* Auth diagnostics panel (visible with ?debug=1) */}
      <AuthDiagnostics />

      <div className="w-full max-w-md px-6 py-10 relative z-10 bg-violet-950/35 backdrop-blur-xl rounded-3xl border border-violet-500/20 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 shadow-2xl">
              <img 
                src={logo} 
                alt="NabuLearn" 
                className="h-16 w-16 rounded-lg"
              />
            </div>
          </Link>
        </div>

        {/* Headline */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              NabuLearn
            </span>
          </h1>
          <p className="text-white/50 text-base">
            A unified hub for school communication, learning, and progress.
          </p>
        </div>

        {/* Auth Card */}
        <Tabs value={authTab} onValueChange={(v) => { setAuthTab(v); setDuplicateEmailPrompt(false); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/15 border border-white/20 rounded-xl p-1 mb-6 backdrop-blur">
            <TabsTrigger 
              value="signin" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/70 transition-all"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/70 transition-all"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            {/* SSO Buttons */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border-0 rounded-xl font-medium text-base shadow-lg"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Sign in using your Google account. Great for teachers and parents with personal Google accounts.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 bg-white/15 hover:bg-white/20 text-white border-white/20 rounded-xl font-medium text-base backdrop-blur"
                    onClick={handleCleverSignIn}
                    disabled={isLoading}
                  >
                    <BookOpen className="mr-3 h-5 w-5 text-blue-300" />
                    Continue with Clever
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Clever is a single sign-on platform used by many schools. If your school uses Clever, sign in here with your school credentials.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Substitute Teacher Button */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-14 rounded-xl font-medium text-base backdrop-blur transition-all ${
                      isSubstituteMode 
                        ? 'bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border-amber-500/50' 
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                    onClick={() => {
                      setIsSubstituteMode(!isSubstituteMode);
                      setSubstituteCode("");
                    }}
                    disabled={isLoading}
                  >
                    <UserCheck className="mr-3 h-5 w-5" />
                    I am a Substitute Teacher
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Substitute teachers can access classrooms using a temporary access code provided by the regular teacher. No account needed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/20 backdrop-blur px-4 py-1 rounded-full text-sm text-white/70 border border-white/20">or</span>
              </div>
            </div>

            {/* Substitute Login Form */}
            {isSubstituteMode ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-300 text-sm">
                    Enter the email and access code provided by the teacher to access their classroom.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-email" className="text-white text-sm font-medium">Your Email</Label>
                  <Input
                    id="sub-email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-amber-500 focus:ring-amber-500/20 backdrop-blur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-code" className="text-white text-sm font-medium">Access Code</Label>
                  <Input
                    id="sub-code"
                    type="text"
                    placeholder="XXXXXXXX"
                    maxLength={8}
                    value={substituteCode}
                    onChange={(e) => setSubstituteCode(e.target.value.toUpperCase())}
                    className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-amber-500 focus:ring-amber-500/20 backdrop-blur font-mono tracking-widest text-center"
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handleSubstituteAccess}
                  className="w-full h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-medium text-base shadow-lg shadow-amber-500/25"
                  disabled={isLoading || !email.trim() || substituteCode.length !== 8}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Access Classroom"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubstituteMode(false);
                    setSubstituteCode("");
                  }}
                  className="w-full text-sm text-white/60 hover:text-white/80 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to regular sign in
                </button>
              </div>
            ) : (
              /* Regular Login — with Email / Student ID sub-tabs */
              <div className="space-y-4">
                {/* Login mode toggle */}
                <div className="flex rounded-xl bg-white/10 p-1 border border-white/15">
                  <button
                    type="button"
                    onClick={() => setLoginMode("email")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      loginMode === "email"
                        ? "bg-white/20 text-white"
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMode("studentId")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      loginMode === "studentId"
                        ? "bg-white/20 text-white"
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    <Hash className="h-3.5 w-3.5" />
                    Student ID
                  </button>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4" autoComplete="on">
                  {loginMode === "email" ? (
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-white text-sm font-medium">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        placeholder="you@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur"
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="signin-student-id" className="text-white text-sm font-medium">Student ID</Label>
                      <Input
                        id="signin-student-id"
                        name="student-id"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{8}"
                        maxLength={8}
                        autoComplete="username"
                        placeholder="12345678"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                        className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur font-mono tracking-widest text-center"
                        required
                      />
                      <p className="text-xs text-white/40">Enter your 8-digit Student ID</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-white text-sm font-medium">Password</Label>
                      {loginMode === "email" && (
                        <button
                          type="button"
                          className="text-sm text-purple-400 hover:text-purple-300"
                          onClick={handleResetPassword}
                          disabled={isLoading}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-medium text-base shadow-lg shadow-purple-500/25"
                    disabled={isLoading || (loginMode === 'studentId' && studentIdInput.length !== 8)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  {loginMode === "studentId" && (
                    <p className="text-xs text-white/40 text-center">
                      Forgot your password? Ask your teacher to reset it.
                    </p>
                  )}
                </form>
              </div>
            )}
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            {/* SSO Buttons */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border-0 rounded-xl font-medium text-base shadow-lg"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Sign up using your Google account. Great for teachers and parents with personal Google accounts.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 bg-white/15 hover:bg-white/20 text-white border-white/20 rounded-xl font-medium text-base backdrop-blur"
                    onClick={handleCleverSignIn}
                    disabled={isLoading}
                  >
                    <BookOpen className="mr-3 h-5 w-5 text-blue-300" />
                    Continue with Clever
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Clever is a single sign-on platform used by many schools. If your school uses Clever, sign up here with your school credentials.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/20 backdrop-blur px-4 py-1 rounded-full text-sm text-white/70 border border-white/20">or sign up with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form id="signup-form" onSubmit={handleSignUp} className="space-y-4" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-white text-sm font-medium">Full Name</Label>
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur"
                  required
                />
              </div>

              {/* Student ID / Email toggle — only for student role */}
              {role === 'student' && (
                <div className="flex rounded-xl bg-white/10 p-1 border border-white/15">
                  <button
                    type="button"
                    onClick={() => setLoginMode("email")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      loginMode === "email"
                        ? "bg-white/20 text-white"
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMode("studentId")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      loginMode === "studentId"
                        ? "bg-white/20 text-white"
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    <Hash className="h-3.5 w-3.5" />
                    Student ID
                  </button>
                </div>
              )}

              {/* Email or Student ID input */}
              {loginMode === "studentId" && role === "student" ? (
                <div className="space-y-2">
                  <Label htmlFor="signup-student-id" className="text-white text-sm font-medium">Student ID</Label>
                  <Input
                    id="signup-student-id"
                    name="student-id"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{8}"
                    maxLength={8}
                    placeholder="12345678"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                    className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur font-mono tracking-widest text-center"
                    required
                  />
                  <p className="text-xs text-white/40">Enter your 8-digit Student ID provided by your teacher</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white text-sm font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur"
                    required
                  />
                </div>
              )
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-white text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-white text-sm font-medium">I am a...</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'student', label: 'Student' },
                    { value: 'parent', label: 'Parent' },
                    { value: 'teacher', label: 'Teacher' },
                    { value: 'admin', label: 'Admin' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRole(option.value as typeof role);
                        if (option.value !== 'admin') {
                          setAdminType(null);
                          setSelectedSchoolId("");
                          setSchoolsInDistrict([]);
                        }
                      }}
                      className={`h-11 rounded-xl text-sm font-medium transition-all ${
                        role === option.value
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Type Selection - only for admin role */}
              {role === 'admin' && (
                <div className="space-y-3">
                  <Label className="text-white text-sm font-medium">Admin Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminType('district_admin');
                        setSelectedSchoolId("");
                        setSchoolsInDistrict([]);
                      }}
                      className={`h-11 rounded-xl text-sm font-medium transition-all ${
                        adminType === 'district_admin'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      District Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminType('school_admin');
                        // If district is already validated, fetch schools
                        if (districtInfo) {
                          fetchSchoolsForDistrict(districtInfo.district_code);
                        }
                      }}
                      className={`h-11 rounded-xl text-sm font-medium transition-all ${
                        adminType === 'school_admin'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      School Admin
                    </button>
                  </div>
                </div>
              )}

              {/* District Code Input for Teacher/Admin */}
              {(role === 'teacher' || (role === 'admin' && adminType)) && (
                <div className="space-y-2">
                  <Label htmlFor="district-code" className="text-white text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    District Code
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-white/50 hover:text-white/80 cursor-help transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="max-w-xs z-50">
                          <p>Your district code is a 12-digit number provided by your school administrator. Contact your school's IT department if you don't have it.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="district-code"
                    type="text"
                    placeholder="Enter 12-digit code"
                    maxLength={12}
                    value={districtCode}
                    onChange={(e) => setDistrictCode(e.target.value)}
                    onBlur={(e) => validateDistrictCode(e.target.value)}
                    className="h-12 bg-white/15 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 font-mono backdrop-blur"
                    required
                  />
                  {districtInfo && (
                    <p className="text-sm text-emerald-400">✓ {districtInfo.name}</p>
                  )}
                </div>
              )}

              {/* School Selection for School Admin */}
              {role === 'admin' && adminType === 'school_admin' && districtInfo && (
                <div className="space-y-2">
                  <Label htmlFor="school-select" className="text-white text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Select School
                  </Label>
                  {loadingSchools ? (
                    <div className="flex items-center gap-2 text-white/60 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading schools...
                    </div>
                  ) : schoolsInDistrict.length > 0 ? (
                    <select
                      id="school-select"
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="w-full h-12 bg-white/15 border border-white/20 text-white rounded-xl px-4 focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur"
                      required
                    >
                      <option value="" className="bg-gray-800">Select a school...</option>
                      {schoolsInDistrict.map((school) => (
                        <option key={school.id} value={school.id} className="bg-gray-800">
                          {school.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-amber-400">No schools found in this district. Contact your district admin.</p>
                  )}
                </div>
              )}

              {/* District Dropdown for Student/Parent */}
              {(role === 'student' || role === 'parent') && (
                <div className="space-y-2">
                  <Label htmlFor="district-select" className="text-white text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    School District
                  </Label>
                  <DistrictCombobox
                    value={selectedDistrictId}
                    onValueChange={setSelectedDistrictId}
                    districts={districts || []}
                    placeholder="Select your district..."
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-medium text-base shadow-lg shadow-purple-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-xs text-white/80 text-center">
                All accounts require district administrator approval
              </p>
            </form>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/70 text-sm">
            By continuing, you agree to our{" "}
            <Link to="/policies" className="text-white hover:text-white underline">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/policies" className="text-white hover:text-white underline">Privacy Policy</Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-white/80 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* District Selection Modal for OAuth users without district email */}
      <Dialog open={showDistrictModal}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Select Your District</DialogTitle>
            <DialogDescription className="text-white/60">
              Please select the district you're joining to continue
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <DistrictCombobox
              districts={districts || []}
              value={pendingDistrictId || ""}
              onValueChange={handleDistrictSelection}
            />
            <p className="text-sm text-white/40">
              Can't find your district? Contact your district administrator.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <RoleSelectionModal
        open={showRoleModal}
        districtName={pendingDistrictName}
        availableRoles={availableRoles}
        onSelectRole={handleRoleSelection}
      />
      
      {/* COPPA Age Verification Modal */}
      <AgeVerificationModal
        open={showAgeVerification}
        onSelectAge={(under13) => {
          setIsUnder13(under13);
          setShowAgeVerification(false);
          if (under13) {
            setShowParentalConsentForm(true);
          } else {
            const form = document.getElementById('signup-form') as HTMLFormElement;
            form?.requestSubmit();
          }
        }}
      />
      
      {/* Parental Consent Form Modal */}
      <ParentalConsentForm
        open={showParentalConsentForm}
        studentEmail={email}
        signupData={{
          password,
          fullName,
          role,
          districtId: selectedDistrictId,
        }}
        onConsentRequested={(parentEmail) => {
          setParentEmailForConsent(parentEmail);
          setShowParentalConsentForm(false);
          setShowConsentPending(true);
        }}
        onCancel={() => {
          setShowParentalConsentForm(false);
          setIsUnder13(false);
        }}
      />
      
      {/* Consent Pending Modal */}
      <ConsentPending
        open={showConsentPending}
        parentEmail={parentEmailForConsent}
        onClose={() => {
          setShowConsentPending(false);
          toast({
            title: "Waiting for Consent",
            description: "Once your parent verifies consent, you can complete the signup process.",
          });
        }}
      />
      {/* Duplicate Email Dialog */}
      <Dialog open={duplicateEmailPrompt} onOpenChange={setDuplicateEmailPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Already Exists</DialogTitle>
            <DialogDescription>
              An account with <span className="font-semibold">{email}</span> already exists. Would you like to sign in instead?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDuplicateEmailPrompt(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={() => {
                setDuplicateEmailPrompt(false);
                setAuthTab("signin");
              }}
            >
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Reset button for stuck auth states */}
      <div className="mt-4 flex justify-center">
        <AuthResetButton />
      </div>
    </div>
  );
};

export default Auth;
