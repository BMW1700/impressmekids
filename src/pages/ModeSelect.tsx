import { lazy, Suspense, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { Button } from "@/components/ui/button";
import { BennyVideoHero } from "@/components/landing/BennyVideoHero";
import { AudienceTrifurcation } from "@/components/landing/AudienceTrifurcation";

const RPGShowcase = lazy(() =>
  import("@/components/landing/RPGShowcase").then((module) => ({ default: module.RPGShowcase }))
);

const ModeSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const skipRedirect = (location.state as any)?.skipRedirect === true;
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const [showShowcase, setShowShowcase] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowShowcase(true), 900);
    return () => window.clearTimeout(t);
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

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(270_45%_6%)] text-white">
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
      <header className="relative z-20 border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              Nabu<span className="text-[hsl(48_100%_70%)]">Learn</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-white/80 hover:bg-white/10 hover:text-white">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild className="text-white/80 hover:bg-white/10 hover:text-white">
              <Link to="/auth">Sign in</Link>
            </Button>
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Super Admin"
                className="text-[hsl(48_100%_70%)] hover:bg-white/10 hover:text-[hsl(48_100%_75%)]"
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
        {/* ── Hero: Benny ── */}
        <section className="relative isolate overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(50% 40% at 50% 0%, hsl(48 100% 55% / 0.18), transparent 70%)," +
                "radial-gradient(70% 60% at 50% 100%, hsl(270 80% 25% / 0.6), transparent 70%)",
            }}
          />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mb-10 max-w-3xl text-center"
            >
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Reading. With their{" "}
                <span className="bg-gradient-to-r from-[hsl(48_100%_75%)] via-[hsl(48_100%_60%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent">
                  first best friend.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-white/70 md:text-xl">
                Meet Benny. Ages 2–5. Adventures kids ask for by name — and the
                words they say out loud are the words that unlock the story.
              </p>
            </motion.div>

            <BennyVideoHero />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button
                size="lg"
                asChild
                className="group h-14 rounded-full bg-white px-8 text-base font-semibold text-[hsl(270_45%_8%)] hover:bg-white"
              >
                <Link to="/game">
                  Start Benny's adventure
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-14 rounded-full border-white/20 bg-white/5 px-8 text-base font-medium text-white backdrop-blur hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                <Link to="/demos">I'm a teacher / school</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ── Audience doorway ── */}
        <AudienceTrifurcation />

        {/* ── RPG live showcase ── */}
        <section className="border-t border-white/5 py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-4 text-xs uppercase tracking-[0.24em] text-white/50">
                Inside the K–12 RPG
              </p>
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Reading as the{" "}
                <span className="bg-gradient-to-r from-[hsl(48_100%_75%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent">
                  combat mechanic.
                </span>
              </h2>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[hsl(270_45%_8%)] overflow-hidden shadow-[0_20px_80px_-20px_hsl(270_80%_30%/0.6)]"
            >
              {showShowcase ? (
                <Suspense fallback={<div className="h-[min(620px,78vh)] bg-[hsl(270_45%_8%)]" aria-hidden="true" />}>
                  <RPGShowcase variant="hero" />
                </Suspense>
              ) : (
                <div className="h-[min(620px,78vh)] bg-[hsl(270_45%_8%)]" aria-hidden="true" />
              )}
            </motion.div>
          </div>
        </section>

        {/* ── Returning players ── */}
        <section className="border-t border-white/5 py-14">
          <div className="container mx-auto px-4 text-center">
            <Link
              to="/game"
              className="group inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
            >
              Returning player? Enter the Adventure
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Legal footer ── */}
      <nav className="border-t border-white/5 py-8">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 text-xs text-white/45">
          <a href="/game/legal/privacy" className="hover:text-white/90">Privacy</a>
          <a href="/game/legal/terms" className="hover:text-white/90">Terms</a>
          <a href="/game/legal/coppa" className="hover:text-white/90">COPPA &amp; Parent Rights</a>
          <a href="/game/legal/security" className="hover:text-white/90">Security</a>
          <a href="/game/legal/dpa" className="hover:text-white/90">DPA</a>
          <a href="/game/legal" className="hover:text-white/90">All legal</a>
        </div>
      </nav>
    </div>
  );
};

export default ModeSelect;
