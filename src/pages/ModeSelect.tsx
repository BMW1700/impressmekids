import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, ShieldCheck, ArrowRight, Sparkles, Swords } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { Button } from "@/components/ui/button";
import { BennyVideoHero } from "@/components/landing/BennyVideoHero";
import { AudienceTrifurcation } from "@/components/landing/AudienceTrifurcation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { setStoredTheme } from "@/lib/gameTheme";


const RPGShowcase = lazy(() =>
  import("@/components/landing/RPGShowcase").then((module) => ({ default: module.RPGShowcase }))
);

type HoverSide = "benny" | "rpg" | null;

const ModeSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const skipRedirect = (location.state as any)?.skipRedirect === true;
  const { user, session, profile, isLoading, isProfileLoading, signOut } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const [showShowcase, setShowShowcase] = useState(false);
  const [hover, setHover] = useState<HoverSide>(null);
  const reduceMotion = useReducedMotion();
  const hoverTimerRef = useRef<number | null>(null);


  const requestHover = (side: HoverSide) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    if (side === null) {
      // small exit delay to avoid flicker when crossing the seam
      hoverTimerRef.current = window.setTimeout(() => setHover(null), 80);
    } else {
      // hover-intent delay so a mouse passing through doesn't trigger blur
      hoverTimerRef.current = window.setTimeout(() => setHover(side), 140);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => setShowShowcase(true), 900);
    return () => {
      window.clearTimeout(t);
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (skipRedirect) return;
    if (isLoading) return;
    if (!user) return;
    if (isProfileLoading || !profile) return;

    const userRole = profile.role;

    if (userRole === 'game_player') {
      navigate('/game/dashboard', { replace: true });
      return;
    }

    const hasDistrict = !!profile.district_id;
    const isVerified = profile.is_verified !== false;

    const schoolRoles = ['teacher', 'student', 'parent', 'admin', 'district_admin'];
    if (userRole && schoolRoles.includes(userRole) && hasDistrict && isVerified) {
      const dashboardMap: Record<string, string> = {
        teacher: '/teacher/dashboard',
        parent: '/parent/dashboard',
        district_admin: '/district/dashboard',
        admin: '/admin/dashboard',
        student: '/student/dashboard',
      };
      navigate(dashboardMap[userRole] || '/student/dashboard', { replace: true });
    }
  }, [skipRedirect, isLoading, isProfileLoading, user, profile, navigate]);

  const showSpinner = !skipRedirect && !!user && (isProfileLoading || !profile);

  if (showSpinner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const bennyActive = hover === "benny";
  const rpgActive = hover === "rpg";
  const bennyPaused = hover === "rpg";
  const rpgPaused = hover === "benny";

  const inactiveFx = (side: "benny" | "rpg") => {
    if (!hover || hover === side) return "";
    if (reduceMotion) return "opacity-[0.1]";
    return "blur-[20px] brightness-[0.08] opacity-[0.06] md:scale-[0.95]";
  };
  const activeFx = (side: "benny" | "rpg") =>
    hover === side && !reduceMotion ? "md:scale-[1.025]" : "";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${
        isLight
          ? "bg-gradient-to-br from-[hsl(270_75%_82%)] via-[hsl(320_80%_88%)] to-[hsl(30_95%_85%)] text-[hsl(270_45%_18%)]"
          : "bg-[hsl(270_45%_6%)] text-white"
      }`}
    >
      <Helmet>
        <title>NabuLearn — Reading adventures with Benny. K–12 literacy that feels like a game.</title>
        <meta
          name="description"
          content="Meet Benny — read-along adventures for ages 2–5. Plus an AI-powered K–12 literacy RPG. FERPA, COPPA & SOC 2 aligned."
        />
        <link rel="canonical" href="https://nabulearn.com/" />
        <meta property="og:title" content="NabuLearn — Reading adventures with Benny" />
        <meta
          property="og:description"
          content="Meet Benny. Read-along adventures for ages 2–5. Plus an AI-powered K–12 literacy RPG."
        />
        <meta property="og:url" content="https://nabulearn.com/" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ── Minimal top bar ── */}
      <header
        className={`relative z-30 border-b ${
          isLight ? "border-[hsl(270_40%_18%)]/10 bg-white/30 backdrop-blur-md" : "border-white/5"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              Nabu
              <span className={isLight ? "text-[hsl(35_95%_45%)]" : "text-[hsl(48_100%_70%)]"}>
                Learn
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              asChild
              className={
                isLight
                  ? "text-[hsl(270_45%_22%)]/80 hover:bg-[hsl(270_45%_22%)]/10 hover:text-[hsl(270_45%_18%)]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }
            >
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className={
                isLight
                  ? "text-[hsl(270_45%_22%)]/80 hover:bg-[hsl(270_45%_22%)]/10 hover:text-[hsl(270_45%_18%)]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }
            >
              <Link to="/auth">Sign in</Link>
            </Button>
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Super Admin"
                className={
                  isLight
                    ? "text-[hsl(35_95%_45%)] hover:bg-[hsl(270_45%_22%)]/10"
                    : "text-[hsl(48_100%_70%)] hover:bg-white/10 hover:text-[hsl(48_100%_75%)]"
                }
              >
                <Link to="/super-admin">
                  <ShieldCheck className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Weighted split: Benny vs K–12 RPG. Hover expands the active side and blurs the other. ── */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background: isLight
                ? "radial-gradient(60% 50% at 25% 15%, hsl(48 100% 75% / 0.45), transparent 70%)," +
                  "radial-gradient(55% 50% at 85% 85%, hsl(320 90% 80% / 0.45), transparent 70%)"
                : "radial-gradient(50% 40% at 30% 20%, hsl(48 100% 55% / 0.18), transparent 70%)," +
                  "radial-gradient(50% 40% at 80% 80%, hsl(270 80% 35% / 0.5), transparent 70%)",
            }}
          />

          <div className="flex flex-col md:flex-row min-h-[calc(100vh-72px)]">
            {/* ─── BENNY PANEL ─── */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => requestHover("benny")}
              onMouseLeave={() => requestHover(null)}
              style={{
                flex: "1 1 0",
                background: isLight
                  ? "linear-gradient(135deg, hsl(48 100% 90%) 0%, hsl(35 100% 86%) 50%, hsl(20 100% 84%) 100%)"
                  : "linear-gradient(135deg, hsl(270 60% 14%) 0%, hsl(285 55% 16%) 50%, hsl(35 80% 22%) 100%)",
              }}
              className={`relative flex flex-col justify-start px-6 pt-16 pb-14 md:px-12 md:pt-24 md:pb-20 transition-[filter,transform,opacity] duration-700 ease-out will-change-[filter,transform] ${activeFx("benny")} ${inactiveFx("benny")}`}
            >
              {/* warm glow */}
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500 ${bennyActive ? "opacity-100" : "opacity-70"}`}
                style={{
                  background: isLight
                    ? "radial-gradient(60% 50% at 50% 40%, hsl(48 100% 70% / 0.45), transparent 70%)"
                    : "radial-gradient(60% 50% at 50% 40%, hsl(48 100% 55% / 0.22), transparent 70%)",
                }}
              />

              <div className="mx-auto w-full max-w-2xl">
                <div
                  className={`mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] ${
                    isLight ? "text-[hsl(28_90%_38%)]" : "text-[hsl(48_100%_75%)]"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ages 2–5 · Pre-K
                </div>
                <p
                  className={`mb-5 text-sm font-medium transition-all duration-300 translate-y-0 ${
                    isLight
                      ? bennyActive
                        ? "text-[hsl(28_90%_32%)]"
                        : "text-[hsl(270_30%_30%)]/75"
                      : bennyActive
                      ? "text-[hsl(48_100%_82%)]"
                      : "text-white/55"
                  }`}
                >
                  For daycares, preschools &amp; 2–5 year-olds
                </p>
                <h1
                  className={`text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl ${
                    isLight ? "text-[hsl(270_45%_15%)]" : ""
                  }`}
                >
                  Reading. With their{" "}
                  <span
                    className={
                      isLight
                        ? "bg-gradient-to-r from-[hsl(28_95%_45%)] via-[hsl(20_95%_50%)] to-[hsl(340_85%_55%)] bg-clip-text text-transparent"
                        : "bg-gradient-to-r from-[hsl(48_100%_78%)] via-[hsl(48_100%_62%)] to-[hsl(30_100%_60%)] bg-clip-text text-transparent"
                    }
                  >
                    first best friend.
                  </span>
                </h1>
                <p
                  className={`mt-5 max-w-xl text-base md:text-lg ${
                    isLight ? "text-[hsl(270_30%_28%)]" : "text-white/75"
                  }`}
                >
                  Meet Benny. Adventures kids ask for by name — and the words
                  they say out loud unlock the story.
                </p>

                <div
                  className={`mt-7 overflow-hidden rounded-2xl border shadow-[0_20px_80px_-20px_hsl(48_100%_55%/0.35)] ${
                    isLight ? "border-white/70 bg-white/40 backdrop-blur-md" : "border-white/10"
                  }`}
                >
                  <BennyVideoHero paused={bennyPaused} />
                </div>

                <div className="mt-7">
                  <Button
                    size="lg"
                    onClick={() => {
                      setStoredTheme("prek");
                      if (user) {
                        navigate("/game/play?tab=rpg");
                      } else {
                        navigate("/game/auth");
                      }
                    }}
                    className={`group h-14 w-full rounded-full px-8 text-base font-semibold sm:w-auto ${
                      isLight
                        ? "bg-[hsl(270_45%_15%)] text-white hover:bg-[hsl(270_45%_22%)]"
                        : "bg-white text-[hsl(270_45%_8%)] hover:bg-white"
                    }`}
                  >
                    Start Benny's adventure
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* ─── K–12 RPG PANEL ─── */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => requestHover("rpg")}
              onMouseLeave={() => requestHover(null)}
              style={{
                flex: "1 1 0",
                background: isLight
                  ? "linear-gradient(135deg, hsl(270 80% 86%) 0%, hsl(285 80% 84%) 50%, hsl(310 85% 84%) 100%)"
                  : "linear-gradient(135deg, hsl(270 55% 10%) 0%, hsl(265 70% 14%) 50%, hsl(255 60% 18%) 100%)",
              }}
              className={`relative flex flex-col justify-start px-6 pt-16 pb-14 md:px-12 md:pt-24 md:pb-20 border-t md:border-t-0 md:border-l ${
                isLight ? "border-white/60" : "border-white/10"
              } transition-[filter,transform,opacity] duration-700 ease-out will-change-[filter,transform] ${activeFx("rpg")} ${inactiveFx("rpg")}`}
            >
              {/* cool glow */}
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500 ${rpgActive ? "opacity-100" : "opacity-70"}`}
                style={{
                  background: isLight
                    ? "radial-gradient(60% 50% at 50% 40%, hsl(280 95% 75% / 0.45), transparent 70%)"
                    : "radial-gradient(60% 50% at 50% 40%, hsl(265 90% 55% / 0.25), transparent 70%)",
                }}
              />

              <div className="mx-auto w-full max-w-xl">
                <div
                  className={`mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] ${
                    isLight ? "text-[hsl(270_70%_38%)]" : "text-[hsl(265_90%_80%)]"
                  }`}
                >
                  <Swords className="h-3.5 w-3.5" />
                  Ages 6–18 · Grades K–12
                </div>
                <p
                  className={`mb-5 text-sm font-medium transition-all duration-300 ${
                    isLight
                      ? rpgActive
                        ? "text-[hsl(270_60%_28%)]"
                        : "text-[hsl(270_30%_30%)]/75"
                      : rpgActive
                      ? "text-[hsl(280_90%_85%)]"
                      : "text-white/55"
                  }`}
                >
                  For K–12 students, at-home learning, schools &amp; districts
                </p>
                <h2
                  className={`text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl ${
                    isLight ? "text-[hsl(270_45%_15%)]" : ""
                  }`}
                >
                  Reading IS the{" "}
                  <span
                    className={
                      isLight
                        ? "bg-gradient-to-r from-[hsl(280_85%_45%)] via-[hsl(265_85%_50%)] to-[hsl(220_85%_50%)] bg-clip-text text-transparent"
                        : "bg-gradient-to-r from-[hsl(280_90%_75%)] via-[hsl(265_90%_65%)] to-[hsl(220_90%_65%)] bg-clip-text text-transparent"
                    }
                  >
                    combat mechanic.
                  </span>
                </h2>
                <p
                  className={`mt-5 text-base md:text-lg ${
                    isLight ? "text-[hsl(270_30%_28%)]" : "text-white/75"
                  }`}
                >
                  An AI-powered literacy RPG. Speak words to cast spells, defeat
                  bosses, and level up — fluency goes up because the game won't
                  work otherwise.
                </p>

                <div
                  className={`mt-7 overflow-hidden rounded-2xl border bg-[hsl(270_45%_8%)] shadow-[0_20px_80px_-20px_hsl(265_90%_55%/0.4)] ${
                    isLight ? "border-white/70" : "border-white/10"
                  }`}
                >
                  {showShowcase ? (
                    <Suspense fallback={<div className="aspect-video w-full bg-[hsl(270_45%_8%)]" aria-hidden="true" />}>
                      <RPGShowcase variant="hero" paused={rpgPaused} />
                    </Suspense>
                  ) : (
                    <div className="aspect-video w-full bg-[hsl(270_45%_8%)]" aria-hidden="true" />
                  )}
                </div>

                <div className="mt-7">
                  <Button
                    size="lg"
                    asChild
                    className="group h-14 w-full rounded-full bg-[hsl(265_90%_60%)] px-8 text-base font-semibold text-white hover:bg-[hsl(265_90%_65%)] sm:w-auto"
                  >
                    <Link to="/game">
                      Enter the Adventure
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tiny center link for teachers/schools */}
          <div
            className={`border-t py-5 ${
              isLight
                ? "border-[hsl(270_45%_20%)]/10 bg-white/20 backdrop-blur-md"
                : "border-white/5 bg-[hsl(270_45%_5%)]/60"
            }`}
          >

            <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 text-sm">
              <Link
                to="/demos"
                className={`group inline-flex items-center gap-1.5 transition ${
                  isLight
                    ? "text-[hsl(270_45%_22%)]/70 hover:text-[hsl(270_45%_18%)]"
                    : "text-white/65 hover:text-white"
                }`}
              >
                I'm a teacher / school
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className={isLight ? "text-[hsl(270_45%_22%)]/30" : "text-white/20"}>·</span>
              <Link
                to="/game"
                className={`group inline-flex items-center gap-1.5 transition ${
                  isLight
                    ? "text-[hsl(270_45%_22%)]/60 hover:text-[hsl(270_45%_18%)]"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Returning player? Jump back in
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

        </section>

        {/* ── Below the fold: audience doorway ── */}
        <AudienceTrifurcation />
      </main>

      {/* ── Legal footer ── */}
      <nav className={`border-t py-8 ${isLight ? "border-[hsl(270_45%_20%)]/10" : "border-white/5"}`}>
        <div
          className={`container mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 text-xs ${
            isLight ? "text-[hsl(270_45%_22%)]/55" : "text-white/45"
          }`}
        >
          <a href="/game/legal/privacy" className={isLight ? "hover:text-[hsl(270_45%_18%)]" : "hover:text-white/90"}>Privacy</a>
          <a href="/game/legal/terms" className={isLight ? "hover:text-[hsl(270_45%_18%)]" : "hover:text-white/90"}>Terms</a>
          <a href="/game/legal/coppa" className={isLight ? "hover:text-[hsl(270_45%_18%)]" : "hover:text-white/90"}>COPPA &amp; Parent Rights</a>
          <a href="/game/legal/security" className={isLight ? "hover:text-[hsl(270_45%_18%)]" : "hover:text-white/90"}>Security</a>
          <a href="/game/legal/dpa" className={isLight ? "hover:text-[hsl(270_45%_18%)]" : "hover:text-white/90"}>DPA</a>
          <a href="/game/legal" className={isLight ? "hover:text-[hsl(270_45%_18%)]" : "hover:text-white/90"}>All legal</a>
        </div>
      </nav>

    </div>
  );
};

export default ModeSelect;
