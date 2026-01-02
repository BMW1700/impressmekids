import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { Coins, Star, Mic, MicOff } from "lucide-react";

interface RPGBalloonQuickPopProps {
  words: string[];
  enemyName?: string;
  onComplete: (popped: number, missed: number, goldEarned: number, xpEarned: number) => void;
  onWordResult?: (word: string, correct: boolean) => void;
}

const soundEffects = new SoundEffects();

const BALLOON_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
const BALLOON_EMOJIS = ['👹', '💀', '🦇', '👻', '🐲'];

interface QuickBalloon {
  id: number;
  color: string;
  emoji: string;
  popped: boolean;
  word: string;
}

export const RPGBalloonQuickPop = ({
  words,
  enemyName = "Enemy",
  onComplete,
  onWordResult,
}: RPGBalloonQuickPopProps) => {
  // Always show exactly 5 balloons (or less if fewer words)
  const balloonCount = Math.min(5, Math.max(3, words.length));
  
  const [balloons, setBalloons] = useState<QuickBalloon[]>(() =>
    words.slice(0, balloonCount).map((word, i) => ({
      id: i,
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      emoji: BALLOON_EMOJIS[i % BALLOON_EMOJIS.length],
      popped: false,
      word,
    }))
  );

  const [currentBalloonIndex, setCurrentBalloonIndex] = useState(0);
  
  // Simplified mic state - stop/start per word for reliability
  const [isMicActive, setIsMicActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [floatingRewards, setFloatingRewards] = useState<{ id: number; gold: number; xp: number; x: number; y: number }[]>([]);
  const [totalGold, setTotalGold] = useState(0);
  const [totalXp, setTotalXp] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const rewardIdRef = useRef(0);
  const processingRef = useRef(false);

  const currentBalloon = balloons[currentBalloonIndex];

  // Log on mount
  useEffect(() => {
    console.log("[BALLOON-QUICKPOP] v3 - Static 5 balloons, per-word recognition", {
      balloonCount,
      wordsCount: words.length,
    });
  }, []);

  // Initialize speech recognition once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // One result at a time
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 3;
      }
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Check for game over
  useEffect(() => {
    if (gameOver) return;
    if (currentBalloonIndex >= balloons.length) {
      setGameOver(true);
      stopMic();
      setTimeout(() => {
        onComplete(poppedCount, missedCount, totalGold, totalXp);
      }, 1500);
    }
  }, [currentBalloonIndex, balloons.length, gameOver, poppedCount, missedCount, totalGold, totalXp, onComplete]);

  const showFloatingReward = useCallback((gold: number, xp: number, balloonId: number) => {
    const id = rewardIdRef.current++;
    const x = 20 + (balloonId % 3) * 30;
    const y = 30 + Math.floor(balloonId / 3) * 15;
    setFloatingRewards(prev => [...prev, { id, gold, xp, x, y }]);
    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(r => r.id !== id));
    }, 1500);
  }, []);

  const handleWordResult = useCallback((correct: boolean) => {
    if (!currentBalloon || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    // Stop recognition immediately
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
    isListeningRef.current = false;

    if (correct) {
      setFeedback('correct');
      setPoppedCount(prev => prev + 1);
      soundEffects.celebrationSound();
      
      // Pop the balloon
      setBalloons(prev => prev.map(b => 
        b.id === currentBalloon.id ? { ...b, popped: true } : b
      ));

      // Award gold and XP
      const goldReward = 5;
      const xpReward = 3;
      setTotalGold(prev => prev + goldReward);
      setTotalXp(prev => prev + xpReward);
      showFloatingReward(goldReward, xpReward, currentBalloon.id);
    } else {
      setFeedback('incorrect');
      setMissedCount(prev => prev + 1);
      soundEffects.incorrectWord();
    }

    onWordResult?.(currentBalloon.word, correct);

    // Move to next balloon after delay
    setTimeout(() => {
      setFeedback(null);
      setCurrentBalloonIndex(prev => prev + 1);
      processingRef.current = false;
      setIsProcessing(false);
      
      // Auto-restart for next word if mic was active
      if (isMicActive && currentBalloonIndex + 1 < balloons.length) {
        setTimeout(() => {
          startListeningForWord();
        }, 200);
      }
    }, 600);
  }, [currentBalloon, onWordResult, showFloatingReward, isMicActive, currentBalloonIndex, balloons.length]);

  // Start listening for a single word
  const startListeningForWord = useCallback(() => {
    if (!recognitionRef.current || gameOver || !currentBalloon || processingRef.current) return;

    isListeningRef.current = true;

    recognitionRef.current.onresult = (event: any) => {
      if (!isListeningRef.current || processingRef.current) return;
      
      // Check all alternatives for a match
      for (let i = 0; i < event.results[0].length; i++) {
        const transcript = event.results[0][i].transcript.toLowerCase().trim();
        const targetWord = currentBalloon.word.toLowerCase().replace(/[^a-z]/g, '');
        const spokenWords = transcript.replace(/[^a-z\s]/g, '').split(/\s+/);
        
        // Check if any spoken word matches the target
        const isCorrect = spokenWords.some(w => 
          w === targetWord || 
          targetWord.includes(w) || 
          w.includes(targetWord)
        );
        
        if (isCorrect) {
          handleWordResult(true);
          return;
        }
      }
      
      // No match found - restart listening
      try {
        setTimeout(() => {
          if (isListeningRef.current && !processingRef.current && !gameOver) {
            recognitionRef.current.start();
          }
        }, 100);
      } catch (e) {}
    };

    recognitionRef.current.onerror = (e: any) => {
      console.log('[BalloonQuickPop] Speech error:', e.error);
      if (e.error === 'no-speech' || e.error === 'aborted') {
        // Restart on no-speech
        setTimeout(() => {
          if (isListeningRef.current && !processingRef.current && !gameOver) {
            try {
              recognitionRef.current.start();
            } catch (err) {}
          }
        }, 100);
      }
    };

    recognitionRef.current.onend = () => {
      // Auto-restart if still listening
      if (isListeningRef.current && !processingRef.current && !gameOver) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }, 100);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log('[BalloonQuickPop] Failed to start recognition:', e);
    }
  }, [gameOver, currentBalloon, handleWordResult]);

  // Mic control functions
  const startMic = useCallback(() => {
    if (gameOver || !currentBalloon) return;
    setIsMicActive(true);
    startListeningForWord();
  }, [gameOver, currentBalloon, startListeningForWord]);

  const stopMic = useCallback(() => {
    isListeningRef.current = false;
    setIsMicActive(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
  }, []);

  const renderBalloon = (balloon: QuickBalloon, index: number) => {
    const isActive = balloon.id === currentBalloon?.id && !balloon.popped;
    const isPopped = balloon.popped;

    return (
      <motion.div
        key={balloon.id}
        className="relative flex-shrink-0"
        initial={{ scale: 0, y: 50 }}
        animate={
          isPopped
            ? { scale: [1, 1.5, 0], opacity: [1, 1, 0], rotate: [0, 20, -20, 0] }
            : { scale: 1, opacity: 1 }
        }
        transition={
          isPopped
            ? { duration: 0.4 }
            : { duration: 0.5 }
        }
      >
        <div
          className={`w-16 h-20 sm:w-20 sm:h-24 rounded-[50%] relative transition-all duration-300 ${
            isActive 
              ? 'ring-4 ring-yellow-400 ring-opacity-80 scale-110 shadow-[0_0_30px_rgba(234,179,8,0.6)]' 
              : 'opacity-60'
          }`}
          style={{
            background: `radial-gradient(ellipse at 30% 25%, ${balloon.color}ee, ${balloon.color}aa, ${balloon.color})`,
            boxShadow: isActive
              ? `0 0 30px ${balloon.color}80, 0 8px 25px rgba(0,0,0,0.3)`
              : `0 8px 20px rgba(0,0,0,0.25)`,
          }}
        >
          {/* Glossy shine */}
          <div className="absolute top-3 left-4 w-6 h-6 bg-white/50 rounded-full blur-sm" />
          <div className="absolute top-5 left-5 w-3 h-3 bg-white/70 rounded-full" />
          
          {/* Enemy face */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl drop-shadow-lg">{balloon.emoji}</span>
          </div>

          {/* String */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-400" 
               style={{ background: 'linear-gradient(to bottom, #9ca3af, #6b7280)' }} />
          
          {/* Knot */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
               style={{ backgroundColor: balloon.color }} />
        </div>

        {/* Pop particles */}
        <AnimatePresence>
          {isPopped && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`pop-${i}`}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{ backgroundColor: balloon.color }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 12) * Math.PI * 2) * 60,
                    y: Math.sin((i / 12) * Math.PI * 2) * 60,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5 }}
                />
              ))}
              {/* Coin burst */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`coin-${i}`}
                  className="absolute top-1/2 left-1/2 text-xl"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 80,
                    y: -30 - Math.random() * 40,
                    scale: [0, 1.2, 1],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                >
                  🪙
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Semi-transparent overlay - keeps battle visible behind */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-indigo-900/80 to-purple-900/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <motion.h2 
            className="text-2xl font-black text-white drop-shadow-lg"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            🎈 POP THE BALLOONS! 🎈
          </motion.h2>
          <p className="text-purple-200 text-sm">Read words to pop {enemyName}'s balloons!</p>
        </div>

        {/* Rewards display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-300 font-bold">{totalGold}</span>
          </div>
          <div className="flex items-center gap-1 bg-purple-500/20 px-3 py-1 rounded-full">
            <Star className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 font-bold">{totalXp} XP</span>
          </div>
        </div>

        {/* Static 5 Balloons in a Row */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-4 sm:gap-6 justify-center items-end px-4">
            {balloons.map((balloon, i) => renderBalloon(balloon, i))}
          </div>
        </div>

        {/* Floating rewards */}
        <AnimatePresence>
          {floatingRewards.map(reward => (
            <motion.div
              key={reward.id}
              className="absolute pointer-events-none flex flex-col items-center"
              style={{ left: `${reward.x}%`, top: `${reward.y}%` }}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -50, scale: 1 }}
              exit={{ opacity: 0, y: -80 }}
              transition={{ duration: 1 }}
            >
              <div className="flex items-center gap-1 bg-yellow-500/90 px-2 py-1 rounded-full text-sm font-bold text-yellow-900">
                <Coins className="h-3 w-3" /> +{reward.gold}
              </div>
              <div className="flex items-center gap-1 bg-purple-500/90 px-2 py-1 rounded-full text-sm font-bold text-purple-100 mt-1">
                <Star className="h-3 w-3" /> +{reward.xp} XP
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Word + controls */}
        {!gameOver && currentBalloon && (
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-4 mt-4">
            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`text-center mb-2 text-xl font-black ${
                    feedback === 'correct' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {feedback === 'correct' ? '🎉 POP!' : '✗ Try again!'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current word */}
            <motion.div
              key={currentBalloonIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-4"
            >
              <div className="text-white/60 text-sm mb-1">Read to pop balloon {currentBalloonIndex + 1} of {balloons.length}:</div>
              <div className="text-4xl font-black text-white">{currentBalloon.word}</div>
            </motion.div>

            {/* Mic Controls */}
            <div className="flex justify-center gap-4">
              {!isMicActive ? (
                <Button
                  size="lg"
                  onClick={startMic}
                  disabled={gameOver || isProcessing}
                  className="px-8 py-4 text-lg font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Reading
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={stopMic}
                  variant="destructive"
                  className="px-8 py-4 text-lg font-bold rounded-full"
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              )}
            </div>

            {/* Mic status indicator */}
            {isMicActive && !isProcessing && (
              <motion.div 
                className="text-center mt-3 text-sm font-bold text-green-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎤 Listening... Say "{currentBalloon.word}"
              </motion.div>
            )}
            
            {isProcessing && (
              <div className="text-center mt-3 text-sm font-bold text-yellow-400">
                ⏳ Processing...
              </div>
            )}

            {/* Test buttons for dev */}
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => handleWordResult(true)} className="text-green-400">
                ✓ Correct
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleWordResult(false)} className="text-red-400">
                ✗ Wrong
              </Button>
            </div>
          </div>
        )}

        {/* Game over summary */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 text-center"
          >
            <h3 className="text-2xl font-black text-white mb-4">
              {poppedCount >= balloons.length / 2 ? '🎉 Great Job!' : '💪 Keep Practicing!'}
            </h3>
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-black text-green-400">{poppedCount}</div>
                <div className="text-sm text-green-200">Popped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-red-400">{missedCount}</div>
                <div className="text-sm text-red-200">Missed</div>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-1 bg-yellow-500/30 px-4 py-2 rounded-full">
                <Coins className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-300 font-bold text-lg">+{totalGold}</span>
              </div>
              <div className="flex items-center gap-1 bg-purple-500/30 px-4 py-2 rounded-full">
                <Star className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-bold text-lg">+{totalXp} XP</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
