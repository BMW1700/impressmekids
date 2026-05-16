import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameHeader } from "@/components/game/GameHeader";
import { useAuth } from "@/contexts/AuthContext";
import PhonemeHeatmap from "@/components/aura/PhonemeHeatmap";
import AuraProgressChart from "@/components/aura/AuraProgressChart";
import KidFriendlyProgress from "@/components/aura/KidFriendlyProgress";
import PhonemeMasteryPathway from "@/components/aura/PhonemeMasteryPathway";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Brain, BookOpen, Activity, Loader2, Zap, Target, Gauge } from "lucide-react";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { RPGPlayerHUD } from "@/components/aura/game/rpg/RPGPlayerHUD";
import { MLStatusBadge } from "@/components/ml/MLStatusBadge";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { useGameReadingSummary } from "@/hooks/useGameReadingSummary";

const GameAnalytics = () => {
  const { user, profile } = useAuth();
  const currentGradeMode = getGradeMode(getStoredTheme());
  const { progress } = useCampaignProgress(user?.id, currentGradeMode);

  const gold = progress?.total_gold ?? 0;
  const xp = progress?.total_xp_earned ?? 0;
  const { data: readingSummary } = useGameReadingSummary(user?.id);

  // Fetch user's AURA records
  const { data: auraRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['game-aura-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('aura_records')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch skill vector
  const { data: skillVector } = useQuery({
    queryKey: ['game-skill-vector', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('student_skill_vectors')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch reading stats
  const { data: readingStats } = useQuery({
    queryKey: ['game-reading-stats', user?.id, currentGradeMode],
    queryFn: async () => {
      if (!user?.id) return null;
      let query = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', user.id);
      if (currentGradeMode) query = query.eq('grade_mode', currentGradeMode);
      const { data } = await query.maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Real reading sessions (separate from speaking aura_records)
  const { data: recentReadingSessions } = useQuery({
    queryKey: ['game-recent-reading-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('reading_sessions')
        .select('id, wpm, wcpm, accuracy_percent, words_read, duration_seconds, reading_mode, created_at')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Format data for single-user heatmap
  const heatmapStudents = user ? [{
    student_id: user.id,
    profiles: {
      id: user.id,
      full_name: profile?.full_name || 'Player',
      email: profile?.email || '',
    }
  }] : [];

  // Extract phoneme mastery from skill vector
  const phonemeScores = (skillVector?.phoneme_scores as Record<string, number> | null) || {};
  const masteredPhonemes = Object.entries(phonemeScores)
    .filter(([, score]) => score >= 0.8)
    .map(([phoneme]) => phoneme);
  const strugglingPhonemes = Object.entries(phonemeScores)
    .filter(([, score]) => score < 0.5)
    .map(([phoneme]) => phoneme);

  // Extract recent grades for difficulty card
  const recentGrades = (auraRecords || [])
    .filter(r => r.grade !== null)
    .slice(0, 10)
    .map(r => r.grade!);

  if (recordsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GameHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GameHeader studentId={user?.id}>
        {user?.id && (
          <RPGPlayerHUD
            studentId={user.id}
            gold={gold}
            xp={xp}
            gradeMode={currentGradeMode}
            className="hidden sm:flex"
          />
        )}
      </GameHeader>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              My Reading Progress
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your reading journey and see how you're improving
            </p>
          </div>
          <MLStatusBadge />
        </div>

        {/* Kid-Friendly Progress Overview */}
        {user?.id && (
          <div className="mb-6">
            <KidFriendlyProgress studentId={user.id} gradeMode={currentGradeMode} />
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="phonemes" className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              Phonemes
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{readingSummary?.totalSessions ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total Sessions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(readingSummary?.totalWordsRead ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Words Read</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-2xl font-bold text-primary">
                    {readingSummary?.hasEnoughData ? readingSummary.avgWpm : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg WPM</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Gauge className="w-4 h-4 mx-auto mb-1 text-pink-500" />
                  <div className="text-2xl font-bold text-primary">
                    {readingSummary?.hasEnoughData ? readingSummary.avgWcpm : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg WCPM</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  <div className="text-2xl font-bold text-primary">
                    {readingSummary?.hasEnoughData ? `${readingSummary.avgAccuracy}%` : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <Badge
                    variant={
                      readingSummary?.fluencyTone === "good"
                        ? "default"
                        : readingSummary?.fluencyTone === "warn"
                        ? "secondary"
                        : readingSummary?.fluencyTone === "bad"
                        ? "destructive"
                        : "outline"
                    }
                    className="text-sm font-bold"
                  >
                    {readingSummary?.hasEnoughData ? readingSummary.fluencyLabel : "—"}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">Fluency</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {readingStats?.current_streak_days ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </CardContent>
              </Card>
            </div>
            {readingSummary && !readingSummary.hasEnoughData && readingSummary.totalSessions < 3 && (
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Complete a few more reading sessions for an accurate fluency average.
              </p>
            )}

            {/* Speaking practice trend (separate from reading) */}
            <AuraProgressChart records={auraRecords || []} />
          </TabsContent>

          <TabsContent value="phonemes" className="space-y-6">
            {/* Phoneme Heatmap - single user */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Phoneme Mastery Heatmap
                  <Badge variant="secondary" className="text-xs">ML-Powered</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhonemeHeatmap
                  students={heatmapStudents}
                  skillVectors={skillVector ? [skillVector] : []}
                  classroomId="game-mode"
                  classroomName="My Progress"
                  hideClassAverage
                />
              </CardContent>
            </Card>

            {/* Phoneme Mastery Pathway */}
            <PhonemeMasteryPathway
              masteredPhonemes={masteredPhonemes}
              strugglingPhonemes={strugglingPhonemes}
            />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Recent Reading Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!recentReadingSessions || recentReadingSessions.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reading sessions yet. Start your first adventure!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentReadingSessions.map((session) => {
                      const mode = (session.reading_mode || 'practice').replace(/_/g, ' ');
                      const acc = session.accuracy_percent ?? 0;
                      const wcpm = session.wcpm ?? session.wpm ?? 0;
                      const mins = Math.max(1, Math.round((session.duration_seconds || 0) / 60));
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <div className="font-medium text-sm capitalize">
                              📖 {mode}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()} · {session.words_read ?? 0} words · {mins}m
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-bold">{Math.round(wcpm)} WCPM</div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(session.wpm ?? 0)} WPM
                              </div>
                            </div>
                            <Badge variant={acc >= 95 ? "default" : acc >= 85 ? "secondary" : "destructive"}>
                              {Math.round(acc)}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GameAnalytics;
