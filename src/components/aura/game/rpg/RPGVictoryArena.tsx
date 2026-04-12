import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Sword, Shield, Zap, Star, ArrowLeft } from "lucide-react";
import { RPGArenaFighter, FighterAction } from "./RPGArenaFighter";
import { ArenaAI } from "./RPGArenaAI";
import { SoundEffects } from "@/lib/pronunciationPlayer";

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

  const aiRef = useRef(new ArenaAI(Math.min(3, worldNumber)));
  const actionLockRef = useRef(false);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] overflow-hidden select-none">
      {/* Arena Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-orange-950 to-slate-950">
        <div className="absolute top-0 left-0 right-0 h-32 flex items-end justify-center gap-1 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div key={i} animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, delay: Math.random() * 2 }}
              className="w-4 bg-slate-800 rounded-t-full" style={{ height: 15 + Math.random() * 25 }} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-800/50 to-transparent" />
        <div className="absolute bottom-28 left-0 right-0 h-1 bg-amber-600/50" />
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-0 right-0 z-[110] px-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-white">
            <ArrowLeft className="h-4 w-4 mr-1" /> Skip
          </Button>
          <div className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-amber-400" />
            <span className="text-amber-300 font-black text-sm">VICTORY ARENA</span>
          </div>
          <div className="text-amber-400 text-sm font-bold">{combo > 0 ? `${combo}x` : ''}</div>
        </div>
        <div className="flex gap-4 max-w-lg mx-auto mt-2">
          <div className="flex-1">
            <span className="text-xs text-green-300 font-bold">{playerName}</span>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <motion.div className="h-full bg-green-500" animate={{ width: `${playerHp}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <span className="text-xs text-red-300 font-bold text-right block">Enemy</span>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <motion.div className="h-full bg-red-500" animate={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Comic text */}
      <AnimatePresence>
        {showComicText && (
          <motion.div key={showComicText} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1.5, rotate: 10 }} exit={{ scale: 0, opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120]">
            <span className="text-5xl font-black text-yellow-400"
              style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
              {showComicText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fighters */}
      <div className="absolute bottom-32 left-[25%] z-[105]">
        <RPGArenaFighter name={playerName} hp={playerHp} maxHp={100} action={playerAction} position="left" isPlayer color="#3b82f6" />
      </div>
      <div className="absolute bottom-32 right-[25%] z-[105]">
        <RPGArenaFighter name="Challenger" hp={enemyHp} maxHp={enemyMaxHp} action={enemyAction} position="right" color="#ef4444" />
      </div>

      {/* Intro */}
      {phase === 'intro' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[130] flex items-center justify-center bg-black/70">
          <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring" }} className="text-center max-w-md mx-4">
            <Trophy className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-amber-400 mb-2">VICTORY ARENA!</h2>
            <p className="text-white text-lg mb-1">You've conquered {worldName}!</p>
            <p className="text-slate-400 mb-6">Enter the arena for a bonus battle!</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleStart} className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold px-8">
                ⚔️ FIGHT!
              </Button>
              <Button variant="outline" onClick={onSkip} className="border-slate-600 text-slate-300">Skip</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Battle Controls */}
      {phase === 'battle' && (
        <div className="absolute bottom-0 left-0 right-0 z-[110] p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            <Button onClick={() => performAction('punch')} disabled={!canAct} className="bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-50">👊 Punch</Button>
            <Button onClick={() => performAction('kick')} disabled={!canAct} className="bg-orange-600 hover:bg-orange-500 text-white font-bold disabled:opacity-50">🦶 Kick</Button>
            <Button onClick={() => performAction('block')} disabled={!canAct} className="bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50">🛡️ Block</Button>
            <Button onClick={() => performAction('special')} disabled={!canAct || combo < 3} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold disabled:opacity-50">⚡ Special</Button>
          </div>
          <p className="text-center text-slate-400 text-xs mt-2">
            {combo >= 3 ? '⚡ Special Ready!' : `Build ${3 - combo} more combo hits for Special!`}
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
    </motion.div>
  );
};
