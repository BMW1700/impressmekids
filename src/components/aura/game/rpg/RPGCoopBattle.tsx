import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Star, Heart, Shield, Sword } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGCoopHUD } from "./RPGCoopHUD";
import { RPGWordReader } from "./RPGWordReader";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { CuratedStory } from "@/data/curatedStories";
import { getEnemyForBattle, heroKnight, allyWizard } from "@/lib/rpgBattleData";
import { getStoredTheme } from "@/lib/gameTheme";
import { getAgentEnemy } from "@/lib/agentBattleData";

const battleSounds = new SoundEffects();

interface BattleStats {
  wordsRead: number;
  correctWords: number;
  longestStreak: number;
  damageDealt: number;
  xpEarned: number;
  goldEarned?: number;
}

interface RPGCoopBattleProps {
  story: CuratedStory;
  studentId: string;
  worldNumber?: number;
  gradeMode?: string;
  onBack: () => void;
  onComplete: (victory: boolean, stats: BattleStats) => void;
}

type CoopPhase = 'setup' | 'battle' | 'victory' | 'defeat';

export const RPGCoopBattle = ({
  story,
  studentId,
  worldNumber = 1,
  gradeMode,
  onBack,
  onComplete,
}: RPGCoopBattleProps) => {
  const [phase, setPhase] = useState<CoopPhase>('setup');
  const [player1Hp, setPlayer1Hp] = useState(100);
  const [player2Hp, setPlayer2Hp] = useState(100);
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [player1Words, setPlayer1Words] = useState(0);
  const [player2Words, setPlayer2Words] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [turnWordsRead, setTurnWordsRead] = useState(0);

  // Refs for volatile counters
  const streakRef = useRef(0);
  const longestStreakRef = useRef(0);
  const totalCorrectRef = useRef(0);
  const totalDamageRef = useRef(0);
  const player1HpRef = useRef(100);
  const player2HpRef = useRef(100);
  const activePlayerRef = useRef<1 | 2>(1);

  // Keep HP refs in sync
  useEffect(() => { player1HpRef.current = player1Hp; }, [player1Hp]);
  useEffect(() => { player2HpRef.current = player2Hp; }, [player2Hp]);
  useEffect(() => { activePlayerRef.current = activePlayer; }, [activePlayer]);

  // Enemy
  const theme = getStoredTheme();
  const enemy = theme === 'agent' ? getAgentEnemy('guard') : getEnemyForBattle('guard');
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [enemyMaxHp] = useState(enemy.maxHp);

  const storyWords = story.passage_text.split(/\s+/).filter(w => w.length > 0);

  // Check victory/defeat
  useEffect(() => {
    if (enemyHp <= 0 && phase !== 'victory') {
      setPhase('victory');
      battleSounds.victoryFanfare();
      const totalWords = player1Words + player2Words;
      setTimeout(() => {
        onComplete(true, {
          wordsRead: totalWords,
          correctWords: totalCorrectRef.current,
          longestStreak: longestStreakRef.current,
          damageDealt: totalDamageRef.current,
          xpEarned: Math.floor(totalCorrectRef.current * 5 + longestStreakRef.current * 3),
          goldEarned: Math.floor(totalCorrectRef.current * 2),
        });
      }, 3000);
    }
    if (player1Hp <= 0 && player2Hp <= 0 && phase !== 'defeat') {
      setPhase('defeat');
      battleSounds.incorrectWord();
      setTimeout(() => {
        onComplete(false, {
          wordsRead: player1Words + player2Words,
          correctWords: totalCorrectRef.current,
          longestStreak: longestStreakRef.current,
          damageDealt: totalDamageRef.current,
          xpEarned: Math.floor(totalCorrectRef.current * 2),
          goldEarned: 0,
        });
      }, 3000);
    }
  }, [enemyHp, player1Hp, player2Hp, phase]);

  // Handle word read
  const handleWordResult = useCallback((correct: boolean, _spokenWord: string, _wordIndex: number) => {
    const currentActive = activePlayerRef.current;
    
    if (currentActive === 1) {
      setPlayer1Words(prev => prev + 1);
    } else {
      setPlayer2Words(prev => prev + 1);
    }

    if (correct) {
      totalCorrectRef.current += 1;
      setTotalCorrect(totalCorrectRef.current);
      
      streakRef.current += 1;
      if (streakRef.current > longestStreakRef.current) {
        longestStreakRef.current = streakRef.current;
        setLongestStreak(longestStreakRef.current);
      }

      const damage = 8 + Math.min(streakRef.current, 5) * 2;
      totalDamageRef.current += damage;
      setTotalDamage(totalDamageRef.current);
      setEnemyHp(prev => Math.max(0, prev - damage));
      battleSounds.correctWord();
    } else {
      streakRef.current = 0;
    }

    setTurnWordsRead(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setTimeout(() => {
          // Enemy attacks the active player
          const enemyDmg = 5 + Math.floor(Math.random() * 8);
          
          if (currentActive === 1) {
            setPlayer1Hp(prev => Math.max(0, prev - enemyDmg));
          } else {
            setPlayer2Hp(prev => Math.max(0, prev - enemyDmg));
          }
          
          setMessage(`💥 ${enemy.name} attacks ${currentActive === 1 ? player1Name : player2Name} for ${enemyDmg}!`);
          battleSounds.fireWhoosh();

          setTimeout(() => {
            const nextPlayer = currentActive === 1 ? 2 : 1;
            const nextHp = nextPlayer === 1 ? player1HpRef.current : player2HpRef.current;
            
            if (nextHp > 0) {
              setActivePlayer(nextPlayer as 1 | 2);
              setMessage(`🟢 ${nextPlayer === 1 ? player1Name : player2Name}'s Turn!`);
            } else {
              setMessage(`⚔️ ${currentActive === 1 ? player1Name : player2Name} fights on alone!`);
            }
          }, 1000);
        }, 500);
        return 0;
      }
      return newCount;
    });
  }, [player1Name, player2Name, enemy.name]);

  const handleStart = useCallback(() => {
    setPhase('battle');
    setMessage(`🟢 ${player1Name}'s Turn! Read to attack!`);
  }, [player1Name]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      <RPGBattleBackground worldNumber={worldNumber} />

      <div className="absolute top-3 left-3 z-[80]">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Exit
        </Button>
      </div>

      {phase !== 'setup' && (
        <RPGCoopHUD
          player1Hp={player1Hp} player1MaxHp={100} player1Name={player1Name}
          player2Hp={player2Hp} player2MaxHp={100} player2Name={player2Name}
          activePlayer={activePlayer}
          player1Words={player1Words} player2Words={player2Words}
          enemyHp={enemyHp} enemyMaxHp={enemyMaxHp} enemyName={enemy.name}
        />
      )}

      {/* Message Banner */}
      <AnimatePresence>
        {message && phase === 'battle' && (
          <motion.div key={message} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-36 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20">
            <p className="text-white font-bold">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters */}
      <div className="absolute bottom-40 left-[10%] z-[50]">
        <RPGCharacter character={heroKnight} currentHp={player1Hp} isAttacking={activePlayer === 1 && phase === 'battle'} />
      </div>
      <div className="absolute bottom-40 left-[30%] z-[50]">
        <RPGCharacter character={allyWizard} currentHp={player2Hp} isAttacking={activePlayer === 2 && phase === 'battle'} />
      </div>
      <div className="absolute bottom-40 right-[15%] z-[50]">
        <RPGCharacter character={enemy} currentHp={enemyHp} isEnemy />
      </div>

      {/* Setup Screen */}
      {phase === 'setup' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 text-center">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Co-op Team Battle!</h2>
            <p className="text-slate-400 mb-6">Two heroes, one goal — defeat the enemy together!</p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm text-blue-400 block mb-1">Player 1 Name</label>
                <input value={player1Name} onChange={e => setPlayer1Name(e.target.value)} className="w-full bg-slate-800 border border-blue-600/30 rounded-lg px-3 py-2 text-white text-center" maxLength={15} />
              </div>
              <div>
                <label className="text-sm text-purple-400 block mb-1">Player 2 Name</label>
                <input value={player2Name} onChange={e => setPlayer2Name(e.target.value)} className="w-full bg-slate-800 border border-purple-600/30 rounded-lg px-3 py-2 text-white text-center" maxLength={15} />
              </div>
            </div>
            <Button onClick={handleStart} className="w-full bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-500 hover:to-purple-400 text-white font-bold py-3">
              🤝 Start Team Battle!
            </Button>
          </div>
        </motion.div>
      )}

      {/* Battle - Word Reader */}
      {phase === 'battle' && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <div className="text-center mb-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              activePlayer === 1 ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'
            }`}>
              {activePlayer === 1 ? player1Name : player2Name}'s Turn ({5 - turnWordsRead} words left)
            </span>
          </div>
          <RPGWordReader
            words={storyWords}
            onResult={handleWordResult}
          />
        </div>
      )}

      {/* Victory */}
      {phase === 'victory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center">
            <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">TEAM VICTORY!</h2>
            <p className="text-white text-xl">{player1Name} & {player2Name} defeated {enemy.name}!</p>
            <p className="text-slate-400 mt-2">{totalCorrect} total words • {longestStreak} best streak</p>
          </motion.div>
        </motion.div>
      )}

      {/* Defeat */}
      {phase === 'defeat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
            <Shield className="h-20 w-20 text-red-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-red-400 mb-2">TEAM DEFEATED!</h2>
            <p className="text-white text-xl">{enemy.name} was too powerful!</p>
            <p className="text-slate-400 mt-2">Keep practicing and try again!</p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
