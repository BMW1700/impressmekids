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
import { BarChart3, TrendingUp, Brain, BookOpen, Activity, Loader2 } from "lucide-react";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { RPGPlayerHUD } from "@/components/aura/game/rpg/RPGPlayerHUD";
import { MLStatusBadge } from "@/components/ml/MLStatusBadge";

const GameAnalytics = () => {
  const { user, profile } = useAuth();
  const { progress } = useCampaignProgress(user?.id);

  const gold = progress?.total_gold ?? 0;
  const xp = progress?.total_xp_earned ?? 0;

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
    queryKey: ['game-reading-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      return data;
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
            <KidFriendlyProgress studentId={user.id} />
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{auraRecords?.length ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total Sessions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {readingStats?.total_words_read?.toLocaleString() ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Words Read</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {auraRecords && auraRecords.length > 0
                      ? Math.round(auraRecords.reduce((sum, r) => sum + (r.wpm || 0), 0) / auraRecords.length)
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg WPM</div>
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

            {/* Progress Chart */}
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
                {(!auraRecords || auraRecords.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reading sessions yet. Start your first adventure!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auraRecords.slice(0, 20).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {record.reading_type === 'reading_speaking' ? '📖 Reading' : 
                             record.presentation_type ? '🎤 Presentation' : '🎯 Practice'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString()} · {record.words} words · {Math.round(record.duration_s / 60)}m
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-bold">{record.wpm} WPM</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(record.clarity * 100)}% clarity
                            </div>
                          </div>
                          {record.grade !== null && (
                            <Badge variant={record.grade >= 80 ? "default" : record.grade >= 60 ? "secondary" : "destructive"}>
                              {Math.round(record.grade)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
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
