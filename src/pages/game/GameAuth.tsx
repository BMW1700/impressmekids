import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft, Gamepad2, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toSyntheticEmail } from "@/lib/studentIdAuth";
import { redeemClassJoinCode, peekClassJoinCode, type PeekResult } from "@/lib/classJoinCode";
import { checkStudentIdSigninRate, recordStudentIdSigninSuccess } from "@/lib/studentIdRateLimit";

type LoginMode = "email" | "studentId";

const LoginModeToggle = ({
  loginMode,
  onChange,
}: {
  loginMode: LoginMode;
  onChange: (mode: LoginMode) => void;
}) => (
  <div className="flex rounded-xl bg-black/20 p-1 border border-white/15 mb-4">
    <button
      type="button"
      onClick={() => onChange("email")}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
        loginMode === "email" ? "bg-white/25 text-white shadow-sm" : "text-white/60 hover:text-white/80"
      }`}
    >
      Email
    </button>
    <button
      type="button"
      onClick={() => onChange("studentId")}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
        loginMode === "studentId" ? "bg-white/25 text-white shadow-sm" : "text-white/60 hover:text-white/80"
      }`}
    >
      <Hash className="h-3.5 w-3.5" />
      Student ID
    </button>
  </div>
);

const IdentityInput = ({
  idPrefix,
  loginMode,
  email,
  onEmailChange,
  studentIdInput,
  onStudentIdChange,
}: {
  idPrefix: string;
  loginMode: LoginMode;
  email: string;
  onEmailChange: (value: string) => void;
  studentIdInput: string;
  onStudentIdChange: (value: string) => void;
}) =>
  loginMode === "email" ? (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-email`} className="text-white/90 font-medium">Email</Label>
      <Input
        id={`${idPrefix}-email`}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => onEmailChange(e.currentTarget.value)}
        placeholder="player@example.com"
        className="bg-black/20 border-white/20 text-white placeholder:text-white/45 h-11 focus-visible:ring-yellow-400/60 focus-visible:border-yellow-400/50"
      />
    </div>
  ) : (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-student-id`} className="text-white/90 font-medium">Student ID</Label>
      <Input
        id={`${idPrefix}-student-id`}
        type="text"
        inputMode="numeric"
        pattern="\d{8}"
        maxLength={8}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={studentIdInput}
        onChange={(e) => {
          const next = e.currentTarget.value.replace(/\D/g, "").slice(0, 8);
          if (next !== studentIdInput) onStudentIdChange(next);
        }}
        placeholder="12345678"
        className="bg-black/20 border-white/20 text-white placeholder:text-white/40 font-mono tracking-widest text-center h-11 focus-visible:ring-yellow-400/60 focus-visible:border-yellow-400/50"
      />
      <p className="text-xs text-white/50">Enter your 8-digit Student ID</p>
    </div>
  );

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

const CleverIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 7h2v2h-2z"/>
  </svg>
);

const GameAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("email");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [classJoinCode, setClassJoinCode] = useState("");
  const [classCodePeek, setClassCodePeek] = useState<PeekResult | null>(null);
  const [classCodePeekLoading, setClassCodePeekLoading] = useState(false);
  const hasPendingClassCodeValidation =
    loginMode === "studentId" &&
    classJoinCode.trim().length === 6 &&
    (classCodePeekLoading || !classCodePeek?.valid);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, profile } = useAuth();

  // Debounced pre-validation of the optional class join code.
  useEffect(() => {
    const code = classJoinCode.trim();
    if (code.length !== 6) {
      setClassCodePeek(null);
      setClassCodePeekLoading(false);
      return;
    }
    setClassCodePeekLoading(true);
    const handle = setTimeout(async () => {
      const result = await peekClassJoinCode(code);
      setClassCodePeek(result);
      setClassCodePeekLoading(false);
    }, 350);
    return () => clearTimeout(handle);
  }, [classJoinCode]);

  // Handle Clever login success/error from URL params (ported from school Auth.tsx)
  useEffect(() => {
    const cleverLogin = searchParams.get('clever_login');
    const cleverError = searchParams.get('error');
    const returnedState = searchParams.get('state');

    const clearCleverParams = () => {
      if (searchParams.has('clever_login') || searchParams.has('error') || searchParams.has('state')) {
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
      const storedState = sessionStorage.getItem('clever_oauth_state');
      sessionStorage.removeItem('clever_oauth_state');
      if (!storedState || !returnedState || storedState !== returnedState) {
        supabase.auth.signOut().catch(() => {});
        toast({
          title: "Clever login failed",
          description: "Invalid login state. Please try again.",
          variant: "destructive",
        });
        clearCleverParams();
        return;
      }
      toast({ title: "Success!", description: "Successfully signed in with Clever" });
      clearCleverParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if already logged in.
  // If a session exists but the user has no profile row yet (typical on the
  // first OAuth sign-in — Supabase creates auth.users but the app has no
  // handle_new_user trigger, so the profile row must be created here), create
  // a minimal profile + game_player role, then continue to the dashboard.
  // Without this, brand-new Google users land back on /auth with no error.
  useEffect(() => {
    if (!session?.user) return;
    if (profile) {
      navigate('/game/dashboard', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = session.user;
        // Check whether a profile row already exists (avoid duplicate insert races).
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', u.id)
          .maybeSingle();
        if (!existing) {
          const fullName =
            (u.user_metadata?.full_name as string | undefined) ||
            (u.user_metadata?.name as string | undefined) ||
            (u.email ? u.email.split('@')[0] : 'Player');
          await supabase.from('profiles').insert({
            id: u.id,
            email: u.email ?? null,
            full_name: fullName,
            role: 'game_player',
          } as any);
        }
        // Only assign game_player if no role exists — never downgrade an
        // existing role (e.g. super_admin, teacher).
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', u.id)
          .maybeSingle();
        if (!existingRole) {
          await supabase
            .from('user_roles')
            .insert({ user_id: u.id, role: 'game_player' } as any);
        }
      } catch (err) {
        console.error('[GameAuth] auto-provision profile failed:', err);
      } finally {
        if (!cancelled) navigate('/game/dashboard', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, profile, navigate]);

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
          },
        },
      });
      if (error) {
        toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Google sign-in failed", description: error?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleverSignIn = () => {
    const cleverClientId = import.meta.env.VITE_CLEVER_CLIENT_ID || '';
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-sync-callback`;
    const state = crypto.randomUUID();
    sessionStorage.setItem('clever_oauth_state', state);
    const cleverAuthUrl = `https://clever.com/oauth/authorize?response_type=code&client_id=${cleverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    window.location.href = cleverAuthUrl;
  };

  const handleForgotPassword = async () => {
    const target = email.trim();
    if (!target) {
      toast({
        title: "Enter your email first",
        description: "Type your email in the field above, then tap Forgot password again.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: window.location.origin + '/auth',
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We sent you a link to reset your password.",
      });
    } catch (error: any) {
      toast({ title: "Couldn't send reset email", description: error?.message ?? "Try again.", variant: "destructive" });
    }
  };

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

    if (isStudentIdMode && classJoinCode.trim().length === 6) {
      if (classCodePeekLoading) {
        toast({ title: "Checking class code", description: "Please wait a moment while we verify that class code.", variant: "destructive" });
        return;
      }
      if (!classCodePeek?.valid) {
        toast({ title: "Invalid class code", description: classCodePeek?.error ?? "Please fix the class code or clear it to continue.", variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isStudentIdMode) {
        const { data: existingStudent } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', studentIdInput)
          .maybeSingle();
        if (existingStudent) {
          toast({ title: "Student ID already in use", description: "That 8-digit ID is already registered.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
      }

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

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (isStudentIdMode && (msg.includes('23505') || msg.includes('duplicate') || msg.includes('profiles_student_id'))) {
          toast({ title: "Student ID already in use", description: "That 8-digit ID was just registered. Please pick another.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (data.user && isStudentIdMode) {
        const { data: sessionData } = await supabase.auth.signInWithPassword({ email: signupEmail, password });
        if (sessionData?.session) {
          if (classJoinCode.trim()) {
            const redeem = await redeemClassJoinCode(data.user.id, classJoinCode);
            if (!redeem.success) {
              toast({ title: "Joined, but class code didn't work", description: redeem.error ?? "Ask your teacher for the correct code.", variant: "destructive" });
            } else {
              toast({ title: "Joined your class!", description: "You're on the roster." });
            }
          }
          navigate('/game/dashboard', { replace: true });
          return;
        }
      }

      if (data.user && !data.session && !isStudentIdMode) {
        toast({ title: "Check your email!", description: "We sent you a verification link. Please verify your email to continue." });
      } else if (data.session) {
        navigate('/game/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isStudentIdMode = loginMode === "studentId";
    const loginEmail = isStudentIdMode ? toSyntheticEmail(studentIdInput) : email.trim();

    if (!loginEmail || !password.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (isStudentIdMode) {
        const gate = await checkStudentIdSigninRate(studentIdInput);
        if (!gate.allowed) {
          toast({ title: "Slow down", description: gate.error, variant: "destructive" });
          setIsLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
      if (isStudentIdMode) await recordStudentIdSigninSuccess(studentIdInput);
      navigate('/game/dashboard', { replace: true });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const identityProps = {
    loginMode,
    email,
    onEmailChange: setEmail,
    studentIdInput,
    onStudentIdChange: setStudentIdInput,
  };

  const SsoButtons = () => (
    <div className="space-y-2.5">
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full h-11 bg-white text-slate-800 hover:bg-white/95 hover:text-slate-900 font-medium shadow-md border border-white/40"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </Button>
      <Button
        type="button"
        onClick={handleCleverSignIn}
        disabled={isLoading}
        className="w-full h-11 bg-[#436CF5] text-white hover:bg-[#3658D6] font-medium shadow-md"
      >
        <CleverIcon />
        <span>Continue with Clever</span>
      </Button>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-transparent px-3 text-[11px] uppercase tracking-[0.18em] text-white/55">
            or continue with
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-hero relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgydjJoLTJ2LTJ6bTAtOGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-slate-900/55 backdrop-blur-2xl border-white/15 shadow-glass-lg overflow-hidden">
          {/* Card header with inline back button */}
          <div className="px-6 pt-5 pb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/65 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">Sign in</span>
          </div>

          {/* Brand block */}
          <div className="text-center px-6 pt-3 pb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400/15 border border-yellow-300/30 mb-3">
              <Gamepad2 className="w-7 h-7 text-yellow-300" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Game Mode</h1>
            <p className="text-sm text-white/65 mt-1">Learn to read through epic adventures</p>
          </div>

          <Tabs defaultValue="login">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2 bg-black/25 border border-white/10">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/65"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/65"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-5">
                  {loginMode === "email" && <SsoButtons />}
                  <LoginModeToggle loginMode={loginMode} onChange={setLoginMode} />
                  <IdentityInput idPrefix="login" {...identityProps} />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-white/90 font-medium">Password</Label>
                      {loginMode === "email" && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs text-yellow-300/90 hover:text-yellow-200 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-black/20 border-white/20 text-white placeholder:text-white/40 pr-10 h-11 focus-visible:ring-yellow-400/60 focus-visible:border-yellow-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-6">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold shadow-yellow"
                    disabled={isLoading || (loginMode === 'studentId' && studentIdInput.length !== 8) || hasPendingClassCodeValidation}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Login
                  </Button>
                  <p className="text-xs text-white/55 text-center leading-relaxed">
                    {loginMode === "studentId"
                      ? "Forgot your password? Ask your teacher."
                      : "Have a school account? Sign in with Google or Clever above."}
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-5">
                  {loginMode === "email" && <SsoButtons />}
                  <LoginModeToggle loginMode={loginMode} onChange={setLoginMode} />
                  {loginMode === "studentId" && (
                    <div className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/75 leading-relaxed">
                      Student ID accounts use a school-issued ID — not an email.
                      We don't collect personal information (FERPA/COPPA-aligned).
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white/90 font-medium">Player Name</Label>
                    <Input
                      id="signup-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/40 h-11 focus-visible:ring-yellow-400/60 focus-visible:border-yellow-400/50"
                    />
                  </div>
                  <IdentityInput idPrefix="signup" {...identityProps} />
                  {loginMode === "studentId" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-class-code" className="text-white/90 font-medium">
                        Class Code <span className="text-white/45 font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="signup-class-code"
                        type="text"
                        maxLength={6}
                        value={classJoinCode}
                        onChange={(e) => setClassJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="ABC123"
                        className="bg-black/20 border-white/20 text-white placeholder:text-white/40 font-mono tracking-widest text-center uppercase h-11 focus-visible:ring-yellow-400/60 focus-visible:border-yellow-400/50"
                      />
                      <p className="text-xs text-white/50">
                        6-character code from your teacher to join your class
                      </p>
                      {classCodePeekLoading && (
                        <p className="text-xs text-white/65 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking code…
                        </p>
                      )}
                      {!classCodePeekLoading && classCodePeek?.valid && (
                        <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                          ✓ Joining <span className="font-semibold">{classCodePeek.classroomName}</span>
                          {classCodePeek.teacherName && <> with {classCodePeek.teacherName}</>}
                        </div>
                      )}
                      {!classCodePeekLoading && classCodePeek && !classCodePeek.valid && classJoinCode.length === 6 && (
                        <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-100">
                          ✗ {classCodePeek.error ?? "Class code not found"}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white/90 font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-black/20 border-white/20 text-white placeholder:text-white/40 pr-10 h-11 focus-visible:ring-yellow-400/60 focus-visible:border-yellow-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-6">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold shadow-yellow"
                    disabled={isLoading || (loginMode === 'studentId' && studentIdInput.length !== 8)}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                  <p className="text-xs text-white/55 text-center leading-relaxed">
                    By signing up you agree to our{" "}
                    <Link to="/terms-of-service" className="underline hover:text-white/80">Terms</Link> and{" "}
                    <Link to="/privacy-policy" className="underline hover:text-white/80">Privacy Policy</Link>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        <div className="mt-4 text-center">
          <Link
            to="/school/auth"
            className="text-xs text-white/60 hover:text-white underline underline-offset-4"
          >
            Teacher / School login →
          </Link>
        </div>
      </div>
    </div>

  );
};

export default GameAuth;
