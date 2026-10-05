import { useMinigameMicOwnership } from "@/hooks/useMinigameMicOwnership";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Wind, Cloud, Crosshair } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface WindWord {
  id: string;
  word: string;
  x: number;
  y: number;
  speed: number;
  caught: boolean;
  missed: boolean;
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
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsCaught, setWordsCaught] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const recognitionRef = useRef<any>(null);
  useMinigameMicOwnership('wind_chase', recognitionRef);
  const animationRef = useRef<number | null>(null);
  const caughtRef = useRef(0);
  const missedRef = useRef(0);
  const windWordsRef = useRef<WindWord[]>([]);

  // Initialize wind words - start from right, blow left
  useEffect(() => {
    const initialWords: WindWord[] = words.slice(0, 8).map((word, index) => ({
      id: `wind-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      x: 110 + (index * 12),
      y: 20 + (index % 5) * 15,
      speed: 0.12 + Math.random() * 0.08,
      caught: false,
      missed: false,
    }));
    setWindWords(initialWords);
    windWordsRef.current = initialWords;
  }, [words]);

  // Keep ref in sync
  useEffect(() => {
    windWordsRef.current = windWords;
  }, [windWords]);

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
        
        windWordsRef.current = updated;
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

  // Start CONTINUOUS listening immediately
  useEffect(() => {
    if (!isActive) return;
    
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // CONTINUOUS listening
    recognition.interimResults = true; // Process interim for faster matching
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      // Process all new results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim().toLowerCase();
        setSpokenText(transcript);
        
        // Check against ALL active wind words (lenient matching)
        const wordsSpoken = transcript.split(/\s+/);
        
        for (const spoken of wordsSpoken) {
          // Find matching uncaught word
          const currentWords = windWordsRef.current;
          for (const windWord of currentWords) {
            if (windWord.caught || windWord.missed) continue;
            
            if (isWordMatchLenient(spoken, windWord.word)) {
              // MATCH FOUND - catch the word!
              soundEffects.correctWord();
              caughtRef.current += 1;
              setWordsCaught(caughtRef.current);
              
              setWindWords(prev => {
                const updated = prev.map(w => 
                  w.id === windWord.id ? { ...w, caught: true } : w
                );
                windWordsRef.current = updated;
                return updated;
              });
              break; // Only catch one word per spoken word
            }
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.log('[WindChase] Speech error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Restart on recoverable errors
        setTimeout(() => {
          if (isActive && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 100);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still active
      if (isActive) {
        setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [isActive]);

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
        className={`absolute inset-0 bg-gradient-to-b ${isAgentMode() ? 'from-slate-800/90 via-amber-900/80 to-slate-900/90' : 'from-sky-400/90 via-cyan-500/80 to-blue-600/90'}`}
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
        {(() => { const t = getMinigameTheme('windChase'); const agent = isAgentMode(); return (
        <div className={`bg-gradient-to-r ${agent ? 'from-amber-600 to-orange-600' : 'from-sky-600 to-cyan-600'} px-6 py-3 rounded-lg
          shadow-lg border ${agent ? 'border-amber-400/50' : 'border-sky-400/50'}`}>
          <div className="flex items-center gap-3 text-white">
            {agent ? <Crosshair className="h-6 w-6 animate-pulse" /> : <Wind className="h-6 w-6 animate-pulse" />}
            <span className="font-bold text-lg">{agent ? 'PURSUIT MODE! Say the words to catch targets!' : 'WIND CHASE! Say the words to catch them!'}</span>
            <Mic className="h-6 w-6 animate-pulse" />
          </div>
        </div>
        ); })()}
      </motion.div>

      {/* Listening indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-28 left-1/2 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 bg-emerald-500/80 px-4 py-2 rounded-full">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <Mic className="h-5 w-5 text-white" />
            </motion.div>
            <span className="text-white font-medium">Listening...</span>
          </div>
          {spokenText && (
            <p className="text-center text-white text-sm mt-2 bg-slate-900/70 px-3 py-1 rounded">
              "{spokenText}"
            </p>
          )}
        </motion.div>
      )}

      {/* Wind Words */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {windWords.map((windWord) => (
            !windWord.caught && !windWord.missed && (
              <motion.div
                key={windWord.id}
                className="absolute pointer-events-none z-20"
                style={{
                  left: `${windWord.x}%`,
                  top: `${windWord.y}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {/* Leaf-like container */}
                <motion.div
                  className="relative px-5 py-3 rounded-full flex items-center justify-center
                    bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    boxShadow: ['0 0 15px rgba(16,185,129,0.5)', '0 0 25px rgba(16,185,129,0.7)', '0 0 15px rgba(16,185,129,0.5)'],
                  }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <span 
                    className="font-black text-lg uppercase tracking-wide text-white"
                    style={{
                      textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
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
              </motion.div>
            )
          ))}
        </AnimatePresence>
        
        {/* Caught word effects */}
        <AnimatePresence>
          {windWords.filter(w => w.caught).map((windWord) => (
            <motion.div
              key={`caught-${windWord.id}`}
              className="absolute z-30"
              style={{
                left: `${windWord.x}%`,
                top: `${windWord.y}%`,
              }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0, y: -50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl">✨</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
