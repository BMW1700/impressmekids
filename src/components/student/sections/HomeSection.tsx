import { ProfileCard } from "@/components/ProfileCard";
import NextBestActionCard from "@/components/aura/NextBestActionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Gamepad2 } from "lucide-react";

interface HomeSectionProps {
  userProfile: any;
  studentProfile: any;
  assignmentStats: any;
}

export const HomeSection = ({
  userProfile,
  studentProfile,
  assignmentStats,
}: HomeSectionProps) => {
  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 border border-primary/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
            Welcome back, {userProfile?.full_name?.split(" ")[0] || "Student"}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's what's happening with your learning today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfileCard
            fullName={userProfile?.full_name}
            grade={studentProfile?.grade}
            avatarUrl={studentProfile?.avatar_url}
            stats={{
              games_played: studentProfile?.stats?.games_played || 0,
              games_won: studentProfile?.stats?.games_won || 0,
            }}
            assignmentStats={{
              total_assignments: assignmentStats?.total_assignments || 0,
              completed_assignments: assignmentStats?.completed_assignments || 0,
            }}
          />
        </div>
        
        <NextBestActionCard />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/games"
          className="group relative block p-8 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Gamepad2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Ready to Play?</h3>
            </div>
            <p className="text-white/95 text-base leading-relaxed">
              Challenge yourself with educational games and compete with your classmates!
            </p>
          </div>
        </Link>

        <Link
          to="/student/aura-practice"
          className="group relative block p-8 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Practice with AURA</h3>
            </div>
            <p className="text-white/95 text-base leading-relaxed">
              Improve your reading skills with AI-powered feedback and personalized exercises.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};
