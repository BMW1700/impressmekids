import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Shield, Zap } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface BarrageWord {
  id: string;
  word: string;
  x: number;
  y: number;
  speed: number;
  destroyed: boolean;
  selected: boolean;
}

interface RPGWordBarrageProps {
  words: string[];
  onComplete: (wordsDestroyed: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGWordBarrage = ({
  words,
  onComplete,
  onWordHit,
}: RPGWordBarrageProps) => {
  const [barrageWords, setBarrageWords] = useState<BarrageWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<BarrageWord | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);

  // Initialize with SLOW floating words
  useEffect(() => {
    const initialWords: BarrageWord[] = words.map((word, index) => ({
      id: `barrage-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      x: 5 + (index % 3) * 15, // Spread across left side
      y: 15 + (index * 12) % 60, // Varied vertical positions
      speed: 0.02 + Math.random() * 0.02, // VERY SLOW: 0.02-0.04 per frame
      destroyed: false,
      selected: false,
    }));
    setBarrageWords(initialWords);
  }, [words]);

  // Slow animation loop
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setBarrageWords(prev => {
        let anyHit = false;
        const updated = prev.map(w => {
          if (w.destroyed) return w;
          
          const newX = w.x + w.speed;
          
          // Word reached heroes at ~75% of screen
          if (newX >= 72) {
            if (!anyHit) {
              anyHit = true;
              // Damage BOTH heroes
              onWordHit(15);
              soundEffects.incorrectWord();
              missedRef.current += 1;
              setWordsMissed(missedRef.current);
            }
            return { ...w, destroyed: true, x: newX };
          }
          
          return { ...w, x: newX };
        });
        
        // Check completion
        const allDone = updated.every(w => w.destroyed);
        if (allDone && isActive) {
          setIsActive(false);
          setTimeout(() => {
            onComplete(destroyedRef.current, missedRef.current);
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

  // Click to select word
  const handleSelectWord = useCallback((word: BarrageWord) => {
    if (word.destroyed || isListening) return;
    
    // Deselect previous
    setBarrageWords(prev => prev.map(w => ({ ...w, selected: w.id === word.id })));
    setSelectedWord(word);
    startListening(word);
  }, [isListening]);

  // Speech recognition for selected word
  const startListening = useCallback((word: BarrageWord) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
      setSpokenText("");
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const transcript = result[0].transcript.trim().toLowerCase();
      setSpokenText(transcript);

      if (result.isFinal) {
        let matched = false;
        
        // Check all alternatives
        for (let i = 0; i < result.length && !matched; i++) {
          const alt = result[i]?.transcript?.trim().toLowerCase() || '';
          const altWords = alt.split(/\s+/);
          for (const spoken of altWords) {
            if (isWordMatchLenient(spoken, word.word)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          // SUCCESS - destroy word
          soundEffects.correctWord();
          destroyedRef.current += 1;
          setWordsDestroyed(destroyedRef.current);
          setBarrageWords(prev => 
            prev.map(w => w.id === word.id ? { ...w, destroyed: true, selected: false } : w)
          );
        } else {
          // WRONG - instant damage!
          soundEffects.incorrectWord();
          onWordHit(18); // Higher damage for wrong word
          missedRef.current += 1;
          setWordsMissed(missedRef.current);
          setBarrageWords(prev => 
            prev.map(w => w.id === word.id ? { ...w, destroyed: true, selected: false } : w)
          );
        }

        setIsListening(false);
        setSelectedWord(null);
        setSpokenText("");
        try { recognition.stop(); } catch (e) {}
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setSelectedWord(null);
      setBarrageWords(prev => prev.map(w => ({ ...w, selected: false })));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}
  }, [onWordHit]);

  // Cleanup
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
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-black/60 to-transparent"
      />

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-red-600 to-purple-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-400/50">
          <div className="flex items-center gap-3 text-white">
            <Zap className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">WORD BARRAGE! Click a word and speak it!</span>
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Floating Words */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {barrageWords.map((word) => (
            !word.destroyed && (
              <motion.button
                key={word.id}
                className={`absolute pointer-events-auto px-5 py-3 rounded-xl
                  font-bold text-xl cursor-pointer transition-all border-2
                  ${word.selected 
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black border-yellow-300 scale-125 shadow-[0_0_50px_rgba(251,191,36,0.9)]' 
                    : 'bg-gradient-to-br from-purple-600 to-red-600 text-white border-purple-400/50 shadow-[0_0_25px_rgba(147,51,234,0.6)]'
                  }
                  hover:scale-110`}
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                }}
                onClick={() => handleSelectWord(word)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  y: [0, -8, 0, 8, 0], // Gentle floating
                }}
                exit={{ 
                  scale: 2.5, 
                  opacity: 0,
                  transition: { duration: 0.4 }
                }}
                transition={{
                  y: { repeat: Infinity, duration: 3 + Math.random() * 2, ease: "easeInOut" },
                }}
              >
                {word.word}
                
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-purple-400/20 blur-md -z-10"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.2, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </motion.button>
            )
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
            <div className="bg-slate-900/95 border-2 border-yellow-400 rounded-xl px-10 py-5
              shadow-[0_0_40px_rgba(251,191,36,0.5)]">
              <p className="text-yellow-400 text-sm mb-2 text-center font-medium">
                Say this word to destroy it:
              </p>
              <p className="text-4xl font-black text-white text-center">{selectedWord.word}</p>
              
              {isListening && (
                <div className="flex items-center justify-center gap-3 mt-4 text-emerald-400">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  >
                    <Mic className="h-6 w-6" />
                  </motion.div>
                  <span className="font-medium">Listening...</span>
                  
                  {/* Audio waves */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full"
                        animate={{ height: ['6px', '18px', '6px'] }}
                        transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
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
        <div className="bg-slate-900/90 rounded-lg p-4 border border-slate-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Shield className="h-5 w-5" />
            <span className="font-bold text-lg">{wordsDestroyed}</span>
            <span className="text-sm text-slate-400">destroyed</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Missed: {wordsMissed}
          </div>
          <div className="text-slate-500 text-xs mt-2">
            Remaining: {barrageWords.filter(w => !w.destroyed).length}
          </div>
        </div>
      </div>
    </div>
  );
};
