import { Link } from "react-router-dom";
import { Sparkles, Gamepad2, AlertCircle, BookOpen, CheckCircle, Trophy, Award } from "lucide-react";
import { CompactProfileHeader } from "@/components/student/CompactProfileHeader";
import { DashboardMetrics } from "@/components/student/DashboardMetrics";
import { ActivityFeed } from "@/components/student/ActivityFeed";
import { SmartNextAction } from "@/components/student/SmartNextAction";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HomeSectionProps {
  userProfile: any;
  studentProfile: any;
  assignmentStats: any;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const HomeSection = ({
  userProfile,
  studentProfile,
  assignmentStats,
}: HomeSectionProps) => {
  const firstName = userProfile?.full_name?.split(" ")[0] || "Student";
  const totalAssignments = assignmentStats?.total_assignments || 0;
  const completedAssignments = assignmentStats?.completed_assignments || 0;
  const gamesPlayed = studentProfile?.stats?.games_played || 0;
  const gamesWon = studentProfile?.stats?.games_won || 0;
  
  return (
    <div className="space-y-8">
      {/* Hero Section - Top 25% */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 border border-primary/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-6">
          {/* Compact Profile Header */}
          <CompactProfileHeader
            fullName={userProfile?.full_name}
            grade={studentProfile?.grade}
            avatarUrl={studentProfile?.avatar_url}
          />

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/student/dashboard" className="group">
              <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-600/10">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalAssignments}</div>
                      <div className="text-xs text-muted-foreground">Assignments</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/student/dashboard" className="group">
              <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-600/10">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">{completedAssignments}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/games" className="group">
              <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-600/10">
                      <Gamepad2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{gamesPlayed}</div>
                      <div className="text-xs text-muted-foreground">Games Played</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/games" className="group">
              <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-600/10">
                      <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{gamesWon}</div>
                      <div className="text-xs text-muted-foreground">Games Won</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
          
          {/* Welcome Message */}
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-base text-muted-foreground">
              Here's what's happening with your learning today.
            </p>
          </div>

          {/* Urgent Action Card - Due in 24h */}
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">Urgent: Assignment Due Soon</h3>
                    <Badge variant="destructive" className="text-xs">Due in 6h</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Reading Comprehension Quiz - Chapter 5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI-Powered Smart Recommendation */}
      <SmartNextAction 
        assignmentStats={assignmentStats}
        studentStats={studentProfile?.stats}
      />

      {/* Dashboard Metrics - Middle 40% */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Performance</h2>
        <DashboardMetrics
          assignmentStats={assignmentStats}
          studentStats={studentProfile?.stats}
        />
      </div>

      {/* Activity Feed - Middle 30% */}
      <ActivityFeed />

      {/* Quick Actions - Bottom 10% */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
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
    </div>
  );
};
