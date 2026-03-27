import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, School, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

const ModeSelect = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hardTimeout = window.setTimeout(() => {
      if (!cancelled) setIsCheckingAuth(false);
    }, 1500);

    const checkAuthAndRedirect = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || cancelled) return;

        const { data: profileData } = await supabase.rpc('get_user_profile', {
          _user_id: session.user.id,
        });

        if (!profileData || profileData.length === 0 || cancelled) return;

        const userRole = profileData[0].role;
        if (userRole === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (userRole === 'parent') {
          navigate('/parent/dashboard');
        } else if (userRole === 'district_admin') {
          navigate('/district/dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } catch {
        // Intentionally swallow so page never bricks behind a spinner
      } finally {
        if (!cancelled) setIsCheckingAuth(false);
      }
    };

    checkAuthAndRedirect();

    return () => {
      cancelled = true;
      window.clearTimeout(hardTimeout);
    };
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-hero relative overflow-hidden px-4 py-8">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgydjJoLTJ2LTJ6bTAtOGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-8 sm:mb-16 text-center relative z-10 leading-tight"
      >
        <span className="text-white">Welcome to </span>
        <span className="text-yellow-400">NabuLearn</span>
      </motion.h1>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 relative z-10 w-full max-w-2xl sm:max-w-none sm:w-auto">
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
          onClick={() => {/* Game mode - coming soon */}}
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
          <span className="text-xs text-white/50 font-medium tracking-wide uppercase">Coming Soon</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ModeSelect;
