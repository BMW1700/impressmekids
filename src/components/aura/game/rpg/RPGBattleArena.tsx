import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sword, BookOpen, Flame } from "lucide-react";
import { RPGCharacter } from "./RPGCharacter";
import { RPGDialogueBox } from "./RPGDialogueBox";
import { RPGWordAttack } from "./RPGWordAttack";
import { RPGCombatPhase } from "./RPGCombatPhase";
import { 
  heroKnight, 
  allyWizard, 
  RPGEnemy, 
  getEnemyForBattle,
  heroDialogue,
  wizardDialogue 
} from "@/lib/rpgBattleData";
import { CuratedStory } from "@/data/curatedStories";

type BattlePhase = 'intro' | 'dialogue' | 'reading' | 'combat' | 'victory' | 'defeat';

interface RPGBattleArenaProps {
  story: CuratedStory;
  enemyType: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss';
  studentId: string;
  onBack: () => void;
  onComplete: (victory: boolean, stats: BattleStats) => void;
}

interface BattleStats {
  wordsRead: number;
  correctWords: number;
  longestStreak: number;
  damageDealt: number;
  xpEarned: number;
}

export const RPGBattleArena = ({
  story,
  enemyType,
  studentId,
  onBack,
  onComplete,
}: RPGBattleArenaProps) => {
  const enemy = getEnemyForBattle(enemyType);
  
  // Battle state
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<'hero' | 'wizard' | 'enemy'>('hero');
  
  // Combat stats
  const [playerHp, setPlayerHp] = useState(heroKnight.maxHp);
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  
  // Word reading state
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordResult, setCurrentWordResult] = useState<boolean | null>(null);
  const [attackType, setAttackType] = useState<'fire' | 'ice' | 'lightning' | 'slash'>('fire');

  // Parse story into words
  useEffect(() => {
    const storyWords = story.passage_text.split(/\s+/).filter(w => w.length > 0);
    setWords(storyWords);
  }, [story.passage_text]);

  // Get current dialogue
  const getCurrentDialogue = useCallback(() => {
    if (phase === 'intro') {
      if (currentSpeaker === 'hero') {
        return heroDialogue.intro[dialogueIndex % heroDialogue.intro.length];
      } else if (currentSpeaker === 'wizard') {
        return wizardDialogue.intro[dialogueIndex % wizardDialogue.intro.length];
      } else {
        return enemy.dialogueIntro[dialogueIndex % enemy.dialogueIntro.length];
      }
    }
    return "";
  }, [phase, currentSpeaker, dialogueIndex, enemy.dialogueIntro]);

  // Handle dialogue progression
  const handleDialogueComplete = useCallback(() => {
    if (phase === 'intro') {
      if (currentSpeaker === 'hero' && dialogueIndex === 0) {
        setCurrentSpeaker('wizard');
      } else if (currentSpeaker === 'wizard') {
        setCurrentSpeaker('enemy');
        setDialogueIndex(0);
      } else if (currentSpeaker === 'enemy') {
        if (dialogueIndex < enemy.dialogueIntro.length - 1) {
          setDialogueIndex(prev => prev + 1);
        } else {
          // Start reading phase
          setPhase('reading');
        }
      } else {
        setDialogueIndex(prev => prev + 1);
      }
    }
  }, [phase, currentSpeaker, dialogueIndex, enemy.dialogueIntro.length]);

  // Calculate word damage
  const calculateDamage = useCallback((wordLength: number, currentStreak: number) => {
    const baseDamage = Math.max(5, wordLength * 2);
    const streakBonus = Math.floor(currentStreak / 3) * 5;
    return baseDamage + streakBonus;
  }, []);

  // Handle word result (simulated - would connect to speech recognition)
  const handleWordResult = useCallback((correct: boolean) => {
    setWordsRead(prev => prev + 1);
    setCurrentWordResult(correct);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectWords(prev => prev + 1);
      if (newStreak > longestStreak) {
        setLongestStreak(newStreak);
      }

      const word = words[currentWordIndex];
      const damage = Math.floor(calculateDamage(word.length, newStreak) * enemy.wordDamageMultiplier);
      setTotalDamage(prev => prev + damage);
      setEnemyHp(prev => Math.max(0, prev - damage));

      // Vary attack type based on streak
      const types: ('fire' | 'ice' | 'lightning' | 'slash')[] = ['slash', 'fire', 'ice', 'lightning'];
      setAttackType(types[Math.min(Math.floor(newStreak / 3), types.length - 1)]);
    } else {
      setStreak(0);
      // Enemy counter-attack on miss
      const damage = Math.floor(enemy.attack * 0.5);
      setPlayerHp(prev => Math.max(0, prev - damage));
    }

    // Move to next word after animation
    setTimeout(() => {
      setCurrentWordResult(null);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // All words read - move to combat if enemy still alive
        if (enemyHp > 0) {
          setPhase('combat');
        }
      }
    }, 600);
  }, [streak, longestStreak, words, currentWordIndex, enemy, calculateDamage, enemyHp]);

  // Check for phase transitions
  useEffect(() => {
    if (enemyHp <= 0 && phase !== 'victory') {
      setPhase('victory');
    } else if (playerHp <= 0 && phase !== 'defeat') {
      setPhase('defeat');
    }
  }, [enemyHp, playerHp, phase]);

  // Handle battle end
  const handleBattleEnd = useCallback((victory: boolean) => {
    const xpEarned = victory ? 
      Math.floor(100 + correctWords * 5 + longestStreak * 10 + totalDamage * 0.5) :
      Math.floor(correctWords * 2);

    onComplete(victory, {
      wordsRead,
      correctWords,
      longestStreak,
      damageDealt: totalDamage,
      xpEarned,
    });
  }, [correctWords, longestStreak, totalDamage, wordsRead, onComplete]);

  // Simulated word input (for testing - would be replaced by speech recognition)
  const handleSimulatedInput = (correct: boolean) => {
    if (phase === 'reading') {
      handleWordResult(correct);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 p-4">
      <Card className="max-w-4xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600/10 to-indigo-600/10">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Battle
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{story.title}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="font-bold">x{streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Battle Arena */}
        <div className="p-6 space-y-6">
          {/* Characters Display */}
          <div className="flex items-end justify-between px-4">
            {/* Heroes */}
            <div className="flex gap-4">
              <RPGCharacter
                character={heroKnight}
                currentHp={playerHp}
                isAttacking={currentWordResult === true}
              />
              <RPGCharacter
                character={allyWizard}
                currentHp={allyWizard.maxHp}
              />
            </div>

            {/* Enemy */}
            <RPGCharacter
              character={enemy}
              currentHp={enemyHp}
              isEnemy
              isTakingDamage={currentWordResult === true}
              damageNumber={currentWordResult === true ? calculateDamage(words[currentWordIndex]?.length || 5, streak) : 0}
              showDamage={currentWordResult === true}
            />
          </div>

          {/* Phase Content */}
          <AnimatePresence mode="wait">
            {/* Intro Dialogue Phase */}
            {phase === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <RPGDialogueBox
                  speakerName={
                    currentSpeaker === 'hero' ? heroKnight.name :
                    currentSpeaker === 'wizard' ? allyWizard.name :
                    enemy.name
                  }
                  speakerColor={
                    currentSpeaker === 'hero' ? heroKnight.color :
                    currentSpeaker === 'wizard' ? allyWizard.color :
                    enemy.color
                  }
                  dialogue={getCurrentDialogue()}
                  onComplete={handleDialogueComplete}
                />
              </motion.div>
            )}

            {/* Reading Phase */}
            {phase === 'reading' && words[currentWordIndex] && (
              <motion.div
                key="reading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Read the word aloud to attack! ({currentWordIndex + 1}/{words.length})
                  </p>
                  <RPGWordAttack
                    word={words[currentWordIndex]}
                    isCorrect={currentWordResult}
                    streak={streak}
                    damage={calculateDamage(words[currentWordIndex].length, streak)}
                    attackType={attackType}
                  />
                </div>

                {/* Simulated Input Buttons (for testing) */}
                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSimulatedInput(true)}
                    className="border-green-500 text-green-500 hover:bg-green-500/10"
                  >
                    ✓ Correct
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSimulatedInput(false)}
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    ✗ Miss
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Combat Phase */}
            {phase === 'combat' && (
              <motion.div
                key="combat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RPGCombatPhase
                  enemy={enemy}
                  enemyHp={enemyHp}
                  playerHp={playerHp}
                  playerMaxHp={heroKnight.maxHp}
                  onPlayerAttack={(damage) => setEnemyHp(prev => Math.max(0, prev - damage))}
                  onEnemyAttack={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
                  onVictory={() => handleBattleEnd(true)}
                  onDefeat={() => handleBattleEnd(false)}
                />
              </motion.div>
            )}

            {/* Victory Screen */}
            {phase === 'victory' && (
              <motion.div
                key="victory"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl"
                >
                  🎉
                </motion.div>
                <h2 className="text-3xl font-black text-yellow-500">VICTORY!</h2>
                <p className="text-muted-foreground">
                  You defeated {enemy.name}!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold">{correctWords}</p>
                    <p className="text-xs text-muted-foreground">Words Read</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold">{longestStreak}</p>
                    <p className="text-xs text-muted-foreground">Best Streak</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold">{totalDamage}</p>
                    <p className="text-xs text-muted-foreground">Damage Dealt</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-yellow-500">
                      +{Math.floor(100 + correctWords * 5 + longestStreak * 10)}
                    </p>
                    <p className="text-xs text-muted-foreground">XP Earned</p>
                  </div>
                </div>
                <Button onClick={() => handleBattleEnd(true)} size="lg" className="mt-4">
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Defeat Screen */}
            {phase === 'defeat' && (
              <motion.div
                key="defeat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="text-6xl">💀</div>
                <h2 className="text-3xl font-black text-red-500">DEFEAT</h2>
                <p className="text-muted-foreground">
                  {enemy.name} was too powerful...
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Button variant="outline" onClick={onBack}>
                    Return to Map
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};
