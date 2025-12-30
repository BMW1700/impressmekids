import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Flame, Zap } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface Fireball {
  id: string;
  word: string;
  x: number;
  y: number;
  speed: number;
  destroyed: boolean;
  selected: boolean;
  scale: number;
}

interface RPGFireballBarrageProps {
  words: string[];
  onComplete: (wordsDestroyed: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGFireballBarrage = ({
  words,
  onComplete,
  onWordHit,
}: RPGFireballBarrageProps) => {
  const [fireballs, setFireballs] = useState<Fireball[]>([]);
  const [selectedFireball, setSelectedFireball] = useState<Fireball | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);
  const selectedFireballRef = useRef<Fireball | null>(null);
  const isListeningRef = useRef(false);

  // Initialize fireballs from dragon side (left) flying toward heroes (right)
  useEffect(() => {
    const initialFireballs: Fireball[] = words.map((word, index) => ({
      id: `fireball-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      x: -10 - (index * 8), // Start off-screen left, staggered
      y: 25 + (index % 4) * 15, // Spread vertically
      speed: 0.08 + Math.random() * 0.05, // Faster than word barrage
      destroyed: false,
      selected: false,
      scale: 0.8 + Math.random() * 0.4,
    }));
    setFireballs(initialFireballs);
  }, [words]);

  // Animation loop - fireballs fly left to right
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setFireballs(prev => {
        let anyHit = false;
        const updated = prev.map(f => {
          if (f.destroyed) return f;
          
          const newX = f.x + f.speed;
          
          // Fireball reached heroes at ~75% of screen
          if (newX >= 72) {
            if (!anyHit) {
              anyHit = true;
              onWordHit(20); // Fireball damage
              soundEffects.incorrectWord();
              missedRef.current += 1;
              setWordsMissed(missedRef.current);
            }
            return { ...f, destroyed: true, x: newX };
          }
          
          return { ...f, x: newX };
        });
        
        // Check completion
        const allDone = updated.every(f => f.destroyed);
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

  const resetListeningState = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    isListeningRef.current = false;
    setSelectedFireball(null);
    selectedFireballRef.current = null;
    setSpokenText("");
    setFireballs(prev => prev.map(f => ({ ...f, selected: false })));
  }, []);

  const handleSelectFireball = useCallback((fireball: Fireball) => {
    if (fireball.destroyed) return;
    
    if (isListeningRef.current) {
      resetListeningState();
    }
    
    setFireballs(prev => prev.map(f => ({ ...f, selected: f.id === fireball.id })));
    setSelectedFireball(fireball);
    selectedFireballRef.current = fireball;
    startListening(fireball);
  }, [resetListeningState]);

  const startListening = useCallback((fireball: Fireball) => {
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

    const lockedFireball = fireball;
    selectedFireballRef.current = fireball;

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
        const targetWord = lockedFireball.word;
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
          destroyedRef.current += 1;
          setWordsDestroyed(destroyedRef.current);
          setFireballs(prev => 
            prev.map(f => f.id === lockedFireball.id ? { ...f, destroyed: true, selected: false } : f)
          );
        } else {
          soundEffects.incorrectWord();
          onWordHit(22);
          missedRef.current += 1;
          setWordsMissed(missedRef.current);
          setFireballs(prev => 
            prev.map(f => f.id === lockedFireball.id ? { ...f, destroyed: true, selected: false } : f)
          );
        }

        setIsListening(false);
        isListeningRef.current = false;
        setSelectedFireball(null);
        selectedFireballRef.current = null;
        setSpokenText("");
        try { recognition.stop(); } catch (e) {}
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
      {/* Fire overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-r from-orange-900/40 via-red-900/30 to-red-950/50"
      />
      
      {/* Heat distortion effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-400/50">
          <div className="flex items-center gap-3 text-white">
            <Flame className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">FIREBALL BARRAGE! Click & speak to destroy!</span>
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Fireballs */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {fireballs.map((fireball) => (
            !fireball.destroyed && (
              <motion.button
                key={fireball.id}
                className={`absolute pointer-events-auto rounded-full cursor-pointer
                  ${fireball.selected 
                    ? 'z-30' 
                    : 'z-20'
                  }`}
                style={{
                  left: `${fireball.x}%`,
                  top: `${fireball.y}%`,
                }}
                onClick={() => handleSelectFireball(fireball)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: fireball.scale,
                  opacity: 1,
                }}
                exit={{ 
                  scale: 3,
                  opacity: 0,
                  transition: { duration: 0.3 }
                }}
              >
              {/* Fireball core */}
              <motion.div
                className={`relative w-28 h-28 rounded-full flex items-center justify-center
                  ${fireball.selected 
                    ? 'bg-gradient-to-br from-yellow-200 via-orange-400 to-red-600' 
                    : 'bg-gradient-to-br from-orange-400 via-red-500 to-red-700'
                  }`}
                animate={{
                  boxShadow: fireball.selected 
                    ? ['0 0 60px rgba(251,191,36,0.9)', '0 0 100px rgba(251,191,36,1)', '0 0 60px rgba(251,191,36,0.9)']
                    : ['0 0 40px rgba(249,115,22,0.7)', '0 0 60px rgba(249,115,22,0.9)', '0 0 40px rgba(249,115,22,0.7)'],
                }}
                transition={{ repeat: Infinity, duration: 0.4 }}
              >
                {/* Word inside - ENHANCED visibility */}
                <span 
                  className={`font-black text-xl z-10 uppercase tracking-wider px-2 py-1 rounded
                    ${fireball.selected 
                      ? 'text-black bg-yellow-300/80' 
                      : 'text-white bg-black/40'
                    }`}
                  style={{
                    textShadow: fireball.selected 
                      ? 'none' 
                      : '0 0 10px rgba(255,255,255,0.8), 2px 2px 0 #000, -2px -2px 0 #000',
                  }}
                >
                  {fireball.word}
                </span>
                
                {/* Inner glow */}
                <motion.div
                  className="absolute inset-2 rounded-full bg-gradient-to-t from-transparent via-yellow-300/40 to-yellow-200/60"
                  animate={{ opacity: [0.5, 0.9, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                />
                
                {/* Hot core */}
                <motion.div
                  className="absolute inset-6 rounded-full bg-gradient-to-br from-white/60 to-yellow-200/30"
                  animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
              </motion.div>
                
                {/* Fire trail */}
                <motion.div
                  className="absolute -left-8 top-1/2 -translate-y-1/2 w-12 h-16"
                  style={{ filter: 'blur(3px)' }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-gradient-to-r from-orange-500 to-transparent"
                      style={{
                        width: 8 + i * 3,
                        height: 8 + i * 3,
                        left: -i * 6,
                        top: `${40 + Math.sin(i) * 20}%`,
                      }}
                      animate={{ 
                        opacity: [0.8, 0.3, 0.8],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
                
                {/* Danger pulse when close */}
                {fireball.x > 50 && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-yellow-300"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
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
        {selectedFireball && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-slate-900/95 border-2 border-orange-400 rounded-xl px-10 py-5
              shadow-[0_0_40px_rgba(249,115,22,0.5)]">
              <p className="text-orange-400 text-sm mb-2 text-center font-medium">
                Say this word to extinguish:
              </p>
              <p className="text-4xl font-black text-white text-center">{selectedFireball.word}</p>
              
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
        <div className="bg-slate-900/90 rounded-lg p-4 border border-orange-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-lg">{wordsDestroyed}</span>
            <span className="text-sm text-slate-400">extinguished</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Burned: {wordsMissed}
          </div>
        </div>
      </div>
    </div>
  );
};
