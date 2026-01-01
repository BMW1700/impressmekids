import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Users, Trophy, Skull, Coins, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundEffects } from "@/lib/pronunciationPlayer";

interface RPGTugOfWarProps {
  words: string[];
  heroName?: string;
  enemyName?: string;
  onComplete: (victory: boolean, stats: { wordsRead: number; correctWords: number; incorrectWords: number }) => void;
  onWordResult?: (word: string, correct: boolean) => void;
}

const soundEffects = new SoundEffects();

interface FloatingReward {
  id: number;
  gold: number;
  xp: number;
  x: number;
  y: number;
}

export const RPGTugOfWar = ({
  words,
  heroName = "Hero",
  enemyName = "Enemy",
  onComplete,
  onWordResult,
}: RPGTugOfWarProps) => {
  // Rope position: -10 (enemy wins) to +10 (hero wins), starts at 0
  const [ropePosition, setRopePosition] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [pullingAnimation, setPullingAnimation] = useState<'hero' | 'enemy' | null>(null);
  
  // Rewards
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [totalGold, setTotalGold] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const rewardIdRef = useRef(0);

  const recognitionRef = useRef<any>(null);

  const currentWord = words[currentWordIndex] || "";
  const WIN_THRESHOLD = 10;
  const LOSE_THRESHOLD = -10;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Check for win/lose conditions
  useEffect(() => {
    if (gameOver) return;

    if (ropePosition >= WIN_THRESHOLD) {
      setGameOver(true);
      setVictory(true);
      soundEffects.celebrationSound();
      setTimeout(() => {
        onComplete(true, { wordsRead, correctWords, incorrectWords });
      }, 2000);
    } else if (ropePosition <= LOSE_THRESHOLD) {
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
    // Position near the center flag
    const x = 45 + Math.random() * 10;
    const y = 40 + Math.random() * 10;
    setFloatingRewards(prev => [...prev, { id, gold, xp, x, y }]);
    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(r => r.id !== id));
    }, 1500);
  }, []);

  const handleWordResult = useCallback((correct: boolean) => {
    setWordsRead(prev => prev + 1);
    const newPosition = correct 
      ? Math.min(ropePosition + 1, WIN_THRESHOLD)
      : Math.max(ropePosition - 2, LOSE_THRESHOLD);
    
    if (correct) {
      setCorrectWords(prev => prev + 1);
      setFeedback('correct');
      setPullingAnimation('hero');
      setRopePosition(newPosition);
      soundEffects.correctWord();
      soundEffects.comboSuccess();
      
      // Award gold and XP on correct words
      const goldReward = 5;
      const xpReward = 2;
      setTotalGold(prev => prev + goldReward);
      setTotalXp(prev => prev + xpReward);
      showFloatingReward(goldReward, xpReward);
      
      // Bonus at milestones (3, 6, 9)
      if (newPosition === 3 || newPosition === 6 || newPosition === 9) {
        const bonusGold = 10;
        const bonusXp = 5;
        setTotalGold(prev => prev + bonusGold);
        setTotalXp(prev => prev + bonusXp);
        setTimeout(() => showFloatingReward(bonusGold, bonusXp), 300);
      }
    } else {
      setIncorrectWords(prev => prev + 1);
      setFeedback('incorrect');
      setPullingAnimation('enemy');
      setRopePosition(newPosition);
      soundEffects.incorrectWord();
      soundEffects.rockCrumble();
    }

    onWordResult?.(currentWord, correct);

    // Clear feedback and move to next word
    setTimeout(() => {
      setFeedback(null);
      setPullingAnimation(null);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      }
    }, 800);
  }, [currentWord, currentWordIndex, words.length, onWordResult, ropePosition, showFloatingReward]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || gameOver) return;

    setIsListening(true);

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const targetWord = currentWord.toLowerCase().replace(/[^a-z]/g, '');
      const spokenWord = transcript.replace(/[^a-z]/g, '');
      
      const isCorrect = spokenWord === targetWord || 
                        transcript.includes(targetWord) ||
                        targetWord.includes(spokenWord);
      
      handleWordResult(isCorrect);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [isListening, gameOver, currentWord, handleWordResult]);

  // Calculate visual positions
  const ropeOffset = (ropePosition / WIN_THRESHOLD) * 40; // -40% to +40%
  const progressPercent = ((ropePosition + WIN_THRESHOLD) / (WIN_THRESHOLD * 2)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-amber-900 via-orange-800 to-amber-900 flex flex-col">
      {/* Header */}
      <div className="p-4 text-center">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <Users className="h-6 w-6" />
          TUG OF WAR
        </h2>
        <p className="text-amber-200 text-sm">Read words correctly to pull the rope!</p>
      </div>

      {/* Rewards Display */}
      <div className="flex justify-center gap-4 mb-2">
        <motion.div 
          className="flex items-center gap-1 bg-yellow-500/30 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalGold > 0 ? [1, 1.1, 1] : 1 }}
          key={totalGold}
        >
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">{totalGold}</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-1 bg-purple-500/30 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalXp > 0 ? [1, 1.1, 1] : 1 }}
          key={totalXp}
        >
          <Star className="h-4 w-4 text-purple-400" />
          <span className="text-purple-300 font-bold">{totalXp} XP</span>
        </motion.div>
      </div>

      {/* Score Display */}
      <div className="flex justify-between px-8 mb-4">
        <div className="text-center">
          <div className="text-red-400 font-bold text-lg">{enemyName}</div>
          <div className="text-white/70 text-sm">Pull: {Math.abs(Math.min(0, ropePosition))}</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-300 font-bold">Words: {wordsRead}</div>
          <div className="text-green-400 text-sm">Correct: {correctWords}</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 font-bold text-lg">{heroName}</div>
          <div className="text-white/70 text-sm">Pull: {Math.max(0, ropePosition)}</div>
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

      {/* Arena */}
      <div className="flex-1 relative overflow-hidden">
        {/* Goal Posts */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <Flag className="h-12 w-12 text-red-500" />
          <span className="text-red-400 text-xs mt-1">Enemy Goal</span>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <Flag className="h-12 w-12 text-green-500" />
          <span className="text-green-400 text-xs mt-1">Hero Goal</span>
        </div>

        {/* Progress Bar / Rope Track */}
        <div className="absolute top-8 left-20 right-20 h-4 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-white/50" />
        </div>

        {/* Rope */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-y-1/2"
          animate={{ x: `${ropeOffset}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{ marginLeft: '-50%', width: '100%' }}
        >
          {/* Rope line */}
          <div className="h-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-full shadow-lg mx-16 relative">
            {/* Rope texture */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(0,0,0,0.2)_8px,rgba(0,0,0,0.2)_16px)] rounded-full" />
          </div>

          {/* Center Flag */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{
              scale: pullingAnimation ? [1, 1.2, 1] : 1,
              rotate: pullingAnimation === 'hero' ? [0, 10, 0] : pullingAnimation === 'enemy' ? [0, -10, 0] : 0,
            }}
          >
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-300">
              <Flag className="h-8 w-8 text-amber-800" />
            </div>
          </motion.div>
        </motion.div>

        {/* Enemy Character (Left) */}
        <motion.div
          className="absolute left-20 top-1/2 -translate-y-1/2"
          animate={{
            x: pullingAnimation === 'enemy' ? [-10, 0] : pullingAnimation === 'hero' ? [10, 0] : 0,
            scale: pullingAnimation === 'enemy' ? [1.1, 1] : 1,
          }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg border-4 border-red-400">
            <span className="text-4xl">👹</span>
          </div>
          <motion.div
            className="text-center mt-2"
            animate={{ opacity: pullingAnimation === 'enemy' ? [1, 0.5, 1] : 1 }}
          >
            <span className="text-red-300 font-bold">PULL!</span>
          </motion.div>
        </motion.div>

        {/* Hero Character (Right) */}
        <motion.div
          className="absolute right-20 top-1/2 -translate-y-1/2"
          animate={{
            x: pullingAnimation === 'hero' ? [10, 0] : pullingAnimation === 'enemy' ? [-10, 0] : 0,
            scale: pullingAnimation === 'hero' ? [1.1, 1] : 1,
          }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-300">
            <span className="text-4xl">⚔️</span>
          </div>
          <motion.div
            className="text-center mt-2"
            animate={{ opacity: pullingAnimation === 'hero' ? [1, 0.5, 1] : 1 }}
          >
            <span className="text-green-300 font-bold">PULL!</span>
          </motion.div>
        </motion.div>

        {/* Dust Effects */}
        <AnimatePresence>
          {pullingAnimation && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`dust-${i}`}
                  className="absolute top-1/2 left-1/2 w-4 h-4 bg-amber-200/50 rounded-full"
                  initial={{ 
                    x: (Math.random() - 0.5) * 100,
                    y: 0,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    y: [0, -30 - Math.random() * 20],
                    scale: [0, 1, 0.5],
                    opacity: [1, 0.5, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Word Display & Reading Interface */}
      {!gameOver && (
        <div className="p-6 bg-black/40 backdrop-blur-sm">
          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`text-center mb-4 text-2xl font-black ${
                  feedback === 'correct' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {feedback === 'correct' ? '✓ CORRECT! Pull!' : '✗ Wrong! They pulled!'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Word */}
          <motion.div
            key={currentWordIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="text-white/60 text-sm mb-2">Read this word:</div>
            <div className="text-5xl font-black text-white tracking-wide">
              {currentWord}
            </div>
          </motion.div>

          {/* Listen Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={startListening}
              disabled={isListening || gameOver}
              className={`px-8 py-6 text-xl font-bold rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500'
              }`}
            >
              {isListening ? '🎤 Listening...' : '🎤 Tap & Speak'}
            </Button>
          </div>

          {/* Skip for testing */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWordResult(true)}
              className="text-green-400 hover:bg-green-400/20"
            >
              ✓ Mark Correct
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWordResult(false)}
              className="text-red-400 hover:bg-red-400/20"
            >
              ✗ Mark Wrong
            </Button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              {victory ? (
                <>
                  <Trophy className="h-24 w-24 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-green-400 mb-2">VICTORY!</h2>
                  <p className="text-white/80">You pulled the flag to your side!</p>
                </>
              ) : (
                <>
                  <Skull className="h-24 w-24 text-red-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-red-400 mb-2">DEFEAT!</h2>
                  <p className="text-white/80">The enemy pulled the flag away!</p>
                </>
              )}
              <div className="mt-4 text-white/60">
                <p>Words Read: {wordsRead}</p>
                <p>Accuracy: {wordsRead > 0 ? Math.round((correctWords / wordsRead) * 100) : 0}%</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
