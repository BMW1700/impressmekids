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
import { Sparkles, Loader2, Chrome } from "lucide-react";
import { detectUserTypeFromEmail } from "@/lib/districtDetection";
import { RoleSelectionModal } from "@/components/auth/RoleSelectionModal";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"teacher" | "student" | "parent" | "district_admin">("student");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingDistrictName, setPendingDistrictName] = useState("");
  const [pendingDistrictId, setPendingDistrictId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectToDashboard = (userRole: string) => {
    if (userRole === 'teacher') {
      navigate('/teacher/dashboard');
    } else if (userRole === 'parent') {
      navigate('/parent/dashboard');
    } else if (userRole === 'district_admin') {
      navigate('/district/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if this is an OAuth callback that needs role selection
        const urlParams = new URLSearchParams(window.location.search);
        const isOAuthCallback = urlParams.get('code') || urlParams.get('access_token');
        
        if (isOAuthCallback && session.user.email) {
          const district = await detectUserTypeFromEmail(session.user.email);
          
          if (district.requiresRoleSelection && district.districtId) {
            // District staff needs to choose role
            setPendingDistrictName(district.districtName || "");
            setPendingDistrictId(district.districtId);
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
          redirectTo: 'https://impress-me-kids.lovable.app/auth',
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

  const handleRoleSelection = async (selectedRole: 'teacher' | 'student') => {
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
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole,
          district_id: pendingDistrictId 
        })
        .eq('id', user.id);

      if (error) throw error;

      setShowRoleModal(false);
      toast({
        title: "Success",
        description: `Welcome! You're signed in as a ${selectedRole}.`,
      });
      redirectToDashboard(selectedRole);
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
      console.log('🔐 Starting signup process...', { email, role, fullName });
      
      // Check if email already exists in profiles table
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (profileCheck) {
        toast({
          title: "Email already registered",
          description: "This email is already in use. Please sign in instead.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Clear any existing sessions first
      await supabase.auth.signOut();
      console.log('🧹 Cleared existing sessions');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: 'https://impress-me-kids.lovable.app/auth',
        },
      });

      if (error) {
        // Handle duplicate email error from Supabase
        if (error.message.includes('already registered') || error.message.includes('duplicate')) {
          toast({
            title: "Email already registered",
            description: "This email is already in use. Please sign in instead.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (data.user) {
        console.log('✅ User created:', data.user.id);
        console.log('📋 User metadata:', data.user.user_metadata);
        
        // Wait a moment for the profile trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the profile was created with correct role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile verification failed:', profileError);
        } else {
          console.log('✅ Profile verified with role:', profile.role);
        }

        toast({
          title: "Account created!",
          description: `Welcome to Impress Me Kids as a ${role}! 🎉`,
        });

        redirectToDashboard(role);
      }
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || "Failed to create account";
      
      if (error.message?.includes('already registered') || error.message?.includes('duplicate')) {
        errorMessage = "This email is already registered. Please sign in instead or use a different email.";
      } else if (error.message?.includes('password')) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message?.includes('email')) {
        errorMessage = "Please enter a valid email address.";
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 Starting signin process...', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log('✅ User signed in:', data.user.id);
        
        // Fetch user profile to determine role with retry
        let profile = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !profile) {
          attempts++;
          console.log(`📋 Fetching profile (attempt ${attempts}/${maxAttempts})...`);
          
          const { data: profileData, error: profileError } = await supabase
            .rpc('get_user_profile', { _user_id: data.user.id });

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          } else if (profileData && profileData.length > 0) {
            profile = profileData[0];
            console.log('✅ Profile found with role:', profile.role);
          } else {
            console.warn('Profile not found for user:', data.user.id);
            if (attempts < maxAttempts) {
              console.log('⏳ Profile not ready, waiting...');
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        if (!profile) {
          throw new Error('Profile not found. Please try again.');
        }

        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${profile.role}! 🎮`,
        });

        redirectToDashboard(profile.role);
      }
    } catch (error: any) {
      console.error('❌ Signin error:', error);
      
      // Provide user-friendly error messages
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
                    <Label htmlFor="signin-password">Password</Label>
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
                    <RadioGroup value={role} onValueChange={(value) => setRole(value as "teacher" | "student" | "parent" | "district_admin")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student" className="font-normal cursor-pointer">
                          Student
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="teacher" />
                        <Label htmlFor="teacher" className="font-normal cursor-pointer">
                          Teacher
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="parent" id="parent" />
                        <Label htmlFor="parent" className="font-normal cursor-pointer">
                          Parent
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="district_admin" id="district_admin" />
                        <Label htmlFor="district_admin" className="font-normal cursor-pointer">
                          District Admin
                        </Label>
                      </div>
                    </RadioGroup>
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
        onSelectRole={handleRoleSelection}
      />
    </div>
  );
};

export default Auth;
