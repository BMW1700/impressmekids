import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Circle, Sparkles } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface VoidWord {
  id: string;
  word: string;
  x: number;
  y: number;
  distance: number; // Distance from center (0 = consumed)
  saved: boolean;
  consumed: boolean;
  selected: boolean;
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
  const [selectedWord, setSelectedWord] = useState<VoidWord | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsSaved, setWordsSaved] = useState(0);
  const [wordsConsumed, setWordsConsumed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [voidPulse, setVoidPulse] = useState(false);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const savedRef = useRef(0);
  const consumedRef = useRef(0);
  const selectedWordRef = useRef<VoidWord | null>(null);
  const isListeningRef = useRef(false);

  // Initialize void words - positioned around center
  useEffect(() => {
    const initialWords: VoidWord[] = words.slice(0, 8).map((word, index) => {
      const angle = (index / 8) * Math.PI * 2;
      const distance = 35 + Math.random() * 10; // Start at edge
      return {
        id: `void-${index}`,
        word: word.replace(/[^a-zA-Z']/g, ''),
        x: 50 + Math.cos(angle) * distance,
        y: 50 + Math.sin(angle) * distance,
        distance,
        saved: false,
        consumed: false,
        selected: false,
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
          
          // Pull toward center
          const pullSpeed = 0.05 + (35 - w.distance) * 0.002; // Faster as it gets closer
          const newDistance = Math.max(0, w.distance - pullSpeed);
          
          // Update position based on angle and new distance
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
          
          // Spiral motion
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

  const resetListeningState = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    isListeningRef.current = false;
    setSelectedWord(null);
    selectedWordRef.current = null;
    setSpokenText("");
    setVoidWords(prev => prev.map(w => ({ ...w, selected: false })));
  }, []);

  const handleSelectWord = useCallback((voidWord: VoidWord) => {
    if (voidWord.saved || voidWord.consumed) return;
    
    if (isListeningRef.current) {
      resetListeningState();
    }
    
    setVoidWords(prev => prev.map(w => ({ ...w, selected: w.id === voidWord.id })));
    setSelectedWord(voidWord);
    selectedWordRef.current = voidWord;
    startListening(voidWord);
  }, [resetListeningState]);

  const startListening = useCallback((voidWord: VoidWord) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      resetListeningState();
      return;
    }

    const lockedWord = voidWord;
    selectedWordRef.current = voidWord;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setSpokenText("");
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const transcript = result[0].transcript.trim().toLowerCase();
      setSpokenText(transcript);

      if (result.isFinal) {
        const targetWord = lockedWord.word;
        let matched = false;
        
        for (let i = 0; i < result.length && !matched; i++) {
          const alt = result[i]?.transcript?.trim().toLowerCase() || '';
          const altWords = alt.split(/\s+/);
          for (const spoken of altWords) {
            if (isWordMatchLenient(spoken, targetWord)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          soundEffects.correctWord();
          savedRef.current += 1;
          setWordsSaved(savedRef.current);
          setVoidWords(prev => 
            prev.map(w => w.id === lockedWord.id ? { ...w, saved: true, selected: false } : w)
          );
        } else {
          soundEffects.incorrectWord();
          onWordHit(18);
          consumedRef.current += 1;
          setWordsConsumed(consumedRef.current);
          setVoidWords(prev => 
            prev.map(w => w.id === lockedWord.id ? { ...w, consumed: true, selected: false } : w)
          );
        }

        resetListeningState();
      }
    };

    recognition.onerror = () => resetListeningState();
    recognition.onend = () => {
      if (isListeningRef.current) resetListeningState();
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { resetListeningState(); }
  }, [onWordHit, resetListeningState]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
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
        className="absolute inset-0 bg-gradient-radial from-purple-950/90 via-slate-950/95 to-black"
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
            animate={{ 
              rotate: 360,
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 20,
              ease: 'linear',
            }}
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
            <span className="font-bold text-lg">VOID PULL! Save words before they're consumed!</span>
            <Circle className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Void Words */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {voidWords.map((voidWord) => (
            !voidWord.saved && !voidWord.consumed && (
              <motion.button
                key={voidWord.id}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${voidWord.x}%`,
                  top: `${voidWord.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handleSelectWord(voidWord)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: voidWord.selected ? 1.2 : 1,
                  opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {/* Word container */}
                <motion.div
                  className={`relative px-5 py-3 rounded-lg flex items-center justify-center
                    ${voidWord.selected 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                      : voidWord.distance < 15
                        ? 'bg-gradient-to-br from-red-600 to-red-800'
                        : 'bg-gradient-to-br from-violet-600 to-purple-700'
                    }`}
                  animate={{
                    boxShadow: voidWord.selected 
                      ? ['0 0 30px rgba(251,191,36,0.8)', '0 0 50px rgba(251,191,36,1)', '0 0 30px rgba(251,191,36,0.8)']
                      : voidWord.distance < 15
                        ? ['0 0 20px rgba(239,68,68,0.8)', '0 0 30px rgba(239,68,68,1)', '0 0 20px rgba(239,68,68,0.8)']
                        : ['0 0 15px rgba(139,92,246,0.5)', '0 0 25px rgba(139,92,246,0.7)', '0 0 15px rgba(139,92,246,0.5)'],
                  }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <span 
                    className={`font-black text-lg uppercase tracking-wide
                      ${voidWord.selected ? 'text-black' : 'text-white'}`}
                  >
                    {voidWord.word}
                  </span>
                </motion.div>
                
                {/* Pull lines toward center */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ transformOrigin: 'center' }}
                >
                  <div 
                    className="absolute w-16 h-0.5 bg-gradient-to-l from-purple-500/50 to-transparent"
                    style={{
                      left: '100%',
                      top: '50%',
                      transform: `rotate(${(Math.atan2(50 - voidWord.y, 50 - voidWord.x) * 180 / Math.PI)}deg)`,
                    }}
                  />
                </motion.div>
                
                {/* Danger indicator when close */}
                {voidWord.distance < 15 && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-red-400"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                  />
                )}
              </motion.button>
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
              animate={{ 
                scale: 0,
                opacity: 0,
                y: -100,
              }}
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

      {/* Selected Word Panel */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-slate-900/95 border-2 border-purple-400 rounded-xl px-10 py-5
              shadow-[0_0_40px_rgba(139,92,246,0.5)]">
              <p className="text-purple-400 text-sm mb-2 text-center font-medium">
                Speak to save from the void:
              </p>
              <p className="text-4xl font-black text-white text-center">{selectedWord.word}</p>
              
              {isListening && (
                <div className="flex items-center justify-center gap-3 mt-4 text-emerald-400">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                    <Mic className="h-6 w-6" />
                  </motion.div>
                  <span className="font-medium">Listening...</span>
                </div>
              )}
              
              {spokenText && (
                <p className="text-center text-slate-400 text-sm mt-2">
                  Heard: "<span className="text-white">{spokenText}</span>"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
