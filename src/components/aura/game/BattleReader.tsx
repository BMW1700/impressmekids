import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Volume2, VolumeX, Sparkles } from "lucide-react";
import { BattleHUD } from "./BattleHUD";
import { BattleArena } from "./BattleArena";
import { PowerButton } from "./PowerButton";
import { GrogState } from "./GrogCharacter";
import { PlayerState } from "./PlayerCharacter";
import { BookRescueCelebration } from "./BookRescueCelebration";
import { 
  BattleState, 
  initializeBattle, 
  processWordResult, 
  calculateXpEarned,
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
}

// Power unlocks at streak 5, deals 3x damage
const POWER_STREAK_REQUIREMENT = 5;
const POWER_DAMAGE_MULTIPLIER = 3;

export const BattleReader = ({
  story,
  worldNumber,
  enemyType,
  studentId,
  onBack,
  onComplete,
  onNextStory,
}: BattleReaderProps) => {
  const { progress, startBattle, completeBattle } = useCampaignProgress(studentId);
  
  const [battleState, setBattleState] = useState<BattleState>(() => 
    initializeBattle(worldNumber, enemyType)
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [battleSessionId, setBattleSessionId] = useState<string | null>(null);
  const [readingStats, setReadingStats] = useState<any>(null);
  
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
  const [triggerPowerBeam, setTriggerPowerBeam] = useState(0);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  
  // Power ability state
  const [powerReady, setPowerReady] = useState(false);
  const [powerCharging, setPowerCharging] = useState(0);
  
  // CRITICAL FIX: Track processed word events to prevent double-applying damage
  const processedWordEventsRef = useRef<Set<string>>(new Set());

  // Initialize battle session in database
  useEffect(() => {
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
  }, []);

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

  // Update power charging based on streak
  useEffect(() => {
    const chargePercent = Math.min((battleState.currentStreak / POWER_STREAK_REQUIREMENT) * 100, 100);
    setPowerCharging(chargePercent);
    setPowerReady(battleState.currentStreak >= POWER_STREAK_REQUIREMENT);
  }, [battleState.currentStreak]);

  // Handle power activation
  const handlePowerActivate = useCallback(() => {
    if (!powerReady || battleState.status !== 'in_progress') return;
    
    // Calculate power damage (3x base damage)
    const baseDamage = 10;
    const powerDamage = baseDamage * POWER_DAMAGE_MULTIPLIER;
    
    // Apply damage to enemy
    setBattleState(prev => {
      const newEnemyHp = Math.max(0, prev.enemyHp - powerDamage);
      return {
        ...prev,
        enemyHp: newEnemyHp,
        totalDamageDealt: prev.totalDamageDealt + powerDamage,
        currentStreak: 0, // Reset streak after using power
        status: newEnemyHp <= 0 ? 'victory' : prev.status,
      };
    });
    
    // Trigger visual effects
    setPlayerState('attacking');
    setGrogState('hit');
    setShowEnemyDamage(powerDamage);
    setLastMessage("⚡ POWER STRIKE! ⚡");
    setTriggerPowerBeam(Date.now());
    setPowerReady(false);
    setPowerCharging(0);
    
    // Reset states after animation
    setTimeout(() => {
      setPlayerState('idle');
      setBattleState(prev => {
        setGrogState(prev.enemyHp <= 0 ? 'defeated' : 'idle');
        return prev;
      });
      setShowEnemyDamage(undefined);
      setLastMessage(undefined);
    }, 600);
  }, [powerReady, battleState.status]);

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
        });
      } catch (error) {
        console.error('Failed to complete battle:', error);
      }
    }

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
    setBattleState(initializeBattle(worldNumber, enemyType));
    setShowCelebration(false);
    setGrogState('idle');
    setPlayerState('idle');
    setPowerReady(false);
    setPowerCharging(0);
  };

  const handleNextStory = () => {
    if (onNextStory) {
      onNextStory();
    } else {
      onBack();
    }
  };

  // Calculate accuracy
  const accuracy = battleState.wordsRead > 0 
    ? Math.round((battleState.correctWords / battleState.wordsRead) * 100) 
    : 0;

  // Enemy name for display
  const enemyName = enemyType === 'minion' ? 'Minion' : 
                    enemyType === 'guard' ? 'Guard' : 
                    enemyType === 'elite' ? 'Elite' : 'Boss';

  return (
    <div className="space-y-2">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1 h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs">Back</span>
        </Button>
        <div className="text-center flex-1">
          <h2 className="text-sm font-bold truncate">{story.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <motion.div 
            className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded text-xs"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-primary font-medium">Coach</span>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Compact Battle Arena with integrated health bars */}
      <BattleArena
        enemyType={enemyType}
        enemyHealthPercent={(battleState.enemyHp / battleState.enemyMaxHp) * 100}
        enemyState={grogState}
        enemyTaunt={currentTaunt}
        enemyHp={battleState.enemyHp}
        enemyMaxHp={battleState.enemyMaxHp}
        enemyName={enemyName}
        playerHealthPercent={(battleState.playerHp / battleState.playerMaxHp) * 100}
        playerState={playerState}
        playerHp={battleState.playerHp}
        playerMaxHp={battleState.playerMaxHp}
        currentStreak={battleState.currentStreak}
        showPlayerDamage={showPlayerDamage}
        showEnemyDamage={showEnemyDamage}
        triggerAttackBeam={triggerAttackBeam}
        triggerDamageBeam={triggerDamageBeam}
        triggerPowerBeam={triggerPowerBeam}
        isCriticalHit={isCriticalHit}
      />

      {/* Compact Stats HUD with Power Button */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
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
            enemyName={enemyName}
            lastDamage={showEnemyDamage}
            lastMessage={lastMessage}
          />
        </div>
        
        {/* Power Button */}
        <PowerButton
          powerReady={powerReady}
          powerCharging={powerCharging}
          onActivate={handlePowerActivate}
          disabled={battleState.status !== 'in_progress'}
        />
      </div>

      {/* Victory requirement hint */}
      <div className="text-center text-[10px] text-muted-foreground">
        🎯 Defeat enemy OR finish with 90%+ accuracy to win!
      </div>

      {/* Reading Area - More compact */}
      <Card className="p-3">
        <WordByWordReader
          passageText={story.passage_text}
          assignmentId={null}
          onComplete={handleReadingComplete}
          onWordResult={handleWordResult}
        />
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
