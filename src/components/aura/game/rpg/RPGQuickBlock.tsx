import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Swords, Zap, Lock } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

const agentMode = isAgentMode();
const theme = getMinigameTheme('quickBlock');
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";

interface QuickBlockWord {
  id: number;
  word: string;
  spoken: boolean;
}

interface RPGQuickBlockProps {
  words: string[];
  onComplete: (blocked: number, total: number, counterDamage: number) => void;
}

const sounds = new SoundEffects();

export const RPGQuickBlock = ({ words, onComplete }: RPGQuickBlockProps) => {
  const [blockWords, setBlockWords] = useState<QuickBlockWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4); // 4 seconds to block
  const [isListening, setIsListening] = useState(false);
  const [phase, setPhase] = useState<'warning' | 'blocking' | 'result'>('warning');
  const [blockedCount, setBlockedCount] = useState(0);
  
  // Refs for speech recognition callbacks
  const isMountedRef = useRef(true);
  const currentWordIndexRef = useRef(0);
  const blockWordsRef = useRef<QuickBlockWord[]>([]);
  const phaseRef = useRef<'warning' | 'blocking' | 'result'>('warning');

  // Keep refs in sync
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    blockWordsRef.current = blockWords;
  }, [blockWords]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Initialize with warning phase
  useEffect(() => {
    const initialWords = words.slice(0, 3).map((word, i) => ({ 
      id: i, 
      word, 
      spoken: false 
    }));
    setBlockWords(initialWords);
    blockWordsRef.current = initialWords;
    
    // Play warning sound (use incorrect word sound as attack warning)
    sounds.incorrectWord();
    
    // Show warning for 1.5 seconds, then start blocking
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setPhase('blocking');
        startListening();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [words]);

  // Countdown timer during blocking phase
  useEffect(() => {
    if (phase !== 'blocking') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          speechManager.stop('quickblock');
          setPhase('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Handle result phase
  useEffect(() => {
    if (phase !== 'result') return;
    
    const blocked = blockedCount;
    const total = blockWords.length;
    
    // Perfect block (3/3) = counter attack damage
    // Partial block (2/3) = 50% damage reduction
    // Weak block (1/3) = 25% damage reduction
    // Failed (0/3) = full damage
    const counterDamage = blocked === total ? 20 : 0;
    
    // Play appropriate sound
    if (blocked === total) {
      sounds.shieldBlock();
      sounds.comboSuccess();
    } else if (blocked >= 2) {
      sounds.shieldBlock();
    } else {
      sounds.incorrectWord();
    }
    
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        onComplete(blocked, total, counterDamage);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [phase, blockedCount, blockWords.length, onComplete]);

  // Start speech recognition
  const startListening = useCallback(() => {
    speechManager.start({
      owner: 'quickblock',
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
        }
      },
      onResult: (transcript) => {
        if (!isMountedRef.current || phaseRef.current !== 'blocking') return;
        
        const spoken = transcript.toLowerCase().trim();
        const spokenWords = spoken.split(' ');
        
        spokenWords.forEach(spokenWord => {
          const cleanSpoken = spokenWord.replace(/[^a-z]/g, '');
          if (cleanSpoken.length < 2) return;
          
          const currentIdx = currentWordIndexRef.current;
          const words = blockWordsRef.current;
          
          if (currentIdx < words.length) {
            const targetWord = words[currentIdx]?.word.toLowerCase().replace(/[^a-z]/g, '');
            
            // Lenient matching for quick blocking
            if (cleanSpoken === targetWord || 
                cleanSpoken.includes(targetWord) || 
                targetWord.includes(cleanSpoken) ||
                (cleanSpoken.length >= 3 && targetWord.startsWith(cleanSpoken.slice(0, 3)))) {
              // Word matched!
              sounds.correctWord();
              setBlockWords(prev => prev.map((w, idx) => 
                idx === currentIdx ? { ...w, spoken: true } : w
              ));
              setBlockedCount(prev => prev + 1);
              setCurrentWordIndex(prev => prev + 1);
            }
          }
        });
      },
      onError: (error) => {
        console.log('[QuickBlock] Recognition error:', error);
      },
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      speechManager.abort('quickblock');
    };
  }, []);

  const getResultMessage = () => {
    const blocked = blockedCount;
    const total = blockWords.length;
    
    if (blocked === total) {
      return { text: '⚔️ PERFECT BLOCK! ⚔️', subtext: 'Counter-attack dealt!', color: 'text-emerald-400' };
    } else if (blocked >= 2) {
      return { text: '🛡️ Good Block!', subtext: '50% damage reduced', color: 'text-cyan-400' };
    } else if (blocked === 1) {
      return { text: '🛡️ Weak Block', subtext: '25% damage reduced', color: 'text-yellow-400' };
    }
    return { text: '💥 Block Failed!', subtext: 'Full damage taken!', color: 'text-red-400' };
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Warning phase */}
      <AnimatePresence>
        {phase === 'warning' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Pulsing danger indicator */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            >
              <Swords className="w-32 h-32 text-red-500" />
            </motion.div>
            
            <motion.div
              className="mt-6 px-8 py-4 bg-red-600/90 rounded-xl border-4 border-red-400"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 0.3 }}
            >
              <span className="text-white font-black text-xl md:text-3xl">{agentMode ? '⚠️ INCOMING HACK! ⚠️' : '⚠️ INCOMING ATTACK! ⚠️'}</span>
            </motion.div>
            
            <motion.p
              className={`mt-4 text-xl ${theme.textColor} font-bold`}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {agentMode ? 'Speak the codes to COUNTER!' : 'Speak the words to BLOCK!'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocking phase */}
      {phase === 'blocking' && (
        <>
          {/* Header with timer */}
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-6">
              <div className={`px-6 py-3 bg-gradient-to-r ${theme.accentGradient} rounded-xl border-2 ${theme.accentColor}`}>
                <span className="text-white font-black text-xl flex items-center gap-2">
                  {agentMode ? <Lock className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  {theme.title}
                </span>
              </div>
              
              <motion.div
                className={`text-6xl font-black ${timeLeft <= 2 ? 'text-red-400' : 'text-white'}`}
                animate={timeLeft <= 2 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.3 }}
              >
                {timeLeft}
              </motion.div>
            </div>
          </motion.div>

          {/* Shield visualization */}
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="relative"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {/* Shield glow based on progress */}
              <motion.div
                className={`absolute inset-0 blur-2xl rounded-full ${
                  blockedCount === 3 ? 'bg-emerald-400/50' :
                  blockedCount === 2 ? 'bg-cyan-400/50' :
                  blockedCount === 1 ? 'bg-yellow-400/50' : 'bg-red-400/30'
                }`}
                style={{ transform: 'scale(2)' }}
              />
              <Shield className={`w-28 h-28 ${
                blockedCount === 3 ? 'text-emerald-400' :
                blockedCount === 2 ? 'text-cyan-400' :
                blockedCount === 1 ? 'text-yellow-400' : 'text-white/50'
              }`} />
            </motion.div>
          </div>

          {/* Words to speak - horizontal row */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="flex gap-2 md:gap-4">
              {blockWords.map((word, idx) => (
                <motion.div
                  key={word.id}
                  className={`px-4 py-3 md:px-8 md:py-6 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all ${
                    word.spoken 
                      ? 'bg-emerald-600/90 border-emerald-300 scale-95' 
                      : idx === currentWordIndex
                        ? 'bg-orange-600/90 border-yellow-400 scale-105 md:scale-110 shadow-[0_0_20px_rgba(250,204,21,0.7)] md:shadow-[0_0_30px_rgba(250,204,21,0.7)]'
                        : 'bg-slate-700/60 border-slate-500'
                  }`}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <span className={`text-2xl md:text-4xl font-black ${
                    word.spoken ? 'text-emerald-200 line-through' : 
                    idx === currentWordIndex ? 'text-yellow-300' : 'text-white/70'
                  }`}>
                    {word.word}
                  </span>
                  
                  {word.spoken && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Shield className="w-8 h-8 md:w-12 md:h-12 text-emerald-300" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Listening indicator */}
            <motion.div 
              className="mt-6 flex items-center justify-center gap-3"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-8 bg-orange-400 rounded-full"
                    animate={{ scaleY: isListening ? [0.3, 1, 0.3] : 0.3 }}
                    transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.08 }}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-orange-300">
                {isListening ? 'SPEAK NOW!' : 'Starting...'}
              </span>
            </motion.div>
          </div>

          {/* Incoming attack from right */}
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2"
            animate={{ x: [100, -50, 100] }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Zap className="w-20 h-20 text-yellow-400" />
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Result phase */}
      <AnimatePresence>
        {phase === 'result' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Flash effect */}
            <motion.div
              className={`absolute inset-0 ${blockedCount === blockWords.length ? 'bg-cyan-400' : 'bg-red-500'}`}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
            
            <motion.div
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
            >
              {(() => {
                const result = getResultMessage();
                return (
                  <>
                    <div className={`text-5xl font-black ${result.color}`}>
                      {result.text}
                    </div>
                    <div className="text-2xl text-white mt-4">
                      {result.subtext}
                    </div>
                    <div className="text-xl text-white/70 mt-2">
                      {blockedCount}/{blockWords.length} words blocked
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
