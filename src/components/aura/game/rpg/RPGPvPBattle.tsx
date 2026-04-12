import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Heart, Star, ArrowLeft, Flame, Zap, Volume2 } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGParentControls, ParentAbility } from "./RPGParentControls";
import { RPGWordReader } from "./RPGWordReader";
import { RPGWordBarrage } from "./RPGWordBarrage";
import { RPGFireballDefense } from "./RPGFireballDefense";
import { RPGWordNinja } from "./RPGWordNinja";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { CuratedStory } from "@/data/curatedStories";
import { getStoredTheme } from "@/lib/gameTheme";
import { heroKnight, RPGEnemy } from "@/lib/rpgBattleData";

const battleSounds = new SoundEffects();

interface BattleStats {
  wordsRead: number;
  correctWords: number;
  longestStreak: number;
  damageDealt: number;
  xpEarned: number;
  goldEarned?: number;
}

interface RPGPvPBattleProps {
  story: CuratedStory;
  studentId: string;
  worldNumber?: number;
  gradeMode?: string;
  onBack: () => void;
  onComplete: (victory: boolean, stats: BattleStats) => void;
}

type PvPPhase = 'setup' | 'kid_turn' | 'parent_turn' | 'parent_reading' | 'mini_game' | 'victory' | 'defeat';

export const RPGPvPBattle = ({
  story,
  studentId,
  worldNumber = 1,
  gradeMode,
  onBack,
  onComplete,
}: RPGPvPBattleProps) => {
  const [phase, setPhase] = useState<PvPPhase>('setup');
  const [kidHp, setKidHp] = useState(100);
  const [parentHp, setParentHp] = useState(100);
  const [kidMaxHp] = useState(100);
  const [parentMaxHp] = useState(100);
  const [turn, setTurn] = useState<'kid' | 'parent'>('kid');
  const [turnCount, setTurnCount] = useState(0);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [activeMiniGame, setActiveMiniGame] = useState<string | null>(null);
  const [kidWordsRead, setKidWordsRead] = useState(0);
  const [kidCorrectWords, setKidCorrectWords] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [parentName, setParentName] = useState("Parent");
  const [kidName, setKidName] = useState("Hero");

  // Refs for volatile counters (prevents stale closures)
  const kidStreakRef = useRef(0);
  const kidCorrectRef = useRef(0);
  const longestStreakRef = useRef(0);
  const totalDamageRef = useRef(0);

  // Parent reading phase state
  const [pendingAbility, setPendingAbility] = useState<ParentAbility | null>(null);
  const [parentReadWord, setParentReadWord] = useState<string | null>(null);

  // Story words
  const storyWords = story.passage_text.split(/\s+/).filter(w => w.length > 0);
  const [wordIndex, setWordIndex] = useState(0);

  // Completion check
  useEffect(() => {
    if (parentHp <= 0 && phase !== 'victory') {
      setPhase('victory');
      battleSounds.victoryFanfare();
      setTimeout(() => {
        onComplete(true, {
          wordsRead: kidWordsRead,
          correctWords: kidCorrectRef.current,
          longestStreak: longestStreakRef.current,
          damageDealt: totalDamageRef.current,
          xpEarned: Math.floor(kidCorrectRef.current * 5 + longestStreakRef.current * 2),
          goldEarned: Math.floor(kidCorrectRef.current * 2),
        });
      }, 3000);
    }
    if (kidHp <= 0 && phase !== 'defeat') {
      setPhase('defeat');
      battleSounds.incorrectWord();
      setTimeout(() => {
        onComplete(false, {
          wordsRead: kidWordsRead,
          correctWords: kidCorrectRef.current,
          longestStreak: longestStreakRef.current,
          damageDealt: totalDamageRef.current,
          xpEarned: Math.floor(kidCorrectRef.current * 2),
          goldEarned: 0,
        });
      }, 3000);
    }
  }, [kidHp, parentHp, phase]);

  // Kid reads a word correctly -> damage to parent
  const handleKidWordResult = useCallback((correct: boolean, _spokenWord: string, _wordIndex: number) => {
    setKidWordsRead(prev => prev + 1);
    
    if (correct) {
      kidCorrectRef.current += 1;
      setKidCorrectWords(kidCorrectRef.current);

      kidStreakRef.current += 1;
      if (kidStreakRef.current > longestStreakRef.current) {
        longestStreakRef.current = kidStreakRef.current;
        setLongestStreak(longestStreakRef.current);
      }

      const baseDamage = 8;
      const streakBonus = Math.min(kidStreakRef.current, 5) * 2;
      const damage = baseDamage + streakBonus;

      totalDamageRef.current += damage;
      setTotalDamage(totalDamageRef.current);
      setParentHp(prev => Math.max(0, prev - damage));
      setMessage(`⚔️ Hero deals ${damage} damage!`);
      battleSounds.correctWord();

      // After 5 correct words, switch to parent turn
      if (kidCorrectRef.current % 5 === 0) {
        setTimeout(() => {
          setTurn('parent');
          setPhase('parent_turn');
          setMessage("🔴 Parent's Turn!");
          setCooldowns(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(k => {
              if (updated[k] > 0) updated[k]--;
            });
            return updated;
          });
          setTurnCount(prev => prev + 1);
        }, 800);
      }
    } else {
      kidStreakRef.current = 0;
    }
  }, []);

  // Parent selects an ability
  const handleParentAbility = useCallback((ability: ParentAbility) => {
    if (ability.type === 'minigame' && ability.miniGame) {
      setActiveMiniGame(ability.miniGame);
      setPhase('mini_game');
      setMessage(`🎮 ${ability.name}!`);
      if (ability.cooldown > 0) {
        setCooldowns(prev => ({ ...prev, [ability.id]: ability.cooldown }));
      }
    } else if (ability.requiresReading) {
      // Parent must read a word for bonus damage
      setPendingAbility(ability);
      setParentReadWord(storyWords[Math.floor(Math.random() * storyWords.length)]);
      setPhase('parent_reading');
      setMessage(`📖 Read the word for bonus damage!`);
    } else {
      let damage = ability.damage;
      setKidHp(prev => Math.max(0, prev - damage));
      setMessage(`💥 Parent uses ${ability.name} for ${damage} damage!`);
      battleSounds.fireWhoosh();

      if (ability.cooldown > 0) {
        setCooldowns(prev => ({ ...prev, [ability.id]: ability.cooldown }));
      }

      setTimeout(() => {
        setTurn('kid');
        setPhase('kid_turn');
        setMessage("🟢 Hero's Turn! Read to attack!");
      }, 1500);
    }
  }, [storyWords]);

  // Parent reading result
  const handleParentReadResult = useCallback((correct: boolean) => {
    if (!pendingAbility) return;
    
    let damage = pendingAbility.damage;
    if (correct) {
      damage += 5; // Bonus damage for reading correctly
      setMessage(`💥 ${pendingAbility.name} + Reading Bonus = ${damage} damage!`);
      battleSounds.correctWord();
    } else {
      setMessage(`💥 ${pendingAbility.name} for ${damage} damage (no bonus)`);
      battleSounds.incorrectWord();
    }

    setKidHp(prev => Math.max(0, prev - damage));
    battleSounds.fireWhoosh();

    if (pendingAbility.cooldown > 0) {
      setCooldowns(prev => ({ ...prev, [pendingAbility.id]: pendingAbility.cooldown }));
    }

    setPendingAbility(null);
    setParentReadWord(null);

    setTimeout(() => {
      setTurn('kid');
      setPhase('kid_turn');
      setMessage("🟢 Hero's Turn! Read to attack!");
    }, 1500);
  }, [pendingAbility]);

  // Mini-game completion
  const handleMiniGameComplete = useCallback((completed: number, failed: number) => {
    const kidDamage = failed * 5;
    if (kidDamage > 0) setKidHp(prev => Math.max(0, prev - kidDamage));
    
    const bonusDamage = completed * 3;
    if (bonusDamage > 0) setParentHp(prev => Math.max(0, prev - bonusDamage));

    setActiveMiniGame(null);
    setTimeout(() => {
      setTurn('kid');
      setPhase('kid_turn');
      setMessage("🟢 Hero's Turn!");
    }, 1000);
  }, []);

  const handleStart = useCallback(() => {
    setPhase('kid_turn');
    setTurn('kid');
    setMessage("🟢 Hero's Turn! Read words to attack!");
  }, []);

  const barrageWords = storyWords.slice(wordIndex, wordIndex + 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      <RPGBattleBackground worldNumber={worldNumber} />

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-[60] p-3">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white">
            <ArrowLeft className="h-4 w-4 mr-1" /> Exit
          </Button>
          <div className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-red-400" />
            <span className="text-white font-bold">PvP BATTLE</span>
          </div>
          <div className="text-slate-400 text-sm">Turn {turnCount + 1}</div>
        </div>

        {/* HP Bars */}
        <div className="flex gap-4 max-w-2xl mx-auto">
          <div className={`flex-1 p-2 rounded-lg border-2 ${turn === 'kid' ? 'border-green-400 bg-green-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-green-300">🦸 {kidName}</span>
              <span className="text-xs text-green-400 ml-auto">{kidHp}/{kidMaxHp}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" animate={{ width: `${(kidHp / kidMaxHp) * 100}%` }} />
            </div>
          </div>

          <span className="text-white font-black text-xl self-center">VS</span>

          <div className={`flex-1 p-2 rounded-lg border-2 ${turn === 'parent' ? 'border-red-400 bg-red-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-red-300">👹 {parentName}</span>
              <span className="text-xs text-red-400 ml-auto">{parentHp}/{parentMaxHp}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-red-500 to-red-400" animate={{ width: `${(parentHp / parentMaxHp) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20"
          >
            <p className="text-white font-bold text-lg">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters */}
      <div className="absolute bottom-40 left-[20%] z-[50]">
        <RPGCharacter
          character={heroKnight}
          currentHp={kidHp}
          isAttacking={turn === 'kid' && phase === 'kid_turn'}
        />
      </div>
      <div className="absolute bottom-40 right-[20%] z-[50]">
        <RPGCharacter
          character={{ ...heroKnight, id: 'villain', name: parentName, type: 'enemy', color: '#ef4444' } as any}
          currentHp={parentHp}
          isEnemy
          isTakingDamage={turn === 'kid'}
        />
      </div>

      {/* Setup Screen */}
      {phase === 'setup' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 text-center">
            <Sword className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Parent vs Kid PvP!</h2>
            <p className="text-slate-400 mb-6">Parent controls the enemy with ability cards. Kid reads words to fight back!</p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Hero Name</label>
                <input value={kidName} onChange={e => setKidName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-center" maxLength={15} />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Villain Name</label>
                <input value={parentName} onChange={e => setParentName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-center" maxLength={15} />
              </div>
            </div>
            <Button onClick={handleStart} className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-3">
              ⚔️ Start Battle!
            </Button>
          </div>
        </motion.div>
      )}

      {/* Kid's Turn - Reading */}
      {phase === 'kid_turn' && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <RPGWordReader
            words={storyWords}
            onResult={handleKidWordResult}
          />
        </div>
      )}

      {/* Parent's Turn - Ability Cards */}
      {phase === 'parent_turn' && (
        <RPGParentControls
          onSelectAbility={handleParentAbility}
          cooldowns={cooldowns}
          parentHp={parentHp}
          parentMaxHp={parentMaxHp}
        />
      )}

      {/* Parent Reading Phase */}
      {phase === 'parent_reading' && parentReadWord && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 z-[90] bg-gradient-to-t from-red-950/95 to-transparent p-6"
        >
          <div className="max-w-md mx-auto text-center">
            <p className="text-red-300 text-sm font-bold mb-2">🔴 PARENT — Read this word aloud:</p>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="bg-red-900/60 border-2 border-red-500/50 rounded-2xl p-6 mb-4"
            >
              <p className="text-4xl font-black text-white">{parentReadWord}</p>
            </motion.div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleParentReadResult(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold px-6"
              >
                ✅ Read Correctly
              </Button>
              <Button
                onClick={() => handleParentReadResult(false)}
                variant="outline"
                className="border-red-500 text-red-300 px-6"
              >
                ❌ Missed It
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mini-game Phase */}
      {phase === 'mini_game' && activeMiniGame === 'word_barrage' && (
        <RPGWordBarrage
          words={barrageWords}
          onComplete={(completed, failed) => handleMiniGameComplete(completed, failed)}
          onWordHit={() => {}}
        />
      )}
      {phase === 'mini_game' && activeMiniGame === 'fireball_defense' && (
        <RPGFireballDefense
          words={barrageWords}
          onComplete={(completed, failed) => handleMiniGameComplete(completed, failed)}
        />
      )}

      {/* Victory Screen */}
      {phase === 'victory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center">
            <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">HERO WINS!</h2>
            <p className="text-white text-xl">{kidName} defeated {parentName}!</p>
            <p className="text-slate-400 mt-2">{kidCorrectWords} words read • {longestStreak} best streak</p>
          </motion.div>
        </motion.div>
      )}

      {/* Defeat Screen */}
      {phase === 'defeat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
            <Shield className="h-20 w-20 text-red-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-red-400 mb-2">VILLAIN WINS!</h2>
            <p className="text-white text-xl">{parentName} defeated {kidName}!</p>
            <p className="text-slate-400 mt-2">Better luck next time! Keep reading!</p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
