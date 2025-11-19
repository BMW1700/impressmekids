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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {userProfile?.full_name?.split(" ")[0] || "Student"}!
        </h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/games">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-primary">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Ready to Play?</h3>
                  <p className="text-sm text-muted-foreground">
                    Challenge yourself with interactive games
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/student/aura-practice">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-primary">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Practice with AURA</h3>
                  <p className="text-sm text-muted-foreground">
                    Improve your speaking skills with AI
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};
