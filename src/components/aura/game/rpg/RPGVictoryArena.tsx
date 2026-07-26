import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Sword, Shield, Zap, Star, ArrowLeft } from "lucide-react";
import { RPGArenaFighter, FighterAction } from "./RPGArenaFighter";
import { ArenaAI } from "./RPGArenaAI";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { RPGLootChest } from "./v2/RPGLootChest";
import { rollBossLoot, type RolledLoot } from "@/hooks/usePlayerLoot";
import { awardQuestProgress } from "@/hooks/useDailyQuests";

const battleSounds = new SoundEffects();

interface RPGVictoryArenaProps {
  worldNumber: number;
  worldName: string;
  playerName?: string;
  onComplete: (bonusGold: number, bonusXp: number) => void;
  onSkip: () => void;
}

export const RPGVictoryArena = ({
  worldNumber,
  worldName,
  playerName = "Champion",
  onComplete,
  onSkip,
}: RPGVictoryArenaProps) => {
  const [phase, setPhase] = useState<'intro' | 'battle' | 'victory' | 'defeat'>('intro');
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(80 + worldNumber * 10);
  const [enemyMaxHp] = useState(80 + worldNumber * 10);
  const [playerAction, setPlayerAction] = useState<FighterAction>('idle');
  const [enemyAction, setEnemyAction] = useState<FighterAction>('idle');
  const [canAct, setCanAct] = useState(true);
  const [combo, setCombo] = useState(0);
  const [showComicText, setShowComicText] = useState<string | null>(null);
  const [rolledLoot, setRolledLoot] = useState<RolledLoot | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const lootRolledRef = useRef(false);

  const aiRef = useRef(new ArenaAI(Math.min(3, worldNumber)));
  const actionLockRef = useRef(false);

  // Roll boss loot + award quest progress once when victory triggers
  useEffect(() => {
    if (phase !== 'victory' || lootRolledRef.current) return;
    lootRolledRef.current = true;
    const bossId = `arena-w${worldNumber}`;
    void rollBossLoot(bossId, worldNumber).then((drop) => {
      if (drop) {
        setRolledLoot(drop);
        setChestOpen(true);
      }
    });
    // The arena is a bonus brawl that follows a boss fight the combat phase has
    // already credited, so do NOT award `defeat_bosses` here — that double-counted
    // one boss defeat across two quest paths and inflated Season XP.
    void awardQuestProgress('defeat_enemies');
    void awardQuestProgress('battle_wins');

  }, [phase, worldNumber]);

  // Enemy AI loop
  useEffect(() => {
    if (phase !== 'battle') return;

    const aiLoop = setInterval(() => {
      if (actionLockRef.current) return;
      
      const action = aiRef.current.getNextAction();
      setEnemyAction(action.type as FighterAction);

      if (action.type === 'punch' || action.type === 'kick' || action.type === 'special') {
        setTimeout(() => {
          setPlayerAction(prev => {
            if (prev === 'block') {
              setShowComicText('BLOCKED!');
              battleSounds.shieldBlock();
              setTimeout(() => setShowComicText(null), 600);
              return prev;
            }
            if (prev === 'dodge') {
              setShowComicText('MISS!');
              setTimeout(() => setShowComicText(null), 600);
              return prev;
            }
            const damage = Math.floor(aiRef.current.getDamage(action.type));
            setPlayerHp(hp => Math.max(0, hp - damage));
            setPlayerAction('hit');
            setShowComicText('POW!');
            battleSounds.lightningCrack();
            setCombo(0);
            setTimeout(() => {
              setShowComicText(null);
              setPlayerAction('idle');
            }, 400);
            return 'hit';
          });
        }, 200);
      }

      setTimeout(() => {
        setEnemyAction('idle');
      }, action.duration);
    }, 1200 + Math.random() * 800);

    return () => clearInterval(aiLoop);
  }, [phase]);

  // Check win/lose
  useEffect(() => {
    if (playerHp <= 0 && phase === 'battle') {
      setPhase('defeat');
      setPlayerAction('defeat');
      setEnemyAction('victory');
      battleSounds.incorrectWord();
    }
    if (enemyHp <= 0 && phase === 'battle') {
      setPhase('victory');
      setPlayerAction('victory');
      setEnemyAction('defeat');
      battleSounds.victoryFanfare();
    }
  }, [playerHp, enemyHp, phase]);

  // Player action
  const performAction = useCallback((action: 'punch' | 'kick' | 'block' | 'dodge' | 'special') => {
    if (!canAct || actionLockRef.current || phase !== 'battle') return;

    actionLockRef.current = true;
    setCanAct(false);
    setPlayerAction(action);

    if (action === 'punch' || action === 'kick' || action === 'special') {
      setTimeout(() => {
        if (enemyAction === 'block') {
          setShowComicText('BLOCKED!');
          setTimeout(() => setShowComicText(null), 600);
        } else {
          const baseDmg = action === 'punch' ? 8 : action === 'kick' ? 12 : 20;
          const comboDmg = baseDmg + combo * 2;
          setEnemyHp(hp => Math.max(0, hp - comboDmg));
          setEnemyAction('hit');
          setCombo(prev => prev + 1);

          const comicTexts = ['POW!', 'BAM!', 'WHAM!', 'CRACK!', 'BOOM!'];
          setShowComicText(comicTexts[Math.floor(Math.random() * comicTexts.length)]);
          battleSounds.correctWord();

          setTimeout(() => {
            setEnemyAction('idle');
            setShowComicText(null);
          }, 400);
        }
      }, 200);
    }

    const cooldown = action === 'special' ? 1500 : action === 'block' ? 800 : 500;
    setTimeout(() => {
      setPlayerAction('idle');
      actionLockRef.current = false;
      setCanAct(true);
    }, cooldown);
  }, [canAct, phase, enemyAction, combo]);

  const handleStart = useCallback(() => {
    setPhase('battle');
  }, []);

  const bonusGold = phase === 'victory' ? 50 + worldNumber * 10 : 10;
  const bonusXp = phase === 'victory' ? 100 + worldNumber * 20 : 20;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] overflow-hidden select-none flex flex-col">
      {/* Arena Background — layered stadium */}
      <div className="absolute inset-0">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-amber-950" />
        {/* Spotlights */}
        <div className="absolute top-0 left-1/4 w-[40%] h-[60%] bg-gradient-radial from-amber-300/15 via-transparent to-transparent blur-2xl" />
        <div className="absolute top-0 right-1/4 w-[40%] h-[60%] bg-gradient-radial from-orange-300/15 via-transparent to-transparent blur-2xl" />
        {/* Crowd silhouettes (back) */}
        <div className="absolute top-[18%] left-0 right-0 h-24 flex items-end justify-center gap-0.5 overflow-hidden opacity-60">
          {Array.from({ length: 80 }).map((_, i) => (
            <motion.div key={`b${i}`} animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.7, delay: Math.random() * 2 }}
              className="w-2 bg-slate-950/80 rounded-t-full" style={{ height: 10 + Math.random() * 18 }} />
          ))}
        </div>
        {/* Crowd silhouettes (front, larger) */}
        <div className="absolute top-[26%] left-0 right-0 h-28 flex items-end justify-center gap-1 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div key={`f${i}`} animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.6, delay: Math.random() * 2 }}
              className="w-3 bg-slate-950 rounded-t-full" style={{ height: 18 + Math.random() * 26 }} />
          ))}
        </div>
        {/* Arena floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-amber-900 via-amber-800/80 to-orange-900/60" />
        {/* Floor ring */}
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[70%] max-w-3xl h-32 rounded-[50%] bg-amber-700/50 blur-sm" />
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 w-[60%] max-w-2xl h-24 rounded-[50%] border-2 border-amber-400/40" />
        {/* Banners */}
        <div className="absolute top-2 left-6 w-12 h-20 bg-gradient-to-b from-red-600 to-red-800 rounded-b-lg shadow-lg" />
        <div className="absolute top-2 right-6 w-12 h-20 bg-gradient-to-b from-blue-600 to-blue-800 rounded-b-lg shadow-lg" />
      </div>

      {/* HUD */}
      <div className="relative z-[110] px-4 pt-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-1" /> Skip
          </Button>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-amber-500/40">
            <Sword className="h-5 w-5 text-amber-400" />
            <span className="text-amber-300 font-black text-sm tracking-wider">VICTORY ARENA</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-amber-300 text-sm font-bold w-16 text-right">{combo > 0 ? `${combo}× COMBO` : ''}</div>
        </div>
        <div className="flex gap-4 max-w-2xl mx-auto mt-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-300 font-bold">{playerName}</span>
              <span className="text-green-200 font-mono">{playerHp}/100</span>
            </div>
            <div className="h-3 bg-slate-900/70 rounded-full overflow-hidden border border-green-500/30">
              <motion.div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" animate={{ width: `${playerHp}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-200 font-mono">{enemyHp}/{enemyMaxHp}</span>
              <span className="text-red-300 font-bold">Challenger</span>
            </div>
            <div className="h-3 bg-slate-900/70 rounded-full overflow-hidden border border-red-500/30">
              <motion.div className="h-full bg-gradient-to-r from-rose-400 to-red-500 ml-auto" animate={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stage area — fills the middle */}
      <div className="relative z-[105] flex-1 flex items-center justify-center px-6">
        {/* Comic text */}
        <AnimatePresence>
          {showComicText && (
            <motion.div key={showComicText} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1.6, rotate: 8 }} exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] pointer-events-none">
              <span className="text-6xl md:text-7xl font-black text-yellow-400"
                style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
                {showComicText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fighters anchored on the arena ring */}
        <div className="relative w-full max-w-3xl h-full flex items-end justify-between pb-12 md:pb-16">
          <div className="ml-4 md:ml-16 scale-150 md:scale-[1.8] origin-bottom">
            <RPGArenaFighter name={playerName} hp={playerHp} maxHp={100} action={playerAction} position="left" isPlayer color="#3b82f6" />
          </div>
          <div className="mr-4 md:mr-16 scale-150 md:scale-[1.8] origin-bottom">
            <RPGArenaFighter name="Challenger" hp={enemyHp} maxHp={enemyMaxHp} action={enemyAction} position="right" color="#ef4444" />
          </div>
        </div>
      </div>

      {/* Intro */}
      {phase === 'intro' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring" }} className="text-center max-w-md mx-4 p-8 rounded-2xl bg-gradient-to-b from-amber-950/90 to-slate-950/90 border-2 border-amber-500/40 shadow-2xl">
            <Trophy className="h-20 w-20 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
            <h2 className="text-4xl font-black text-amber-400 mb-2 tracking-wider">VICTORY ARENA</h2>
            <p className="text-white text-lg mb-1">You conquered <span className="text-amber-300 font-bold">{worldName}</span>!</p>
            <p className="text-slate-300 mb-6">Step into the arena for a bonus brawl.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleStart} className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold px-8 text-base">
                ⚔️ FIGHT!
              </Button>
              <Button variant="outline" onClick={onSkip} className="border-slate-500 text-slate-200 hover:bg-white/10">Skip</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Battle Controls */}
      {phase === 'battle' && (
        <div className="relative z-[110] p-4 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <div className="grid grid-cols-4 gap-2 max-w-xl mx-auto">
            <Button onClick={() => performAction('punch')} disabled={!canAct} className="h-14 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-red-900/50 border border-red-400/30">👊 Punch</Button>
            <Button onClick={() => performAction('kick')} disabled={!canAct} className="h-14 bg-gradient-to-b from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-orange-900/50 border border-orange-400/30">🦶 Kick</Button>
            <Button onClick={() => performAction('block')} disabled={!canAct} className="h-14 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-blue-900/50 border border-blue-400/30">🛡️ Block</Button>
            <Button onClick={() => performAction('special')} disabled={!canAct || combo < 3} className="h-14 bg-gradient-to-b from-yellow-500 to-amber-700 hover:from-yellow-400 hover:to-amber-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-yellow-900/50 border border-yellow-400/40">⚡ Special</Button>
          </div>
          <p className="text-center text-amber-200/80 text-xs mt-2 font-medium">
            {combo >= 3 ? '⚡ Special Ready — unleash it!' : `Build ${3 - combo} more combo hits for Special`}
          </p>
        </div>
      )}


      {/* Victory/Defeat */}
      {(phase === 'victory' || phase === 'defeat') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="absolute inset-0 z-[130] flex items-center justify-center bg-black/60">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.8 }} className="text-center">
            {phase === 'victory' ? (
              <>
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div key={i} initial={{ y: -100, x: Math.random() * 400 - 200, opacity: 1 }}
                    animate={{ y: 500, rotate: Math.random() * 720 }}
                    transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{ backgroundColor: ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e', '#a855f7'][i % 5], left: `${20 + Math.random() * 60}%` }} />
                ))}
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-4xl font-black text-yellow-400 mb-2">CHAMPION!</h2>
                <p className="text-white text-xl">Champion of {worldName}!</p>
                <div className="flex gap-4 justify-center mt-3">
                  <span className="text-yellow-400 font-bold">+{bonusGold} 🪙</span>
                  <span className="text-blue-400 font-bold">+{bonusXp} XP</span>
                </div>
                <Button onClick={() => onComplete(bonusGold, bonusXp)} className="mt-6 bg-gradient-to-r from-yellow-600 to-amber-500 text-white font-bold px-8">
                  Claim Rewards!
                </Button>
              </>
            ) : (
              <>
                <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-red-400 mb-2">DEFEATED!</h2>
                <p className="text-white">Good fight!</p>
                <div className="flex gap-4 justify-center mt-3">
                  <span className="text-yellow-400 font-bold">+{bonusGold} 🪙</span>
                  <span className="text-blue-400 font-bold">+{bonusXp} XP</span>
                </div>
                <Button onClick={() => onComplete(bonusGold, bonusXp)} className="mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold px-8">Continue</Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Boss loot chest */}
      <RPGLootChest loot={rolledLoot} open={chestOpen} onClose={() => setChestOpen(false)} />
    </motion.div>
  );
};
