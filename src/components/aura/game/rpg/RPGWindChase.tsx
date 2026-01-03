import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Wind, Cloud } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface WindWord {
  id: string;
  word: string;
  x: number;
  y: number;
  speed: number;
  caught: boolean;
  missed: boolean;
  selected: boolean;
}

interface RPGWindChaseProps {
  words: string[];
  onComplete: (wordsCaught: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGWindChase = ({
  words,
  onComplete,
  onWordHit,
}: RPGWindChaseProps) => {
  const [windWords, setWindWords] = useState<WindWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<WindWord | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsCaught, setWordsCaught] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const caughtRef = useRef(0);
  const missedRef = useRef(0);
  const selectedWordRef = useRef<WindWord | null>(null);
  const isListeningRef = useRef(false);

  // Initialize wind words - start from right, blow left
  useEffect(() => {
    const initialWords: WindWord[] = words.slice(0, 8).map((word, index) => ({
      id: `wind-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      x: 110 + (index * 12), // Start off-screen right, staggered
      y: 20 + (index % 5) * 15, // Spread vertically
      speed: 0.12 + Math.random() * 0.08, // Wind speed
      caught: false,
      missed: false,
      selected: false,
    }));
    setWindWords(initialWords);
  }, [words]);

  // Animation loop - words blow from right to left
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setWindWords(prev => {
        let anyMissed = false;
        const updated = prev.map(w => {
          if (w.caught || w.missed) return w;
          
          const newX = w.x - w.speed;
          
          // Word blew off screen
          if (newX <= -15) {
            if (!anyMissed) {
              anyMissed = true;
              onWordHit(12);
              soundEffects.incorrectWord();
              missedRef.current += 1;
              setWordsMissed(missedRef.current);
            }
            return { ...w, missed: true, x: newX };
          }
          
          // Add slight wave motion
          const waveY = w.y + Math.sin(newX * 0.05) * 0.3;
          return { ...w, x: newX, y: waveY };
        });
        
        // Check completion
        const allDone = updated.every(w => w.caught || w.missed);
        if (allDone && isActive) {
          setIsActive(false);
          setTimeout(() => {
            onComplete(caughtRef.current, missedRef.current);
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
    setWindWords(prev => prev.map(w => ({ ...w, selected: false })));
  }, []);

  const handleSelectWord = useCallback((windWord: WindWord) => {
    if (windWord.caught || windWord.missed) return;
    
    if (isListeningRef.current) {
      resetListeningState();
    }
    
    setWindWords(prev => prev.map(w => ({ ...w, selected: w.id === windWord.id })));
    setSelectedWord(windWord);
    selectedWordRef.current = windWord;
    startListening(windWord);
  }, [resetListeningState]);

  const startListening = useCallback((windWord: WindWord) => {
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

    const lockedWord = windWord;
    selectedWordRef.current = windWord;

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
          caughtRef.current += 1;
          setWordsCaught(caughtRef.current);
          setWindWords(prev => 
            prev.map(w => w.id === lockedWord.id ? { ...w, caught: true, selected: false } : w)
          );
        } else {
          soundEffects.incorrectWord();
          onWordHit(15);
          missedRef.current += 1;
          setWordsMissed(missedRef.current);
          setWindWords(prev => 
            prev.map(w => w.id === lockedWord.id ? { ...w, missed: true, selected: false } : w)
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
      {/* Sky overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-sky-400/90 via-cyan-500/80 to-blue-600/90"
      />
      
      {/* Floating clouds */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl opacity-20"
            style={{
              left: `${10 + i * 15}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
            animate={{ x: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 4 + i, ease: "easeInOut" }}
          >
            ☁️
          </motion.div>
        ))}
      </div>
      
      {/* Wind lines effect */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-0.5 bg-gradient-to-l from-white/40 to-transparent"
            style={{
              width: 50 + Math.random() * 100,
              top: `${5 + i * 6}%`,
              right: -150,
            }}
            animate={{ x: [-200, -1000] }}
            transition={{ 
              repeat: Infinity, 
              duration: 1 + Math.random() * 0.5,
              delay: i * 0.1,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(14,165,233,0.6)] border border-sky-400/50">
          <div className="flex items-center gap-3 text-white">
            <Wind className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">WIND CHASE! Catch the words before they blow away!</span>
            <Wind className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Wind Words */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {windWords.map((windWord) => (
            !windWord.caught && !windWord.missed && (
              <motion.button
                key={windWord.id}
                className={`absolute pointer-events-auto cursor-pointer rounded-full
                  ${windWord.selected 
                    ? 'z-30' 
                    : 'z-20'
                  }`}
                style={{
                  left: `${windWord.x}%`,
                  top: `${windWord.y}%`,
                }}
                onClick={() => handleSelectWord(windWord)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {/* Leaf-like container */}
                <motion.div
                  className={`relative px-5 py-3 rounded-full flex items-center justify-center
                    ${windWord.selected 
                      ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400' 
                      : 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500'
                    }`}
                  animate={{
                    rotate: [0, 5, -5, 0],
                    boxShadow: windWord.selected 
                      ? ['0 0 30px rgba(251,191,36,0.8)', '0 0 50px rgba(251,191,36,1)', '0 0 30px rgba(251,191,36,0.8)']
                      : ['0 0 15px rgba(16,185,129,0.5)', '0 0 25px rgba(16,185,129,0.7)', '0 0 15px rgba(16,185,129,0.5)'],
                  }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <span 
                    className={`font-black text-lg uppercase tracking-wide
                      ${windWord.selected ? 'text-black' : 'text-white'}`}
                    style={{
                      textShadow: windWord.selected ? 'none' : '2px 2px 0 rgba(0,0,0,0.3)',
                    }}
                  >
                    {windWord.word}
                  </span>
                </motion.div>
                
                {/* Wind trail */}
                <motion.div
                  className="absolute right-full top-1/2 -translate-y-1/2 flex gap-1"
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-8 h-0.5 bg-white/40"
                      animate={{ opacity: [0.4, 0.1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
                
                {/* Danger pulse when close to edge */}
                {windWord.x < 25 && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-400"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 0.4 }}
                  />
                )}
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
            <div className="bg-slate-900/95 border-2 border-sky-400 rounded-xl px-10 py-5
              shadow-[0_0_40px_rgba(14,165,233,0.5)]">
              <p className="text-sky-400 text-sm mb-2 text-center font-medium">
                Say this word to catch it:
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
        <div className="bg-slate-900/90 rounded-lg p-4 border border-sky-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Cloud className="h-5 w-5 text-sky-400" />
            <span className="font-bold text-lg">{wordsCaught}</span>
            <span className="text-sm text-slate-400">caught</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Blown away: {wordsMissed}
          </div>
        </div>
      </div>
    </div>
  );
};
