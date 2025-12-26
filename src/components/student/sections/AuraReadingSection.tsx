import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mic, TrendingUp, BookOpen, Library, Sparkles, Trophy, AlertTriangle, Loader2 } from "lucide-react";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { useActiveScreeningPassage } from "@/hooks/useActiveScreeningPassage";
import type { CuratedStory as Story } from "@/data/curatedStories";

// Lazy load heavy components to prevent flicker on tab switch
const VoiceRecorder = lazy(() => import("@/components/aura/VoiceRecorder").then(m => ({ default: m.VoiceRecorder })));
const AuraFeedbackCard = lazy(() => import("@/components/aura/AuraFeedbackCard"));
const AuraProgressChart = lazy(() => import("@/components/aura/AuraProgressChart"));
const SpeakerDiarizationView = lazy(() => import("@/components/aura/SpeakerDiarizationView"));
const GeneratedExercises = lazy(() => import("@/components/aura/GeneratedExercises"));
const PhonemeMasteryPathway = lazy(() => import("@/components/aura/PhonemeMasteryPathway"));
const DifficultyProgressCard = lazy(() => import("@/components/aura/DifficultyProgressCard"));
const PhonemePracticeExercises = lazy(() => import("@/components/aura/PhonemePracticeExercises").then(m => ({ default: m.PhonemePracticeExercises })));
const StoryLibrary = lazy(() => import("@/components/aura/StoryLibrary").then(m => ({ default: m.StoryLibrary })));
const GuidedReadingFlow = lazy(() => import("@/components/aura/GuidedReadingFlow").then(m => ({ default: m.GuidedReadingFlow })));
const ReadingBookshelf = lazy(() => import("@/components/aura/ReadingBookshelf").then(m => ({ default: m.ReadingBookshelf })));
const SmartNotifications = lazy(() => import("@/components/aura/SmartNotifications").then(m => ({ default: m.SmartNotifications })));
const GamificationHeader = lazy(() => import("@/components/aura/GamificationHeader").then(m => ({ default: m.GamificationHeader })));
const ActiveMissionsPanel = lazy(() => import("@/components/aura/ActiveMissionsPanel").then(m => ({ default: m.ActiveMissionsPanel })));
const ClassChallengeCard = lazy(() => import("@/components/aura/ClassChallengeCard").then(m => ({ default: m.ClassChallengeCard })));
const LeaderboardCard = lazy(() => import("@/components/aura/LeaderboardCard").then(m => ({ default: m.LeaderboardCard })));

// Loading fallback for lazy components
const TabLoader = () => (
  <div className="py-12 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Helper component to get student's classroom and show leaderboard
const ClassroomLeaderboardWrapper = ({ studentId }: { studentId: string }) => {
  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['student-enrollment', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classroom_students')
        .select('classroom_id')
        .eq('student_id', studentId)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  if (isLoading || !enrollment?.classroom_id) {
    return null;
  }

  return (
    <Suspense fallback={<TabLoader />}>
      <LeaderboardCard 
        classroomId={enrollment.classroom_id} 
        currentStudentId={studentId}
        title="Class Leaderboard 🏆"
      />
    </Suspense>
  );
};

export const AuraReadingSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isReadingStory, setIsReadingStory] = useState(false);

  // Setup global voice error handler for toast notifications
  useEffect(() => {
    (window as any).__showVoiceError = () => {
      toast({
        title: "Voice unavailable",
        description: "Click any button first to enable voice pronunciation.",
        variant: "destructive",
      });
    };
    return () => {
      delete (window as any).__showVoiceError;
    };
  }, [toast]);

  // Unlock speech synthesis on first user interaction with the page
  const handlePageInteraction = useCallback(() => {
    unlockSpeechSynthesis();
  }, []);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Check for active screening period
  const { data: activeScreening } = useActiveScreeningPassage(user?.id);

  const { data: records, refetch } = useQuery({
    queryKey: ['aura-records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aura_records')
        .select('*')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: skillVector } = useQuery({
    queryKey: ['skill-vector', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_skill_vectors')
        .select('*')
        .eq('student_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleTranscriptionComplete = async (
    text: string, 
    audioUrl: string, 
    durationSeconds: number,
    audioFeatures?: any,
    phonemes?: any[]
  ) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-aura', {
        body: {
          transcript: text,
          durationSeconds,
          audioUrl,
          audioFeatures,
          phonemes,
        },
      });

      if (error) throw error;

      setLatestAnalysis(data.analysis);
      toast({
        title: "✨ Analysis Complete!",
        description: `Your speaking grade: ${data.analysis.grade}/100`,
      });
      
      refetch();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze your recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setIsReadingStory(true);
  };

  const handleReadingComplete = () => {
    refetch();
  };

  const handleReadingBack = () => {
    setIsReadingStory(false);
    setSelectedStory(null);
  };

  // Handler to start screening assessment
  const handleStartScreening = () => {
    if (activeScreening?.passage) {
      const screeningStory: Story = {
        title: activeScreening.passage.title,
        description: `Grade ${activeScreening.gradeLevel} Screening Assessment - ${activeScreening.periodName}`,
        passage_text: activeScreening.passage.passage,
        grade_level: activeScreening.gradeLevel,
        category: activeScreening.passage.genre === 'fiction' ? 'adventure' : 'science',
        word_count: activeScreening.passage.wordCount,
        reading_time_minutes: 1,
        difficulty_level: activeScreening.gradeLevel,
        cover_gradient: 'from-amber-500 to-orange-600',
        target_phonemes: [],
      };
      setSelectedStory(screeningStory);
      setIsReadingStory(true);
    }
  };

  if (isReadingStory && selectedStory && user?.id) {
    return (
      <div onClick={handlePageInteraction}>
        <Suspense fallback={<TabLoader />}>
          <GuidedReadingFlow
            story={selectedStory}
            studentId={user.id}
            onBack={handleReadingBack}
            onComplete={handleReadingComplete}
            screeningPeriodId={activeScreening?.periodId}
            screeningClassroomId={activeScreening?.classroomId}
            screeningPassageId={activeScreening?.passageId}
            screeningPassageTitle={activeScreening?.passage?.title}
            screeningGradeLevel={activeScreening?.gradeLevel}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-6" onClick={handlePageInteraction}>
      {/* Header with Gamification Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 min-h-[64px]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AURA Reading</h1>
            <p className="text-muted-foreground">AI-powered reading comprehension practice</p>
          </div>
        </div>
        
        {/* Gamification Stats Header */}
        {user?.id && (
          <Suspense fallback={<div className="h-10 w-32 animate-pulse bg-muted rounded" />}>
            <GamificationHeader studentId={user.id} />
          </Suspense>
        )}
      </div>

      <Suspense fallback={null}>
        <SmartNotifications onNavigate={(path) => navigate(path)} />
      </Suspense>

      {/* Active Screening Banner */}
      {activeScreening?.passage && (
        <Card className={`border-2 ${
          activeScreening.hasCompleted 
            ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
            : 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  activeScreening.hasCompleted ? 'bg-green-500/20' : 'bg-amber-500/20'
                }`}>
                  {activeScreening.hasCompleted ? (
                    <Trophy className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h3 className={`font-semibold ${
                    activeScreening.hasCompleted 
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-amber-900 dark:text-amber-100'
                  }`}>
                    {activeScreening.hasCompleted 
                      ? '✅ Benchmark Complete!' 
                      : '📊 Benchmark Screening Active'}
                  </h3>
                  <p className={`text-sm ${
                    activeScreening.hasCompleted
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {activeScreening.hasCompleted
                      ? `Great job! You've completed the ${activeScreening.periodName} assessment`
                      : `Your teacher has assigned a ${activeScreening.periodName} reading assessment`}
                  </p>
                </div>
              </div>
              {!activeScreening.hasCompleted && (
                <Button 
                  onClick={handleStartScreening}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Start Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stories" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-max md:grid md:w-full md:grid-cols-6 min-w-max">
            <TabsTrigger value="stories" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
              <Library className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
              <span className="text-xs md:text-sm">Stories</span>
            </TabsTrigger>
            <TabsTrigger value="bookshelf" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
              <BookOpen className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
              <span className="text-xs md:text-sm">Bookshelf</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
              <Mic className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
              <span className="text-xs md:text-sm">Practice</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
              <Trophy className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
              <span className="text-xs md:text-sm">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
              <TrendingUp className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
              <span className="text-xs md:text-sm">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
              <Sparkles className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
              <span className="text-xs md:text-sm">Exercises</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stories" className="mt-6">
          <Suspense fallback={<TabLoader />}>
            <StoryLibrary onSelectStory={handleStorySelect} />
          </Suspense>
        </TabsContent>

        <TabsContent value="bookshelf" className="mt-6">
          <Suspense fallback={<TabLoader />}>
            <ReadingBookshelf />
          </Suspense>
        </TabsContent>

        <TabsContent value="practice" className="space-y-6 mt-6">
          <Suspense fallback={<TabLoader />}>
            <Card className="hover:scale-[1.01] transition-transform duration-200">
              <CardHeader>
                <CardTitle>Record Your Practice</CardTitle>
                <CardDescription>
                  Read a passage, answer a question, or practice pronunciation. Our AI will analyze your speech.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoiceRecorder 
                  onTranscriptionComplete={handleTranscriptionComplete}
                  isAnalyzing={isAnalyzing}
                />
              </CardContent>
            </Card>

            {latestAnalysis && (
              <>
                <AuraFeedbackCard analysis={latestAnalysis} />
                
                {latestAnalysis.speakerSegments && latestAnalysis.speakerSegments.length > 0 && (
                  <SpeakerDiarizationView
                    segments={latestAnalysis.speakerSegments}
                    diarizationConfidence={latestAnalysis.diarizationConfidence}
                  />
                )}
              </>
            )}
          </Suspense>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-6 space-y-6">
          <Suspense fallback={<TabLoader />}>
            {user?.id && (
              <>
                <ActiveMissionsPanel studentId={user.id} />
                <ClassChallengeCard studentId={user.id} />
                <ClassroomLeaderboardWrapper studentId={user.id} />
              </>
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Suspense fallback={<TabLoader />}>
            {!records || records.length === 0 ? (
              <Card className="hover:scale-[1.01] transition-transform duration-200">
                <CardContent className="text-center py-12">
                  <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                    <Mic className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Practice Sessions Yet</h3>
                  <p className="text-muted-foreground">Start recording to see your progress!</p>
                </CardContent>
              </Card>
            ) : (
              <AuraProgressChart records={records} />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="exercises" className="mt-6 space-y-6">
          <Suspense fallback={<TabLoader />}>
            {user?.id && (
              <PhonemePracticeExercises studentId={user.id} />
            )}
            
            {skillVector && (
              <DifficultyProgressCard
                currentLevel={skillVector.current_difficulty_level || 1}
                performanceTrend={skillVector.performance_trend || 0}
                recentGrades={(records || []).slice(0, 5).map(r => r.grade).filter(g => g !== null)}
                difficultyHistory={(skillVector.difficulty_history as any) || []}
              />
            )}
            
            <PhonemeMasteryPathway
              masteredPhonemes={latestAnalysis?.masteredPhonemes || []}
              strugglingPhonemes={latestAnalysis?.problematicPhonemes || []}
              studentGrade={5}
            />
            
            <GeneratedExercises 
              problematicPhonemes={latestAnalysis?.problematicPhonemes || []}
              studentGrade={5}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};
