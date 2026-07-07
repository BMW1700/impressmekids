import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { CampaignModeEntry } from "@/components/aura/game/CampaignModeEntry";
import { RPGBattleArena } from "@/components/aura/game/rpg/RPGBattleArena";
import { RPGWorldMap, type WorldProgress } from "@/components/aura/game/rpg/RPGWorldMap";
import { RPGLevelSelect, type CampaignLevel } from "@/components/aura/game/rpg/RPGLevelSelect";
import { YubiEpisodeWrapper } from "@/components/aura/game/rpg/YubiEpisodeWrapper";
import { getPreKContent, isPreKWorldId } from "@/data/preKWordBanks";
import { usePublishedPrekLevels } from "@/hooks/usePublishedPrekLevels";
import { type BattleMode } from "@/components/aura/game/rpg/RPGBattleModeSelector";
import { BookRescueCelebration } from "@/components/aura/game/BookRescueCelebration";
import { campaignWorlds, type CampaignWorld } from "@/lib/campaignData";
import { agentCampaignWorlds } from "@/lib/agentCampaignData";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import type { EnemyType } from "@/lib/battleMechanics";
import KidFriendlyProgress from "@/components/aura/KidFriendlyProgress";
import { curatedStories } from "@/data/curatedStories";
import { agentStories } from "@/data/agentStories";
import { getStoredTheme, setStoredTheme, type GameTheme, getGradeMode, getThemeFromGradeMode, type GradeMode } from "@/lib/gameTheme";
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
import { Mic, TrendingUp, BookOpen, Library, Sparkles, Trophy, AlertTriangle, ArrowLeft, Presentation, Castle } from "lucide-react";
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
import { CustomStoryChooser } from "@/components/customStories/CustomStoryChooser";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { awardVillageProgress } from "@/hooks/useVillage";
import { usePreKLevelStars, recordPreKLevelCompletion } from "@/hooks/usePreKLevelStars";

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
  const [gameTheme, setGameTheme] = useState<GameTheme | null>(getStoredTheme());
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);
  const currentGradeMode: GradeMode = getGradeMode(gameTheme);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  // Theme-aware data sources
  const activeWorlds =
    gameTheme === 'agent'
      ? agentCampaignWorlds
      : gameTheme === 'prek'
        ? campaignWorlds.filter((w) => w.mode === 'prek')
        : campaignWorlds.filter((w) => w.mode !== 'prek');
  const activeStories = gameTheme === 'agent' ? agentStories : curatedStories;
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  const [isRpgMode, setIsRpgMode] = useState(false);
  const [rpgView, setRpgView] = useState<'world_map' | 'level_select' | 'battle' | 'prek_reader'>('world_map');
  const [selectedWorld, setSelectedWorld] = useState<CampaignWorld | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CampaignLevel | null>(null);
  const [rpgStory, setRpgStory] = useState<Story | null>(null);
  const [rpgEnemyType, setRpgEnemyType] = useState<EnemyType>('minion');
  const [selectedBattleMode, setSelectedBattleMode] = useState<BattleMode>('classic');
  const [pendingBattle, setPendingBattle] = useState<null | { level: CampaignLevel; mode: BattleMode; enemy: EnemyType; primaryEnemy: string }>(null);
  const isSelectedPreK = !!selectedWorld && (selectedWorld.mode === 'prek' || isPreKWorldId(selectedWorld.id));
  const { levelNums: publishedPrekLevelNums, meta: publishedPrekLevelMeta } = usePublishedPrekLevels(
    isSelectedPreK ? selectedWorld!.id : null,
  );
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

  // Auth comes from the centralized AuthContext so we don't race a separate
  // supabase.auth.getUser() call — that race left `user` undefined on first
  // paint, which made GamificationHeader/SmartNotifications render empty
  // bars and made the RPG Mode button look like it "did nothing" because
  // the `user?.id` render gate dropped through.
  const { user, isLoading: isAuthLoading } = useAuth();

  // Profile (role + default grade mode) still needs its own query because
  // AuthContext's profile shape doesn't carry default_grade_mode.
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('role, default_grade_mode')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error('[AuraPractice] profile load failed', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });


  // Auto-select grade mode from profile default on page load
  // Only applies to the Reading Stories library (non-game routes).
  // In RPG/game mode, the user must explicitly pick a mode via ThemeSelector,
  // so we never preselect a gameTheme from the profile default here.
  useEffect(() => {
    if (isGameMode) return;
    if (!hasLoadedDefault && profile?.default_grade_mode) {
      const defaultTheme = getThemeFromGradeMode(profile.default_grade_mode as GradeMode);
      setGameTheme(defaultTheme);
      setStoredTheme(defaultTheme);
      setHasLoadedDefault(true);
    }
  }, [profile, hasLoadedDefault, isGameMode]);

  const { data: activeScreening } = useActiveScreeningPassage(user?.id);

  // Campaign progress hook - scoped by grade mode
  const { 
    progress: campaignProgress, 
    startBattle, 
    completeBattle,
    initializeProgress 
  } = useCampaignProgress(user?.id, currentGradeMode);

  // Per-level Pre-K stars (source of truth for world tile + level select stars/checkmarks).
  const preKLevelStars = usePreKLevelStars(user?.id, currentGradeMode);

  // All published Pre-K worlds (world_number + level count) so the world map's
  // progress bars/stars match what RPGWorldMap actually renders from the DB.
  const { data: publishedPrekWorldsMeta } = useQuery({
    queryKey: ["published-prek-worlds-meta"],
    queryFn: async (): Promise<Array<{ world_number: number; level_count: number }>> => {
      const { data: worlds, error } = await supabase
        .from("prek_worlds")
        .select("id, world_number, is_published")
        .eq("is_published", true);
      if (error || !worlds) return [];
      const ids = worlds.map((w) => w.id);
      if (!ids.length) return [];
      const { data: levels } = await supabase
        .from("prek_levels")
        .select("world_id, is_published")
        .in("world_id", ids)
        .eq("is_published", true);
      const counts: Record<string, number> = {};
      for (const l of levels ?? []) counts[l.world_id] = (counts[l.world_id] ?? 0) + 1;
      return worlds.map((w) => ({
        world_number: w.world_number,
        level_count: counts[w.id] ?? 0,
      }));
    },
    staleTime: 5 * 60_000,
  });
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

  // Auth-loading gate: while AuthContext is resolving the session, render a
  // spinner instead of the full layout. This prevents the page from painting
  // empty GamificationHeader / SmartNotifications bars (the "blank rectangles"
  // the user was seeing) and prevents click handlers from firing before
  // `user?.id` is available (which made buttons look like they did nothing).
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  // RPG Pre-K One-Word Reader (no story, no minigames, no fail state)
  if (isRpgMode && rpgView === 'prek_reader' && selectedWorld && selectedLevel && user?.id) {
    const handlePreKComplete = async (preKStats: { wordsRead: number; correctWords: number; stars: number }) => {
      try {
        const session = await startBattle({
          storyTitle: selectedLevel.story.title,
          storyCategory: selectedLevel.story.category,
          worldNumber: selectedWorld.id,
          enemyType: 'minion',
          enemyMaxHp: 1,
        });
        await completeBattle({
          battleId: session.id,
          victory: true,
          xpEarned: preKStats.stars * 10,
          damageDealt: preKStats.correctWords,
          longestStreak: preKStats.correctWords,
          storyTitle: selectedLevel.story.title,
          worldNumber: selectedWorld.id,
          goldEarned: preKStats.stars * 5,
        });
        // Award 1 Village Token per completed Pre-K level + sync zone unlocks
        await awardVillageProgress(user.id, 1);
        refetch();
      } catch (e) {
        console.error('[Pre-K] Failed to persist completion:', e);
      }
      setRpgView('level_select');
    };
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-background" onClick={handlePageInteraction}>
        {isGameMode ? <GameHeader studentId={user?.id} /> : <Header />}
        <main className="flex-1 min-h-0 container mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <YubiEpisodeWrapper
            world={selectedWorld}
            level={selectedLevel}
            onBack={() => setRpgView('level_select')}
            onComplete={handlePreKComplete}
          />
        </main>
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
            gradeMode={currentGradeMode}
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
    // Get world progress from campaign data - check ALL worlds for completed titles (handles story reshuffling)
    const worldProgressData = campaignProgress?.world_progress as Record<string, string[]> || {};
    const completedStoriesInWorld = worldProgressData[selectedWorld.id.toString()] || [];
    const allCompletedStories = new Set(Object.values(worldProgressData).flat());
    const completedStories = completedStoriesInWorld;
    
    const isPreKWorld = selectedWorld.mode === 'prek' || isPreKWorldId(selectedWorld.id);

    // Generate levels from world's level data + curated stories (or Pre-K word banks)
    // For Pre-K worlds, only show levels that are PUBLISHED in the Super Admin CMS.
    const sourceLevels = isPreKWorld
      ? selectedWorld.levels.filter((l) => publishedPrekLevelNums.has(l.id))
      : selectedWorld.levels;

    const levels: CampaignLevel[] = sourceLevels.map((levelData, idx) => {
      const isTutorial = selectedWorld.id === 0;

      // Pre-K worlds: synthesize a lightweight story from word banks (no curated stories)
      if (isPreKWorld) {
        const content = getPreKContent(selectedWorld.id, levelData.id);
        const items = content.kind === 'single' ? content.words : content.phrases;
        const preview = items.slice(0, 3).join(' · ');
        const cmsMeta = publishedPrekLevelMeta[levelData.id];
        const title = cmsMeta?.title || `${selectedWorld.name} · Lesson ${levelData.id}`;
        const story = {
          title,
          description: cmsMeta?.goal || preview,
          passage_text: items.join(' '),
          grade_level: 0,
          category: 'adventure' as const,
          word_count: cmsMeta?.wordCount || items.length,
          reading_time_minutes: 1,
          difficulty_level: 0,
          cover_gradient: selectedWorld.gradient || 'from-pink-300 to-rose-400',
          target_phonemes: [] as string[],
        };
        const isCompleted = completedStories.includes(title);
        const isUnlocked = idx === 0 || completedStories.length >= idx;
        return {
          id: levelData.id,
          story,
          enemies: levelData.enemies as CampaignLevel['enemies'],
          isBossLevel: levelData.isBossLevel,
          starsEarned: isCompleted ? 2 : 0,
          isCompleted,
          isUnlocked,
          isTutorial: false,
        };
      }

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

      // Unlock logic: first level always unlocked, subsequent levels unlock when previous is completed
      const prevStoryTitle = activeStories[selectedWorld.levels[idx - 1]?.storyIndex]?.title || '';
      const isPrevCompleted = completedStories.includes(prevStoryTitle) || allCompletedStories.has(prevStoryTitle);
      const isUnlocked = idx === 0 || isPrevCompleted || completedStories.length >= idx;

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
      setSelectedBattleMode(battleMode);

      // Pre-K worlds: skip the standard battle and go straight to the One-Word Reader
      if (isPreKWorld) {
        setRpgView('prek_reader');
        return;
      }

      // Set enemy type based on level
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
      const enemy = enemyMap[primaryEnemy] || 'minion';
      setRpgEnemyType(enemy);

      // Show the custom-story chooser before starting the battle
      setPendingBattle({ level, mode: battleMode, enemy, primaryEnemy });
    };

    const startBattleWithStory = async (storyForBattle: Story) => {
      if (!pendingBattle || !selectedWorld) return;
      setRpgStory(storyForBattle);
      try {
        const battleSession = await startBattle({
          storyTitle: storyForBattle.title,
          storyCategory: storyForBattle.category,
          worldNumber: selectedWorld.id,
          enemyType: pendingBattle.primaryEnemy,
          enemyMaxHp: 100,
        });
        setCurrentBattleId(battleSession.id);
      } catch (error) {
        console.error('Failed to start battle session:', error);
      }
      setPendingBattle(null);
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
        {pendingBattle && (
          <CustomStoryChooser
            open={!!pendingBattle}
            onOpenChange={(open) => { if (!open) setPendingBattle(null); }}
            target={{ kind: "rpg_level", worldId: selectedWorld.id, levelId: pendingBattle.level.id }}
            levelLabel={`${selectedWorld.name} · Level ${pendingBattle.level.id}`}
            defaultStoryLabel={pendingBattle.level.story.title}
            onConfirm={(source) => {
              const base = pendingBattle.level.story;
              const storyForBattle: Story = source.kind === "custom"
                ? { ...base, title: source.story.title, passage_text: source.story.body }
                : base;
              void startBattleWithStory(storyForBattle);
            }}
          />
        )}
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
    // Calculate world progress from campaign data
    const worldProgressData = campaignProgress?.world_progress as Record<string, string[]> || {};
    const totalBooksRescued = campaignProgress?.books_rescued || 0;
    const allCompletedTitles = new Set(Object.values(worldProgressData).flat());
    
    const worldProgress: WorldProgress[] = activeWorlds.map(w => {
      const worldStoriesInDB = worldProgressData[w.id.toString()] || [];
      // Count stories completed for this world's levels (checking all worlds for reshuffled stories)
      const worldLevelTitles = w.levels.map(l => activeStories[l.storyIndex]?.title).filter(Boolean);
      const levelsCompleted = worldLevelTitles.filter(t => allCompletedTitles.has(t)).length || worldStoriesInDB.length;
      const totalLevels = w.levels.length;
      
      // World unlock logic based on previous world completion (check reshuffled stories too)
      let isUnlocked = w.id === 1;
      if (w.id > 1) {
        const prevWorld = activeWorlds.find(pw => pw.id === w.id - 1);
        const prevWorldStoriesInDB = worldProgressData[(w.id - 1).toString()] || [];
        const prevWorldLevelTitles = prevWorld?.levels.map(l => activeStories[l.storyIndex]?.title).filter(Boolean) || [];
        const prevCompleted = prevWorldLevelTitles.filter(t => allCompletedTitles.has(t)).length || prevWorldStoriesInDB.length;
        isUnlocked = prevCompleted >= w.unlockRequirement;
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
          gradeMode={currentGradeMode}
          currentTheme={gameTheme}
          onSelectWorld={(world) => {
            setSelectedWorld(world);
            setRpgView('level_select');
          }}
          onBack={() => {
            setIsRpgMode(false);
            setRpgView('world_map');
            setSelectedWorld(null);
          }}
          onSwitchMode={setGameTheme}
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
            {user?.id && <GamificationHeader studentId={user.id} gradeMode={currentGradeMode} />}
          </div>

          <SmartNotifications onNavigate={(path) => navigate(path)} gradeMode={currentGradeMode} />

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

          {/* Grade Mode Selector */}
          <div className="flex flex-col items-center gap-1">
            <div className="inline-flex items-center rounded-lg border bg-card p-1 gap-1">
              <button
                onClick={() => {
                  setStoredTheme('classic');
                  setGameTheme('classic');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentGradeMode === 'k5'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📚 Grades K-5
              </button>
              <button
                onClick={() => {
                  setStoredTheme('agent');
                  setGameTheme('agent');
                }}
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

          <Card className="overflow-hidden border-2 border-rose-600/50 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 shadow-lg shadow-rose-900/30">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-rose-700 flex items-center justify-center text-3xl shadow-lg border border-slate-500/40">
                    🏰
                  </div>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                      <Castle className="h-5 w-5 text-rose-400" />
                      Castle Swarm Defense
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-rose-50">NEW</span>
                    </h2>
                    <p className="text-sm text-slate-400">Defend your castle by reading aloud in Campaign, Endless, and Daily Challenge.</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/game/castle-swarm')}
                  className="bg-gradient-to-r from-slate-700 to-rose-700 hover:from-slate-600 hover:to-rose-600 font-bold text-slate-50 border border-rose-500/40"
                >
                  <Castle className="h-4 w-4 mr-2" />
                  Enter Castle Mode
                </Button>
              </div>
            </CardContent>
          </Card>

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
                onStartRpgMode={() => {
                  if (!user?.id) {
                    toast({ title: "Loading your profile…", description: "Try again in a moment." });
                    return;
                  }
                  setIsRpgMode(true);
                }}
                onStartCastle={() => navigate('/game/castle-swarm')}
                categoryFilter={categoryFilter}
                gradeMode={currentGradeMode}
              />
            </TabsContent>

            <TabsContent value="bookshelf" className="mt-6">
              <ReadingBookshelf gradeMode={currentGradeMode} />
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
                  {!isGameMode && <ClassChallengeCard studentId={user.id} gradeMode={currentGradeMode} />}
                  
                  {/* Classroom Leaderboard - hide in game mode */}
                  {!isGameMode && <ClassroomLeaderboardWrapper studentId={user.id} gradeMode={currentGradeMode} />}
                </>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6 space-y-6">
              {/* Kid-Friendly Progress at the top */}
              {user?.id && <KidFriendlyProgress studentId={user.id} gradeMode={currentGradeMode} />}
              
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
