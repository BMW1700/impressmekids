import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Radio } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface GhostWord {
  id: number;
  word: string;
  x: number;
  y: number;
  opacity: number;
  destroyed: boolean;
}

interface RPGGhostlyWhispersProps {
  words: string[];
  onComplete: (destroyed: number, missed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGGhostlyWhispers = ({
  words,
  onComplete,
  onWordHit,
}: RPGGhostlyWhispersProps) => {
  const [ghosts, setGhosts] = useState<GhostWord[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);

  // Initialize ghosts
  useEffect(() => {
    const initialGhosts: GhostWord[] = words.map((word, i) => ({
      id: i,
      word: word.replace(/[^a-zA-Z]/g, '').toLowerCase(),
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 60,
      opacity: 1,
      destroyed: false,
    }));
    setGhosts(initialGhosts);
  }, [words]);

  // Fade animation - words fade over time (MUCH SLOWER - 0.008 instead of 0.02)
  useEffect(() => {
    if (gameOver) return;
    
    const interval = setInterval(() => {
      setGhosts(prev => {
        const updated = prev.map(ghost => {
          if (ghost.destroyed) return ghost;
          const newOpacity = ghost.opacity - 0.008; // 2.5x slower fade
          if (newOpacity <= 0) {
            missedRef.current += 1;
            setMissed(missedRef.current);
            onWordHit(10);
            soundEffects.incorrectWord();
            return { ...ghost, destroyed: true, opacity: 0 };
          }
          return { ...ghost, opacity: newOpacity };
        });
        
        // Check completion
        const allDone = updated.every(g => g.destroyed);
        if (allDone && !gameOver) {
          setGameOver(true);
          setTimeout(() => onComplete(destroyedRef.current, missedRef.current), 500);
        }
        
        return updated;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [gameOver, onComplete, onWordHit]);

  // Handle ghost destruction
  const handleGhostDestroy = useCallback((ghostId: number) => {
    setGhosts(prev => prev.map(g => 
      g.id === ghostId ? { ...g, destroyed: true } : g
    ));
    destroyedRef.current += 1;
    setDestroyed(destroyedRef.current);
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

          // Check against all active ghosts - super lenient matching
          setGhosts(prev => {
            const activeGhosts = prev.filter(g => !g.destroyed);
            
            for (const ghost of activeGhosts) {
              const targetWord = ghost.word.toLowerCase();
              
              for (const spoken of spokenWords) {
                const cleanSpoken = spoken.replace(/[^a-z]/g, '');
                
                if (cleanSpoken.length >= 2) {
                  const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 2)) || 
                                          cleanSpoken.startsWith(targetWord.slice(0, 2));
                  const containsMatch = targetWord.includes(cleanSpoken) || 
                                        cleanSpoken.includes(targetWord);
                  const exactMatch = cleanSpoken === targetWord;
                  
                  if (exactMatch || startsWithMatch || containsMatch) {
                    handleGhostDestroy(ghost.id);
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
        if (isListeningRef.current && !gameOver) {
          setTimeout(() => startListening(), 200);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && !gameOver) {
          setTimeout(() => startListening(), 100);
        }
      };

      recognition.start();
    } catch {}
  }, [gameOver, handleGhostDestroy]);

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
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-50">
      {/* Dark misty background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-purple-950/80 via-slate-900/70 to-purple-900/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Mist particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 50 - 25],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}

      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="px-6 py-2 bg-purple-900/90 rounded-lg border-2 border-purple-400">
          <span className="text-white font-black text-lg">👻 GHOSTLY WHISPERS! Speak before they fade! 👻</span>
        </div>
      </motion.div>

      {/* Ghost words */}
      <AnimatePresence>
        {ghosts.map((ghost) => (
          !ghost.destroyed && (
            <motion.div
              key={ghost.id}
              className="absolute z-20"
              style={{ 
                left: `${ghost.x}%`, 
                top: `${ghost.y}%`,
                opacity: ghost.opacity,
              }}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                y: [0, -10, 0],
              }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ y: { repeat: Infinity, duration: 3 } }}
            >
              {/* Ghost word container */}
              <div className="relative">
                {/* Ghostly glow */}
                <motion.div
                  className="absolute inset-0 bg-purple-400/30 rounded-full blur-xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                
                {/* Word with wispy effect */}
                <div className="relative px-5 py-3 bg-gradient-to-br from-purple-400/40 to-slate-600/30 
                  rounded-lg border border-purple-300/40 backdrop-blur-sm
                  shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  <span 
                    className="font-bold text-xl text-purple-100 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                    style={{ 
                      textShadow: '0 0 20px rgba(168,85,247,0.8)',
                    }}
                  >
                    {ghost.word}
                  </span>
                </div>

                {/* Fade progress bar */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
                    style={{ width: `${ghost.opacity * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
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

      {/* Score display */}
      <div className="absolute bottom-4 right-4 flex gap-4 z-50">
        <div className="px-4 py-2 bg-emerald-600/90 rounded-lg">
          <span className="text-white font-bold">Dispersed: {destroyed}</span>
        </div>
        <div className="px-4 py-2 bg-red-600/90 rounded-lg">
          <span className="text-white font-bold">Faded: {missed}</span>
        </div>
      </div>
    </div>
  );
};
