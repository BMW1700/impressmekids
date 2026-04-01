import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { CampaignModeEntry } from "@/components/aura/game/CampaignModeEntry";
import { RPGBattleArena } from "@/components/aura/game/rpg/RPGBattleArena";
import { RPGWorldMap, type WorldProgress } from "@/components/aura/game/rpg/RPGWorldMap";
import { RPGLevelSelect, type CampaignLevel } from "@/components/aura/game/rpg/RPGLevelSelect";
import { type BattleMode } from "@/components/aura/game/rpg/RPGBattleModeSelector";
import { BookRescueCelebration } from "@/components/aura/game/BookRescueCelebration";
import { campaignWorlds, type CampaignWorld } from "@/lib/campaignData";
import { agentCampaignWorlds } from "@/lib/agentCampaignData";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import type { EnemyType } from "@/lib/battleMechanics";
import KidFriendlyProgress from "@/components/aura/KidFriendlyProgress";
import { curatedStories } from "@/data/curatedStories";
import { agentStories } from "@/data/agentStories";
import { getStoredTheme, setStoredTheme, type GameTheme } from "@/lib/gameTheme";
import { ThemeSelector } from "@/components/aura/game/rpg/ThemeSelector";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GameHeader } from "@/components/game/GameHeader";
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isGameMode = location.pathname.startsWith('/game');
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isReadingStory, setIsReadingStory] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('free');
  const [selectedPrompt, setSelectedPrompt] = useState<PresentationPrompt | null>(null);
  const [customTopic, setCustomTopic] = useState<string | undefined>();
  const [presentationMetrics, setPresentationMetrics] = useState<PresentationMetrics | null>(null);
  const [presentationTranscript, setPresentationTranscript] = useState<string>('');
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  const [isRpgMode, setIsRpgMode] = useState(false);
  const [rpgView, setRpgView] = useState<'world_map' | 'level_select' | 'battle'>('world_map');
  const [selectedWorld, setSelectedWorld] = useState<CampaignWorld | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CampaignLevel | null>(null);
  const [rpgStory, setRpgStory] = useState<Story | null>(null);
  const [rpgEnemyType, setRpgEnemyType] = useState<EnemyType>('minion');
  const [selectedBattleMode, setSelectedBattleMode] = useState<BattleMode>('classic');
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'stories');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(searchParams.get('category'));
  
  // Victory celebration state
  const [showVictoryCelebration, setShowVictoryCelebration] = useState(false);
  const [victoryStats, setVictoryStats] = useState<{
    victory: boolean;
    xpEarned: number;
    damageDealt: number;
    longestStreak: number;
    wordsRead: number;
    correctWords: number;
    accuracy: number;
    defeatedBeforeFinish: boolean;
  } | null>(null);
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);

  // Handle URL params for tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    const category = searchParams.get('category');
    if (tab === 'rpg') {
      setIsRpgMode(true);
    } else if (tab) {
      setActiveTab(tab);
    }
    if (category) setCategoryFilter(category);
  }, [searchParams]);

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

  // Auth is handled by the user query - no need for redundant checkAuth

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get user profile for role checking
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check for active screening period
  const { data: activeScreening } = useActiveScreeningPassage(user?.id);

  // Campaign progress hook
  const { 
    progress: campaignProgress, 
    startBattle, 
    completeBattle,
    initializeProgress 
  } = useCampaignProgress(user?.id);
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

  // Campaign mode takes over the whole screen
  if (isCampaignMode && user?.id) {
    return (
      <div className="min-h-screen flex flex-col bg-background" onClick={handlePageInteraction}>
        {isGameMode ? <GameHeader studentId={user?.id} /> : <Header />}
        <main className="flex-1 container mx-auto px-4 py-8">
          <CampaignModeEntry
            studentId={user.id}
            onBack={() => setIsCampaignMode(false)}
            stories={curatedStories}
            isAdmin={profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'district_admin'}
          />
        </main>
        {!isGameMode && <Footer />}
      </div>
    );
  }

  // RPG Battle Mode takes over the whole screen
  if (isRpgMode && rpgView === 'battle' && rpgStory && user?.id) {
    const handleBattleComplete = async (victory: boolean, stats: { wordsRead: number; correctWords: number; longestStreak: number; damageDealt: number; xpEarned: number; goldEarned?: number }) => {
      console.log('RPG Battle complete:', stats, 'victory:', victory);
      
      // CRITICAL: Cap accuracy at 100% to prevent display bugs
      const accuracy = stats.wordsRead > 0 ? Math.min(100, Math.round((stats.correctWords / stats.wordsRead) * 100)) : 0;
      
      // Set victory stats for celebration modal
      setVictoryStats({
        victory,
        xpEarned: stats.xpEarned,
        damageDealt: stats.damageDealt,
        longestStreak: stats.longestStreak,
        wordsRead: stats.wordsRead,
        correctWords: stats.correctWords,
        accuracy,
        defeatedBeforeFinish: victory && stats.correctWords < stats.wordsRead * 0.8,
      });
      
      // Save progress to database - NOW INCLUDES GOLD
      if (currentBattleId && selectedWorld) {
        await completeBattle({
          battleId: currentBattleId,
          victory,
          xpEarned: stats.xpEarned,
          damageDealt: stats.damageDealt,
          longestStreak: stats.longestStreak,
          storyTitle: rpgStory?.title || 'Unknown',
          worldNumber: selectedWorld.id,
          goldEarned: stats.goldEarned || 0, // NEW: Pass gold to sync to wallet
        });
      }
      
      refetch();
      setShowVictoryCelebration(true);
    };

    return (
      <div className="min-h-screen flex flex-col bg-background" onClick={handlePageInteraction}>
        {isGameMode ? <GameHeader studentId={user?.id} /> : <Header />}
        <main className="flex-1 container mx-auto px-4 py-8">
          <RPGBattleArena
            story={rpgStory}
            enemyType={rpgEnemyType}
            studentId={user.id}
            battleMode={selectedBattleMode}
            worldNumber={selectedWorld?.id || 1}
            onBack={() => {
              setRpgView('level_select');
              setRpgStory(null);
              setCurrentBattleId(null);
              setSelectedBattleMode('classic'); // Reset mode on back
            }}
            onComplete={handleBattleComplete}
          />
          
          {/* Victory/Defeat Celebration Modal */}
          <BookRescueCelebration
            open={showVictoryCelebration}
            onClose={() => setShowVictoryCelebration(false)}
            victory={victoryStats?.victory || false}
            storyTitle={rpgStory?.title || 'Story'}
            stats={victoryStats || {
              xpEarned: 0,
              damageDealt: 0,
              longestStreak: 0,
              wordsRead: 0,
              correctWords: 0,
              accuracy: 0,
              defeatedBeforeFinish: false,
            }}
            worldNumber={selectedWorld?.id || 1}
            booksRescued={campaignProgress?.books_rescued || 0}
            onPlayAgain={() => {
              setShowVictoryCelebration(false);
              // Reload the same level
              window.location.reload();
            }}
            onNextStory={() => {
              setShowVictoryCelebration(false);
              setRpgView('level_select');
              setRpgStory(null);
              setCurrentBattleId(null);
            }}
            onBackToMap={() => {
              setShowVictoryCelebration(false);
              setRpgView('world_map');
              setRpgStory(null);
              setSelectedWorld(null);
              setCurrentBattleId(null);
            }}
          />
        </main>
        {!isGameMode && <Footer />}
      </div>
    );
  }

  // RPG Mode - Level Select
  if (isRpgMode && rpgView === 'level_select' && selectedWorld && user?.id) {
    // Get world progress from campaign data
    const worldProgressData = campaignProgress?.world_progress as Record<string, string[]> || {};
    const completedStories = worldProgressData[selectedWorld.id.toString()] || [];
    
    // Generate levels from world's level data + curated stories
    const levels: CampaignLevel[] = selectedWorld.levels.map((levelData, idx) => {
      // Tutorial world uses a special story
      const isTutorial = selectedWorld.id === 0;
      const story = isTutorial 
        ? {
            title: 'Tutorial',
            description: 'Learn how to play!',
            passage_text: 'Welcome to the reading adventure. You will learn how to read words and defeat enemies. Each word you say correctly attacks the enemy. Get ready to become a reading champion!',
            grade_level: 0,
            category: 'adventure' as const,
            word_count: 30,
            reading_time_minutes: 1,
            difficulty_level: 0,
            cover_gradient: 'from-green-400 to-emerald-500',
            target_phonemes: [],
          }
        : (curatedStories[levelData.storyIndex] || curatedStories[idx % curatedStories.length]);
      
      const isCompleted = completedStories.includes(story.title);
      
      // Unlock logic: first level always unlocked, subsequent levels unlock when previous is completed
      const isUnlocked = idx === 0 || completedStories.includes(
        curatedStories[selectedWorld.levels[idx - 1]?.storyIndex]?.title || ''
      ) || completedStories.length >= idx;
      
      return {
        id: levelData.id,
        story,
        enemies: levelData.enemies as CampaignLevel['enemies'],
        isBossLevel: levelData.isBossLevel,
        starsEarned: isCompleted ? 2 : 0, // Default 2 stars for completed
        isCompleted,
        isUnlocked,
        isTutorial,
      };
    });

    const handleLevelSelect = async (level: CampaignLevel, battleMode: BattleMode) => {
      setSelectedLevel(level);
      setRpgStory(level.story);
      setSelectedBattleMode(battleMode); // Save the selected battle mode
      
      // Set enemy type based on level
      const primaryEnemy = level.enemies[0];
      // Map all campaign enemy types to battle enemy types
      const enemyMap: Record<string, EnemyType> = {
        minion: 'minion',
        guard: 'guard',
        elite: 'elite',
        boss: 'boss',
        dragon: 'dragon',
        ice_golem: 'ice_golem',
        shadow_wraith: 'shadow_wraith',
        stone_guardian: 'stone_guardian',
        // World 5 - Whispering Caverns
        cave_troll: 'cave_troll',
        crystal_spider: 'crystal_spider',
        echo_wraith: 'echo_wraith',
        // World 6 - Floating Isles
        storm_harpy: 'storm_harpy',
        cloud_giant: 'cloud_giant',
        zephyr: 'zephyr',
        // World 7 - Sunken Library
        ink_kraken: 'ink_kraken',
        reef_guardian: 'reef_guardian',
        leviathan: 'leviathan',
        // World 8 - The Void
        void_phantom: 'void_phantom',
        reality_shifter: 'reality_shifter',
        word_eater: 'word_eater',
      };
      setRpgEnemyType(enemyMap[primaryEnemy] || 'minion');
      
      console.log('[AuraPractice] Selected battle mode:', battleMode);
      
      // Start battle session in database
      try {
        const battleSession = await startBattle({
          storyTitle: level.story.title,
          storyCategory: level.story.category,
          worldNumber: selectedWorld.id,
          enemyType: primaryEnemy,
          enemyMaxHp: 100,
        });
        setCurrentBattleId(battleSession.id);
      } catch (error) {
        console.error('Failed to start battle session:', error);
      }
      
      setRpgView('battle');
    };

    return (
      <div className="min-h-screen flex flex-col bg-background" onClick={handlePageInteraction}>
        <RPGLevelSelect
          world={selectedWorld}
          levels={levels}
          onSelectLevel={handleLevelSelect}
          onBack={() => {
            setSelectedWorld(null);
            setRpgView('world_map');
          }}
        />
      </div>
    );
  }

  // RPG Mode - World Map
  if (isRpgMode && rpgView === 'world_map' && user?.id) {
    // Calculate world progress from campaign data
    const worldProgressData = campaignProgress?.world_progress as Record<string, string[]> || {};
    const totalBooksRescued = campaignProgress?.books_rescued || 0;
    
    const worldProgress: WorldProgress[] = campaignWorlds.map(w => {
      const worldStories = worldProgressData[w.id.toString()] || [];
      const totalLevels = w.levels.length;
      const levelsCompleted = worldStories.length;
      
      // World unlock logic based on previous world completion
      let isUnlocked = w.id === 1;
      if (w.id > 1) {
        const prevWorldStories = worldProgressData[(w.id - 1).toString()] || [];
        isUnlocked = prevWorldStories.length >= w.unlockRequirement;
      }
      
      return {
        worldId: w.id,
        levelsCompleted,
        totalLevels,
        starsEarned: levelsCompleted * 2, // 2 stars per completed level (can enhance later)
        isUnlocked,
      };
    });

    return (
      <div className="min-h-screen flex flex-col bg-background" onClick={handlePageInteraction}>
        <RPGWorldMap
          worldProgress={worldProgress}
          totalBooksRescued={totalBooksRescued}
          studentId={user.id}
          gold={campaignProgress?.total_gold || 0}
          xp={campaignProgress?.total_xp_earned || 0}
          onSelectWorld={(world) => {
            setSelectedWorld(world);
            setRpgView('level_select');
          }}
          onBack={() => {
            setIsRpgMode(false);
            setRpgView('world_map');
            setSelectedWorld(null);
          }}
        />
      </div>
    );
  }

  if (isReadingStory && selectedStory && user?.id) {
    return (
      <div className="min-h-screen flex flex-col bg-background" onClick={handlePageInteraction}>
        {isGameMode ? <GameHeader studentId={user?.id} /> : <Header />}
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
        {!isGameMode && <Footer />}
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
      {isGameMode ? <GameHeader studentId={user?.id} /> : <Header />}
      
      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => {
              navigate(isGameMode ? '/game/dashboard' : '/student/dashboard');
              window.scrollTo(0, 0);
            }}
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

          {/* Active Screening Banner - school only */}
          {!isGameMode && activeScreening?.passage && (
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full flex justify-center overflow-x-auto">
              <TabsList className="inline-flex">
                <TabsTrigger value="stories" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
                  <Library className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
                  <span className="text-xs md:text-sm">Stories</span>
                </TabsTrigger>
                <TabsTrigger value="bookshelf" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
                  <BookOpen className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
                  <span className="text-xs md:text-sm">Bookshelf</span>
                </TabsTrigger>
                <TabsTrigger value="practice" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
                  <Presentation className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
                  <span className="text-xs md:text-sm">Present</span>
                </TabsTrigger>
                <TabsTrigger value="challenges" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
                  <Trophy className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
                  <span className="text-xs md:text-sm">Challenges</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="hover:scale-105 transition-transform whitespace-nowrap px-3 md:px-4">
                  <TrendingUp className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
                  <span className="text-xs md:text-sm">Progress</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="stories" className="mt-6">
              <StoryLibrary 
                onSelectStory={handleStorySelect} 
                onStartCampaign={() => setIsCampaignMode(true)}
                onStartRpgMode={() => setIsRpgMode(true)}
                categoryFilter={categoryFilter}
              />
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
                  
                  {/* Class Challenge - hide in game mode */}
                  {!isGameMode && <ClassChallengeCard studentId={user.id} />}
                  
                  {/* Classroom Leaderboard - hide in game mode */}
                  {!isGameMode && <ClassroomLeaderboardWrapper studentId={user.id} />}
                </>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6 space-y-6">
              {/* Kid-Friendly Progress at the top */}
              {user?.id && <KidFriendlyProgress studentId={user.id} />}
              
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

          </Tabs>
        </div>
      </main>

      {!isGameMode && <Footer />}
    </div>
  );
};

export default AuraPractice;
