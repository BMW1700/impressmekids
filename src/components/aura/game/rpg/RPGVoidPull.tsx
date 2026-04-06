import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Circle, Sparkles } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface VoidWord {
  id: string;
  word: string;
  x: number;
  y: number;
  distance: number;
  saved: boolean;
  consumed: boolean;
  angle: number;
}

interface RPGVoidPullProps {
  words: string[];
  onComplete: (wordsSaved: number, wordsConsumed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGVoidPull = ({
  words,
  onComplete,
  onWordHit,
}: RPGVoidPullProps) => {
  const [voidWords, setVoidWords] = useState<VoidWord[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [wordsSaved, setWordsSaved] = useState(0);
  const [wordsConsumed, setWordsConsumed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [voidPulse, setVoidPulse] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const savedRef = useRef(0);
  const consumedRef = useRef(0);

  // Initialize void words - positioned around center
  useEffect(() => {
    const initialWords: VoidWord[] = words.slice(0, 8).map((word, index) => {
      const angle = (index / 8) * Math.PI * 2;
      const distance = 35 + Math.random() * 10;
      return {
        id: `void-${index}`,
        word: word.replace(/[^a-zA-Z']/g, '').toLowerCase(),
        x: 50 + Math.cos(angle) * distance,
        y: 50 + Math.sin(angle) * distance,
        distance,
        saved: false,
        consumed: false,
        angle,
      };
    });
    setVoidWords(initialWords);
  }, [words]);

  // Animation loop - words get pulled toward center
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setVoidWords(prev => {
        let anyConsumed = false;
        const updated = prev.map(w => {
          if (w.saved || w.consumed) return w;
          
          const pullSpeed = 0.05 + (35 - w.distance) * 0.002;
          const newDistance = Math.max(0, w.distance - pullSpeed);
          
          const newX = 50 + Math.cos(w.angle) * newDistance;
          const newY = 50 + Math.sin(w.angle) * newDistance;
          
          // Word consumed by void
          if (newDistance <= 5) {
            if (!anyConsumed) {
              anyConsumed = true;
              onWordHit(20);
              soundEffects.incorrectWord();
              consumedRef.current += 1;
              setWordsConsumed(consumedRef.current);
              setVoidPulse(true);
              setTimeout(() => setVoidPulse(false), 200);
            }
            return { ...w, consumed: true, distance: 0 };
          }
          
          const newAngle = w.angle + 0.01;
          
          return { ...w, x: newX, y: newY, distance: newDistance, angle: newAngle };
        });
        
        // Check completion
        const allDone = updated.every(w => w.saved || w.consumed);
        if (allDone && isActive) {
          setIsActive(false);
          setTimeout(() => {
            onComplete(savedRef.current, consumedRef.current);
          }, 500);
        }
        
        return updated;
      });
      
      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, onComplete, onWordHit]);

  // Handle word save via speech
  const handleWordSave = useCallback((wordId: string) => {
    setVoidWords(prev => prev.map(w => 
      w.id === wordId ? { ...w, saved: true } : w
    ));
    savedRef.current += 1;
    setWordsSaved(savedRef.current);
    soundEffects.correctWord();
  }, []);

  // Continuous speech recognition - like GoblinHorde
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          const spokenWords = transcript.split(/\s+/);

          // Check against all active void words - super lenient matching
          setVoidWords(prev => {
            const activeWords = prev.filter(w => !w.saved && !w.consumed);
            
            for (const voidWord of activeWords) {
              const targetWord = voidWord.word.toLowerCase();
              
              for (const spoken of spokenWords) {
                const cleanSpoken = spoken.replace(/[^a-z]/g, '');
                
                if (cleanSpoken.length >= 2) {
                  const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 2)) || 
                                          cleanSpoken.startsWith(targetWord.slice(0, 2));
                  const containsMatch = targetWord.includes(cleanSpoken) || 
                                        cleanSpoken.includes(targetWord);
                  const exactMatch = cleanSpoken === targetWord;
                  
                  if (exactMatch || startsWithMatch || containsMatch) {
                    handleWordSave(voidWord.id);
                    return prev;
                  }
                }
              }
            }
            return prev;
          });
        }
      };

      recognition.onerror = () => {
        if (isListeningRef.current && isActive) {
          setTimeout(() => startListening(), 200);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && isActive) {
          setTimeout(() => startListening(), 100);
        }
      };

      recognition.start();
    } catch {}
  }, [isActive, handleWordSave]);

  const startMic = useCallback(() => {
    setIsMicActive(true);
    isListeningRef.current = true;
    startListening();
  }, [startListening]);

  const stopMic = useCallback(() => {
    setIsMicActive(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
  }, []);

  // Auto-start mic on mount
  useEffect(() => {
    const timer = setTimeout(() => startMic(), 500);
    return () => {
      clearTimeout(timer);
      stopMic();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Void space overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 ${isAgentMode() ? 'bg-gradient-radial from-slate-950/90 via-cyan-950/95 to-black' : 'bg-gradient-radial from-purple-950/90 via-slate-950/95 to-black'}`}
      />
      
      {/* Distant stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1 + Math.random() * 2,
              delay: Math.random(),
            }}
          />
        ))}
      </div>
      
      {/* Central void */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative"
          animate={{ 
            scale: voidPulse ? [1, 1.3, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Void core */}
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-900 via-black to-purple-950"
            style={{
              boxShadow: '0 0 60px rgba(88, 28, 135, 0.8), inset 0 0 30px rgba(0,0,0,0.8)',
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          />
          
          {/* Accretion disk */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500/30"
              style={{
                width: 150 + i * 30,
                height: 150 + i * 30,
              }}
              animate={{ 
                rotate: -360,
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 10 + i * 5, ease: 'linear' },
                opacity: { repeat: Infinity, duration: 2, delay: i * 0.5 },
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-purple-400/50">
          <div className="flex items-center gap-3 text-white">
            <Circle className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">VOID PULL! Speak to save words!</span>
            <Circle className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Void Words */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {voidWords.map((voidWord) => (
            !voidWord.saved && !voidWord.consumed && (
              <motion.div
                key={voidWord.id}
                className="absolute z-20"
                style={{
                  left: `${voidWord.x}%`,
                  top: `${voidWord.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {/* Word container */}
                <motion.div
                  className={`relative px-5 py-3 rounded-lg flex items-center justify-center
                    ${voidWord.distance < 15
                      ? 'bg-gradient-to-br from-red-600 to-red-800'
                      : 'bg-gradient-to-br from-violet-600 to-purple-700'
                    }`}
                  animate={{
                    boxShadow: voidWord.distance < 15
                      ? ['0 0 20px rgba(239,68,68,0.8)', '0 0 30px rgba(239,68,68,1)', '0 0 20px rgba(239,68,68,0.8)']
                      : ['0 0 15px rgba(139,92,246,0.5)', '0 0 25px rgba(139,92,246,0.7)', '0 0 15px rgba(139,92,246,0.5)'],
                  }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <span className="font-black text-lg uppercase tracking-wide text-white">
                    {voidWord.word}
                  </span>
                </motion.div>
                
                {/* Danger indicator when close */}
                {voidWord.distance < 15 && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-red-400"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                  />
                )}
              </motion.div>
            )
          ))}
        </AnimatePresence>
        
        {/* Saved words - float away */}
        <AnimatePresence>
          {voidWords.filter(w => w.saved).map((word) => (
            <motion.div
              key={`saved-${word.id}`}
              className="absolute pointer-events-none"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
              }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0, opacity: 0, y: -100 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="px-5 py-3 rounded-lg bg-emerald-500 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="font-bold text-white">{word.word}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          className={`p-6 rounded-full cursor-pointer ${
            isMicActive 
              ? 'bg-purple-600 shadow-[0_0_30px_rgba(147,51,234,0.6)]' 
              : 'bg-slate-700'
          }`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          onClick={() => isMicActive ? stopMic() : startMic()}
        >
          <Mic className={`h-10 w-10 ${isMicActive ? 'text-white' : 'text-slate-400'}`} />
        </motion.div>
        {isMicActive && (
          <motion.p 
            className="text-center text-purple-300 mt-2 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎤 Listening...
          </motion.p>
        )}
      </div>

      {/* Score */}
      <div className="absolute top-28 right-6 pointer-events-auto">
        <div className="bg-slate-900/90 rounded-lg p-4 border border-purple-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="font-bold text-lg">{wordsSaved}</span>
            <span className="text-sm text-slate-400">saved</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Consumed: {wordsConsumed}
          </div>
        </div>
      </div>
    </div>
  );
};
