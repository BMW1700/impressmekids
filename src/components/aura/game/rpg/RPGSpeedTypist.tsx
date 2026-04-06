import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Timer, Flame, Target, Satellite } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface SpeedWord {
  id: number;
  word: string;
  spoken: boolean;
  missed: boolean;
  position: number;
}

interface RPGSpeedTypistProps {
  words: string[];
  onComplete: (wordsSpoken: number, damage: number) => void;
  onDamage: (damage: number) => void;
}

const sounds = new SoundEffects();

export const RPGSpeedTypist = ({
  words,
  onComplete,
  onDamage,
}: RPGSpeedTypistProps) => {
  const [speedWords, setSpeedWords] = useState<SpeedWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [phase, setPhase] = useState<'countdown' | 'playing' | 'complete'>('countdown');
  const [isListening, setIsListening] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; word: string } | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  
  const isMountedRef = useRef(true);
  const currentIndexRef = useRef(0);
  const speedWordsRef = useRef<SpeedWord[]>([]);
  const phaseRef = useRef<'countdown' | 'playing' | 'complete'>('countdown');

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    speedWordsRef.current = speedWords;
  }, [speedWords]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Initialize words
  useEffect(() => {
    const limitedWords = words.slice(0, 15);
    const initialWords: SpeedWord[] = limitedWords.map((word, i) => ({
      id: i,
      word,
      spoken: false,
      missed: false,
      position: 10 + (i * 6) % 80,
    }));
    setSpeedWords(initialWords);
    speedWordsRef.current = initialWords;
    
    sounds.miniGameStart();
  }, [words]);

  // Countdown then start
  useEffect(() => {
    if (phase !== 'countdown') return;
    
    const interval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          setPhase('playing');
          startListening();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Main game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          speechManager.stop('speed_typist');
          setPhase('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Handle completion
  useEffect(() => {
    if (phase === 'complete') {
      const damage = score * 10 + streak * 5;
      setTimeout(() => {
        if (isMountedRef.current) {
          onComplete(score, damage);
        }
      }, 1500);
    }
  }, [phase, score, streak, onComplete]);

  // Super lenient matching for speed reading
  const checkWordMatch = useCallback((spoken: string, target: string): boolean => {
    const cleanSpoken = spoken.replace(/[^\w\s]/g, '').toLowerCase().trim();
    const cleanTarget = target.replace(/[^\w\s]/g, '').toLowerCase().trim();
    
    // Exact match
    if (cleanSpoken === cleanTarget) return true;
    // Contains match
    if (cleanSpoken.includes(cleanTarget)) return true;
    if (cleanTarget.includes(cleanSpoken) && cleanSpoken.length >= 2) return true;
    // First 2-3 chars match (phonetic similarity)
    if (cleanSpoken.length >= 2 && cleanTarget.length >= 2) {
      if (cleanSpoken.slice(0, 2) === cleanTarget.slice(0, 2)) return true;
      if (cleanSpoken.length >= 3 && cleanTarget.length >= 3 && 
          cleanSpoken.slice(0, 3) === cleanTarget.slice(0, 3)) return true;
    }
    return false;
  }, []);

  // Start recognition using manager - with interim results for speed
  const startListening = useCallback(() => {
    speechManager.start({
      owner: 'speed_typist',
      continuous: true,
      interimResults: true, // Enable interim for faster feedback
      onStart: () => {
        if (isMountedRef.current) {
          setIsListening(true);
        }
      },
      onEnd: () => {
        if (isMountedRef.current) {
          setIsListening(false);
          // Restart if still playing
          if (phaseRef.current === 'playing') {
            setTimeout(() => {
              if (isMountedRef.current && phaseRef.current === 'playing') {
                startListening();
              }
            }, 100);
          }
        }
      },
      onResult: (transcript) => {
        if (!isMountedRef.current || phaseRef.current !== 'playing') return;
        
        const currentIdx = currentIndexRef.current;
        const words = speedWordsRef.current;
        
        if (currentIdx >= words.length) return;
        
        const currentWord = words[currentIdx];
        
        // Check each word in transcript against current target
        const spokenWords = transcript.toLowerCase().split(/\s+/);
        const targetClean = currentWord.word.replace(/[^\w\s]/g, '').toLowerCase();
        
        let matched = false;
        for (const spoken of spokenWords) {
          if (checkWordMatch(spoken, targetClean)) {
            matched = true;
            break;
          }
        }
        
        if (matched) {
          sounds.correctWord();
          setFeedback({ type: 'correct', word: currentWord.word });
          setScore(prev => prev + 1);
          setStreak(prev => prev + 1);
          setSpeedWords(prev => prev.map((w, i) => 
            i === currentIdx ? { ...w, spoken: true } : w
          ));
          setCurrentIndex(prev => prev + 1);
          onDamage(10); // Deal damage on each word
          setTimeout(() => setFeedback(null), 300);
        }
      },
      onError: (error) => {
        console.log('[SpeedTypist] Recognition error:', error);
        if (isMountedRef.current && phaseRef.current === 'playing') {
          setTimeout(() => startListening(), 200);
        }
      },
    });
  }, [onDamage, checkWordMatch]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechManager.abort('speed_typist');
    };
  }, []);

  const currentWord = speedWords[currentIndex];
  const progressPercent = (score / speedWords.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-orange-900/95 via-red-900/95 to-yellow-900/95 flex flex-col"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-8 bg-yellow-400/20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 500),
              y: -50,
            }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <Zap className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            SPEED READING BLITZ!
          </h1>
        </motion.div>
        
        <div className="flex gap-4">
          {/* Timer */}
          <motion.div 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              timeLeft <= 3 ? 'bg-red-900/80 border-red-500' : 'bg-orange-900/60 border-orange-500/50'
            }`}
            animate={timeLeft <= 3 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <Timer className="h-5 w-5" />
            <span className="text-2xl font-black">{timeLeft}s</span>
          </motion.div>
          
          {/* Score */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-900/60 border border-yellow-500/50">
            <Target className="h-5 w-5 text-yellow-400" />
            <span className="text-2xl font-black text-yellow-300">{score}</span>
          </div>
          
          {/* Streak */}
          {streak > 0 && (
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/60 border border-red-500/50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-2xl font-black text-orange-300">x{streak}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Countdown */}
        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                key={countdownValue}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="text-9xl font-black text-yellow-400"
              >
                {countdownValue > 0 ? countdownValue : 'GO!'}
              </motion.div>
              <p className="text-orange-200 text-xl mt-4">Get ready to speak fast!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playing phase */}
        {phase === 'playing' && (
          <div className="w-full max-w-2xl mx-auto text-center space-y-8 px-4">
            {/* Current word to speak */}
            {currentWord && (
              <motion.div
                key={currentWord.id}
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative"
              >
                <motion.div
                  className="bg-slate-900/90 px-16 py-10 rounded-2xl border-4 border-yellow-500 shadow-2xl shadow-yellow-500/30"
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(234, 179, 8, 0.3)',
                      '0 0 60px rgba(234, 179, 8, 0.5)',
                      '0 0 30px rgba(234, 179, 8, 0.3)',
                    ],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <p className="text-slate-400 text-sm mb-2">SAY IT NOW!</p>
                  <p className="text-6xl font-black text-white tracking-wide">
                    {currentWord.word}
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Feedback overlay */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 rounded-xl ${
                    feedback.type === 'correct' 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-red-500/90 text-white'
                  }`}
                >
                  <span className="text-3xl font-black">
                    {feedback.type === 'correct' ? '✓ CORRECT!' : '✗ MISS!'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Listening indicator */}
            {isListening && (
              <motion.div
                className="flex items-center justify-center gap-3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 bg-green-400 rounded-full"
                      animate={{
                        height: [10, 25, 10],
                      }}
                      transition={{
                        duration: 0.5,
                        delay: i * 0.1,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </div>
                <span className="text-green-300 font-medium">Listening...</span>
              </motion.div>
            )}

            {/* Upcoming words preview */}
            <div className="flex justify-center gap-3 flex-wrap">
              {speedWords.slice(currentIndex + 1, currentIndex + 4).map((word, i) => (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.5 - i * 0.15, scale: 0.9 - i * 0.1 }}
                  className="bg-slate-800/50 px-4 py-2 rounded-lg text-slate-400"
                >
                  {word.word}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Complete phase */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center bg-orange-900/90 p-10 rounded-2xl border-2 border-orange-500"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Zap className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-4xl font-black text-yellow-300 mb-6">BLITZ COMPLETE!</h2>
              <div className="flex gap-8 justify-center">
                <div className="text-center">
                  <p className="text-5xl font-black text-green-400">{score}</p>
                  <p className="text-sm text-slate-400">Words Read</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-black text-orange-400">{streak}</p>
                  <p className="text-sm text-slate-400">Best Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-black text-red-400">{score * 10 + streak * 5}</p>
                  <p className="text-sm text-slate-400">Damage!</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};