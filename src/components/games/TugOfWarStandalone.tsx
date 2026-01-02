import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Coins, Star, Timer, Volume2, Mic, RotateCcw, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { TugOfWarBackground } from "@/components/aura/game/rpg/TugOfWarBackground";
import { TugOfWarRope } from "@/components/aura/game/rpg/TugOfWarRope";
import { TugOfWarKid } from "@/components/aura/game/rpg/TugOfWarKid";
import { TugOfWarCharacterSelect } from "@/components/aura/game/rpg/TugOfWarCharacterSelect";
import { SirValor } from "@/components/aura/game/characters/SirValor";
import { Elara } from "@/components/aura/game/characters/Elara";
import { GoblinGuard } from "@/components/aura/game/characters/GoblinGuard";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { speechManager } from "@/lib/speechRecognitionManager";
import { DifficultyLevel, DIFFICULTY_LABELS } from "@/data/sightWords";
import { ensureMicrophoneAccess } from "@/lib/micDiagnostics";
import { useToast } from "@/hooks/use-toast";

const soundEffects = new SoundEffects();

interface TugOfWarStandaloneProps {
  words: string[];
  difficulty: DifficultyLevel;
  onComplete: (victory: boolean, stats: { wordsRead: number; correctWords: number; incorrectWords: number }) => void;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
  onExit: () => void;
}

interface FloatingReward {
  id: number;
  gold: number;
  xp: number;
  x: number;
  y: number;
}

// Thresholds
const WIN_THRESHOLD = 10;
const LOSE_THRESHOLD = -10;
const AUTO_PULL_SECONDS = 20;

// Pull amounts
const HERO_PULL = 2;
const ENEMY_PULL = 1;
const AUTO_PULL = 2;

export const TugOfWarStandalone = ({
  words,
  difficulty,
  onComplete,
  onPlayAgain,
  onChangeDifficulty,
  onExit,
}: TugOfWarStandaloneProps) => {
  const { toast } = useToast();
  const [selectedCharacter, setSelectedCharacter] = useState<'valor' | 'elara' | null>(null);
  const [ropePosition, setRopePosition] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [pullingAnimation, setPullingAnimation] = useState<'hero' | 'enemy' | null>(null);
  const [autoPullTimer, setAutoPullTimer] = useState(AUTO_PULL_SECONDS);
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [totalGold, setTotalGold] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const rewardIdRef = useRef(0);
  const gameCompletedRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const currentWordRef = useRef("");
  const processedWordsRef = useRef<Set<number>>(new Set());
  const echoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentWord = words[currentWordIndex] || words[0] || "";

  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  const ropeOffsetPercent = (ropePosition / WIN_THRESHOLD) * 15;

  // Check win/lose
  useEffect(() => {
    if (gameOver || gameCompletedRef.current) return;

    if (ropePosition >= WIN_THRESHOLD) {
      gameCompletedRef.current = true;
      setGameOver(true);
      setVictory(true);
      soundEffects.celebrationSound();
      setTimeout(() => {
        onComplete(true, { wordsRead, correctWords, incorrectWords });
      }, 2000);
    } else if (ropePosition <= LOSE_THRESHOLD) {
      gameCompletedRef.current = true;
      setGameOver(true);
      setVictory(false);
      soundEffects.rockCrumble();
      setTimeout(() => {
        onComplete(false, { wordsRead, correctWords, incorrectWords });
      }, 2000);
    }
  }, [ropePosition, gameOver, wordsRead, correctWords, incorrectWords, onComplete]);

  const showFloatingReward = useCallback((gold: number, xp: number) => {
    const id = rewardIdRef.current++;
    const x = 45 + Math.random() * 10;
    const y = 30 + Math.random() * 10;
    setFloatingRewards(prev => [...prev, { id, gold, xp, x, y }]);
    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(r => r.id !== id));
    }, 1500);
  }, []);

  const handleEnemyAutoPull = useCallback(() => {
    if (gameOver || gameCompletedRef.current) return;
    
    setIncorrectWords(prev => prev + 1);
    setFeedback('incorrect');
    setPullingAnimation('enemy');
    setRopePosition(prev => Math.max(prev - AUTO_PULL, LOSE_THRESHOLD));
    soundEffects.incorrectWord();
    soundEffects.rockCrumble();
    
    setTimeout(() => {
      setFeedback(null);
      setPullingAnimation(null);
    }, 800);
  }, [gameOver]);

  // Auto-pull timer - always counts down unless game is over or not started
  useEffect(() => {
    if (gameOver || !selectedCharacter) return;
    
    const interval = setInterval(() => {
      setAutoPullTimer(prev => {
        if (prev <= 1) {
          handleEnemyAutoPull();
          return AUTO_PULL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameOver, selectedCharacter, handleEnemyAutoPull]);

  const processWordResult = useCallback((correct: boolean, wordIdx: number) => {
    if (gameOver || gameCompletedRef.current) return;
    if (processedWordsRef.current.has(wordIdx)) return;
    processedWordsRef.current.add(wordIdx);
    
    if (echoRetryTimeoutRef.current) {
      clearTimeout(echoRetryTimeoutRef.current);
      echoRetryTimeoutRef.current = null;
    }
    
    setWordsRead(prev => prev + 1);
    setAutoPullTimer(AUTO_PULL_SECONDS); // Reset timer on any word attempt
    
    if (correct) {
      const newPosition = Math.min(ropePosition + HERO_PULL, WIN_THRESHOLD);
      setCorrectWords(prev => prev + 1);
      setFeedback('correct');
      setPullingAnimation('hero');
      setRopePosition(newPosition);
      soundEffects.correctWord();
      soundEffects.comboSuccess();
      
      const goldReward = 5;
      const xpReward = 2;
      setTotalGold(prev => prev + goldReward);
      setTotalXp(prev => prev + xpReward);
      showFloatingReward(goldReward, xpReward);
      
      if (newPosition === 3 || newPosition === 6 || newPosition === 9) {
        const bonusGold = 10;
        const bonusXp = 5;
        setTotalGold(prev => prev + bonusGold);
        setTotalXp(prev => prev + bonusXp);
        setTimeout(() => showFloatingReward(bonusGold, bonusXp), 300);
      }
    } else {
      const newPosition = Math.max(ropePosition - ENEMY_PULL, LOSE_THRESHOLD);
      setIncorrectWords(prev => prev + 1);
      setFeedback('incorrect');
      setPullingAnimation('enemy');
      setRopePosition(newPosition);
      soundEffects.incorrectWord();
      soundEffects.rockCrumble();
    }

    setTimeout(() => {
      setFeedback(null);
      setPullingAnimation(null);
      // Cycle through words continuously
      setCurrentWordIndex(prev => (prev + 1) % words.length);
    }, 600);
  }, [words.length, ropePosition, showFloatingReward, gameOver]);

  const handleSpeechResult = useCallback((transcript: string, alternatives: string[], isFinal: boolean) => {
    if (gameOver || gameCompletedRef.current) return;
    
    const expected = currentWordRef.current.toLowerCase().trim();
    if (!expected) return;
    
    const spoken = transcript.toLowerCase().trim();
    if (isWordMatchLenient(spoken, expected)) {
      processWordResult(true, currentWordIndex);
      return;
    }
    
    for (const alt of alternatives) {
      if (isWordMatchLenient(alt.toLowerCase().trim(), expected)) {
        processWordResult(true, currentWordIndex);
        return;
      }
    }
    
    const spokenWords = spoken.split(/\s+/);
    for (const word of spokenWords) {
      if (isWordMatchLenient(word, expected)) {
        processWordResult(true, currentWordIndex);
        return;
      }
    }
    
    if (isFinal && spoken.length > 0) {
      if (!echoRetryTimeoutRef.current) {
        echoRetryTimeoutRef.current = setTimeout(() => {
          if (!processedWordsRef.current.has(currentWordIndex)) {
            processWordResult(false, currentWordIndex);
          }
          echoRetryTimeoutRef.current = null;
        }, 1500);
      }
    }
  }, [gameOver, currentWordIndex, processWordResult]);

  // Start recognition - MUST be called from user gesture
  const startRecognition = useCallback(async () => {
    setMicError(null);
    
    // STEP 1: Ensure we have mic permission first
    const micResult = await ensureMicrophoneAccess(false);
    
    if (!micResult.success) {
      console.error('[TugOfWarStandalone] Microphone access failed:', micResult.error);
      setMicError(micResult.error?.userMessage || 'Microphone access failed');
      toast({
        title: micResult.error?.actionRequired === 'unblock' ? 'Microphone Blocked' : 'Microphone Error',
        description: micResult.error?.userMessage || 'Please allow microphone access.',
        variant: 'destructive',
      });
      return false;
    }
    
    // STEP 2: Now start speech recognition
    const success = speechManager.start({
      owner: 'reader',
      continuous: true,
      interimResults: true,
      onResult: handleSpeechResult,
      onStart: () => {
        setIsListening(true);
        setMicError(null);
      },
      onEnd: () => setIsListening(false),
      onError: (error) => {
        console.log('[TugOfWarStandalone] Speech error:', error);
        if (error === 'not-allowed') {
          setMicError('Microphone access was denied.');
        }
      }
    });
    
    return success;
  }, [handleSpeechResult, toast]);

  // NOTE: We do NOT auto-start mic on character select - user must tap button
  useEffect(() => {
    return () => {
      speechManager.stop('reader');
      if (echoRetryTimeoutRef.current) {
        clearTimeout(echoRetryTimeoutRef.current);
      }
    };
  }, []);

  const pronounceWord = useCallback(() => {
    if (currentWord && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord);
      utterance.rate = 0.75;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [currentWord]);

  const progressPercent = ((ropePosition + WIN_THRESHOLD) / (WIN_THRESHOLD * 2)) * 100;

  if (!selectedCharacter) {
    return <TugOfWarCharacterSelect onSelect={setSelectedCharacter} />;
  }

  const LeaderComponent = selectedCharacter === 'valor' ? SirValor : Elara;
  const leaderState = pullingAnimation === 'hero' ? 'pulling' : pullingAnimation === 'enemy' ? 'hit' : 'idle';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <TugOfWarBackground />

      {/* Header */}
      <div className="relative z-10 p-4 text-center">
        <h2 className="text-3xl font-black text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          ⚔️ TUG OF WAR ⚔️
        </h2>
        <p className="text-white/90 text-sm drop-shadow">
          {DIFFICULTY_LABELS[difficulty]} • Read words to pull the rope!
        </p>
      </div>

      {/* Rewards & Timer */}
      <div className="relative z-10 flex justify-center gap-4 mb-2">
        <motion.div 
          className="flex items-center gap-1 bg-yellow-500/40 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalGold > 0 ? [1, 1.1, 1] : 1 }}
          key={totalGold}
        >
          <Coins className="h-4 w-4 text-yellow-300" />
          <span className="text-yellow-200 font-bold">{totalGold}</span>
        </motion.div>
        
        <motion.div 
          className={`flex items-center gap-1 backdrop-blur-sm px-3 py-1 rounded-full ${
            autoPullTimer <= 5 ? 'bg-red-500/60' : 'bg-orange-500/40'
          }`}
          animate={autoPullTimer <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: autoPullTimer <= 5 ? Infinity : 0 }}
        >
          <Timer className="h-4 w-4 text-white" />
          <span className="text-white font-bold">{autoPullTimer}s</span>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-1 bg-purple-500/40 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalXp > 0 ? [1, 1.1, 1] : 1 }}
          key={totalXp}
        >
          <Star className="h-4 w-4 text-purple-300" />
          <span className="text-purple-200 font-bold">{totalXp} XP</span>
        </motion.div>
      </div>

      {/* Progress Bar with Goal Lines */}
      <div className="relative z-10 px-8 mb-4">
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-red-400 font-bold drop-shadow">Goblins</span>
          <span className="text-white font-bold drop-shadow">Score: {correctWords}/{wordsRead}</span>
          <span className="text-green-400 font-bold drop-shadow">Hero</span>
        </div>
        <div className="h-6 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm relative">
          {/* Danger zone (left 15%) */}
          <div className="absolute left-0 top-0 w-[15%] h-full bg-red-500/40 border-r-2 border-red-400" />
          {/* Victory zone (right 15%) */}
          <div className="absolute right-0 top-0 w-[15%] h-full bg-green-500/40 border-l-2 border-green-400" />
          
          {/* Progress indicator */}
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-white/70" />
          
          {/* Goal labels */}
          <div className="absolute left-[7%] top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-200">
            LOSE
          </div>
          <div className="absolute right-[7%] top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-200">
            WIN
          </div>
        </div>
      </div>

      {/* Floating Rewards */}
      <AnimatePresence>
        {floatingRewards.map(reward => (
          <motion.div
            key={reward.id}
            className="absolute pointer-events-none z-30 flex flex-col items-center"
            style={{ left: `${reward.x}%`, top: `${reward.y}%` }}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 1.2 }}
          >
            <div className="flex items-center gap-1 bg-yellow-500/90 px-2 py-1 rounded-full text-sm font-bold text-yellow-900 shadow-lg">
              <Coins className="h-3 w-3" /> +{reward.gold}
            </div>
            <div className="flex items-center gap-1 bg-purple-500/90 px-2 py-1 rounded-full text-sm font-bold text-purple-100 mt-1 shadow-lg">
              <Star className="h-3 w-3" /> +{reward.xp} XP
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* WORD DISPLAY - In the blue sky area */}
      <div className="absolute left-0 right-0 z-20" style={{ top: '200px' }}>
        <div className="text-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWord}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-3"
            >
              <div className={`text-6xl md:text-7xl font-black tracking-wide ${
                feedback === 'correct' ? 'text-green-400' :
                feedback === 'incorrect' ? 'text-red-400' :
                'text-white'
              }`} style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.6)' }}>
                {currentWord}
              </div>
              
              {feedback && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-2xl font-bold mt-2 ${
                    feedback === 'correct' ? 'text-green-300' : 'text-red-300'
                  }`}
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {feedback === 'correct' ? '✓ Correct!' : '✗ Try again!'}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={pronounceWord}
              className="bg-white/30 hover:bg-white/40 text-white rounded-full h-12 w-12 backdrop-blur-sm"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
            
            {/* Mic Error Display */}
            {micError && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30 mb-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{micError}</span>
              </div>
            )}
            
            {isListening ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm bg-green-500/70">
                <Mic className="h-5 w-5 text-white animate-pulse" />
                <span className="text-white text-sm font-medium">Listening...</span>
              </div>
            ) : (
              <Button
                onClick={() => startRecognition()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Mic className="h-4 w-4 mr-2" />
                Tap to Start Mic
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TUG-OF-WAR SCENE - Characters much larger */}
      <motion.div 
        className="absolute left-0 right-0 z-[10]"
        style={{ bottom: '40px', height: '320px' }}
        animate={{ x: `${ropeOffsetPercent}%` }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      >
        <div className="relative w-full h-full flex items-end justify-center">
          
          {/* Enemy Team - LARGER */}
          <motion.div 
            className="absolute left-[3%] bottom-0 flex flex-col items-center z-[15]"
            animate={pullingAnimation === 'enemy' ? { x: [-10, 0] } : pullingAnimation === 'hero' ? { x: [10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-end">
              <div className="origin-bottom -mr-4">
                <GoblinGuard 
                  state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                  healthPercent={100}
                  size="medium"
                />
              </div>
              <div className="origin-bottom -mr-2">
                <GoblinGuard 
                  state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                  healthPercent={100}
                  size="large"
                />
              </div>
              <div className="origin-bottom">
                <GoblinGuard 
                  state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                  healthPercent={100}
                  size="large"
                />
              </div>
            </div>
            <div className="text-red-600 font-bold text-sm mt-2 bg-white/90 px-3 py-1 rounded-full shadow">
              Goblins
            </div>
          </motion.div>

          {/* Rope */}
          <div 
            className="absolute z-[12]"
            style={{ 
              left: '50%', 
              transform: 'translateX(-50%)',
              bottom: '60px',
              width: '55%'
            }}
          >
            <TugOfWarRope
              ropePosition={ropePosition}
              maxPosition={WIN_THRESHOLD}
              isPulling={pullingAnimation}
            />
          </div>

          {/* Hero Team - LARGER */}
          <motion.div 
            className="absolute right-[3%] bottom-0 flex flex-col items-center z-[15]"
            animate={pullingAnimation === 'hero' ? { x: [10, 0] } : pullingAnimation === 'enemy' ? { x: [-10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-end">
              <div className="origin-bottom">
                <LeaderComponent state={leaderState} size="large" healthPercent={100} />
              </div>
              <div className="flex -ml-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="-ml-4 first:ml-0">
                    <TugOfWarKid
                      index={index}
                      isPulling={pullingAnimation === 'hero'}
                      isStraining={pullingAnimation === 'enemy'}
                      side="hero"
                      size="large"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="text-green-600 font-bold text-sm mt-2 bg-white/90 px-3 py-1 rounded-full shadow">
              Hero
            </div>
          </motion.div>
        </div>
      </motion.div>


      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`p-8 rounded-2xl text-center max-w-md mx-4 ${
                victory 
                  ? 'bg-gradient-to-b from-yellow-400/90 to-orange-500/90' 
                  : 'bg-gradient-to-b from-gray-600/90 to-gray-800/90'
              }`}
            >
              {victory ? (
                <>
                  <Trophy className="h-20 w-20 text-yellow-200 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-white mb-2">VICTORY!</h2>
                  <p className="text-yellow-100 mb-4">You pulled the goblins across the line!</p>
                </>
              ) : (
                <>
                  <Skull className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-white mb-2">DEFEATED</h2>
                  <p className="text-gray-300 mb-4">The goblins pulled you over! Try again!</p>
                </>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{correctWords}</div>
                  <div className="text-sm text-white/80">Correct Words</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{wordsRead}</div>
                  <div className="text-sm text-white/80">Total Words</div>
                </div>
                <div className="bg-yellow-500/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-200 flex items-center justify-center gap-1">
                    <Coins className="h-5 w-5" /> {totalGold}
                  </div>
                  <div className="text-sm text-yellow-100/80">Gold Earned</div>
                </div>
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-200 flex items-center justify-center gap-1">
                    <Star className="h-5 w-5" /> {totalXp}
                  </div>
                  <div className="text-sm text-purple-100/80">XP Earned</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={onPlayAgain}
                  className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg py-6"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Play Again
                </Button>
                <Button
                  onClick={onChangeDifficulty}
                  variant="outline"
                  className="border-white/50 text-white hover:bg-white/20 font-bold"
                >
                  Change Difficulty
                </Button>
                <Button
                  onClick={onExit}
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Games
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
