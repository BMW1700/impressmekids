import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Chrome, Building2 } from "lucide-react";
import { detectUserTypeFromEmail } from "@/lib/districtDetection";
import { RoleSelectionModal } from "@/components/auth/RoleSelectionModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"teacher" | "student" | "parent" | "admin">("student");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingDistrictName, setPendingDistrictName] = useState("");
  const [pendingDistrictId, setPendingDistrictId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<('teacher' | 'student' | 'parent')[]>(['student', 'parent']);
  
  // District code for teacher/admin signup
  const [districtCode, setDistrictCode] = useState("");
  const [districtInfo, setDistrictInfo] = useState<{id: string, name: string} | null>(null);
  
  // District selection for student/parent signup
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch all districts for dropdown
  const { data: districts } = useQuery({
    queryKey: ['districts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('districts')
        .select('id, name, district_code')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const redirectToDashboard = (userRole: string) => {
    if (userRole === 'teacher') {
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
          
          if (district.requiresRoleSelection) {
            setPendingDistrictName(district.districtName || "");
            setPendingDistrictId(district.districtId);
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

  const validateDistrictCode = async (code: string) => {
    if (code.length !== 12) return;
    
    const { data, error } = await supabase
      .from('districts')
      .select('id, name')
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
    setIsLoading(true);

    try {
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
        ? districtInfo?.id 
        : selectedDistrictId;
      
      const districtName = (role === 'teacher' || role === 'admin')
        ? districtInfo?.name
        : districts?.find(d => d.id === selectedDistrictId)?.name;

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-white shadow-lg">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Impress Me Kids!</h1>
          <p className="text-white/80">Sign in or create an account to start playing</p>
        </div>

        <Card>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                        onClick={handleResetPassword}
                        disabled={isLoading}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join Impress Me Kids and start learning!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <RadioGroup value={role} onValueChange={(value) => setRole(value as typeof role)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student" className="font-normal cursor-pointer">
                          Student
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="parent" id="parent" />
                        <Label htmlFor="parent" className="font-normal cursor-pointer">
                          Parent
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="teacher" />
                        <Label htmlFor="teacher" className="font-normal cursor-pointer">
                          Teacher
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin" className="font-normal cursor-pointer">
                          District Admin
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* District Code Input for Teacher/Admin */}
                  {(role === 'teacher' || role === 'admin') && (
                    <div className="space-y-2">
                      <Label htmlFor="district-code" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        12-Digit District Code
                      </Label>
                      <Input
                        id="district-code"
                        type="text"
                        placeholder="000000000000"
                        maxLength={12}
                        value={districtCode}
                        onChange={(e) => setDistrictCode(e.target.value)}
                        onBlur={(e) => validateDistrictCode(e.target.value)}
                        required
                      />
                      {districtInfo && (
                        <p className="text-sm text-primary">✓ {districtInfo.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Contact your district administrator for your district code
                      </p>
                    </div>
                  )}

                  {/* District Dropdown for Student/Parent */}
                  {(role === 'student' || role === 'parent') && (
                    <div className="space-y-2">
                      <Label htmlFor="district-select" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Select Your School District
                      </Label>
                      <Select value={selectedDistrictId} onValueChange={setSelectedDistrictId}>
                        <SelectTrigger id="district-select">
                          <SelectValue placeholder="Choose your district..." />
                        </SelectTrigger>
                        <SelectContent>
                          {districts?.map((district) => (
                            <SelectItem key={district.id} value={district.id}>
                              {district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Note: All new accounts require verification and approval by district administrators.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center mt-4">
          <Link to="/" className="text-white hover:text-white/80 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>

      <RoleSelectionModal
        open={showRoleModal}
        districtName={pendingDistrictName}
        availableRoles={availableRoles}
        onSelectRole={handleRoleSelection}
      />
    </div>
  );
};

export default Auth;
