import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Bomb } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface Boulder {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  rotation: number;
  destroyed: boolean;
}

interface RPGRollingBouldersProps {
  words: string[];
  onComplete: (destroyed: number, missed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGRollingBoulders = ({
  words,
  onComplete,
  onWordHit,
}: RPGRollingBouldersProps) => {
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);
  const bouldersRef = useRef<Boulder[]>([]);

  // Initialize boulders
  useEffect(() => {
    const initialBoulders: Boulder[] = words.map((word, i) => ({
      id: i,
      word: word.replace(/[^a-zA-Z]/g, '').toLowerCase(),
      x: 100 + i * 15,
      y: 30 + Math.random() * 40,
      speed: 0.8 + Math.random() * 0.4,
      size: Math.min(100, Math.max(60, word.length * 12)),
      rotation: 0,
      destroyed: false,
    }));
    setBoulders(initialBoulders);
    bouldersRef.current = initialBoulders;
  }, [words]);

  // Rolling animation
  useEffect(() => {
    if (gameOver) return;
    
    const interval = setInterval(() => {
      setBoulders(prev => {
        const updated = prev.map(boulder => {
          if (boulder.destroyed) return boulder;
          const newX = boulder.x - boulder.speed;
          const newRotation = boulder.rotation - boulder.speed * 5;
          
          // Boulder reaches hero zone
          if (newX <= 10) {
            missedRef.current += 1;
            setMissed(missedRef.current);
            onWordHit(12);
            soundEffects.incorrectWord();
            return { ...boulder, destroyed: true, x: newX };
          }
          
          return { ...boulder, x: newX, rotation: newRotation };
        });
        
        // Check completion
        const allDone = updated.every(b => b.destroyed);
        if (allDone && !gameOver) {
          setGameOver(true);
          setTimeout(() => onComplete(destroyedRef.current, missedRef.current), 500);
        }
        
        bouldersRef.current = updated;
        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver, onComplete, onWordHit]);

  // Handle boulder destruction
  const handleBoulderDestroy = useCallback((boulderId: number) => {
    setBoulders(prev => {
      const updated = prev.map(b => 
        b.id === boulderId ? { ...b, destroyed: true } : b
      );
      bouldersRef.current = updated;
      return updated;
    });
    destroyedRef.current += 1;
    setDestroyed(destroyedRef.current);
    soundEffects.correctWord();
    soundEffects.rockCrumble();
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

          // Check against all active boulders using ref (not nested setState)
          const activeBoulders = bouldersRef.current.filter(b => !b.destroyed);
          
          for (const boulder of activeBoulders) {
            const targetWord = boulder.word.toLowerCase();
            
            for (const spoken of spokenWords) {
              const cleanSpoken = spoken.replace(/[^a-z]/g, '');
              
              if (cleanSpoken.length >= 2) {
                const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 2)) || 
                                        cleanSpoken.startsWith(targetWord.slice(0, 2));
                const containsMatch = targetWord.includes(cleanSpoken) || 
                                      cleanSpoken.includes(targetWord);
                const exactMatch = cleanSpoken === targetWord;
                
                if (exactMatch || startsWithMatch || containsMatch) {
                  handleBoulderDestroy(boulder.id);
                  break;
                }
              }
            }
          }
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
  }, [gameOver, handleBoulderDestroy]);

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
      {/* Rocky background */}
      {(() => { const t = getMinigameTheme('rollingBoulders'); const agent = isAgentMode(); return (
      <>
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${agent ? 'from-slate-800/70 via-gray-900/50 to-slate-900/80' : 'from-stone-800/70 via-amber-900/50 to-stone-900/80'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Dust/debris */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute bottom-0 w-40 h-20 ${agent ? 'bg-gray-700/20' : 'bg-amber-700/20'} rounded-full blur-2xl`}
          style={{ left: `${i * 12}%` }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className={`px-6 py-2 ${agent ? 'bg-gray-700/90' : 'bg-stone-700/90'} rounded-lg border-2 ${agent ? 'border-red-600' : 'border-amber-600'}`}>
          <span className="text-white font-black text-lg">{t.emoji} {t.title} Speak to shatter! {t.emoji}</span>
        </div>
      </motion.div>
      </>
      ); })()}

      {/* Hero zone indicator */}
      <div className="absolute left-[8%] top-[20%] bottom-[20%] w-2 bg-red-500/50 rounded-full">
        <motion.div
          className="absolute inset-0 bg-red-400"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>

      {/* Boulders */}
      <AnimatePresence>
        {boulders.map((boulder) => (
          !boulder.destroyed && (
            <motion.div
              key={boulder.id}
              className="absolute z-20"
              style={{ 
                left: `${boulder.x}%`, 
                top: `${boulder.y}%`,
                width: boulder.size,
                height: boulder.size,
              }}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                rotate: boulder.rotation,
              }}
              exit={{ scale: 1.5, opacity: 0, y: -50 }}
            >
              {/* Boulder body */}
              <div 
                className="relative w-full h-full rounded-full 
                  bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700
                  shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.5),5px_5px_15px_rgba(0,0,0,0.4)]
                  border-2 border-stone-600
                  flex items-center justify-center"
              >
                {/* Word carved in stone */}
                <span 
                  className="font-black text-sm text-stone-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                  style={{ 
                    textShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {boulder.word}
                </span>

                {/* Rock texture spots */}
                <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-stone-600 rounded-full" />
                <div className="absolute top-[60%] right-[25%] w-3 h-3 bg-stone-600 rounded-full" />
                <div className="absolute bottom-[30%] left-[30%] w-2 h-2 bg-stone-700 rounded-full" />
              </div>

              {/* Dust trail */}
              <motion.div
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-700/30 rounded-full blur-md"
                animate={{ opacity: [0.5, 0.2, 0.5], x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          className={`p-6 rounded-full cursor-pointer ${
            isMicActive 
              ? 'bg-amber-600 shadow-[0_0_30px_rgba(217,119,6,0.6)]' 
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
            className="text-center text-amber-300 mt-2 font-medium"
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
          <span className="text-white font-bold">Shattered: {destroyed}</span>
        </div>
        <div className="px-4 py-2 bg-red-600/90 rounded-lg">
          <span className="text-white font-bold">Crushed: {missed}</span>
        </div>
      </div>
    </div>
  );
};
