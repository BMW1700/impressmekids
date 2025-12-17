import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Chrome, Building2, BookOpen } from "lucide-react";
import { detectUserTypeFromEmail } from "@/lib/districtDetection";
import { RoleSelectionModal } from "@/components/auth/RoleSelectionModal";
import { DistrictCombobox } from "@/components/auth/DistrictCombobox";
import { AgeVerificationModal } from "@/components/auth/AgeVerificationModal";
import { ParentalConsentForm } from "@/components/auth/ParentalConsentForm";
import { ConsentPending } from "@/components/auth/ConsentPending";
import { useQuery } from "@tanstack/react-query";
import logo from "@/assets/logo.png";

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
  
  // District code for teacher/admin signup
  const [districtCode, setDistrictCode] = useState("");
  const [districtInfo, setDistrictInfo] = useState<{district_code: string, name: string} | null>(null);
  
  // District selection for student/parent signup
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  
  // COPPA consent flow state
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showParentalConsentForm, setShowParentalConsentForm] = useState(false);
  const [showConsentPending, setShowConsentPending] = useState(false);
  const [parentEmailForConsent, setParentEmailForConsent] = useState("");
  const [isUnder13, setIsUnder13] = useState(false);
  
  const navigate = useNavigate();
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

  useEffect(() => {
    // Handle Clever login success/error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const cleverLogin = urlParams.get('clever_login');
    const cleverError = urlParams.get('error');
    
    if (cleverError) {
      toast({
        title: "Clever login failed",
        description: cleverError,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/auth');
    }
    
    if (cleverLogin === 'success') {
      toast({
        title: "Success!",
        description: "Successfully signed in with Clever",
      });
      window.history.replaceState({}, '', '/auth');
    }
    
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check verification status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified, role')
          .eq('id', session.user.id)
          .single();
        
        if (!profile?.is_verified) {
          navigate('/pending-verification');
          return;
        }

        // Check if this is an OAuth callback that needs role selection
        const urlParams = new URLSearchParams(window.location.search);
        const isOAuthCallback = urlParams.get('code') || urlParams.get('access_token');
        
        if (isOAuthCallback && session.user.email) {
          const district = await detectUserTypeFromEmail(session.user.email);
          
          // ALWAYS require district and role selection for OAuth users
          // If no district match, show district selection first
          if (!district.districtCode) {
            setShowDistrictModal(true);
            setAvailableRoles(district.availableRoles);
            return;
          }
          
          // If district matched, proceed to role selection
          if (district.requiresRoleSelection) {
            setPendingDistrictName(district.districtName || "");
            setPendingDistrictId(district.districtCode);
            setAvailableRoles(district.availableRoles);
            setShowRoleModal(true);
            return;
          }
        }

        const { data: profileData, error: profileError } = await supabase
          .rpc('get_user_profile', { _user_id: session.user.id });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else if (profileData && profileData.length > 0) {
          redirectToDashboard(profileData[0].role);
        } else {
          console.warn('Profile not found for user:', session.user.id);
        }
      }
    };

    checkUser();
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
    const cleverClientId = 'afb863b57be9112271e5';
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-sync-callback`;
    const cleverAuthUrl = `https://clever.com/oauth/authorize?response_type=code&client_id=${cleverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
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
    } else {
      setDistrictInfo(null);
      toast({
        title: "Invalid Code",
        description: "District code not found. Please check and try again.",
        variant: "destructive",
      });
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

      // Update profile with selected role and district
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole,
          district_id: pendingDistrictId,
          district_name: pendingDistrictName,
          is_verified: false
        })
        .eq('id', user.id);

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
    
    // For students, show age verification first
    if (role === 'student' && !showAgeVerification && !isUnder13 && !showParentalConsentForm) {
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

      // Validation for teacher/admin signup
      if (role === 'teacher' || role === 'admin') {
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
        toast({
          title: "Email already registered",
          description: "This email is already in use. Please sign in instead.",
          variant: "destructive",
        });
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

      // Wait for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get district info
      const districtId = (role === 'teacher' || role === 'admin') 
        ? districtInfo?.district_code 
        : selectedDistrictId;
      
      const districtName = (role === 'teacher' || role === 'admin')
        ? districtInfo?.name
        : districts?.find(d => d.district_code === selectedDistrictId)?.name;

      // For admins, mark as verified immediately (they'll create the first admin manually)
      const isVerified = role === 'admin';

      // Update profile with district info and verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          district_id: districtId,
          district_name: districtName,
          is_verified: isVerified
        })
        .eq('id', data.user.id);

      if (profileError) throw profileError;

      // Create verification request for all non-admin roles
      if (role === 'teacher' || role === 'student' || role === 'parent') {
        const { error: requestError } = await supabase
          .from('account_verification_requests')
          .insert({
            user_id: data.user.id,
            profile_id: data.user.id,
            district_id: districtId!,
            district_name: districtName || '',
            full_name: fullName,
            email: email,
            requested_role: role,
            status: 'pending'
          });

        if (requestError) throw requestError;

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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check verification status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified, role')
          .eq('id', data.user.id)
          .single();

        if (!profile?.is_verified) {
          navigate('/pending-verification');
          return;
        }

        // Fetch full profile with retry
        let profileData = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !profileData) {
          attempts++;
          
          const { data: pd, error: profileError } = await supabase
            .rpc('get_user_profile', { _user_id: data.user.id });

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          } else if (pd && pd.length > 0) {
            profileData = pd[0];
          } else if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!profileData) {
          throw new Error('Profile not found. Please try again.');
        }

        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${profileData.role}!`,
        });

        redirectToDashboard(profileData.role);
      }
    } catch (error: any) {
      console.error('Signin error:', error);
      
      let errorMessage = error.message || "Failed to sign in";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message?.includes('Email not confirmed')) {
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

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4"
      style={{
        background: 'linear-gradient(135deg, hsl(280 60% 50%) 0%, hsl(300 45% 55%) 35%, hsl(25 60% 65%) 70%, hsl(45 75% 65%) 100%)'
      }}
    >
      <div className="w-full max-w-md px-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 shadow-2xl">
              <img 
                src={logo} 
                alt="ImpressMe Kids" 
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
              ImpressMe Kids
            </span>
          </h1>
          <p className="text-white/50 text-base">
            The literacy platform trusted by schools
          </p>
        </div>

        {/* Auth Card */}
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
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

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl font-medium text-base"
              onClick={handleCleverSignIn}
              disabled={isLoading}
            >
              <BookOpen className="mr-3 h-5 w-5 text-blue-400" />
              Continue with Clever
            </Button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0f0f12] px-4 text-sm text-white/40">or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-white/70 text-sm">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password" className="text-white/70 text-sm">Password</Label>
                  <button
                    type="button"
                    className="text-sm text-purple-400 hover:text-purple-300"
                    onClick={handleResetPassword}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-medium text-base shadow-lg shadow-purple-500/25"
                disabled={isLoading}
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
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            {/* SSO Buttons */}
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

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl font-medium text-base"
              onClick={handleCleverSignIn}
              disabled={isLoading}
            >
              <BookOpen className="mr-3 h-5 w-5 text-blue-400" />
              Continue with Clever
            </Button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0f0f12] px-4 text-sm text-white/40">or sign up with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form id="signup-form" onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-white/70 text-sm">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-white/70 text-sm">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-white/70 text-sm">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                  required
                  minLength={6}
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-white/70 text-sm">I am a...</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'student', label: 'Student' },
                    { value: 'parent', label: 'Parent' },
                    { value: 'teacher', label: 'Teacher' },
                    { value: 'admin', label: 'District Admin' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value as typeof role)}
                      className={`h-11 rounded-xl text-sm font-medium transition-all ${
                        role === option.value
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* District Code Input for Teacher/Admin */}
              {(role === 'teacher' || role === 'admin') && (
                <div className="space-y-2">
                  <Label htmlFor="district-code" className="text-white/70 text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    District Code
                  </Label>
                  <Input
                    id="district-code"
                    type="text"
                    placeholder="Enter 12-digit code"
                    maxLength={12}
                    value={districtCode}
                    onChange={(e) => setDistrictCode(e.target.value)}
                    onBlur={(e) => validateDistrictCode(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 font-mono"
                    required
                  />
                  {districtInfo && (
                    <p className="text-sm text-emerald-400">✓ {districtInfo.name}</p>
                  )}
                </div>
              )}

              {/* District Dropdown for Student/Parent */}
              {(role === 'student' || role === 'parent') && (
                <div className="space-y-2">
                  <Label htmlFor="district-select" className="text-white/70 text-sm flex items-center gap-2">
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

              <p className="text-xs text-white/40 text-center">
                All accounts require district administrator approval
              </p>
            </form>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/30 text-sm">
            By continuing, you agree to our{" "}
            <Link to="/policies" className="text-white/50 hover:text-white/70 underline">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/policies" className="text-white/50 hover:text-white/70 underline">Privacy Policy</Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-white/40 hover:text-white/60 text-sm transition-colors">
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
    </div>
  );
};

export default Auth;
