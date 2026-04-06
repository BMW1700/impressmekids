import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Mic, Volume2, Crosshair } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface TrappedWord {
  id: number;
  word: string;
  freed: boolean;
  x: number;
  y: number;
  webStrands: number; // 1-3 strands to break
  wiggle: number;
}

interface RPGWebTrapProps {
  words: string[];
  onComplete: (wordsFreed: number, damage: number) => void;
  onDamage: (damage: number) => void;
}

const sounds = new SoundEffects();

export const RPGWebTrap = ({
  words,
  onComplete,
  onDamage,
}: RPGWebTrapProps) => {
  const [trappedWords, setTrappedWords] = useState<TrappedWord[]>([]);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'complete'>('intro');
  const [isListening, setIsListening] = useState(false);
  const [freedCount, setFreedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [feedback, setFeedback] = useState<{ word: string; success: boolean } | null>(null);
  const [lastSpoken, setLastSpoken] = useState('');
  
  const isMountedRef = useRef(true);
  const trappedWordsRef = useRef<TrappedWord[]>([]);

  useEffect(() => {
    trappedWordsRef.current = trappedWords;
  }, [trappedWords]);

  // Initialize words
  useEffect(() => {
    const limitedWords = words.slice(0, 12);
    const initialWords: TrappedWord[] = limitedWords.map((word, i) => ({
      id: i,
      word,
      freed: false,
      x: 15 + (i % 4) * 22 + Math.random() * 8,
      y: 20 + Math.floor(i / 4) * 25 + Math.random() * 8,
      webStrands: Math.floor(Math.random() * 3) + 1,
      wiggle: Math.random() * 10,
    }));
    setTrappedWords(initialWords);
    trappedWordsRef.current = initialWords;
    sounds.miniGameStart();
  }, [words]);

  // Intro phase
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => {
        setPhase('playing');
        startListening();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          speechManager.stop('web_trap');
          setPhase('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Check for all freed
  useEffect(() => {
    if (phase === 'playing' && trappedWords.length > 0) {
      const allFreed = trappedWords.every(w => w.freed);
      if (allFreed) {
        speechManager.stop('web_trap');
        setPhase('complete');
      }
    }
  }, [trappedWords, phase]);

  // Handle completion
  useEffect(() => {
    if (phase === 'complete') {
      const damage = freedCount * 12 + streak * 8;
      setTimeout(() => {
        if (isMountedRef.current) {
          onComplete(freedCount, damage);
        }
      }, 2000);
    }
  }, [phase, freedCount, streak, onComplete]);

  // Super lenient matching for web trap
  const checkWordMatch = useCallback((spoken: string, target: string): boolean => {
    const cleanSpoken = spoken.replace(/[^\w\s]/g, '').toLowerCase().trim();
    const cleanTarget = target.replace(/[^\w\s]/g, '').toLowerCase().trim();
    
    if (cleanSpoken === cleanTarget) return true;
    if (cleanSpoken.includes(cleanTarget)) return true;
    if (cleanTarget.includes(cleanSpoken) && cleanSpoken.length >= 2) return true;
    
    // Phonetic/fuzzy match - first 2+ chars match
    if (cleanSpoken.length >= 2 && cleanTarget.length >= 2) {
      if (cleanSpoken.slice(0, 2) === cleanTarget.slice(0, 2)) return true;
      if (cleanSpoken.slice(0, 3) === cleanTarget.slice(0, 3)) return true;
    }
    
    return false;
  }, []);

  // Start continuous recognition
  const startListening = useCallback(() => {
    speechManager.start({
      owner: 'web_trap',
      continuous: true,
      interimResults: true,
      onStart: () => {
        if (isMountedRef.current) {
          setIsListening(true);
        }
      },
      onEnd: () => {
        if (isMountedRef.current) {
          setIsListening(false);
          // Restart if still playing
          if (phase === 'playing') {
            setTimeout(() => {
              if (isMountedRef.current && phase === 'playing') {
                startListening();
              }
            }, 100);
          }
        }
      },
      onResult: (transcript) => {
        if (!isMountedRef.current || phase !== 'playing') return;
        
        const currentWords = trappedWordsRef.current;
        const spokenWords = transcript.toLowerCase().split(/\s+/);
        setLastSpoken(transcript);
        
        // Check each spoken word against trapped words
        spokenWords.forEach(spokenWord => {
          if (spokenWord.length < 2) return;
          
          currentWords.forEach((trapped, idx) => {
            if (trapped.freed) return;
            
            if (checkWordMatch(spokenWord, trapped.word)) {
              // Free this word!
              sounds.correctWord();
              setFreedCount(prev => prev + 1);
              setStreak(prev => prev + 1);
              setFeedback({ word: trapped.word, success: true });
              onDamage(12); // Damage dealt immediately
              
              setTrappedWords(prev => prev.map((w, i) => 
                i === idx ? { ...w, freed: true } : w
              ));
              
              setTimeout(() => setFeedback(null), 500);
            }
          });
        });
      },
      onError: (error) => {
        console.log('[WebTrap] Recognition error:', error);
        if (isMountedRef.current && phase === 'playing') {
          setTimeout(() => startListening(), 300);
        }
      },
    });
  }, [phase, checkWordMatch, onDamage]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechManager.abort('web_trap');
    };
  }, []);

  const remainingWords = trappedWords.filter(w => !w.freed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Spider web background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-900 to-violet-950">
        {/* Web pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
          <defs>
            <pattern id="webPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#A78BFA" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="#A78BFA" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="22" fill="none" stroke="#A78BFA" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="10" fill="none" stroke="#A78BFA" strokeWidth="0.5"/>
              <line x1="50" y1="0" x2="50" y2="100" stroke="#A78BFA" strokeWidth="0.3"/>
              <line x1="0" y1="50" x2="100" y2="50" stroke="#A78BFA" strokeWidth="0.3"/>
              <line x1="0" y1="0" x2="100" y2="100" stroke="#A78BFA" strokeWidth="0.3"/>
              <line x1="100" y1="0" x2="0" y2="100" stroke="#A78BFA" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#webPattern)"/>
        </svg>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Bug className="h-8 w-8 text-purple-400" />
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            WEB TRAP!
          </h1>
        </div>
        
        <div className="flex gap-4">
          {/* Timer */}
          <div className={`px-4 py-2 rounded-xl border ${
            timeLeft <= 5 ? 'bg-red-900/80 border-red-500 animate-pulse' : 'bg-purple-900/60 border-purple-500/50'
          }`}>
            <span className="text-2xl font-black">{timeLeft}s</span>
          </div>
          
          {/* Freed count */}
          <div className="px-4 py-2 rounded-xl bg-green-900/60 border border-green-500/50">
            <span className="text-2xl font-black text-green-300">{freedCount} freed</span>
          </div>
          
          {/* Streak */}
          {streak > 1 && (
            <motion.div 
              className="px-4 py-2 rounded-xl bg-yellow-900/60 border border-yellow-500/50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <span className="text-2xl font-black text-yellow-300">x{streak}!</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Intro phase */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <div className="bg-purple-900/90 px-12 py-8 rounded-2xl border-2 border-purple-400 text-center">
              <Bug className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-purple-200 mb-2">SPEAK TO FREE THE WORDS!</h2>
              <p className="text-purple-300">Say the trapped words out loud to break them free!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game area */}
      {phase === 'playing' && (
        <div className="absolute inset-0 pt-20 pb-24 px-8">
          {/* Trapped words */}
          <div className="relative w-full h-full">
            {trappedWords.map((trapped) => (
              <motion.div
                key={trapped.id}
                className="absolute"
                style={{
                  left: `${trapped.x}%`,
                  top: `${trapped.y}%`,
                }}
                initial={{ scale: 0 }}
                animate={trapped.freed ? {
                  scale: [1, 1.5, 0],
                  opacity: [1, 1, 0],
                  y: [0, -50],
                } : {
                  rotate: [trapped.wiggle - 3, trapped.wiggle + 3, trapped.wiggle - 3],
                  y: [0, -2, 0],
                }}
                transition={trapped.freed ? { duration: 0.5 } : {
                  duration: 0.5 + Math.random() * 0.3,
                  repeat: trapped.freed ? 0 : Infinity,
                  ease: 'easeInOut',
                }}
              >
                {!trapped.freed && (
                  <>
                    {/* Web strands around word */}
                    <svg 
                      className="absolute -inset-8 pointer-events-none" 
                      viewBox="0 0 100 80"
                    >
                      {/* Diagonal strands */}
                      <line x1="10" y1="10" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.6"/>
                      <line x1="90" y1="10" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.6"/>
                      <line x1="10" y1="70" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.6"/>
                      <line x1="90" y1="70" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.6"/>
                      {trapped.webStrands >= 2 && (
                        <>
                          <line x1="0" y1="40" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.5"/>
                          <line x1="100" y1="40" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.5"/>
                        </>
                      )}
                      {trapped.webStrands >= 3 && (
                        <>
                          <line x1="50" y1="0" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.4"/>
                          <line x1="50" y1="80" x2="50" y2="40" stroke="#DDD6FE" strokeWidth="1" opacity="0.4"/>
                        </>
                      )}
                    </svg>
                    
                    {/* Word bubble */}
                    <div className="relative bg-slate-900/95 px-5 py-3 rounded-xl border-2 border-purple-500/80 shadow-lg shadow-purple-500/20">
                      <span className="text-xl font-bold text-white">{trapped.word}</span>
                    </div>
                  </>
                )}
                
                {/* Freed effect */}
                {trapped.freed && (
                  <motion.div
                    className="text-3xl font-black text-green-400"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    ✓ {trapped.word}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Listening indicator */}
      {phase === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-20">
          <motion.div
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-purple-900/80 border border-purple-500"
            animate={isListening ? { boxShadow: ['0 0 10px #A78BFA', '0 0 30px #A78BFA', '0 0 10px #A78BFA'] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Mic className={`h-6 w-6 ${isListening ? 'text-green-400' : 'text-purple-400'}`} />
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-1 bg-purple-400 rounded-full"
                  animate={isListening ? {
                    height: [8, 24, 8],
                  } : { height: 8 }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.08,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
            <span className="text-purple-200">
              {isListening ? 'Speak to free words!' : 'Starting...'}
            </span>
          </motion.div>
          
          {lastSpoken && (
            <div className="text-sm text-purple-300/70">
              Heard: "{lastSpoken}"
            </div>
          )}
        </div>
      )}

      {/* Feedback popup */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
          >
            <div className="bg-green-500/90 px-8 py-4 rounded-xl text-center">
              <span className="text-3xl font-black text-white">✓ FREED!</span>
              <p className="text-green-100">{feedback.word}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete phase */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-purple-900/95 px-12 py-10 rounded-2xl border-2 border-purple-400 text-center"
            >
              <Bug className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-4xl font-black text-green-300 mb-6">WORDS FREED!</h2>
              <div className="flex gap-10 justify-center">
                <div className="text-center">
                  <p className="text-5xl font-black text-green-400">{freedCount}</p>
                  <p className="text-sm text-purple-300">Words Freed</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-black text-yellow-400">{streak}</p>
                  <p className="text-sm text-purple-300">Best Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-black text-red-400">{freedCount * 12 + streak * 8}</p>
                  <p className="text-sm text-purple-300">Damage!</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
