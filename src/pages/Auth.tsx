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
import { Sparkles, Loader2 } from "lucide-react";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"teacher" | "student" | "parent" | "district_admin">("student");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (profile?.role === 'parent') {
          navigate('/parent/dashboard');
        } else if (profile?.role === 'district_admin') {
          navigate('/district/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 Starting signup process...', { email, role, fullName });
      
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
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;

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

        // Navigate to appropriate dashboard
        if (role === 'teacher') {
          console.log('🎯 Redirecting to teacher dashboard');
          navigate('/teacher/dashboard');
        } else if (role === 'parent') {
          console.log('🎯 Redirecting to parent dashboard');
          navigate('/parent/dashboard');
        } else if (role === 'district_admin') {
          console.log('🎯 Redirecting to district dashboard');
          navigate('/district/dashboard');
        } else {
          console.log('🎯 Redirecting to student dashboard');
          navigate('/student/dashboard');
        }
      }
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
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
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (!profileError && profileData) {
            profile = profileData;
            console.log('✅ Profile found with role:', profile.role);
          } else if (attempts < maxAttempts) {
            console.log('⏳ Profile not ready, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!profile) {
          throw new Error('Profile not found. Please try again.');
        }

        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${profile.role}! 🎮`,
        });

        // Navigate based on role
        if (profile.role === 'teacher') {
          console.log('🎯 Redirecting to teacher dashboard');
          navigate('/teacher/dashboard');
        } else if (profile.role === 'parent') {
          console.log('🎯 Redirecting to parent dashboard');
          navigate('/parent/dashboard');
        } else if (profile.role === 'district_admin') {
          console.log('🎯 Redirecting to district dashboard');
          navigate('/district/dashboard');
        } else {
          console.log('🎯 Redirecting to student dashboard');
          navigate('/student/dashboard');
        }
      }
    } catch (error: any) {
      console.error('❌ Signin error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
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
    </div>
  );
};

export default Auth;
