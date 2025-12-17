import { Link } from "react-router-dom";
import { Sparkles, Gamepad2, AlertCircle, BookOpen, CheckCircle, Trophy, Target, Flame } from "lucide-react";
import { CompactProfileHeader } from "@/components/student/CompactProfileHeader";
import { DashboardMetrics } from "@/components/student/DashboardMetrics";
import { ActivityFeed } from "@/components/student/ActivityFeed";
import { SmartNextAction } from "@/components/student/SmartNextAction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReadingGamification } from "@/hooks/useReadingGamification";
import { AchievementBadge } from "@/components/aura/AchievementBadge";
import { StreakCounter } from "@/components/aura/StreakCounter";
import { MissionCard } from "@/components/aura/MissionCard";
import { BehaviorPointsCard } from "@/components/behavior/BehaviorPointsCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface HomeSectionProps {
  userProfile: any;
  studentProfile: any;
  assignmentStats: any;
  classrooms?: Array<{ id: string }>;
}

export const HomeSection = ({
  userProfile,
  studentProfile,
  assignmentStats,
  classrooms
}: HomeSectionProps) => {
  const { t } = useLanguage();
  const firstName = userProfile?.full_name?.split(" ")[0] || "Student";
  const totalAssignments = assignmentStats?.total_assignments || 0;
  const completedAssignments = assignmentStats?.completed_assignments || 0;
  const gamesPlayed = studentProfile?.stats?.games_played || 0;
  const gamesWon = studentProfile?.stats?.games_won || 0;
  
  const { achievements, streak, missions } = useReadingGamification(studentProfile?.id);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 border border-border/50 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-6">
          <CompactProfileHeader 
            fullName={userProfile?.full_name} 
            grade={studentProfile?.grade} 
            avatarUrl={studentProfile?.avatar_url} 
          />

          {/* Welcome Message */}
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-gradient-purple">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('home.subtitle')}
            </p>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/student/dashboard" className="group">
              <Card variant="glass" className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-circle-sm icon-circle-blue">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{totalAssignments}</div>
                      <div className="text-xs text-muted-foreground font-medium">{t('home.assignments')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/student/dashboard" className="group">
              <Card variant="glass" className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-circle-sm icon-circle-green">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{completedAssignments}</div>
                      <div className="text-xs text-muted-foreground font-medium">{t('home.completed')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/games" className="group">
              <Card variant="glass" className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-circle-sm icon-circle-purple">
                      <Gamepad2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{gamesPlayed}</div>
                      <div className="text-xs text-muted-foreground font-medium">{t('home.gamesPlayed')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/games" className="group">
              <Card variant="glass" className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-circle-sm icon-circle-gold">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{gamesWon}</div>
                      <div className="text-xs text-muted-foreground font-medium">{t('home.gamesWon')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Urgent Action Card */}
          <Card className="border border-orange-400/30 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="icon-circle-orange">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-orange-700 dark:text-orange-400">{t('home.urgentAssignment')}</h3>
                    <Badge variant="red">{t('home.dueIn')} 6h</Badge>
                  </div>
                  <p className="text-sm text-orange-600/80 dark:text-orange-300/80">Reading Comprehension Quiz - Chapter 5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI-Powered Smart Recommendation */}
      <SmartNextAction assignmentStats={assignmentStats} studentStats={studentProfile?.stats} />

      {/* Dashboard Metrics */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gradient-purple">{t('home.yourPerformance')}</h2>
        <DashboardMetrics assignmentStats={assignmentStats} studentStats={studentProfile?.stats} />
      </div>

      {/* Behavior Points Section */}
      {studentProfile?.id && classrooms && classrooms.length > 0 && (
        <BehaviorPointsCard 
          studentId={studentProfile.id} 
          classroomId={classrooms[0].id} 
        />
      )}

      {/* Reading Gamification Section */}
      {studentProfile?.id && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Streak Counter */}
          <StreakCounter 
            currentStreak={streak.current_streak} 
            longestStreak={streak.longest_streak} 
          />

          {/* Achievements */}
          {achievements.length > 0 && (
            <Card variant="glass" className="hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="icon-circle-gold w-10 h-10">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  {t('home.achievements')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {achievements.slice(0, 6).map(achievement => (
                    <AchievementBadge key={achievement.id} achievement={achievement} size="md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Missions */}
          {missions.length > 0 && (
            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <h3 className="font-bold text-lg text-gradient-purple">{t('home.activeMissions')}</h3>
              {missions.slice(0, 2).map(mission => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Feed */}
      {studentProfile?.id && <ActivityFeed studentId={studentProfile.id} />}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gradient-purple">{t('home.quickActions')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/games" className="group relative block p-8 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Gamepad2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">{t('home.readyToPlay')}</h3>
              </div>
              <p className="text-white/90 text-base leading-relaxed">
                {t('home.readyToPlayDesc')}
              </p>
            </div>
          </Link>

          <Link to="/student/aura-practice" className="group relative block p-8 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">{t('home.practiceWithAura')}</h3>
              </div>
              <p className="text-white/90 text-base leading-relaxed">
                {t('home.practiceWithAuraDesc')}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
