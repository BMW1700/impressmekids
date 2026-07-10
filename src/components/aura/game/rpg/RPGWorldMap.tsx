import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lock, Star, Swords, Crown, TreePine, Mountain, Castle, Flame, Sparkles, Gem, Cloud, Waves, Eclipse, GraduationCap, ShoppingBag, Zap, BookOpen, ChevronRight, Home } from "lucide-react";
import { campaignWorlds, CampaignWorld, CampaignLevel } from "@/lib/campaignData";
import { agentCampaignWorlds } from "@/lib/agentCampaignData";
import { getGradeTitle } from "@/lib/gradeUtils";
import { getStoredTheme, setStoredTheme, type GameTheme } from "@/lib/gameTheme";
import { PreKStatsButton } from "@/components/prek/PreKStatsButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { 
  DrakeSilhouette, 
  IceGolemSilhouette, 
  StoneGuardianSilhouette, 
  GrogSilhouette,
  EchoWraithSilhouette,
  ZephyrSilhouette,
  LeviathanSilhouette,
  WordEaterSilhouette,
  BrokerSilhouette,
  ArchitectSilhouette,
  DoubleAgentSilhouette,
  DirectorSilhouette,
} from "../characters/BossSilhouettes";
import { AnimatedStarCounter } from "../effects/StarCollectionEffect";
import { AnimatedBookCounter } from "../effects/FlyingBookAnimation";
import { MilestoneCelebration } from "../effects/MilestoneCelebration";
import { RPGPlayerHUD } from "./RPGPlayerHUD";
import { ReadingProgressPanel } from "./ReadingProgressPanel";
import { BennyStanding } from "./BennyStanding";
import prekBedroomBg from "@/assets/prek-bedroom-bg.png.asset.json";

export interface WorldProgress {
  worldId: number;
  levelsCompleted: number;
  totalLevels: number;
  starsEarned: number;
  isUnlocked: boolean;
}

interface RPGWorldMapProps {
  worldProgress: WorldProgress[];
  totalBooksRescued: number;
  onSelectWorld: (world: CampaignWorld) => void;
  onBack: () => void;
  onStartBossRush?: () => void;
  onSwitchMode?: (theme: GameTheme) => void;
  studentId?: string;
  gold?: number;
  xp?: number;
  gradeMode?: string;
  currentTheme?: GameTheme | null;
}

const worldIcons: Record<number, React.ReactNode> = {
  0: <GraduationCap className="h-8 w-8" />, // Tutorial
  1: <TreePine className="h-8 w-8" />,
  2: <Mountain className="h-8 w-8" />,
  3: <Flame className="h-8 w-8" />,
  4: <Crown className="h-8 w-8" />,
  5: <Gem className="h-8 w-8" />,        // Whispering Caverns
  6: <Cloud className="h-8 w-8" />,       // Floating Isles
  7: <Waves className="h-8 w-8" />,       // Sunken Library
  8: <Eclipse className="h-8 w-8" />,     // The Void
  // Pre-K worlds
  101: <Sparkles className="h-8 w-8" />,
  102: <Zap className="h-8 w-8" />,
  103: <BookOpen className="h-8 w-8" />,
};

// Enhanced SVG connecting path with dotted line and particle flow
const WorldPath = ({ isActive, delay }: { isActive: boolean; delay: number }) => (
  <div className="absolute left-1/2 -translate-x-1/2 h-16 w-8 flex flex-col items-center justify-center overflow-visible">
    {/* SVG path with dashed line */}
    <svg className="absolute w-full h-full overflow-visible" viewBox="0 0 32 64">
      {/* Background dashed line */}
      <path
        d="M16 0 L16 64"
        stroke={isActive ? "#22C55E" : "#475569"}
        strokeWidth="3"
        strokeDasharray="6 4"
        strokeLinecap="round"
        fill="none"
        className="transition-colors duration-500"
      />
      {/* Glow effect for active paths */}
      {isActive && (
        <path
          d="M16 0 L16 64"
          stroke="#22C55E"
          strokeWidth="8"
          strokeDasharray="6 4"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          filter="blur(4px)"
        />
      )}
    </svg>
    
    {/* Animated particles flowing along path */}
    {isActive && (
      <>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
            initial={{ top: "0%", opacity: 0 }}
            animate={{
              top: ["0%", "100%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: delay + i * 0.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </>
    )}
    
    {/* Locked path indicator */}
    {!isActive && (
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-slate-600 border border-slate-500"
        style={{ top: "50%" }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    )}
  </div>
);

// Animated star with pulsing glow
const AnimatedStar = ({ filled, delay }: { filled: boolean; delay: number }) => (
  <motion.div
    initial={{ rotate: -180, opacity: 0, scale: 0 }}
    animate={{ rotate: 0, opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
  >
    <motion.div
      animate={filled ? {
        filter: ['drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))', 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.8))', 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))'],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Star
        className={`h-6 w-6 transition-all duration-300 ${
          filled
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-slate-600'
        }`}
      />
    </motion.div>
  </motion.div>
);

// Boss silhouette component with proper SVG characters
const BossSilhouette = ({ worldId, isUnlocked }: { worldId: number; isUnlocked: boolean }) => {
  const currentTheme = getStoredTheme();
  const isAgent = currentTheme === 'agent';

  const renderSilhouette = () => {
    if (isAgent) {
      switch (worldId) {
        case 1: return <BrokerSilhouette isUnlocked={isUnlocked} size="small" />;
        case 2: return <ArchitectSilhouette isUnlocked={isUnlocked} size="small" />;
        case 3: return <DoubleAgentSilhouette isUnlocked={isUnlocked} size="small" />;
        case 4: return <DirectorSilhouette isUnlocked={isUnlocked} size="small" />;
        default: return <BrokerSilhouette isUnlocked={isUnlocked} size="small" />;
      }
    }
    switch (worldId) {
      case 1: return <DrakeSilhouette isUnlocked={isUnlocked} size="small" />;
      case 2: return <IceGolemSilhouette isUnlocked={isUnlocked} size="small" />;
      case 3: return <StoneGuardianSilhouette isUnlocked={isUnlocked} size="small" />;
      case 4: return <GrogSilhouette isUnlocked={isUnlocked} size="small" />;
      case 5: return <EchoWraithSilhouette isUnlocked={isUnlocked} size="small" />;
      case 6: return <ZephyrSilhouette isUnlocked={isUnlocked} size="small" />;
      case 7: return <LeviathanSilhouette isUnlocked={isUnlocked} size="small" />;
      case 8: return <WordEaterSilhouette isUnlocked={isUnlocked} size="small" />;
      default: return <DrakeSilhouette isUnlocked={isUnlocked} size="small" />;
    }
  };

  return (
    <motion.div
      className={`absolute -right-3 -top-3 p-1 rounded-full ${
        isUnlocked 
          ? 'bg-slate-900/90 border border-red-500/50' 
          : 'bg-slate-800/80 border border-slate-600/50'
      }`}
      animate={isUnlocked ? {
        boxShadow: [
          '0 0 10px rgba(239, 68, 68, 0.3)',
          '0 0 20px rgba(239, 68, 68, 0.5)',
          '0 0 10px rgba(239, 68, 68, 0.3)',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {renderSilhouette()}
    </motion.div>
  );
};

export const RPGWorldMap = ({
  worldProgress,
  totalBooksRescued,
  onSelectWorld,
  onBack,
  onStartBossRush,
  onSwitchMode,
  studentId,
  gold = 0,
  xp = 0,
  gradeMode,
  currentTheme,
}: RPGWorldMapProps) => {
  const navigate = useNavigate();
  const mapTheme = currentTheme ?? getStoredTheme() ?? 'classic';
  const [previousBookCount] = useState(totalBooksRescued);
  // Published Pre-K worlds + levels from the Super Admin CMS. Anything
  // published here appears as a Pre-K world card — whether or not a
  // hardcoded campaignWorlds entry exists for it. `null` = still loading.
  const [publishedPrekWorlds, setPublishedPrekWorlds] = useState<CampaignWorld[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: worlds, error } = await supabase
        .from('prek_worlds')
        .select('id, world_number, title, description, difficulty, sort_order')
        .eq('is_published', true)
        .order('world_number', { ascending: true });
      if (cancelled) return;
      if (error || !worlds) {
        setPublishedPrekWorlds([]);
        return;
      }
      const worldIds = worlds.map((w) => w.id);
      let levelsByWorld: Record<string, number[]> = {};
      if (worldIds.length) {
        const { data: levels } = await supabase
          .from('prek_levels')
          .select('world_id, level_number, is_published')
          .in('world_id', worldIds)
          .eq('is_published', true)
          .order('level_number', { ascending: true });
        for (const l of levels ?? []) {
          (levelsByWorld[l.world_id] ||= []).push(l.level_number);
        }
      }
      const built: CampaignWorld[] = worlds.map((w) => {
        const hardcoded = campaignWorlds.find((c) => c.id === w.world_number && c.mode === 'prek');
        const publishedLevelNums = levelsByWorld[w.id] ?? [];
        const levels: CampaignLevel[] = publishedLevelNums.map((n) => {
          const fromHardcoded = hardcoded?.levels.find((lv) => lv.id === n);
          return fromHardcoded ?? {
            id: n,
            storyIndex: -1,
            enemies: ['wiggleworm'],
            isBossLevel: false,
            starThresholds: [50, 70, 90] as [number, number, number],
          };
        });
        return {
          id: w.world_number,
          name: w.title || hardcoded?.name || `World ${w.world_number}`,
          description: w.description || hardcoded?.description || '',
          gradient: hardcoded?.gradient ?? 'from-pink-300 via-rose-300 to-orange-300',
          bgColor: hardcoded?.bgColor ?? 'bg-pink-900/10',
          enemyTypes: hardcoded?.enemyTypes ?? ['wiggleworm'],
          requiredGradeLevel: 0,
          storyCount: levels.length,
          unlockRequirement: 0,
          mode: 'prek',
          lore: hardcoded?.lore ?? '',
          levels,
        };
      });
      setPublishedPrekWorlds(built);
    })();
    return () => { cancelled = true; };
  }, []);

  // Check if Boss Rush is unlocked (World 8 complete)
  const isBossRushUnlocked = useMemo(() => {
    const world8Progress = worldProgress.find(p => p.worldId === 8);
    return world8Progress && world8Progress.levelsCompleted >= 5;
  }, [worldProgress]);

  const getWorldProgress = (worldId: number, fallbackTotal = 5): WorldProgress => {
    const existing = worldProgress.find(p => p.worldId === worldId);
    if (existing) {
      // Honor the actual authored level count if we know it; DB progress rows
      // can lag behind newly added/removed levels.
      return fallbackTotal > 0
        ? { ...existing, totalLevels: fallbackTotal }
        : existing;
    }
    return {
      worldId,
      levelsCompleted: 0,
      totalLevels: fallbackTotal,
      starsEarned: 0,
      isUnlocked: worldId === 1,
    };
  };

  const isWorldUnlocked = (world: CampaignWorld): boolean => {
    if (world.mode === 'prek') return true; // Pre-K worlds always unlocked
    if (world.id === 0) return true; // Tutorial always unlocked
    if (world.id === 1) return true;
    const prevWorld = getWorldProgress(world.id - 1);
    return prevWorld.levelsCompleted >= world.unlockRequirement;
  };

  const isPrek = mapTheme === 'prek';

  return (
    <div
      className={`dark min-h-screen p-4 relative overflow-hidden z-0 ${isPrek ? '' : 'bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900'}`}
    >
      {/* Milestone celebrations */}
      <MilestoneCelebration currentCount={totalBooksRescued} />

      {/* Pre-K bedroom background — fixed to viewport so it doesn't scroll */}
      {isPrek && (
        <>
          <div className="fixed inset-0 bg-slate-900 pointer-events-none z-0" aria-hidden />
          <img
            src={prekBedroomBg.url}
            alt=""
            aria-hidden
            draggable={false}
            className="fixed inset-0 w-screen h-screen object-cover object-center pointer-events-none select-none z-0"
          />
          <div className="fixed inset-0 bg-slate-950/45 pointer-events-none z-0" aria-hidden />
        </>
      )}

      {/* Animated background particles (non-Pre-K) */}
      {!isPrek && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                delay: Math.random() * 5,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      )}

      {/* Benny standing on the left (Pre-K only, desktop) */}
      {isPrek && (
        <div className="hidden lg:block fixed left-[-160px] xl:left-[-140px] bottom-[-180px] xl:bottom-[-220px] z-[6] pointer-events-none">
          <BennyStanding size={720} />

        </div>
      )}

      {/* Header */}
      <div className="relative z-[5] flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {/* Mode switcher — Pre-K → Classic → Agent (grade-level order) */}
          {(() => {
            const current = mapTheme;
            const MODES: { value: GameTheme; label: string; sub: string; emoji: string }[] = [
              { value: 'prek',    label: 'Pre-K',   sub: 'Ages 3–5', emoji: '✨' },
              { value: 'classic', label: 'Classic', sub: 'Grades K–5', emoji: '⚔️' },
              { value: 'agent',   label: 'Agent',   sub: 'Grades 6–12', emoji: '🕵️' },
            ];
            const currentMode = MODES.find((m) => m.value === current) ?? MODES[1];
            const handlePick = (next: GameTheme) => {
              if (next === current) return;
              setStoredTheme(next);
              if (onSwitchMode) onSwitchMode(next);
              else window.location.reload();
            };
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    {currentMode.emoji} {currentMode.label} — Switch
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {MODES.map((m) => (
                    <DropdownMenuItem
                      key={m.value}
                      onClick={() => handlePick(m.value)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{m.emoji}</span>
                        <span className="flex flex-col leading-tight">
                          <span className="font-semibold">{m.label}</span>
                          <span className="text-xs text-muted-foreground">{m.sub}</span>
                        </span>
                      </span>
                      {current === m.value && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}
        </div>
        
        {/* Player HUD with Gold, XP, Streak, Achievements, Pets */}
        {studentId && (
          <RPGPlayerHUD 
            studentId={studentId} 
            gold={gold} 
            xp={xp}
            gradeMode={gradeMode}
            className="hidden sm:flex"
          />
        )}

        {/* Pre-K → Benny's Village entry */}
        {isPrek && (
          <Button
            onClick={() => navigate('/game/village')}
            className="bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold shadow-lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Benny's Village
          </Button>
        )}


        <motion.div 
          className="flex items-center gap-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Enhanced animated book counter */}
          <motion.div 
            className="bg-amber-900/60 px-4 py-2 rounded-full border border-amber-500/50"
            animate={{
              boxShadow: [
                '0 0 10px rgba(245, 158, 11, 0.3)',
                '0 0 20px rgba(245, 158, 11, 0.5)',
                '0 0 10px rgba(245, 158, 11, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AnimatedBookCounter 
              count={totalBooksRescued} 
              previousCount={previousBookCount} 
            />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Mobile Player HUD */}
      {studentId && (
        <div className="sm:hidden mb-4 flex justify-center">
          <RPGPlayerHUD 
            studentId={studentId} 
            gold={gold} 
            xp={xp}
            gradeMode={gradeMode}
          />
        </div>
      )}
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-[5]"
      >
        <motion.div
          className="inline-block"
          animate={{
            textShadow: [
              '0 0 20px rgba(251, 191, 36, 0.3)',
              '0 0 40px rgba(251, 191, 36, 0.5)',
              '0 0 20px rgba(251, 191, 36, 0.3)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 mb-2">
            {mapTheme === 'agent' ? '🕵️ Agent Mode' : mapTheme === 'prek' ? '✨ Pre-K Mode' : '⚔️ RPG Mode'}
          </h1>
        </motion.div>
        <p className="text-purple-300 text-lg">
          {mapTheme === 'agent'
            ? 'Your covert reading mission begins, agent!'
            : mapTheme === 'prek'
              ? 'Your Yubi Village adventure awaits!'
              : 'Your reading adventure awaits, hero!'}
        </p>

        {mapTheme === 'prek' && (
          <div className="mt-4 flex justify-center">
            <PreKStatsButton studentId={studentId} />
          </div>
        )}
        
        {/* Sparkle decorations */}
        <motion.div
          className="absolute -left-4 top-0"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="h-6 w-6 text-yellow-400/50" />
        </motion.div>
        <motion.div
          className="absolute -right-4 bottom-0"
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Sparkles className="h-5 w-5 text-purple-400/50" />
        </motion.div>
      </motion.div>

      {/* Pre-K horizontal Reading Journey strip */}
      {isPrek && studentId && (
        <div className="hidden lg:block max-w-4xl mx-auto relative z-[5] mb-6 lg:ml-[480px] xl:ml-[540px] lg:mr-auto px-1">
          <ReadingProgressPanel studentId={studentId} gradeMode={gradeMode} layout="horizontal" />
        </div>
      )}

      {/* World 0: Phonics Foundations — prominent entry banner */}
      <div className={`max-w-4xl mx-auto relative z-[5] mb-6 ${isPrek ? 'lg:ml-[480px] xl:ml-[540px] lg:mr-auto' : ''}`}>

        <motion.button
          type="button"
          onClick={() => navigate('/game/phonics-foundations')}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full text-left rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600/30 via-teal-600/25 to-cyan-600/30 p-4 sm:p-5 shadow-lg shadow-emerald-900/30 hover:border-emerald-300/70 transition-colors"
          aria-label="Open World 0: Phonics Foundations"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/30 border border-emerald-300/40 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-emerald-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-200 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  World 0 · New
                </span>
                <span className="text-[10px] sm:text-xs text-emerald-100/80 hidden sm:inline">
                  CCSS RF.K.2 – RF.2.3
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Phonics Foundations
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/85 mt-0.5">
                Master CVC, blends, Silent-E, digraphs & vowel teams — speech-checked.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-200 flex-shrink-0" />
          </div>
        </motion.button>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/scope-and-sequence')}
            className="text-[11px] sm:text-xs text-purple-200/80 hover:text-white inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            <BookOpen className="w-3 h-3" />
            View Full Scope &amp; Sequence
          </button>
        </div>
      </div>

      {/* World Cards with Enhanced Connecting Paths */}
      <div className={`max-w-4xl mx-auto relative z-[5] ${isPrek ? 'lg:ml-[480px] xl:ml-[540px] lg:mr-auto' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(() => {
            const theme = mapTheme;
            let displayedWorlds: CampaignWorld[];
            if (theme === 'agent') {
              displayedWorlds = agentCampaignWorlds;
            } else if (theme === 'prek') {
              displayedWorlds = [...(publishedPrekWorlds ?? [])].sort((a, b) => a.id - b.id);
            } else {
              displayedWorlds = campaignWorlds.filter((w) => w.mode !== 'prek');
            }
            return displayedWorlds.map((world, index) => {
            const authoredLevelCount = world.levels?.length ?? world.storyCount ?? 5;
            const progress = getWorldProgress(world.id, authoredLevelCount);
            const unlocked = isWorldUnlocked(world);
            const completionPercent = progress.totalLevels > 0 
              ? (progress.levelsCompleted / progress.totalLevels) * 100 
              : 0;
            const isComplete = progress.totalLevels > 0 && progress.levelsCompleted >= progress.totalLevels;
            const avgStarsPerLevel = progress.levelsCompleted > 0 
              ? Math.floor(progress.starsEarned / progress.levelsCompleted)
              : 0;

            return (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {/* Enhanced SVG path connector to next world */}
                {index < displayedWorlds.length - 1 && index % 2 === 1 && (
                  <div className="hidden md:block absolute -bottom-8 left-1/2 -translate-x-1/2 z-0">
                    <WorldPath isActive={isComplete} delay={index * 0.2} />
                  </div>
                )}

                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300
                    ${unlocked 
                      ? 'hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30' 
                      : 'opacity-60 cursor-not-allowed grayscale'
                    }
                    border-2 ${unlocked ? 'border-purple-500/50' : 'border-slate-600'}`}
                  onClick={() => unlocked && onSelectWorld(world)}
                >
                  {/* Background Gradient */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${world.gradient} opacity-20`}
                    animate={unlocked && !isComplete ? {
                      opacity: [0.15, 0.25, 0.15],
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Completion Glow Effect */}
                  {isComplete && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10"
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  
                  {/* Lock Overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center z-10">
                      <motion.div 
                        className="text-center"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Lock className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        </motion.div>
                        <p className="text-slate-400 text-sm">
                          Complete {world.unlockRequirement} stories in previous world
                        </p>
                      </motion.div>
                    </div>
                  )}

                  {/* Boss Silhouette with proper SVG character */}
                  {/* Boss Silhouette — Classic/Agent K-12 worlds only */}
                  {world.id >= 1 && world.mode !== 'prek' && (
                    <BossSilhouette worldId={world.id} isUnlocked={unlocked} />
                  )}

                  <div className="relative p-6 z-5">
                    {/* World Icon & Number */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className={`p-3 rounded-xl bg-gradient-to-br ${world.gradient} text-white shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {worldIcons[world.id] || <Swords className="h-8 w-8" />}
                      </motion.div>
                      <div className="text-right">
                        <span className="text-sm text-purple-300">World</span>
                        <motion.div 
                          className="text-3xl font-black text-white"
                          animate={unlocked ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {world.id}
                        </motion.div>
                      </div>
                    </div>

                    {/* Grade Label */}
                    {world.id > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-300 mb-1">
                        {world.mode === 'prek' ? 'Pre-K' : getGradeTitle(world.requiredGradeLevel)}
                      </span>
                    )}

                    {/* World Name */}
                    <h3 className={`text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${world.gradient}`}>
                      {world.name}
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">{world.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{progress.levelsCompleted}/{progress.totalLevels} Levels</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${completionPercent}%` }}
                          transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
                          className={`h-full bg-gradient-to-r ${world.gradient}`}
                        />
                      </div>
                    </div>

                    {/* Animated Stars with counter */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((star) => (
                          <AnimatedStar
                            key={star}
                            filled={star <= avgStarsPerLevel}
                            delay={index * 0.15 + star * 0.1}
                          />
                        ))}
                      </div>
                      <AnimatedStarCounter 
                        count={progress.starsEarned} 
                        delay={index * 0.15 + 0.5} 
                      />
                    </div>

                    {/* Boss Indicator — Classic K-12 World 4 only */}
                    {world.id === 4 && world.mode !== 'prek' && mapTheme === 'classic' && (
                      <motion.div 
                        className="mt-4 flex items-center gap-2 bg-red-900/50 px-3 py-2 rounded-lg border border-red-500/50"
                        animate={{
                          boxShadow: [
                            '0 0 10px rgba(239, 68, 68, 0.2)',
                            '0 0 20px rgba(239, 68, 68, 0.4)',
                            '0 0 10px rgba(239, 68, 68, 0.2)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="h-5 w-5 text-red-400" />
                        </motion.div>
                        <span className="text-red-300 font-bold text-sm">FINAL BOSS: Grog the Goblin King!</span>
                      </motion.div>
                    )}

                    {/* Completion Badge */}
                    {isComplete && (
                      <motion.div
                        className="absolute top-2 right-12 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.15 + 0.6, type: "spring" }}
                      >
                        ✓ COMPLETE
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          });
          })()}
        </div>
      </div>

      {/* Reading Progress Panel - Fixed position on left side (non-Pre-K) */}
      {studentId && !isPrek && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20 hidden lg:block">
          <ReadingProgressPanel studentId={studentId} gradeMode={gradeMode} />
        </div>
      )}

      {/* Mobile Reading Progress Panel (non-Pre-K; Pre-K renders horizontal panel inline above) */}
      {studentId && !isPrek && (
        <div className="lg:hidden mt-4 px-4 relative z-10">
          <ReadingProgressPanel studentId={studentId} gradeMode={gradeMode} />
        </div>
      )}

      {/* Pre-K mobile Reading Journey strip (horizontal panel already shown above on desktop) */}
      {studentId && isPrek && (
        <div className="lg:hidden mt-4 px-4 relative z-10">
          <ReadingProgressPanel studentId={studentId} gradeMode={gradeMode} layout="horizontal" />
        </div>
      )}

      {/* Boss Rush Button - Only visible after World 8 completion */}
      {isBossRushUnlocked && onStartBossRush && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(168, 85, 247, 0.4)',
                '0 0 40px rgba(168, 85, 247, 0.7)',
                '0 0 20px rgba(168, 85, 247, 0.4)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Button
              onClick={onStartBossRush}
              size="lg"
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-bold text-lg px-8 py-4 rounded-xl border-2 border-purple-400/50"
            >
              <Zap className="h-5 w-5 mr-2" />
              ⚔️ BOSS RUSH ⚔️
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom Lore */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center relative z-10"
      >
        <motion.p 
          className="text-purple-400 italic max-w-2xl mx-auto"
          animate={{
            textShadow: [
              '0 0 10px rgba(168, 85, 247, 0.2)',
              '0 0 20px rgba(168, 85, 247, 0.3)',
              '0 0 10px rgba(168, 85, 247, 0.2)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {mapTheme === 'agent'
            ? '"The Syndicate has stolen classified intelligence files. Infiltrate their operation, decode their secrets, and bring down The Director!"'
            : mapTheme === 'prek'
              ? '"Yubi Village is ready for little readers. Follow the published worlds and practice each friendly word."'
              : '"Princess Ella\'s books are scattered across four worlds. Defeat Grog\'s minions, rescue the books, and restore magic to the kingdom!"'
          }
        </motion.p>
      </motion.div>
    </div>
  );
};
