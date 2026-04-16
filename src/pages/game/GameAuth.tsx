import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft, Gamepad2, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toSyntheticEmail } from "@/lib/studentIdAuth";

const GameAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"email" | "studentId">("email");
  const [studentIdInput, setStudentIdInput] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (session && profile) {
      navigate('/game/dashboard', { replace: true });
    }
  }, [session, profile, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isStudentIdMode = loginMode === "studentId";
    const signupEmail = isStudentIdMode ? toSyntheticEmail(studentIdInput) : email.trim();

    if (!fullName.trim() || !signupEmail || !password.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (isStudentIdMode && studentIdInput.length !== 8) {
      toast({ title: "Please enter a valid 8-digit Student ID", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'game_player',
            ...(isStudentIdMode ? { student_id: studentIdInput } : {}),
          },
          emailRedirectTo: isStudentIdMode ? undefined : window.location.origin,
        },
      });

      if (error) throw error;

      if (data.user && !data.session && !isStudentIdMode) {
        toast({
          title: "Check your email!",
          description: "We sent you a verification link. Please verify your email to continue.",
        });
      } else if (data.session) {
        navigate('/game/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginEmail = loginMode === "studentId" ? toSyntheticEmail(studentIdInput) : email.trim();

    if (!loginEmail || !password.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;
      navigate('/game/dashboard', { replace: true });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const LoginModeToggle = () => (
    <div className="flex rounded-xl bg-white/10 p-1 border border-white/15 mb-4">
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
  );

  const IdentityInput = ({ idPrefix }: { idPrefix: string }) => (
    loginMode === "email" ? (
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`} className="text-white/80">Email</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="player@example.com"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </div>
    ) : (
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-student-id`} className="text-white/80">Student ID</Label>
        <Input
          id={`${idPrefix}-student-id`}
          type="text"
          inputMode="numeric"
          pattern="\d{8}"
          maxLength={8}
          value={studentIdInput}
          onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
          placeholder="12345678"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono tracking-widest text-center"
        />
        <p className="text-xs text-white/40">Enter your 8-digit Student ID</p>
      </div>
    )
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-hero relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgydjJoLTJ2LTJ6bTAtOGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />

      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mode Select
        </Button>

        <div className="text-center mb-8">
          <Gamepad2 className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Game Mode</h1>
          <p className="text-white/60 mt-2">Learn to read through epic adventures</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-[0_8px_32px_rgba(168,85,247,0.3)]">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="login" className="data-[state=active]:bg-white/20 text-white">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white/20 text-white">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-6">
                  <LoginModeToggle />
                  <IdentityInput idPrefix="login" />
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white/80">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    disabled={isLoading || (loginMode === 'studentId' && studentIdInput.length !== 8)}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Login
                  </Button>
                  <p className="text-xs text-white/50 text-center">
                    {loginMode === "studentId" 
                      ? "Forgot your password? Ask your teacher." 
                      : "School accounts work here too!"}
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-6">
                  <LoginModeToggle />
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white/80">Player Name</Label>
                    <Input
                      id="signup-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <IdentityInput idPrefix="signup" />
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white/80">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    disabled={isLoading || (loginMode === 'studentId' && studentIdInput.length !== 8)}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                  <p className="text-xs text-white/50 text-center">
                    By signing up you agree to our{" "}
                    <Link to="/terms-of-service" className="underline hover:text-white/70">Terms</Link> and{" "}
                    <Link to="/privacy-policy" className="underline hover:text-white/70">Privacy Policy</Link>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default GameAuth;
