import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, School, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { RPGShowcase } from "@/components/landing/RPGShowcase";

const ModeSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const skipRedirect = (location.state as any)?.skipRedirect === true;
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  useEffect(() => {
    if (skipRedirect) return;
    if (isLoading) return;
    if (!user) return; // Not signed in — show mode select
    if (isProfileLoading || !profile) return; // Wait for profile from AuthContext (no refetch)

    const userRole = profile.role;

    // Game players always go to game dashboard
    if (userRole === 'game_player') {
      navigate('/game/dashboard', { replace: true });
      return;
    }

    const hasDistrict = !!profile.district_id;
    const isVerified = profile.is_verified !== false;

    // School roles only auto-redirect if they have a district AND are verified
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
    // Otherwise stay on mode select
  }, [skipRedirect, isLoading, isProfileLoading, user, profile, navigate]);

  // Show spinner only while session is being determined OR while a signed-in user's
  // profile is loading (so we don't flash mode select before redirecting them).
  const showSpinner = !skipRedirect && (isLoading || (!!user && (isProfileLoading || !profile)));

  if (showSpinner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-hero relative overflow-hidden px-4 py-8">
      <Helmet>
        <title>NabuLearn — AI-Powered Literacy for K-12</title>
        <meta name="description" content="Choose School Mode or Game Mode to begin. NabuLearn delivers AI-powered literacy assessment, adaptive RPG practice, and classroom analytics." />
        <link rel="canonical" href="https://nabulearn.com/" />
        <meta property="og:title" content="NabuLearn — AI-Powered Literacy" />
        <meta property="og:description" content="Choose School Mode or Game Mode to begin." />
        <meta property="og:url" content="https://nabulearn.com/" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgydjJoLTJ2LTJ6bTAtOGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />

      <main className="flex flex-col items-center justify-center relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-4xl mb-6 rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden"
        >
          <RPGShowcase variant="compact" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-8 sm:mb-16 text-center leading-tight"
        >
          <span className="text-white">Welcome to </span>
          <span className="text-yellow-400">NabuLearn</span>
        </motion.h1>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 w-full max-w-2xl sm:max-w-none sm:w-auto">
        {/* School Mode - larger */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/school')}
          className="w-full sm:w-64 h-48 sm:h-64 md:w-72 md:h-72 rounded-2xl flex flex-col items-center justify-center gap-3 sm:gap-4
            bg-white/10 backdrop-blur-xl border border-white/20
            shadow-[0_8px_32px_rgba(168,85,247,0.35),0_0_60px_rgba(168,85,247,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:shadow-[0_12px_50px_rgba(168,85,247,0.5),0_0_80px_rgba(168,85,247,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]
            hover:bg-white/15 hover:border-white/30
            transition-all duration-300 cursor-pointer group"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-white/10 flex items-center justify-center
            group-hover:bg-white/20 transition-colors duration-300">
            <School className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white">School Mode</span>
          <span className="text-xs sm:text-sm text-white/60">Teachers, Students & Parents</span>
        </motion.button>

        {/* Game Mode - slightly smaller */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/game')}
          className="w-full sm:w-56 h-44 sm:h-56 md:w-64 md:h-64 rounded-2xl flex flex-col items-center justify-center gap-3 sm:gap-4
            bg-white/10 backdrop-blur-xl border border-white/20
            shadow-[0_8px_32px_rgba(168,85,247,0.35),0_0_60px_rgba(168,85,247,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:shadow-[0_12px_50px_rgba(168,85,247,0.5),0_0_80px_rgba(168,85,247,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]
            hover:bg-white/15 hover:border-white/30
            transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-white/10 flex items-center justify-center
            group-hover:bg-white/20 transition-colors duration-300">
            <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white">Game Mode</span>
          <span className="text-xs sm:text-sm text-white/60">Play & Learn to Read</span>
        </motion.button>
        </div>
      </main>
    </div>
  );
};

export default ModeSelect;
