import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Volume2, VolumeX, Sparkles, Star, Play } from "lucide-react";
import { BattleHUD } from "./BattleHUD";
import { BattleArena } from "./BattleArena";
import { GrogState } from "./GrogCharacter";
import { PlayerState } from "./PlayerCharacter";
import { BookRescueCelebration } from "./BookRescueCelebration";
import { StreakPower } from "./StreakPower";
import { PurpleFireEffect } from "./PurpleFireEffect";
import { BattleDifficultySelector, BattleDifficulty } from "./BattleDifficultySelector";
import { 
  BattleState, 
  initializeBattle, 
  processWordResult, 
  calculateXpEarned,
  calculatePowerDamage,
  EnemyType 
} from "@/lib/battleMechanics";
import { getRandomTaunt } from "@/lib/campaignData";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { WordByWordReader } from "../WordByWordReader";
import { CuratedStory } from "@/data/curatedStories";


interface BattleReaderProps {
  story: CuratedStory;
  worldNumber: number;
  enemyType: EnemyType;
  studentId: string;
  onBack: () => void;
  onComplete: () => void;
  onNextStory?: () => void;
  ellaAvatarUrl?: string;
  grogAvatarUrl?: string;
}

export const BattleReader = ({
  story,
  worldNumber,
  enemyType,
  studentId,
  onBack,
  onComplete,
  onNextStory,
  ellaAvatarUrl,
  grogAvatarUrl,
}: BattleReaderProps) => {
  const { progress, startBattle, completeBattle } = useCampaignProgress(studentId);
  
  // DIFFICULTY SELECTION STATE
  const [battleDifficulty, setBattleDifficulty] = useState<BattleDifficulty | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  
  const [battleState, setBattleState] = useState<BattleState>(() => 
    initializeBattle(worldNumber, enemyType)
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [battleSessionId, setBattleSessionId] = useState<string | null>(null);
  const [readingStats, setReadingStats] = useState<any>(null);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  
  // Character states
  const [grogState, setGrogState] = useState<GrogState>('idle');
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentTaunt, setCurrentTaunt] = useState<string>("");
  
  // Damage display
  const [showEnemyDamage, setShowEnemyDamage] = useState<number | undefined>();
  const [showPlayerDamage, setShowPlayerDamage] = useState<number | undefined>();
  const [lastMessage, setLastMessage] = useState<string | undefined>();
  
  // Beam effect triggers
  const [triggerAttackBeam, setTriggerAttackBeam] = useState(0);
  const [triggerDamageBeam, setTriggerDamageBeam] = useState(0);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  
  // STREAK POWER SYSTEM
  const [powerAvailable, setPowerAvailable] = useState(false);
  const [powerCooldown, setPowerCooldown] = useState(false);
  const [triggerPurpleFire, setTriggerPurpleFire] = useState(0);
  const [purpleFireDamage, setPurpleFireDamage] = useState(0);
  const [isMegaPower, setIsMegaPower] = useState(false);
  const lastPowerStreakRef = useRef(0);
  
  // CRITICAL FIX: Track processed word events to prevent double-applying damage
  const processedWordEventsRef = useRef<Set<string>>(new Set());

  // Ref for WordByWordReader control
  const readerStartRef = useRef<(() => void) | null>(null);

  // Handle difficulty selection
  const handleDifficultySelect = (difficulty: BattleDifficulty) => {
    setBattleDifficulty(difficulty);
    setShowDifficultySelector(false);
  };

  // Initialize battle session in database
  useEffect(() => {
    // Only start battle after difficulty is selected
    if (!battleDifficulty) return;
    
    const initBattle = async () => {
      try {
        const session = await startBattle({
          storyTitle: story.title,
          storyCategory: story.category,
          worldNumber,
          enemyType,
          enemyMaxHp: battleState.enemyMaxHp,
        });
        setBattleSessionId(session?.id || null);
      } catch (error) {
        console.error('Failed to start battle session:', error);
      }
    };
    initBattle();
  }, [battleDifficulty]);

  // Random taunt every 15-30 seconds when enemy is idle
  useEffect(() => {
    if (battleState.status !== 'in_progress') return;
    
    const showRandomTaunt = () => {
      if (grogState === 'idle' && Math.random() > 0.5) {
        setCurrentTaunt(getRandomTaunt('grogTaunts'));
        setTimeout(() => setCurrentTaunt(""), 3000);
      }
    };
    
    const interval = setInterval(showRandomTaunt, 15000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, [battleState.status, grogState]);

  // STREAK POWER: Check if power should be available
  useEffect(() => {
    const streak = battleState.currentStreak;
    const { tier } = calculatePowerDamage(streak);
    
    // Power becomes available at streak milestones (5, 10, 15, etc.)
    // But only if we haven't already used power at this milestone
    const currentMilestone = Math.floor(streak / 5) * 5;
    
    if (tier !== 'none' && currentMilestone > lastPowerStreakRef.current && !powerCooldown) {
      setPowerAvailable(true);
    }
  }, [battleState.currentStreak, powerCooldown]);

  // Handle power activation
  const handlePowerActivate = useCallback(() => {
    if (!powerAvailable || powerCooldown) return;
    
    const { damage, tier } = calculatePowerDamage(battleState.currentStreak);
    if (tier === 'none') return;
    
    // Mark power as used at this milestone
    const currentMilestone = Math.floor(battleState.currentStreak / 5) * 5;
    lastPowerStreakRef.current = currentMilestone;
    
    // Set power cooldown
    setPowerAvailable(false);
    setPowerCooldown(true);
    
    // Trigger purple fire animation
    setPurpleFireDamage(damage);
    setIsMegaPower(tier === 'mega');
    setTriggerPurpleFire(Date.now());
    
    // Apply damage to enemy
    setBattleState(prev => {
      const newEnemyHp = Math.max(0, prev.enemyHp - damage);
      return {
        ...prev,
        enemyHp: newEnemyHp,
        totalDamageDealt: prev.totalDamageDealt + damage,
        status: newEnemyHp <= 0 ? 'victory' : prev.status,
      };
    });
    
    // Visual effects
    setGrogState('hit');
    setTimeout(() => {
      setGrogState(battleState.enemyHp - purpleFireDamage <= 0 ? 'defeated' : 'idle');
    }, 800);
    
    // Reset cooldown after animation
    setTimeout(() => {
      setPowerCooldown(false);
    }, 1500);
  }, [powerAvailable, powerCooldown, battleState.currentStreak, battleState.enemyHp, purpleFireDamage]);

  // Handle real-time word results from reader
  // CRITICAL FIX: Use functional state update to avoid stale state issues
  const handleWordResult = useCallback((result: { 
    correct: boolean; 
    wordIndex: number; 
    streak: number; 
    word: string;
    wordLength: number;
  }) => {
    // Create unique event key to prevent double-processing
    const eventKey = `${result.wordIndex}-${result.correct}`;
    if (processedWordEventsRef.current.has(eventKey)) {
      return; // Already processed this exact event
    }
    processedWordEventsRef.current.add(eventKey);
    
    // Use functional update to ensure we always work with latest state
    setBattleState(prevState => {
      if (prevState.status !== 'in_progress') {
        return prevState; // Don't update if battle is over
      }
      
      const { newState, damageResult, attackResult } = processWordResult(
        prevState,
        result.correct,
        enemyType,
        result.wordLength
      );
      
      // Trigger visual effects based on result
      if (result.correct && damageResult) {
        // Player attacks enemy
        setPlayerState('attacking');
        setGrogState('hit');
        setShowEnemyDamage(damageResult.damage);
        setLastMessage(damageResult.message || undefined);
        setIsCriticalHit(damageResult.isCritical);
        setTriggerAttackBeam(Date.now());
        
        // Clear taunt on hit
        setCurrentTaunt("");
        
        // Reset states after animation
        setTimeout(() => {
          setPlayerState('idle');
          setGrogState(newState.enemyHp <= 0 ? 'defeated' : 'idle');
          setShowEnemyDamage(undefined);
          setLastMessage(undefined);
        }, 500);
        
      } else if (!result.correct && attackResult) {
        // Enemy attacks player
        setGrogState('attacking');
        setPlayerState('hit');
        setShowPlayerDamage(attackResult.damage);
        setLastMessage(attackResult.message);
        setTriggerDamageBeam(Date.now());
        
        // Show taunt on player mistake
        if (Math.random() > 0.6) {
          setCurrentTaunt(getRandomTaunt('playerHit'));
        }
        
        // Reset states after animation
        setTimeout(() => {
          setGrogState('idle');
          setPlayerState(newState.playerHp <= 0 ? 'defeated' : 'idle');
          setShowPlayerDamage(undefined);
          setLastMessage(undefined);
        }, 500);
      }
      
      // Check for battle end
      if (newState.status === 'victory') {
        setGrogState('defeated');
        setPlayerState('victory');
      } else if (newState.status === 'defeat') {
        setPlayerState('defeated');
        setGrogState('taunting');
        setCurrentTaunt(getRandomTaunt('grogTaunts'));
      }
      
      return newState;
    });
  }, [enemyType]);

  // Handle reading completion
  // VICTORY RULES: Win if goblin dies OR (story finished AND accuracy >= 90%)
  const handleReadingComplete = async (stats: any) => {
    setReadingStats(stats);
    
    // Get final battle state for victory calculation
    const finalState = battleState;
    const accuracy = finalState.wordsRead > 0 
      ? (finalState.correctWords / finalState.wordsRead) * 100 
      : 0;
    
    // VICTORY CONDITIONS:
    // 1. Killed the goblin (enemyHp <= 0)
    // 2. Finished story with 90%+ accuracy AND still alive
    const killedGoblin = finalState.enemyHp <= 0;
    const passedAccuracyGate = accuracy >= 90 && finalState.playerHp > 0;
    const victory = killedGoblin || passedAccuracyGate;
    
    const defeatedBeforeFinish = killedGoblin && finalState.wordsRead < story.word_count;
    
    const xpEarned = calculateXpEarned(
      victory,
      finalState.wordsRead,
      finalState.correctWords,
      finalState.longestStreak,
      worldNumber,
      defeatedBeforeFinish
    );

    // Update final battle state
    setBattleState(prev => ({
      ...prev,
      status: victory ? 'victory' : 'defeat',
      xpEarned,
    }));

    if (victory) {
      setGrogState('defeated');
      setPlayerState('victory');
    } else {
      setGrogState('taunting');
      setPlayerState('defeated');
    }

    // Save to database
    if (battleSessionId) {
      try {
        await completeBattle({
          battleId: battleSessionId,
          victory,
          xpEarned,
          damageDealt: finalState.totalDamageDealt,
          longestStreak: finalState.longestStreak,
          storyTitle: story.title,
          worldNumber,
          goldEarned: 0, // BattleReader doesn't track gold; RPGBattleArena does
        });
      } catch (error) {
        console.error('Failed to complete battle:', error);
      }
    }

    // NOTE: student_reading_stats is already updated by the embedded WordByWordReader
    // Do NOT call updateStudentReadingStats here to avoid double-counting

    setShowCelebration(true);
  };

  // Handle celebration close
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    if (battleState.status === 'victory') {
      onComplete();
    }
  };

  const handleTryAgain = () => {
    // Reset everything for a fresh battle
    processedWordEventsRef.current = new Set();
    lastPowerStreakRef.current = 0;
    setPowerAvailable(false);
    setPowerCooldown(false);
    setBattleState(initializeBattle(worldNumber, enemyType));
    setShowCelebration(false);
    setGrogState('idle');
    setPlayerState('idle');
    setHasStartedReading(false);
  };

  const handleNextStory = () => {
    if (onNextStory) {
      onNextStory();
    } else {
      onBack();
    }
  };

  // Calculate accuracy from battle state (source of truth)
  const accuracy = battleState.wordsRead > 0 
    ? Math.round((battleState.correctWords / battleState.wordsRead) * 100) 
    : 0;

  // Show difficulty selector first
  if (showDifficultySelector) {
    return (
      <div className="space-y-2">
        {/* Compact Header */}
        <div className="flex items-center justify-between py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-1 h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-base font-bold truncate">{story.title}</h2>
          </div>
          <div className="w-8" /> {/* Spacer for alignment */}
        </div>
        
        <BattleDifficultySelector 
          onSelect={handleDifficultySelect}
          storyTitle={story.title}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      {/* Purple Fire Effect Overlay */}
      <PurpleFireEffect
        trigger={triggerPurpleFire}
        damage={purpleFireDamage}
        isMega={isMegaPower}
      />

      {/* Compact Header */}
      <div className="flex items-center justify-between py-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1 h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
        <div className="text-center flex-1">
          <h2 className="text-base font-bold truncate">{story.title}</h2>
          <span className="text-xs text-muted-foreground">
            {battleDifficulty === 'challenging' ? '⚡ Challenging Mode' : '🛡️ Normal Mode'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* START BUTTON BANNER - Above Battle Arena */}
      {!hasStartedReading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-xl p-4 flex items-center justify-center gap-4 shadow-lg"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Star className="h-10 w-10 text-yellow-900 fill-yellow-900" />
          </motion.div>
          <div className="text-center">
            <p className="text-yellow-900 font-bold text-lg">Ready to Battle?</p>
            <p className="text-yellow-800 text-sm">Click below to start reading!</p>
          </div>
          <Button
            size="lg"
            className="bg-yellow-900 hover:bg-yellow-800 text-yellow-100"
            onClick={() => setHasStartedReading(true)}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Reading
          </Button>
        </motion.div>
      )}

      {/* AURA Coach Indicator - Small bar at top */}
      <motion.div 
        className="flex items-center justify-center gap-2 py-1 bg-primary/10 rounded-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-xs font-medium text-primary">AURA Coach Active</span>
        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
      </motion.div>

      {/* Battle Arena - Characters (NO HP bars, just visuals) */}
      <BattleArena
        enemyType={enemyType}
        enemyHealthPercent={(battleState.enemyHp / battleState.enemyMaxHp) * 100}
        enemyState={grogState}
        enemyTaunt={currentTaunt}
        playerHealthPercent={(battleState.playerHp / battleState.playerMaxHp) * 100}
        playerState={playerState}
        currentStreak={battleState.currentStreak}
        showPlayerDamage={showPlayerDamage}
        showEnemyDamage={showEnemyDamage}
        triggerAttackBeam={triggerAttackBeam}
        triggerDamageBeam={triggerDamageBeam}
        isCriticalHit={isCriticalHit}
        ellaAvatarUrl={ellaAvatarUrl}
        grogAvatarUrl={grogAvatarUrl}
      />

      {/* Battle Stats HUD - SINGLE source of HP display */}
      <BattleHUD
        enemyHp={battleState.enemyHp}
        enemyMaxHp={battleState.enemyMaxHp}
        playerHp={battleState.playerHp}
        playerMaxHp={battleState.playerMaxHp}
        currentStreak={battleState.currentStreak}
        wordsRead={battleState.wordsRead}
        correctWords={battleState.correctWords}
        totalWords={story.word_count}
        worldNumber={worldNumber}
        enemyName={`World ${worldNumber} ${enemyType.charAt(0).toUpperCase() + enemyType.slice(1)}`}
        lastDamage={showEnemyDamage}
        lastMessage={lastMessage}
      />

      {/* Streak Power Button */}
      <div className="flex justify-center">
        <StreakPower
          currentStreak={battleState.currentStreak}
          onActivate={handlePowerActivate}
          isAvailable={powerAvailable}
          cooldownActive={powerCooldown}
        />
      </div>

      {/* Victory requirement hint */}
      <div className="text-center text-xs text-muted-foreground bg-muted/30 py-1 rounded">
        🎯 Win by defeating the enemy OR finishing with 90%+ accuracy!
      </div>

      {/* Reading Area - Story Text with internal scroll */}
      <Card className="p-3 max-h-[40vh] overflow-y-auto">
        {hasStartedReading ? (
          <WordByWordReader
            passageText={story.passage_text}
            assignmentId={null}
            onComplete={handleReadingComplete}
            onWordResult={handleWordResult}
            challengingMode={battleDifficulty === 'challenging'}
            battleMode={true}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Start Reading" above to begin the battle!</p>
          </div>
        )}
      </Card>

      {/* Victory/Defeat Celebration */}
      <BookRescueCelebration
        open={showCelebration}
        victory={battleState.status === 'victory'}
        storyTitle={story.title}
        stats={{
          xpEarned: battleState.xpEarned,
          damageDealt: battleState.totalDamageDealt,
          longestStreak: battleState.longestStreak,
          wordsRead: battleState.wordsRead,
          correctWords: battleState.correctWords,
          accuracy,
          defeatedBeforeFinish: battleState.enemyHp <= 0 && battleState.wordsRead < story.word_count,
        }}
        worldNumber={worldNumber}
        booksRescued={(progress?.books_rescued || 0) + (battleState.status === 'victory' ? 1 : 0)}
        onClose={handleCelebrationClose}
        onPlayAgain={handleTryAgain}
        onNextStory={handleNextStory}
        onBackToMap={onBack}
      />
    </div>
  );
};
