import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Mic, Terminal } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface ComboWord {
  id: number;
  word: string;
  spoken: boolean;
  current: boolean;
}

interface RPGSpellComboProps {
  words: string[];
  onComplete: (success: boolean, comboMultiplier: number) => void;
}

const sounds = new SoundEffects();

export const RPGSpellCombo = ({
  words,
  onComplete,
}: RPGSpellComboProps) => {
  const [comboWords, setComboWords] = useState<ComboWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'casting' | 'success' | 'failed'>('ready');
  const [isListening, setIsListening] = useState(false);
  const [comboProgress, setComboProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  
  // Refs to avoid stale closures
  const isMountedRef = useRef(true);
  const currentIndexRef = useRef(0);
  const comboWordsRef = useRef<ComboWord[]>([]);
  const phaseRef = useRef<'ready' | 'casting' | 'success' | 'failed'>('ready');

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    comboWordsRef.current = comboWords;
  }, [comboWords]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Initialize combo words
  useEffect(() => {
    const limitedWords = words.slice(0, 5);
    const initialWords = limitedWords.map((word, i) => ({
      id: i,
      word,
      spoken: false,
      current: i === 0,
    }));
    setComboWords(initialWords);
    comboWordsRef.current = initialWords;
    
    // Play start sound
    sounds.miniGameStart();
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setPhase('casting');
        setTimeout(() => {
          if (isMountedRef.current) {
            startListening();
          }
        }, 300);
      }
    }, 1500);
  }, [words]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'casting') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          speechManager.stop('spell_combo');
          setPhase('failed');
          setTimeout(() => {
            if (isMountedRef.current) {
              onComplete(false, 1);
            }
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, onComplete]);

  // Check for completion
  useEffect(() => {
    if (phase !== 'casting') return;
    
    const allSpoken = comboWords.every(w => w.spoken);
    if (allSpoken && comboWords.length > 0) {
      speechManager.stop('spell_combo');
      setPhase('success');
      sounds.comboSuccess();
      const multiplier = Math.min(5, comboWords.length);
      setTimeout(() => {
        if (isMountedRef.current) {
          onComplete(true, multiplier);
        }
      }, 2500);
    }
  }, [comboWords, phase, onComplete]);

  // Start recognition using manager
  const startListening = useCallback(() => {
    speechManager.start({
      owner: 'spell_combo',
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
      onResult: (transcript, alternatives, isFinal) => {
        if (!isMountedRef.current || phaseRef.current !== 'casting') return;
        
        const spoken = transcript.toLowerCase().trim();
        const spokenWords = spoken.split(' ');
        
        spokenWords.forEach(spokenWord => {
          const cleanSpoken = spokenWord.replace(/[^a-z]/g, '');
          if (cleanSpoken.length < 2) return;
          
          const currentIdx = currentIndexRef.current;
          const words = comboWordsRef.current;
          
          if (currentIdx < words.length) {
            const targetWord = words[currentIdx]?.word.toLowerCase().replace(/[^a-z]/g, '');
            
            if (cleanSpoken === targetWord || 
                cleanSpoken.includes(targetWord) || 
                targetWord.includes(cleanSpoken) ||
                (cleanSpoken.length >= 3 && targetWord.startsWith(cleanSpoken.slice(0, 3)))) {
              sounds.magicSparkle();
              setComboWords(prev => prev.map((w, idx) => ({
                ...w,
                spoken: idx <= currentIdx ? true : w.spoken,
                current: idx === currentIdx + 1,
              })));
              setComboProgress(prev => prev + (100 / words.length));
              setCurrentIndex(prev => prev + 1);
            }
          }
        });
      },
      onError: (error) => {
        console.log('[SpellCombo] Recognition error:', error);
      },
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechManager.abort('spell_combo');
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {/* Magical background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-purple-950/90 via-indigo-900/85 to-violet-900/90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Magic particles */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, fontSize: `${12 + Math.random() * 16}px` }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 1, 0.2],
            scale: [0.5, 1.2, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          ✦
        </motion.div>
      ))}

      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]">
          <span className="text-white font-black text-xl flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            SPELL COMBO
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </span>
        </div>
      </motion.div>

      {/* Timer */}
      {phase === 'casting' && (
        <motion.div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50"
          animate={timeLeft <= 5 ? { scale: [1, 1.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.3 }}
        >
          <div className={`text-7xl font-black ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
            {timeLeft}s
          </div>
        </motion.div>
      )}

      {/* Combo chain visualization */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-3">
          {comboWords.map((word, idx) => (
            <div key={word.id} className="flex items-center">
              {/* Word orb */}
              <motion.div
                className={`relative w-24 h-24 rounded-full flex items-center justify-center
                  ${word.spoken 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-600' 
                    : word.current
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-600'
                      : 'bg-gradient-to-br from-slate-600 to-slate-800'}
                  border-3 ${word.current ? 'border-yellow-300' : word.spoken ? 'border-emerald-300' : 'border-slate-500'}
                  shadow-lg`}
                animate={word.current ? { 
                  scale: [1, 1.15, 1],
                  boxShadow: ['0 0 20px rgba(250,204,21,0.5)', '0 0 40px rgba(250,204,21,0.8)', '0 0 20px rgba(250,204,21,0.5)']
                } : {}}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >
                <span className="text-white font-bold text-base text-center px-2">
                  {word.word}
                </span>
                
                {/* Sparkle burst on success */}
                {word.spoken && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 2, 0], opacity: [1, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="absolute inset-0 bg-emerald-400/50 rounded-full" />
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `rotate(${i * 45}deg) translateX(30px)`
                        }}
                        initial={{ scale: 1 }}
                        animate={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>

              {/* Chain link */}
              {idx < comboWords.length - 1 && (
                <motion.div
                  className={`w-10 h-2 rounded-full ${
                    word.spoken ? 'bg-gradient-to-r from-emerald-400 to-yellow-400' : 'bg-slate-600'
                  }`}
                  animate={word.spoken ? { 
                    boxShadow: ['0 0 10px #fbbf24', '0 0 25px #fbbf24', '0 0 10px #fbbf24']
                  } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Combo progress bar */}
        <div className="mt-10 w-full max-w-lg mx-auto">
          <div className="h-5 bg-slate-800 rounded-full overflow-hidden border-2 border-purple-500">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400"
              style={{ width: `${comboProgress}%` }}
              transition={{ type: 'spring' }}
            />
          </div>
          <p className="text-center text-purple-300 mt-3 font-bold text-lg">
            Combo: {comboWords.filter(w => w.spoken).length} / {comboWords.length}
          </p>
        </div>
      </div>

      {/* Current word prompt */}
      {phase === 'casting' && currentIndex < comboWords.length && (
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50"
          key={currentIndex}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.div 
            className="px-12 py-6 bg-gradient-to-br from-purple-900 via-violet-900 to-purple-900 rounded-2xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)]"
            animate={{ 
              boxShadow: [
                '0 0 50px rgba(250,204,21,0.6)',
                '0 0 80px rgba(250,204,21,0.9)',
                '0 0 50px rgba(250,204,21,0.6)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            <p className="text-yellow-300 text-sm mb-2 text-center">✨ Cast the spell:</p>
            <p className="text-6xl font-black text-white text-center">{comboWords[currentIndex]?.word}</p>
            
            {/* Listening indicator */}
            <motion.div 
              className="mt-4 flex items-center justify-center gap-3"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Mic className={`w-5 h-5 ${isListening ? 'text-emerald-400' : 'text-red-400'}`} />
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-6 bg-yellow-400 rounded-full"
                    animate={{ scaleY: isListening ? [0.3, 1, 0.3] : 0.3 }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <span className={`text-sm font-bold ${isListening ? 'text-emerald-400' : 'text-red-400'}`}>
                {isListening ? 'Casting...' : 'Starting...'}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Success/Failure state */}
      <AnimatePresence>
        {(phase === 'success' || phase === 'failed') && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.4, 1], rotate: 0 }}
            >
              {phase === 'success' ? (
                <>
                  <motion.div 
                    className="text-8xl mb-6"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    ✨⚡✨
                  </motion.div>
                  <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
                    COMBO COMPLETE!
                  </div>
                  <div className="text-3xl text-emerald-400 mt-4">
                    {comboWords.length}x DAMAGE MULTIPLIER!
                  </div>
                </>
              ) : (
                <>
                  <div className="text-8xl mb-6">💔</div>
                  <div className="text-5xl font-black text-red-400">
                    COMBO BROKEN
                  </div>
                  <div className="text-xl text-slate-300 mt-4">
                    Normal damage only
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ready phase */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                <Zap className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
              </motion.div>
              <div className="text-4xl font-black text-white">
                Prepare to cast!
              </div>
              <div className="text-xl text-purple-300 mt-4">
                Speak all {words.slice(0, 5).length} words in order!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};