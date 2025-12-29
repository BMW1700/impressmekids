import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Trophy, Skull, Star, AlertTriangle } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGDialogueBox } from "./RPGDialogueBox";
import { RPGCommandMenu } from "./RPGCommandMenu";
import { RPGPartyStats } from "./RPGPartyStats";
import { RPGWordAttack } from "./RPGWordAttack";
import { RPGWordReader } from "./RPGWordReader";
import { RPGWordBarrage } from "./RPGWordBarrage";
import { Spell } from "./RPGSpellMenu";
import { Item } from "./RPGItemMenu";
import { 
  heroKnight, 
  allyWizard, 
  getEnemyForBattle,
  heroDialogue,
  wizardDialogue,
} from "@/lib/rpgBattleData";
import { CuratedStory } from "@/data/curatedStories";

type BattlePhase = 'intro' | 'dialogue' | 'reading' | 'combat' | 'barrage' | 'enemy_turn' | 'victory' | 'defeat';
type InventoryKey = 'health_potion' | 'magic_potion';
type CommandType = 'read' | 'magic' | 'defend' | 'items';

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
  const [currentCommand, setCurrentCommand] = useState<CommandType | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [screenShake, setScreenShake] = useState(false);
  const [barrageTriggered, setBarrageTriggered] = useState(false);
  
  // Combat stats
  const [playerHp, setPlayerHp] = useState(heroKnight.maxHp);
  const [wizardHp, setWizardHp] = useState(allyWizard.maxHp);
  const [wizardMp, setWizardMp] = useState(50);
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [inventory, setInventory] = useState<Record<InventoryKey, number>>({ health_potion: 2, magic_potion: 1 });
  
  // Status effects
  const [isPoisoned, setIsPoisoned] = useState(false);
  const [poisonDamage, setPoisonDamage] = useState(0);
  const [isDebuffed, setIsDebuffed] = useState(false);
  const [debuffTurns, setDebuffTurns] = useState(0);
  
  // Word reading state
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordResult, setCurrentWordResult] = useState<boolean | null>(null);
  const [attackType, setAttackType] = useState<'fire' | 'ice' | 'lightning' | 'slash'>('fire');
  const [barrageWords, setBarrageWords] = useState<string[]>([]);

  // Animation states
  const [heroAttacking, setHeroAttacking] = useState(false);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [enemyTakingDamage, setEnemyTakingDamage] = useState(false);
  const [heroTakingDamage, setHeroTakingDamage] = useState(false);
  const [showDamageNumber, setShowDamageNumber] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const [enemyAbilityMessage, setEnemyAbilityMessage] = useState<string | null>(null);

  // Parse story into words - memoized for stability
  const storyWords = useMemo(() => {
    if (!story?.passage_text) return [];
    return story.passage_text.split(/\s+/).filter(w => w.length > 0);
  }, [story?.passage_text]);

  // Set words on mount
  useEffect(() => {
    setWords(storyWords);
  }, [storyWords]);

  // Check for barrage trigger (50% HP)
  useEffect(() => {
    if (!barrageTriggered && enemyHp <= enemy.maxHp / 2 && enemyHp > 0 && phase === 'reading') {
      setBarrageTriggered(true);
      triggerWordBarrage();
    }
  }, [enemyHp, enemy.maxHp, barrageTriggered, phase]);

  // Trigger word barrage attack
  const triggerWordBarrage = useCallback(() => {
    const wordCount = enemy.barrageWordCount || 5;
    const availableWords = words.slice(currentWordIndex, currentWordIndex + wordCount + 10);
    const barrageSelection = availableWords.slice(0, wordCount);
    setBarrageWords(barrageSelection);
    setPhase('barrage');
  }, [words, currentWordIndex, enemy.barrageWordCount]);

  // Handle barrage completion
  const handleBarrageComplete = useCallback((destroyed: number, missed: number) => {
    // Bonus XP for destroying words
    if (destroyed > 0) {
      setCorrectWords(prev => prev + destroyed);
    }
    setPhase('reading');
  }, []);

  // Handle barrage word hit
  const handleBarrageWordHit = useCallback((damage: number) => {
    setPlayerHp(prev => Math.max(0, prev - damage));
    triggerScreenShake();
  }, []);

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
          setPhase('reading');
          setCurrentCommand('read');
        }
      } else {
        setDialogueIndex(prev => prev + 1);
      }
    }
  }, [phase, currentSpeaker, dialogueIndex, enemy.dialogueIntro.length]);

  // Calculate word damage
  const calculateDamage = useCallback((wordLength: number, currentStreak: number) => {
    let baseDamage = Math.max(8, wordLength * 3);
    const streakBonus = Math.floor(currentStreak / 2) * 5;
    const criticalBonus = Math.random() > 0.85 ? 15 : 0;
    
    // Apply debuff if active
    if (isDebuffed) {
      baseDamage = Math.floor(baseDamage * 0.7);
    }
    
    return baseDamage + streakBonus + criticalBonus;
  }, [isDebuffed]);

  // Trigger screen shake
  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  };

  // Handle command selection
  const handleCommand = (command: CommandType) => {
    setCurrentCommand(command);
    if (command === 'defend') {
      setIsPlayerTurn(false);
      setTimeout(() => {
        setIsPlayerTurn(true);
        setCurrentCommand(null);
      }, 1500);
    }
  };

  // Handle spell casting
  const handleCastSpell = useCallback((spell: Spell) => {
    if (wizardMp < spell.mpCost) return;
    
    setWizardMp(prev => prev - spell.mpCost);
    setAttackType(spell.effect);
    setDamageAmount(spell.damage);
    setHeroAttacking(true);
    
    setTimeout(() => {
      setHeroAttacking(false);
      setEnemyTakingDamage(true);
      setShowDamageNumber(true);
      setEnemyHp(prev => Math.max(0, prev - spell.damage));
      setTotalDamage(prev => prev + spell.damage);
      triggerScreenShake();
      
      setTimeout(() => {
        setEnemyTakingDamage(false);
        setShowDamageNumber(false);
        // Trigger enemy turn after spell
        triggerEnemyTurn();
      }, 600);
    }, 300);
  }, [wizardMp]);

  // Handle item usage
  const handleUseItem = useCallback((item: Item) => {
    const itemKey = item.id as InventoryKey;
    if (!inventory[itemKey] || inventory[itemKey] <= 0) return;
    
    setInventory(prev => ({ ...prev, [itemKey]: prev[itemKey] - 1 }));
    
    if (item.effect === 'heal_hp') {
      setPlayerHp(prev => Math.min(heroKnight.maxHp, prev + item.value));
      // Clear poison on healing
      setIsPoisoned(false);
      setPoisonDamage(0);
    } else if (item.effect === 'restore_mp') {
      setWizardMp(prev => Math.min(50, prev + item.value));
    }
  }, [inventory]);

  // Enemy turn logic
  const triggerEnemyTurn = useCallback(() => {
    if (!enemy.specialAbilities || enemy.specialAbilities.length === 0) return;
    
    setPhase('enemy_turn');
    setIsPlayerTurn(false);
    
    // Pick a random ability
    const ability = enemy.specialAbilities[Math.floor(Math.random() * enemy.specialAbilities.length)];
    setEnemyAbilityMessage(`${enemy.name} uses ${ability.name}!`);
    
    setTimeout(() => {
      setEnemyAttacking(true);
      
      setTimeout(() => {
        setEnemyAttacking(false);
        
        // Apply ability effects
        switch (ability.effect) {
          case 'poison':
            setIsPoisoned(true);
            setPoisonDamage(ability.damage);
            setPlayerHp(prev => Math.max(0, prev - Math.floor(ability.damage / 2)));
            break;
          case 'debuff':
            setIsDebuffed(true);
            setDebuffTurns(3);
            if (ability.damage > 0) {
              setPlayerHp(prev => Math.max(0, prev - ability.damage));
            }
            break;
          case 'silence':
            // Disable magic temporarily (handled in UI)
            setWizardMp(prev => Math.max(0, prev - 20));
            break;
          default:
            setPlayerHp(prev => Math.max(0, prev - ability.damage));
        }
        
        setHeroTakingDamage(true);
        triggerScreenShake();
        
        setTimeout(() => {
          setHeroTakingDamage(false);
          setEnemyAbilityMessage(null);
          setPhase('reading');
          setIsPlayerTurn(true);
        }, 600);
      }, 400);
    }, 1000);
  }, [enemy]);

  // Handle word result from RPGWordReader
  const handleWordResult = useCallback((correct: boolean, spokenWord: string, wordIndex: number) => {
    setWordsRead(prev => prev + 1);
    setCurrentWordResult(correct);

    // Apply poison damage if poisoned
    if (isPoisoned && poisonDamage > 0) {
      setPlayerHp(prev => Math.max(0, prev - 2));
    }

    // Reduce debuff turns
    if (isDebuffed && debuffTurns > 0) {
      setDebuffTurns(prev => {
        const newTurns = prev - 1;
        if (newTurns <= 0) setIsDebuffed(false);
        return newTurns;
      });
    }

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectWords(prev => prev + 1);
      if (newStreak > longestStreak) {
        setLongestStreak(newStreak);
      }

      const word = words[currentWordIndex + wordIndex];
      const damage = Math.floor(calculateDamage(word?.length || 5, newStreak) * enemy.wordDamageMultiplier);
      setTotalDamage(prev => prev + damage);
      setDamageAmount(damage);
      
      // Attack animation sequence
      setHeroAttacking(true);
      setTimeout(() => {
        setHeroAttacking(false);
        setEnemyTakingDamage(true);
        setShowDamageNumber(true);
        setEnemyHp(prev => Math.max(0, prev - damage));
        triggerScreenShake();
        
        setTimeout(() => {
          setEnemyTakingDamage(false);
          setShowDamageNumber(false);
        }, 600);
      }, 300);

      // Vary attack type based on streak
      const types: ('fire' | 'ice' | 'lightning' | 'slash')[] = ['slash', 'fire', 'ice', 'lightning'];
      setAttackType(types[Math.min(Math.floor(newStreak / 3), types.length - 1)]);
    } else {
      setStreak(0);
      // Enemy counter-attack on miss
      const damage = Math.floor(enemy.attack * 0.5);
      
      setTimeout(() => {
        setEnemyAttacking(true);
        setTimeout(() => {
          setEnemyAttacking(false);
          setHeroTakingDamage(true);
          setPlayerHp(prev => Math.max(0, prev - damage));
          triggerScreenShake();
          
          setTimeout(() => {
            setHeroTakingDamage(false);
          }, 400);
        }, 300);
      }, 300);
    }

    // Move word index forward
    setCurrentWordIndex(prev => prev + 1);

    // Clear result after animation
    setTimeout(() => {
      setCurrentWordResult(null);
    }, 800);
  }, [streak, longestStreak, words, currentWordIndex, enemy, calculateDamage, isPoisoned, poisonDamage, isDebuffed, debuffTurns]);

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

  // Get current batch of words for reading
  const getCurrentWordBatch = useCallback(() => {
    const batchSize = 10;
    return words.slice(currentWordIndex, currentWordIndex + batchSize);
  }, [words, currentWordIndex]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 overflow-hidden"
      animate={screenShake ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Battle Background */}
      <RPGBattleBackground enemyType={enemyType} />

      {/* Word Barrage Overlay */}
      <AnimatePresence>
        {phase === 'barrage' && (
          <RPGWordBarrage
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
      </AnimatePresence>

      {/* Enemy Ability Message */}
      <AnimatePresence>
        {enemyAbilityMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-red-900/90 border-2 border-red-500 px-6 py-3 rounded-lg
              shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <span className="text-white font-bold text-lg">{enemyAbilityMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Effects Display */}
      <AnimatePresence>
        {(isPoisoned || isDebuffed) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-24 left-4 z-30 flex flex-col gap-2"
          >
            {isPoisoned && (
              <div className="flex items-center gap-2 bg-green-900/80 px-3 py-1.5 rounded-lg border border-green-500">
                <span className="text-lg">☠️</span>
                <span className="text-green-300 text-sm font-medium">Poisoned</span>
              </div>
            )}
            {isDebuffed && (
              <div className="flex items-center gap-2 bg-purple-900/80 px-3 py-1.5 rounded-lg border border-purple-500">
                <AlertTriangle className="h-4 w-4 text-purple-300" />
                <span className="text-purple-300 text-sm font-medium">Weakened ({debuffTurns})</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Battle Layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retreat
          </Button>
          <div className="flex items-center gap-4 text-white/80">
            <span className="text-sm font-medium truncate max-w-[200px]">{story.title}</span>
            {streak > 0 && (
              <motion.div 
                className="flex items-center gap-1 text-orange-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Flame className="h-4 w-4" />
                <span className="font-bold">x{streak}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Battle Arena - Center Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-2">
          <div className="w-full max-w-5xl flex items-end justify-between gap-8">
            {/* Enemy (Left Side) */}
            <motion.div
              className="flex-1 flex justify-center"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <RPGCharacter
                character={enemy}
                currentHp={enemyHp}
                isEnemy
                isAttacking={enemyAttacking}
                isTakingDamage={enemyTakingDamage}
                damageNumber={damageAmount}
                showDamage={showDamageNumber}
              />
            </motion.div>

            {/* VS Indicator */}
            <motion.div
              className="text-4xl font-black text-white/30"
              animate={{ 
                scale: phase === 'reading' ? [1, 1.1, 1] : 1,
                opacity: phase === 'reading' ? [0.3, 0.5, 0.3] : 0.3,
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ⚔
            </motion.div>

            {/* Heroes (Right Side) */}
            <motion.div
              className="flex-1 flex justify-center gap-2 md:gap-4"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <RPGCharacter
                character={heroKnight}
                currentHp={playerHp}
                isAttacking={heroAttacking}
                isTakingDamage={heroTakingDamage}
                isDefending={currentCommand === 'defend'}
              />
              <RPGCharacter
                character={allyWizard}
                currentHp={wizardHp}
              />
            </motion.div>
          </div>
        </div>

        {/* Bottom UI Section */}
        <div className="bg-black/50 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-5xl mx-auto p-4">
            <AnimatePresence mode="wait">
              {/* Intro Dialogue */}
              {phase === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full"
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
              {phase === 'reading' && (
                <motion.div
                  key="reading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4"
                >
                  {/* Command Menu */}
                  <div className="hidden md:block">
                    <RPGCommandMenu
                      onSelectCommand={handleCommand}
                      onCastSpell={handleCastSpell}
                      onUseItem={handleUseItem}
                      isPlayerTurn={isPlayerTurn}
                      currentCommand={currentCommand}
                      disabled={currentWordResult !== null}
                      currentMp={wizardMp}
                      inventory={inventory}
                    />
                  </div>

                  {/* Center: Voice Reading */}
                  <div className="space-y-4">
                    {currentCommand === 'read' && getCurrentWordBatch().length > 0 && (
                      <RPGWordReader
                        words={getCurrentWordBatch()}
                        onResult={handleWordResult}
                        disabled={currentWordResult !== null || !isPlayerTurn}
                        streak={streak}
                        batchSize={10}
                      />
                    )}

                    {/* Word Attack Effect */}
                    {currentWordResult !== null && (
                      <RPGWordAttack
                        word={words[currentWordIndex - 1] || ""}
                        isCorrect={currentWordResult}
                        streak={streak}
                        damage={damageAmount}
                        attackType={attackType}
                      />
                    )}
                  </div>

                  {/* Party Stats */}
                  <div className="hidden md:block">
                    <RPGPartyStats
                      members={[
                        { name: heroKnight.name, currentHp: playerHp, maxHp: heroKnight.maxHp, isDefending: currentCommand === 'defend' },
                        { name: allyWizard.name, currentHp: wizardHp, maxHp: allyWizard.maxHp, currentMp: wizardMp, maxMp: 50 },
                      ]}
                      streak={streak}
                      longestStreak={longestStreak}
                    />
                  </div>
                </motion.div>
              )}

              {/* Enemy Turn Phase */}
              {phase === 'enemy_turn' && (
                <motion.div
                  key="enemy_turn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-2xl font-bold text-red-400"
                  >
                    {enemy.name}'s Turn!
                  </motion.div>
                </motion.div>
              )}

              {/* Victory Screen */}
              {phase === 'victory' && (
                <motion.div
                  key="victory"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex justify-center gap-2"
                  >
                    <Trophy className="h-16 w-16 text-yellow-400" />
                  </motion.div>
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    VICTORY!
                  </h2>
                  <p className="text-slate-300">
                    You defeated <span className="text-red-400 font-bold">{enemy.name}</span>!
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-white">{correctWords}</p>
                      <p className="text-xs text-slate-400">Words Read</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-orange-400">{longestStreak}</p>
                      <p className="text-xs text-slate-400">Best Streak</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-red-400">{totalDamage}</p>
                      <p className="text-xs text-slate-400">Damage</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                        <Star className="h-5 w-5" />
                        {Math.floor(100 + correctWords * 5 + longestStreak * 10)}
                      </p>
                      <p className="text-xs text-slate-400">XP Earned</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleBattleEnd(true)} 
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 
                      text-black font-bold px-12 shadow-lg shadow-yellow-500/30"
                  >
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
                  className="text-center py-8 space-y-6"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Skull className="h-16 w-16 text-red-500 mx-auto" />
                  </motion.div>
                  <h2 className="text-4xl font-black text-red-500">DEFEAT</h2>
                  <p className="text-slate-300">
                    {enemy.name} was too powerful...
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300">
                      Return to Map
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-red-500 to-rose-600"
                    >
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
