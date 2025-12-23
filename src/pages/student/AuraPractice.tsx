import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VoiceRecorder } from "@/components/aura/VoiceRecorder";
import AuraFeedbackCard from "@/components/aura/AuraFeedbackCard";
import AuraProgressChart from "@/components/aura/AuraProgressChart";
import SpeakerDiarizationView from "@/components/aura/SpeakerDiarizationView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mic, TrendingUp, BookOpen, Library, Sparkles, Trophy, AlertTriangle, ArrowLeft, Presentation } from "lucide-react";
import GeneratedExercises from "@/components/aura/GeneratedExercises";
import PhonemeMasteryPathway from "@/components/aura/PhonemeMasteryPathway";
import DifficultyProgressCard from "@/components/aura/DifficultyProgressCard";
import { PhonemePracticeExercises } from "@/components/aura/PhonemePracticeExercises";
import { StoryLibrary } from "@/components/aura/StoryLibrary";
import { GuidedReadingFlow } from "@/components/aura/GuidedReadingFlow";
import { ReadingBookshelf } from "@/components/aura/ReadingBookshelf";
import { SmartNotifications } from "@/components/aura/SmartNotifications";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { GamificationHeader } from "@/components/aura/GamificationHeader";
import { ActiveMissionsPanel } from "@/components/aura/ActiveMissionsPanel";
import { ClassChallengeCard } from "@/components/aura/ClassChallengeCard";
import { LeaderboardCard } from "@/components/aura/LeaderboardCard";
import { PracticeModeSelector as OldPracticeModeSelector, type PracticeMode } from "@/components/aura/PracticeModeSelector";
import { PresentationModeSelector } from "@/components/aura/PresentationModeSelector";
import { PresentationRecorder } from "@/components/aura/PresentationRecorder";
import { PresentationFeedbackCard } from "@/components/aura/PresentationFeedbackCard";
import { PresentationHistory } from "@/components/aura/PresentationHistory";
import { analyzePresentation, type PresentationPrompt, type PresentationMetrics } from "@/lib/presentationAnalysis";
import { crossModalNetwork, type PresentationFeatures } from "@/lib/ml/crossModalTransferNetwork";
import { useActiveScreeningPassage, type ActiveScreening } from "@/hooks/useActiveScreeningPassage";
import type { CuratedStory as Story } from "@/data/curatedStories";

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
    <LeaderboardCard 
      classroomId={enrollment.classroom_id} 
      currentStudentId={studentId}
      title="Class Leaderboard 🏆"
    />
  );
};

const AuraPractice = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isReadingStory, setIsReadingStory] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('free');
  const [selectedPrompt, setSelectedPrompt] = useState<PresentationPrompt | null>(null);
  const [customTopic, setCustomTopic] = useState<string | undefined>();
  const [presentationMetrics, setPresentationMetrics] = useState<PresentationMetrics | null>(null);
  const [presentationTranscript, setPresentationTranscript] = useState<string>('');

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }
    
    const { data: profileResult } = await supabase.rpc('get_user_profile', { 
      _user_id: session.user.id 
    });
    
    if (!profileResult || profileResult.length === 0) { 
      navigate('/auth'); 
      return; 
    }
    
    const profileData = profileResult[0];
    
    // Redirect non-students to their dashboards
    if (profileData.role === 'district_manager') navigate('/district-manager/dashboard');
    else if (profileData.role === 'teacher') navigate('/teacher/dashboard');
    else if (profileData.role === 'admin') navigate('/admin/dashboard');
    else if (profileData.role === 'parent') navigate('/parent/dashboard');
  };

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
      const isFreeMode = practiceMode === 'free';
      console.log(`🚀 Sending to AURA AI backend (${isFreeMode ? 'FREE' : 'PREMIUM'} mode)...`);
      console.log('Phonemes detected:', phonemes?.length || 0);
      console.log('Audio features:', !!audioFeatures);
      
      const { data, error } = await supabase.functions.invoke('analyze-aura', {
        body: {
          transcript: text,
          durationSeconds,
          audioUrl,
          audioFeatures,
          phonemes,
          freeMode: isFreeMode, // Pass free mode flag
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
    // Don't auto-exit - let student view detailed results first
    // They will use the "Back to Library" button to leave
    console.log('Reading completed - student viewing results');
    refetch(); // Refresh progress data
  };

  const handleReadingBack = () => {
    setIsReadingStory(false);
    setSelectedStory(null);
  };

  if (isReadingStory && selectedStory && user?.id) {
    return (
      <div className="min-h-screen flex flex-col bg-background" onClick={handlePageInteraction}>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
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
        </main>
        <Footer />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-background" onClick={handlePageInteraction}>
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {/* Header with Gamification Stats */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
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
            {user?.id && <GamificationHeader studentId={user.id} />}
          </div>

          <SmartNotifications onNavigate={(path) => navigate(path)} />

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="stories" className="hover:scale-105 transition-transform">
                <Library className="h-4 w-4 mr-2" />
                Stories
              </TabsTrigger>
              <TabsTrigger value="bookshelf" className="hover:scale-105 transition-transform">
                <BookOpen className="h-4 w-4 mr-2" />
                Bookshelf
              </TabsTrigger>
              <TabsTrigger value="practice" className="hover:scale-105 transition-transform">
                <Presentation className="h-4 w-4 mr-2" />
                Present
              </TabsTrigger>
              <TabsTrigger value="challenges" className="hover:scale-105 transition-transform">
                <Trophy className="h-4 w-4 mr-2" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="progress" className="hover:scale-105 transition-transform">
                <TrendingUp className="h-4 w-4 mr-2" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="exercises" className="hover:scale-105 transition-transform">
                <Sparkles className="h-4 w-4 mr-2" />
                Exercises
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stories" className="mt-6">
              <StoryLibrary onSelectStory={handleStorySelect} />
            </TabsContent>

            <TabsContent value="bookshelf" className="mt-6">
              <ReadingBookshelf />
            </TabsContent>

            <TabsContent value="practice" className="space-y-6 mt-6">
              {!selectedPrompt && !customTopic ? (
                <>
                  <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <Presentation className="h-6 w-6 text-primary" />
                        <div>
                          <h3 className="font-semibold">Presentation Practice</h3>
                          <p className="text-sm text-muted-foreground">
                            Practice speaking confidently with AI coaching on pacing, filler words, and structure
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <PresentationModeSelector 
                    onSelectPrompt={(prompt, topic) => {
                      setSelectedPrompt(prompt);
                      setCustomTopic(topic);
                      setPresentationMetrics(null);
                    }}
                  />
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setSelectedPrompt(null);
                      setCustomTopic(undefined);
                      setPresentationMetrics(null);
                    }}
                    className="mb-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Choose Different Topic
                  </Button>

                  {!presentationMetrics ? (
                    <PresentationRecorder
                      topic={selectedPrompt?.title || customTopic}
                      targetDuration={selectedPrompt?.duration || 60}
                      isAnalyzing={isAnalyzing}
                      onRecordingComplete={async (data) => {
                        console.log('🎤 Presentation recording complete, starting analysis...');
                        console.log('👤 Current user:', user?.id || 'NOT LOGGED IN');
                        
                        // Check if user is logged in
                        if (!user?.id) {
                          console.error('❌ Cannot save presentation: User not logged in');
                          toast({
                            title: "Not Logged In",
                            description: "Please log in to save your presentation recordings.",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        setIsAnalyzing(true);
                        try {
                          const metrics = analyzePresentation(
                            data.transcript,
                            data.durationSeconds,
                            (data.transcript.split(/\s+/).length / data.durationSeconds) * 60,
                            data.audioFeatures?.pauseCount || 0,
                            data.audioFeatures?.avgSilenceDuration || 500,
                            data.audioFeatures
                          );
                          setPresentationMetrics(metrics);
                          setPresentationTranscript(data.transcript);
                          
                          // Save presentation data to database
                          console.log('💾 Attempting to save presentation for user:', user.id);
                          const wordCount = data.transcript.split(/\s+/).filter(Boolean).length;

                          const toLikert5 = (score0to100: number) => {
                            const safe = Number.isFinite(score0to100) ? score0to100 : 0;
                            const clamped = Math.max(0, Math.min(100, safe));
                            // Map 0..100 -> 1..5
                            return Math.max(1, Math.min(5, Math.round(1 + (clamped / 100) * 4)));
                          };

                          const insertData = {
                            profile_id: user.id,
                            request_id: crypto.randomUUID(),
                            transcript: data.transcript,
                            duration_s: Math.max(1, Math.round(data.durationSeconds)),
                            words: wordCount,
                            wpm: Math.round(metrics.wordsPerMinute),
                            asr_confidence: 0.95,
                            // DB constraints: clarity/confidence/pace must be 1..5
                            clarity: toLikert5(metrics.clarityScore),
                            confidence: toLikert5(metrics.confidenceScore),
                            pace: toLikert5(metrics.pacingScore),
                            pause_count: data.audioFeatures?.pauseCount || 0,
                            avg_silence_ms: Math.round(data.audioFeatures?.avgSilenceDuration || 500),
                            // DB constraint expects 'en' or 'es'
                            language: 'en',
                            audio_url: '',
                            feedback: {} as any,
                            presentation_type: selectedPrompt?.id || 'custom',
                            presentation_topic: selectedPrompt?.title || customTopic || 'Custom Topic',
                            presentation_confidence_score: Math.round(metrics.confidenceScore),
                            pacing_score: Math.round(metrics.pacingScore),
                            structure_score: Math.round(metrics.structureScore),
                            filler_word_count: metrics.fillerWordCount || 0,
                            filler_words: metrics.fillerWords as any,
                            presentation_duration_target: selectedPrompt?.duration || 60,
                            presentation_metrics: metrics as any,
                            grade: Math.round(metrics.overallScore),
                          };
                          
                          console.log('📝 Insert data:', JSON.stringify(insertData, null, 2));
                          
                          const { data: savedData, error: saveError } = await supabase
                            .from('aura_records')
                            .insert(insertData)
                            .select();
                          
                          if (saveError) {
                            console.error('❌ Failed to save presentation:', saveError);
                            toast({
                              title: "Save Failed",
                              description: `Could not save presentation: ${saveError.message}`,
                              variant: "destructive",
                            });
                          } else {
                            console.log('✅ Presentation saved to database:', savedData);
                            
                            // Run cross-modal prediction for insights
                            try {
                              const presentationFeatures: PresentationFeatures = {
                                confidenceScore: metrics.confidenceScore,
                                pacingScore: metrics.pacingScore,
                                structureScore: metrics.structureScore,
                                clarityScore: metrics.clarityScore,
                                fillerWordCount: metrics.fillerWordCount,
                                wordsPerMinute: metrics.wordsPerMinute,
                              };
                              const prediction = await crossModalNetwork.predictReadingFromPresentation(presentationFeatures);
                              console.log('📊 Cross-Modal Prediction (Presentation → Reading):', prediction);
                            } catch (predError) {
                              console.warn('Cross-modal prediction failed:', predError);
                            }
                            
                            refetch(); // Refresh records
                            
                            toast({
                              title: "✨ Presentation Saved!",
                              description: `Your score: ${metrics.overallScore}/100 (Grade ${metrics.grade})`,
                            });
                          }
                        } catch (error) {
                          console.error('Analysis error:', error);
                          toast({
                            title: "Analysis Failed",
                            description: "Could not analyze your presentation.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsAnalyzing(false);
                        }
                      }}
                    />
                  ) : (
                    <>
                      <PresentationFeedbackCard
                        metrics={presentationMetrics}
                        transcript={presentationTranscript}
                        durationSeconds={presentationMetrics.wordsPerMinute > 0 
                          ? (presentationTranscript.split(/\s+/).length / presentationMetrics.wordsPerMinute) * 60 
                          : 60}
                        targetDuration={selectedPrompt?.duration || 60}
                      />
                      <Button 
                        onClick={() => setPresentationMetrics(null)}
                        className="w-full"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </>
                  )}
                  
                  {/* Presentation History */}
                  {user?.id && (
                    <div className="mt-8">
                      <PresentationHistory studentId={user.id} />
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* NEW: Challenges Tab */}
            <TabsContent value="challenges" className="mt-6 space-y-6">
              {user?.id && (
                <>
                  {/* Active Missions */}
                  <ActiveMissionsPanel studentId={user.id} />
                  
                  {/* Class Challenge */}
                  <ClassChallengeCard studentId={user.id} />
                  
                  {/* Classroom Leaderboard */}
                  <ClassroomLeaderboardWrapper studentId={user.id} />
                </>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
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
            </TabsContent>

            <TabsContent value="exercises" className="mt-6 space-y-6">
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
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuraPractice;
