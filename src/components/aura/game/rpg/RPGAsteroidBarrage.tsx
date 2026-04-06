import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Shield, AlertTriangle, Database } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface Asteroid {
  id: string;
  word: string;
  x: number;
  y: number;
  speed: number;
  destroyed: boolean;
  selected: boolean;
  rotation: number;
  size: number;
}

interface RPGAsteroidBarrageProps {
  words: string[];
  onComplete: (wordsDestroyed: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGAsteroidBarrage = ({
  words,
  onComplete,
  onWordHit,
}: RPGAsteroidBarrageProps) => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);
  const selectedAsteroidRef = useRef<Asteroid | null>(null);
  const isListeningRef = useRef(false);

  // Initialize asteroids falling from top
  useEffect(() => {
    const initialAsteroids: Asteroid[] = words.map((word, index) => ({
      id: `asteroid-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      x: 15 + (index % 5) * 15, // Spread horizontally
      y: -15 - (index * 12), // Start above screen, staggered
      speed: 0.04 + Math.random() * 0.03, // Falling speed
      destroyed: false,
      selected: false,
      rotation: Math.random() * 360,
      size: 0.8 + (word.length * 0.08), // Bigger words = bigger asteroids
    }));
    setAsteroids(initialAsteroids);
  }, [words]);

  // Animation loop - asteroids fall down
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setAsteroids(prev => {
        let anyHit = false;
        const updated = prev.map(a => {
          if (a.destroyed) return a;
          
          const newY = a.y + a.speed;
          const newRotation = a.rotation + 0.5;
          
          // Asteroid reached heroes at bottom (~85% of screen)
          if (newY >= 82) {
            if (!anyHit) {
              anyHit = true;
              onWordHit(18); // Asteroid impact damage
              soundEffects.incorrectWord();
              missedRef.current += 1;
              setWordsMissed(missedRef.current);
            }
            return { ...a, destroyed: true, y: newY };
          }
          
          return { ...a, y: newY, rotation: newRotation };
        });
        
        const allDone = updated.every(a => a.destroyed);
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
    setSelectedAsteroid(null);
    selectedAsteroidRef.current = null;
    setSpokenText("");
    setAsteroids(prev => prev.map(a => ({ ...a, selected: false })));
  }, []);

  const handleSelectAsteroid = useCallback((asteroid: Asteroid) => {
    if (asteroid.destroyed) return;
    
    if (isListeningRef.current) {
      resetListeningState();
    }
    
    setAsteroids(prev => prev.map(a => ({ ...a, selected: a.id === asteroid.id })));
    setSelectedAsteroid(asteroid);
    selectedAsteroidRef.current = asteroid;
    startListening(asteroid);
  }, [resetListeningState]);

  const startListening = useCallback((asteroid: Asteroid) => {
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

    const lockedAsteroid = asteroid;
    selectedAsteroidRef.current = asteroid;

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
        const targetWord = lockedAsteroid.word;
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
          setAsteroids(prev => 
            prev.map(a => a.id === lockedAsteroid.id ? { ...a, destroyed: true, selected: false } : a)
          );
        } else {
          soundEffects.incorrectWord();
          onWordHit(20);
          missedRef.current += 1;
          setWordsMissed(missedRef.current);
          setAsteroids(prev => 
            prev.map(a => a.id === lockedAsteroid.id ? { ...a, destroyed: true, selected: false } : a)
          );
        }

        setIsListening(false);
        isListeningRef.current = false;
        setSelectedAsteroid(null);
        selectedAsteroidRef.current = null;
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
      {/* Space/cosmic overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-purple-950/90 via-slate-900/95 to-slate-950/90"
      />
      
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ repeat: Infinity, duration: 1 + Math.random() * 2, delay: Math.random() }}
          />
        ))}
      </div>

      {/* Hero danger zone at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[18%] pointer-events-none">
        <motion.div
          className="h-full border-t-4 border-dashed border-red-500/60"
          animate={{ borderColor: ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.8)', 'rgba(239,68,68,0.3)'] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-red-400/70 text-sm font-medium">
          ⚠️ IMPACT ZONE ⚠️
        </div>
      </div>

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(147,51,234,0.6)] border border-purple-400/50">
          <div className="flex items-center gap-3 text-white">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">WORD PRISON! Click asteroids & speak to shatter!</span>
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Asteroids */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {asteroids.map((asteroid) => (
            !asteroid.destroyed && (
              <motion.button
                key={asteroid.id}
                className="absolute pointer-events-auto cursor-pointer z-20"
                style={{
                  left: `${asteroid.x}%`,
                  top: `${asteroid.y}%`,
                  transform: `rotate(${asteroid.rotation}deg)`,
                }}
                onClick={() => handleSelectAsteroid(asteroid)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: asteroid.size,
                  opacity: 1,
                }}
                exit={{ 
                  scale: 2.5,
                  opacity: 0,
                  transition: { duration: 0.4 }
                }}
              >
                {/* Asteroid body */}
                <motion.div
                  className={`relative w-28 h-28 rounded-full flex items-center justify-center
                    ${asteroid.selected 
                      ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600' 
                      : 'bg-gradient-to-br from-slate-500 via-stone-600 to-slate-800'
                    }`}
                  style={{
                    clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 95% 70%, 70% 100%, 30% 95%, 5% 65%, 0% 30%, 25% 5%)',
                  }}
                  animate={{
                    boxShadow: asteroid.selected 
                      ? ['0 0 40px rgba(251,191,36,0.8)', '0 0 60px rgba(251,191,36,1)', '0 0 40px rgba(251,191,36,0.8)']
                      : ['0 0 20px rgba(100,116,139,0.4)', '0 0 30px rgba(100,116,139,0.6)', '0 0 20px rgba(100,116,139,0.4)'],
                  }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  {/* Word carved into asteroid */}
                  <span className={`font-black text-lg z-10 drop-shadow-lg
                    ${asteroid.selected 
                      ? 'text-black' 
                      : 'text-cyan-300'
                    }`}
                    style={{ 
                      textShadow: asteroid.selected ? 'none' : '0 0 10px rgba(103,232,249,0.8)',
                      transform: `rotate(-${asteroid.rotation}deg)` // Counter-rotate text
                    }}
                  >
                    {asteroid.word}
                  </span>
                  
                  {/* Crater details */}
                  <div className="absolute top-3 left-4 w-4 h-4 rounded-full bg-slate-700/50" />
                  <div className="absolute bottom-5 right-3 w-3 h-3 rounded-full bg-slate-700/50" />
                  <div className="absolute top-8 right-6 w-2 h-2 rounded-full bg-slate-700/50" />
                </motion.div>
                
                {/* Trailing debris */}
                <motion.div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-slate-600"
                      style={{ left: (i - 1) * 10, top: -i * 6 }}
                      animate={{ opacity: [0.6, 0.2, 0.6] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
                
                {/* Danger pulse when close to bottom */}
                {asteroid.y > 60 && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-500"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0, 0.9] }}
                    transition={{ repeat: Infinity, duration: 0.35 }}
                  />
                )}
              </motion.button>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Word Panel */}
      <AnimatePresence>
        {selectedAsteroid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-slate-900/95 border-2 border-purple-400 rounded-xl px-10 py-5
              shadow-[0_0_40px_rgba(147,51,234,0.5)]">
              <p className="text-purple-400 text-sm mb-2 text-center font-medium">
                Speak to shatter:
              </p>
              <p className="text-4xl font-black text-white text-center">{selectedAsteroid.word}</p>
              
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
            <Shield className="h-5 w-5" />
            <span className="font-bold text-lg">{wordsDestroyed}</span>
            <span className="text-sm text-slate-400">shattered</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Impact: {wordsMissed}
          </div>
        </div>
      </div>
    </div>
  );
};
