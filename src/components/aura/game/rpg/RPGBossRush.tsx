import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Swords, Timer, Trophy, Skull, Crown, Sparkles } from "lucide-react";
import { useBossRush } from "@/hooks/useBossRush";
import { RPGBattleArena } from "./RPGBattleArena";
import { curatedStories } from "@/data/curatedStories";

// Boss order for the 9-boss gauntlet
const BOSS_QUEUE: Array<{
  name: string;
  enemyType: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon' | 'ice_golem' | 'stone_guardian' | 'echo_wraith' | 'zephyr' | 'leviathan' | 'word_eater';
  worldNumber: number;
  color: string;
}> = [
  { name: "Tutorial Boss", enemyType: "guard", worldNumber: 0, color: "from-green-500 to-emerald-600" },
  { name: "Drake the Dragon", enemyType: "dragon", worldNumber: 1, color: "from-red-500 to-orange-600" },
  { name: "Ice Golem", enemyType: "ice_golem", worldNumber: 2, color: "from-cyan-500 to-blue-600" },
  { name: "Stone Guardian", enemyType: "stone_guardian", worldNumber: 3, color: "from-amber-500 to-yellow-600" },
  { name: "Grog the Goblin King", enemyType: "boss", worldNumber: 4, color: "from-green-500 to-lime-600" },
  { name: "Echo Wraith", enemyType: "echo_wraith", worldNumber: 5, color: "from-purple-500 to-violet-600" },
  { name: "Zephyr", enemyType: "zephyr", worldNumber: 6, color: "from-sky-500 to-cyan-600" },
  { name: "Leviathan", enemyType: "leviathan", worldNumber: 7, color: "from-teal-500 to-emerald-600" },
  { name: "The Word Eater", enemyType: "word_eater", worldNumber: 8, color: "from-purple-600 to-pink-600" },
];

interface RPGBossRushProps {
  studentId: string;
  onBack: () => void;
  onComplete: (victory: boolean, stats: {
    bossesDefeated: number;
    totalTime: number;
    totalXp: number;
    totalGold: number;
  }) => void;
}

export const RPGBossRush = ({ studentId, onBack, onComplete }: RPGBossRushProps) => {
  const {
    isActive,
    currentBossIndex,
    stats,
    formattedTime,
    elapsedSeconds,
    startBossRush,
    recordBossDefeat,
    completeBossRush,
    failBossRush,
    cancelBossRush,
  } = useBossRush(studentId);

  const [showIntro, setShowIntro] = useState(true);
  const [showBattle, setShowBattle] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);

  // Get a random story for each boss battle
  const getStoryForBoss = useCallback((bossIndex: number) => {
    const availableStories = curatedStories;
    return availableStories[bossIndex % availableStories.length] || curatedStories[0];
  }, []);

  // Start the Boss Rush
  const handleStart = async () => {
    const success = await startBossRush();
    if (success) {
      setShowIntro(false);
      setShowBattle(true);
    }
  };

  // Handle battle completion
  const handleBattleComplete = async (victory: boolean, battleStats: {
    wordsRead: number;
    correctWords: number;
    longestStreak: number;
    damageDealt: number;
    xpEarned: number;
    goldEarned?: number;
  }) => {
    if (victory) {
      // Record boss defeat
      await recordBossDefeat({
        damageDealt: battleStats.damageDealt,
        wordsRead: battleStats.wordsRead,
        xpEarned: battleStats.xpEarned,
        goldEarned: battleStats.goldEarned || 0,
        longestStreak: battleStats.longestStreak,
      });

      // Check if all bosses defeated
      if (currentBossIndex >= BOSS_QUEUE.length - 1) {
        await completeBossRush();
        setShowBattle(false);
        setShowVictory(true);
      }
      // Otherwise continue to next boss (currentBossIndex is updated by recordBossDefeat)
    } else {
      // Player defeated
      await failBossRush();
      setShowBattle(false);
      setShowDefeat(true);
    }
  };

  // Exit Boss Rush
  const handleExit = () => {
    cancelBossRush();
    onBack();
  };

  // Victory screen exit
  const handleVictoryExit = () => {
    onComplete(true, {
      bossesDefeated: stats.bossesDefeated,
      totalTime: elapsedSeconds,
      totalXp: stats.totalXpEarned,
      totalGold: stats.totalGoldEarned,
    });
  };

  // Defeat screen exit
  const handleDefeatExit = () => {
    onComplete(false, {
      bossesDefeated: stats.bossesDefeated,
      totalTime: elapsedSeconds,
      totalXp: stats.totalXpEarned,
      totalGold: stats.totalGoldEarned,
    });
  };

  // Intro Screen
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/40 rounded-full"
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

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={handleExit}
          className="absolute top-4 left-4 text-white/70 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-block"
            animate={{
              textShadow: [
                '0 0 20px rgba(168, 85, 247, 0.5)',
                '0 0 40px rgba(168, 85, 247, 0.8)',
                '0 0 20px rgba(168, 85, 247, 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-4">
              ⚔️ BOSS RUSH ⚔️
            </h1>
          </motion.div>
          <p className="text-purple-300 text-xl">The Ultimate Reading Challenge</p>
        </motion.div>

        {/* Boss queue preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/60 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full mb-8"
        >
          <h2 className="text-center text-lg font-bold text-purple-300 mb-4">
            9 Bosses • 1 Hero • No Breaks
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {BOSS_QUEUE.map((boss, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className={`bg-gradient-to-br ${boss.color} rounded-lg p-2 text-center`}
              >
                <div className="text-2xl mb-1">
                  {i === 8 ? '👹' : i === 4 ? '👑' : '💀'}
                </div>
                <div className="text-xs text-white/90 font-medium truncate">
                  {boss.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-white/60">Boss {i + 1}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-purple-200/80 mb-8 max-w-md"
        >
          <p className="text-sm">
            💎 Defeat all 9 bosses without losing to earn the <strong>Champion of Words</strong> title!
          </p>
          <p className="text-sm mt-2">
            ⏱️ Your time is tracked - can you beat your best?
          </p>
        </motion.div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
        >
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xl px-12 py-6 rounded-xl shadow-lg shadow-purple-500/30"
          >
            <Swords className="h-6 w-6 mr-3" />
            BEGIN BOSS RUSH
          </Button>
        </motion.div>
      </div>
    );
  }

  // Battle Screen
  if (showBattle && isActive) {
    const currentBoss = BOSS_QUEUE[currentBossIndex];
    const story = getStoryForBoss(currentBossIndex);

    return (
      <div className="relative min-h-screen">
        {/* Boss Rush HUD Overlay */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-900/95 to-transparent py-2 px-4"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Timer */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-purple-500/50">
              <Timer className="h-4 w-4 text-purple-400" />
              <span className="text-white font-mono font-bold">{formattedTime}</span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-purple-500/50">
              <Crown className="h-4 w-4 text-yellow-400" />
              <span className="text-white font-bold">Boss {currentBossIndex + 1}/9</span>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1 text-yellow-400">
                <span className="text-sm">⚔️</span>
                <span className="text-sm font-bold">{stats.totalDamageDealt}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <span className="text-sm">🪙</span>
                <span className="text-sm font-bold">{stats.totalGoldEarned}</span>
              </div>
            </div>
          </div>

          {/* Boss progress bar */}
          <div className="max-w-4xl mx-auto mt-2">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentBossIndex) / 9) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-1">
              {BOSS_QUEUE.map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < currentBossIndex
                      ? 'bg-green-500'
                      : i === currentBossIndex
                      ? 'bg-purple-500 ring-2 ring-purple-300'
                      : 'bg-slate-600'
                  }`}
                  animate={i === currentBossIndex ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Battle */}
        <div className="pt-20">
          <RPGBattleArena
            story={story}
            enemyType={currentBoss.enemyType as any}
            studentId={studentId}
            battleMode="classic"
            worldNumber={currentBoss.worldNumber}
            onBack={handleExit}
            onComplete={handleBattleComplete}
          />
        </div>
      </div>
    );
  }

  // Victory Screen
  if (showVictory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-900 via-amber-900 to-orange-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Celebration particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{
                x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
                y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
                scale: 0,
              }}
              animate={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                scale: [0, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 1,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
              }}
            >
              {['⭐', '🌟', '✨', '💎', '🏆', '👑'][i % 6]}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1 }}
          className="text-8xl mb-6"
        >
          🏆
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 text-center mb-4"
        >
          CHAMPION OF WORDS!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-amber-200 text-xl mb-8"
        >
          You defeated all 9 bosses!
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-amber-900/60 backdrop-blur-sm border border-amber-500/50 rounded-2xl p-6 mb-8 max-w-md w-full"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{formattedTime}</div>
              <div className="text-amber-300 text-sm">Total Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.bossesDefeated}</div>
              <div className="text-amber-300 text-sm">Bosses Defeated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">{stats.totalGoldEarned}</div>
              <div className="text-amber-300 text-sm">Gold Earned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">{stats.totalXpEarned}</div>
              <div className="text-amber-300 text-sm">XP Earned</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <Button
            onClick={handleVictoryExit}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 font-bold text-lg px-8 py-4"
          >
            <Trophy className="h-5 w-5 mr-2" />
            Claim Rewards
          </Button>
        </motion.div>
      </div>
    );
  }

  // Defeat Screen
  if (showDefeat) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-red-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="text-6xl mb-6"
        >
          💀
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-red-400 text-center mb-4"
        >
          Defeated!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-red-300 text-lg mb-8"
        >
          You defeated {stats.bossesDefeated} of 9 bosses
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/60 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 mb-8 max-w-md w-full"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{formattedTime}</div>
              <div className="text-red-300 text-sm">Time Survived</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.bossesDefeated}/9</div>
              <div className="text-red-300 text-sm">Progress</div>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-4">
          <Button
            onClick={handleDefeatExit}
            variant="outline"
            className="border-red-500/50 text-red-300 hover:bg-red-900/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return
          </Button>
          <Button
            onClick={async () => {
              setShowDefeat(false);
              setShowIntro(true);
            }}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
          >
            <Swords className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
