import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { BattleHUD } from "./BattleHUD";
import { GrogCharacter, GrogState } from "./GrogCharacter";
import { BookRescueCelebration } from "./BookRescueCelebration";
import { 
  BattleState, 
  initializeBattle, 
  processWordResult, 
  calculateXpEarned,
  EnemyType 
} from "@/lib/battleMechanics";
import { getRandomTaunt, getRandomEncouragement } from "@/lib/campaignData";
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
  const { progress, startBattle, updateBattle, completeBattle } = useCampaignProgress(studentId);
  
  const [battleState, setBattleState] = useState<BattleState>(() => 
    initializeBattle(worldNumber, enemyType)
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastDamage, setLastDamage] = useState<number | undefined>();
  const [lastMessage, setLastMessage] = useState<string | undefined>();
  const [grogState, setGrogState] = useState<GrogState>('idle');
  const [currentTaunt, setCurrentTaunt] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [battleSessionId, setBattleSessionId] = useState<string | null>(null);
  const [readingStats, setReadingStats] = useState<any>(null);

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

  // Handle reading completion
  const handleReadingComplete = async (stats: any) => {
    setReadingStats(stats);
    
    // Determine victory/defeat based on enemy HP or accuracy
    const victory = battleState.enemyHp <= 0 || (stats.accuracy >= 70 && battleState.status !== 'defeat');
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
    <div className="space-y-4">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* Battle Arena */}
      <Card className="p-4 bg-gradient-to-b from-background to-muted/50 relative overflow-hidden">
        {/* Battle HUD */}
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
          lastDamage={lastDamage}
          lastMessage={lastMessage}
        />

        {/* Enemy Character */}
        <div className="flex justify-center my-6">
          <GrogCharacter
            state={grogState}
            healthPercent={(battleState.enemyHp / battleState.enemyMaxHp) * 100}
            enemyType={enemyType}
            taunt={currentTaunt}
            showDamage={lastDamage}
          />
        </div>
      </Card>

      {/* Story Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold">{story.title}</h2>
        <p className="text-sm text-muted-foreground">Read aloud to defeat the enemy!</p>
      </div>

      {/* Reading Area */}
      <Card className="p-4">
        <WordByWordReader
          passageText={story.passage_text}
          assignmentId={null}
          onComplete={handleReadingComplete}
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
