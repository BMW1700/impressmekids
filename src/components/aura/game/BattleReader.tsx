import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { BattleHUD } from "./BattleHUD";
import { BattleArena } from "./BattleArena";
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
  const [isCriticalHit, setIsCriticalHit] = useState(false);

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

  // Handle real-time word results from reader
  const handleWordResult = useCallback((result: { 
    correct: boolean; 
    wordIndex: number; 
    streak: number; 
    word: string;
    wordLength: number;
  }) => {
    if (battleState.status !== 'in_progress') return;
    
    const { newState, damageResult, attackResult } = processWordResult(
      battleState,
      result.correct,
      enemyType,
      result.wordLength
    );
    
    setBattleState(newState);
    
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
  }, [battleState, enemyType]);

  // Handle reading completion
  const handleReadingComplete = async (stats: any) => {
    setReadingStats(stats);
    
    // Determine victory/defeat based on final state
    const victory = battleState.status === 'victory' || 
      (battleState.enemyHp <= 0) || 
      (stats.accuracy >= 70 && battleState.playerHp > 0);
    
    const defeatedBeforeFinish = battleState.enemyHp <= 0 && battleState.wordsRead < story.word_count;
    
    const xpEarned = calculateXpEarned(
      victory,
      battleState.wordsRead,
      battleState.correctWords,
      battleState.longestStreak,
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
          damageDealt: battleState.totalDamageDealt,
          longestStreak: battleState.longestStreak,
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
    setBattleState(initializeBattle(worldNumber, enemyType));
    setShowCelebration(false);
    setGrogState('idle');
    setPlayerState('idle');
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

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Retreat
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-bold">{story.title}</h2>
          <p className="text-xs text-muted-foreground">Read aloud to attack!</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* Battle Arena - Characters with health bars */}
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
      />

      {/* Battle Stats HUD */}
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

      {/* Reading Area */}
      <Card className="p-4">
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
