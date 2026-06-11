import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { VoiceRecorder } from "@/components/aura/VoiceRecorder";
import AuraFeedbackCard from "@/components/aura/AuraFeedbackCard";
import AuraProgressChart from "@/components/aura/AuraProgressChart";
import SpeakerDiarizationView from "@/components/aura/SpeakerDiarizationView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mic, TrendingUp, BookOpen, Library, Sparkles, Trophy, AlertTriangle } from "lucide-react";
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
import { useActiveScreeningPassage } from "@/hooks/useActiveScreeningPassage";
import { ImprovementTracker } from "@/components/shared/ImprovementTracker";
import KidFriendlyProgress from "@/components/aura/KidFriendlyProgress";
import { CampaignModeEntry } from "@/components/aura/game/CampaignModeEntry";
import { RPGBattleArena } from "@/components/aura/game/rpg/RPGBattleArena";
import { RPGWorldMap, type WorldProgress } from "@/components/aura/game/rpg/RPGWorldMap";
import { RPGLevelSelect, type CampaignLevel } from "@/components/aura/game/rpg/RPGLevelSelect";
import { usePublishedPrekLevels } from "@/hooks/usePublishedPrekLevels";
import { type BattleMode } from "@/components/aura/game/rpg/RPGBattleModeSelector";
import { BookRescueCelebration } from "@/components/aura/game/BookRescueCelebration";
import { campaignWorlds, type CampaignWorld } from "@/lib/campaignData";
import { agentCampaignWorlds } from "@/lib/agentCampaignData";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import type { EnemyType } from "@/lib/battleMechanics";
import { curatedStories } from "@/data/curatedStories";
import { agentStories } from "@/data/agentStories";
import { getStoredTheme, setStoredTheme, type GameTheme, getGradeMode, getThemeFromGradeMode, type GradeMode } from "@/lib/gameTheme";
import { ThemeSelector } from "@/components/aura/game/rpg/ThemeSelector";
import type { CuratedStory as Story } from "@/data/curatedStories";

// Helper component to get student's classroom and show leaderboard
const ClassroomLeaderboardWrapper = ({ studentId, gradeMode }: { studentId: string; gradeMode?: string }) => {
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
  if (isLoading || !enrollment?.classroom_id) return null;
  return (
    <LeaderboardCard 
      classroomId={enrollment.classroom_id} 
      currentStudentId={studentId}
      title="Class Leaderboard 🏆"
      gradeMode={gradeMode}
    />
  );
};

export const AuraReadingSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isReadingStory, setIsReadingStory] = useState(false);
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  const [gameTheme, setGameTheme] = useState<GameTheme | null>(getStoredTheme());
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);
  const currentGradeMode: GradeMode = getGradeMode(gameTheme);
  
  // Theme-aware data sources
  const activeWorlds =
    gameTheme === 'agent'
      ? agentCampaignWorlds
      : gameTheme === 'prek'
        ? campaignWorlds.filter((w) => w.mode === 'prek')
        : campaignWorlds.filter((w) => w.mode !== 'prek');
  const activeStories = gameTheme === 'agent' ? agentStories : curatedStories;

  // RPG Mode state
  const [isRpgMode, setIsRpgMode] = useState(false);
  const [rpgView, setRpgView] = useState<'world_map' | 'level_select' | 'battle'>('world_map');
  const [selectedWorld, setSelectedWorld] = useState<CampaignWorld | null>(null);
  const isSelectedPreK = !!selectedWorld && selectedWorld.mode === 'prek';
  const { levelNums: publishedPrekLevelNums, meta: publishedPrekLevelMeta } = usePublishedPrekLevels(
    isSelectedPreK ? selectedWorld!.id : null,
  );
  const [selectedLevel, setSelectedLevel] = useState<CampaignLevel | null>(null);
  const [rpgStory, setRpgStory] = useState<Story | null>(null);
  const [rpgEnemyType, setRpgEnemyType] = useState<EnemyType>('minion');
  const [selectedBattleMode, setSelectedBattleMode] = useState<BattleMode>('classic');
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
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

  // Get user profile for role checking
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('role, default_grade_mode')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-select grade mode from profile default on page load
  useEffect(() => {
    if (!hasLoadedDefault && profile?.default_grade_mode) {
      const defaultTheme = getThemeFromGradeMode(profile.default_grade_mode as GradeMode);
      setGameTheme(defaultTheme);
      setStoredTheme(defaultTheme);
      setHasLoadedDefault(true);
    }
  }, [profile, hasLoadedDefault]);

  // Check for active screening period
  const { data: activeScreening } = useActiveScreeningPassage(user?.id);

  // Campaign progress hook for RPG mode - scoped by grade mode
  const { 
    progress: campaignProgress, 
    startBattle, 
    completeBattle,
  } = useCampaignProgress(user?.id, currentGradeMode);

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

  // RPG Battle Mode - Battle View
  if (isRpgMode && rpgView === 'battle' && rpgStory && user?.id) {
    const handleBattleComplete = async (victory: boolean, stats: { wordsRead: number; correctWords: number; longestStreak: number; damageDealt: number; xpEarned: number; goldEarned?: number }) => {
      const accuracy = stats.wordsRead > 0 ? Math.round((stats.correctWords / stats.wordsRead) * 100) : 0;
      
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
      
      if (currentBattleId && selectedWorld) {
        await completeBattle({
          battleId: currentBattleId,
          victory,
          xpEarned: stats.xpEarned,
          damageDealt: stats.damageDealt,
          longestStreak: stats.longestStreak,
          storyTitle: rpgStory?.title || 'Unknown',
          worldNumber: selectedWorld.id,
          goldEarned: stats.goldEarned || 0,
        });
      }
      
      refetch();
      setShowVictoryCelebration(true);
    };

    return (
      <div onClick={handlePageInteraction}>
        <RPGBattleArena
          story={rpgStory}
          enemyType={rpgEnemyType}
          studentId={user.id}
          battleMode={selectedBattleMode}
          worldNumber={selectedWorld?.id || 1}
          gradeMode={currentGradeMode}
          onBack={() => {
            setRpgView('level_select');
            setRpgStory(null);
            setCurrentBattleId(null);
            setSelectedBattleMode('classic');
          }}
          onComplete={handleBattleComplete}
        />
        
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
      </div>
    );
  }

  // RPG Mode - Level Select
  if (isRpgMode && rpgView === 'level_select' && selectedWorld && user?.id) {
    const worldProgressData = campaignProgress?.world_progress as Record<string, string[]> || {};
    const completedStoriesInWorld = worldProgressData[selectedWorld.id.toString()] || [];
    const allCompletedStories = new Set(Object.values(worldProgressData).flat());
    const completedStories = completedStoriesInWorld;
    
    // For Pre-K worlds, only show levels published in the Super Admin CMS.
    const sourceLevels = isSelectedPreK
      ? selectedWorld.levels.filter((l) => publishedPrekLevelNums.has(l.id))
      : selectedWorld.levels;

    const levels: CampaignLevel[] = sourceLevels.map((levelData, idx) => {
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
        : (activeStories[levelData.storyIndex] || activeStories[idx % activeStories.length]);
      
      const isCompleted = completedStories.includes(story.title) || allCompletedStories.has(story.title);
      const prevStoryTitle = activeStories[selectedWorld.levels[idx - 1]?.storyIndex]?.title || '';
      const isPrevCompleted = completedStories.includes(prevStoryTitle) || allCompletedStories.has(prevStoryTitle);
      const isUnlocked = idx === 0 || isPrevCompleted || completedStories.length >= idx;
      
      return {
        id: levelData.id,
        story,
        enemies: levelData.enemies as CampaignLevel['enemies'],
        isBossLevel: levelData.isBossLevel,
        starsEarned: isCompleted ? 2 : 0,
        isCompleted,
        isUnlocked,
        isTutorial,
      };
    });

    const handleLevelSelect = async (level: CampaignLevel, battleMode: BattleMode) => {
      setSelectedLevel(level);
      setRpgStory(level.story);
      setSelectedBattleMode(battleMode);
      
      const primaryEnemy = level.enemies[0];
      const enemyMap: Record<string, EnemyType> = {
        minion: 'minion', guard: 'guard', elite: 'elite', boss: 'boss', dragon: 'dragon',
        ice_golem: 'ice_golem', shadow_wraith: 'shadow_wraith', stone_guardian: 'stone_guardian',
        cave_troll: 'cave_troll', crystal_spider: 'crystal_spider', echo_wraith: 'echo_wraith',
        storm_harpy: 'storm_harpy', cloud_giant: 'cloud_giant', zephyr: 'zephyr',
        ink_kraken: 'ink_kraken', reef_guardian: 'reef_guardian', leviathan: 'leviathan',
        void_phantom: 'void_phantom', reality_shifter: 'reality_shifter', word_eater: 'word_eater',
        fire_elemental: 'fire_elemental', lava_hound: 'lava_hound', ember_drake: 'ember_drake',
        crystal_knight: 'crystal_knight', prism_mage: 'prism_mage', crystal_queen: 'crystal_queen',
        star_sprite: 'star_sprite', comet_wolf: 'comet_wolf', nova_titan: 'nova_titan',
        tome_golem: 'tome_golem', page_wraith: 'page_wraith', the_librarian: 'the_librarian',
      };
      setRpgEnemyType(enemyMap[primaryEnemy] || 'minion');
      
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
      <div onClick={handlePageInteraction}>
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

  // RPG Mode - Theme Selector (first time)
  if (isRpgMode && !gameTheme) {
    return (
      <ThemeSelector onSelect={(theme) => {
        setStoredTheme(theme);
        setGameTheme(theme);
      }} />
    );
  }

  // RPG Mode - World Map
  if (isRpgMode && rpgView === 'world_map' && user?.id) {
    const worldProgressData = campaignProgress?.world_progress as Record<string, string[]> || {};
    
    const worldProgress: WorldProgress[] = activeWorlds.map(world => ({
      worldId: world.id,
      levelsCompleted: worldProgressData[world.id.toString()]?.length || 0,
      totalLevels: world.levels.length,
      starsEarned: (worldProgressData[world.id.toString()]?.length || 0) * 2,
      isUnlocked: world.id === 1 || (worldProgressData[(world.id - 1).toString()]?.length || 0) >= 3,
    }));

    return (
      <div onClick={handlePageInteraction}>
        <RPGWorldMap
          worldProgress={worldProgress}
          onSelectWorld={(world) => {
            setSelectedWorld(world);
            setRpgView('level_select');
          }}
          onBack={() => setIsRpgMode(false)}
          totalBooksRescued={campaignProgress?.books_rescued || 0}
          gradeMode={currentGradeMode}
          onSwitchMode={() => {
            const next: GameTheme = gameTheme === 'agent' ? 'classic' : 'agent';
            setGameTheme(next);
          }}
        />
      </div>
    );
  }

  // Campaign Mode
  if (isCampaignMode && user?.id) {
    return (
      <div onClick={handlePageInteraction}>
        <CampaignModeEntry
          studentId={user.id}
          onBack={() => setIsCampaignMode(false)}
          stories={curatedStories}
          isAdmin={profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'district_admin'}
        />
      </div>
    );
  }

  if (isReadingStory && selectedStory && user?.id) {
    return (
      <div onClick={handlePageInteraction}>
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
      </div>
    );
  }

  return (
    <div className="space-y-6" onClick={handlePageInteraction}>
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
        {user?.id && <GamificationHeader studentId={user.id} gradeMode={currentGradeMode} />}
      </div>

      <SmartNotifications onNavigate={(path) => navigate(path)} gradeMode={currentGradeMode} />

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

      {/* Grade Mode Selector */}
      <div className="flex flex-col items-center gap-1">
        <div className="inline-flex items-center rounded-lg border bg-card p-1 gap-1">
          <button
            onClick={() => { setStoredTheme('classic'); setGameTheme('classic'); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentGradeMode === 'k5'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📚 Grades K-5
          </button>
          <button
            onClick={() => { setStoredTheme('agent'); setGameTheme('agent'); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentGradeMode === '6to12'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🕵️ Grades 6-12
          </button>
        </div>
        {user?.id && profile?.default_grade_mode !== currentGradeMode && (
          <button
            onClick={async () => {
              await supabase
                .from('profiles')
                .update({ default_grade_mode: currentGradeMode } as any)
                .eq('id', user.id);
              toast({ title: `Default set to ${currentGradeMode === 'k5' ? 'Grades K-5' : 'Grades 6-12'}` });
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
          >
            Set as my default
          </button>
        )}
      </div>

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
          </TabsList>
        </div>

        <TabsContent value="stories" className="mt-6">
          <StoryLibrary 
            onSelectStory={handleStorySelect} 
            onStartCampaign={() => setIsCampaignMode(true)}
            onStartRpgMode={() => setIsRpgMode(true)}
            onStartCastle={() => navigate('/game/castle-swarm')}
            gradeMode={currentGradeMode}
          />
        </TabsContent>

        <TabsContent value="bookshelf" className="mt-6">
          <ReadingBookshelf gradeMode={currentGradeMode} />
        </TabsContent>

        <TabsContent value="practice" className="space-y-6 mt-6">
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
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-6 space-y-6">
          {user?.id && (
            <>
              <ActiveMissionsPanel studentId={user.id} />
              <ClassChallengeCard studentId={user.id} gradeMode={currentGradeMode} />
              <ClassroomLeaderboardWrapper studentId={user.id} gradeMode={currentGradeMode} />
            </>
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6 space-y-6">
          {/* Kid-Friendly Progress - Simple and Fun! */}
          {user?.id && (
            <KidFriendlyProgress studentId={user.id} gradeMode={currentGradeMode} />
          )}
          
          {/* Week-by-Week Improvement Tracker */}
          {user?.id && (
            <ImprovementTracker 
              studentId={user.id} 
              studentName="You"
              variant="detailed"
            />
          )}
          
          {/* Existing Progress Chart */}
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
  );
};
