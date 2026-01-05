import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Mountain } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";

interface RippleMountain {
  id: number;
  word: string;
  x: number;
  destroyed: boolean;
  speed: number;
  height: number;
}

interface RPGGroundRippleProps {
  words: string[];
  onComplete: (destroyed: number, missed: number) => void;
  onWordHit: (damage: number) => void;
}

const battleSounds = new SoundEffects();

export const RPGGroundRipple = ({
  words,
  onComplete,
  onWordHit,
}: RPGGroundRippleProps) => {
  const [mountains, setMountains] = useState<RippleMountain[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const gameWordsRef = useRef<string[]>([]);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);

  // Initialize words and spawn mountains
  useEffect(() => {
    const cleanWords = words
      .filter(w => w.length >= 2 && w.length <= 10)
      .slice(0, 6)
      .map(w => w.replace(/[^a-zA-Z]/g, ''));
    
    if (cleanWords.length < 3) {
      gameWordsRef.current = ['crash', 'smash', 'quake', 'rumble', 'shake'];
    } else {
      gameWordsRef.current = cleanWords;
    }

    // Trigger initial ground slam effect
    setShakeScreen(true);
    battleSounds.rockCrumble();
    setTimeout(() => setShakeScreen(false), 500);

    // Spawn first mountain after slam animation
    setTimeout(() => spawnMountain(0), 600);

    // Spawn more mountains with delays
    let index = 1;
    spawnIntervalRef.current = setInterval(() => {
      if (index < gameWordsRef.current.length) {
        spawnMountain(index);
        battleSounds.rockCrumble();
        index++;
      } else {
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      }
    }, 2000);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [words]);

  const spawnMountain = (index: number) => {
    const word = gameWordsRef.current[index];
    if (!word) return;

    const newMountain: RippleMountain = {
      id: index,
      word: word.toLowerCase(),
      x: 100,
      destroyed: false,
      speed: 0.12 + Math.random() * 0.05,
      height: 60 + Math.random() * 40,
    };

    setMountains(prev => [...prev, newMountain]);
  };

  // Move mountains toward heroes
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setMountains(prev => {
        const updated = prev.map(m => {
          if (m.destroyed) return m;
          const newX = m.x - m.speed;
          
          // Mountain hit heroes!
          if (newX <= 8) {
            missedRef.current += 1;
            setMissed(missedRef.current);
            onWordHit(15);
            battleSounds.incorrectWord();
            setShakeScreen(true);
            setTimeout(() => setShakeScreen(false), 200);
            return { ...m, x: newX, destroyed: true };
          }
          
          return { ...m, x: newX };
        });
        return updated;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [onWordHit]);

  // Check for game over
  useEffect(() => {
    const totalMountains = gameWordsRef.current.length;
    if (totalMountains > 0 && destroyedRef.current + missedRef.current >= totalMountains && !gameOver) {
      setGameOver(true);
      stopMic();
      
      setTimeout(() => {
        onComplete(destroyedRef.current, missedRef.current);
      }, 1000);
    }
  }, [destroyed, missed, gameOver, onComplete]);

  const handleMountainDestroy = useCallback((mountainId: number, word: string) => {
    setMountains(prev => prev.map(m => 
      m.id === mountainId ? { ...m, destroyed: true } : m
    ));
    
    destroyedRef.current += 1;
    setDestroyed(destroyedRef.current);
    battleSounds.correctWord();
    battleSounds.rockCrumble();
  }, []);

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

          // Check against all active mountains - super lenient matching
          setMountains(prev => {
            const activeMountains = prev.filter(m => !m.destroyed);
            
            for (const mountain of activeMountains) {
              const targetWord = mountain.word.toLowerCase();
              
              for (const spoken of spokenWords) {
                const cleanSpoken = spoken.replace(/[^a-z]/g, '');
                
                if (cleanSpoken.length >= 2) {
                  const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 2)) || 
                                          cleanSpoken.startsWith(targetWord.slice(0, 2));
                  const containsMatch = targetWord.includes(cleanSpoken) || 
                                        cleanSpoken.includes(targetWord);
                  const exactMatch = cleanSpoken === targetWord;
                  
                  if (exactMatch || startsWithMatch || containsMatch) {
                    handleMountainDestroy(mountain.id, mountain.word);
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
  }, [gameOver, handleMountainDestroy]);

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

  // Auto-start mic
  useEffect(() => {
    const timer = setTimeout(() => startMic(), 800);
    return () => {
      clearTimeout(timer);
      stopMic();
    };
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        x: shakeScreen ? [-5, 5, -5, 5, 0] : 0,
      }}
      transition={{ duration: shakeScreen ? 0.3 : 0.2 }}
    >
      {/* Background - rocky canyon */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-stone-800 to-stone-950" />
      
      {/* Dust particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-amber-600/30 rounded-full blur-sm"
          style={{ 
            left: `${Math.random() * 100}%`, 
            bottom: `${15 + Math.random() * 30}%` 
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-stone-900 via-amber-800 to-stone-700">
        {/* Cracks in ground */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <path d="M0 20 L50 15 L100 25 L150 10 L200 20" stroke="#3D2817" strokeWidth="2" fill="none"/>
          <path d="M100 0 L120 30 L110 50" stroke="#3D2817" strokeWidth="2" fill="none"/>
          <path d="M300 10 L320 40 L350 30" stroke="#3D2817" strokeWidth="2" fill="none"/>
        </svg>
      </div>

      {/* Hero zone */}
      <div className="absolute left-0 bottom-[15%] w-[10%] h-[35%] bg-gradient-to-r from-blue-500/30 to-transparent border-r-2 border-blue-400/50 flex items-center justify-center">
        <div className="text-5xl">🛡️</div>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
        <motion.div 
          className="bg-stone-900/90 px-5 py-3 rounded-xl border-2 border-amber-600"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
        >
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-black text-amber-400">GROUND RIPPLE!</h2>
          </div>
          <p className="text-sm text-amber-300 mt-1">Grog smashes! Speak words to destroy the mountains!</p>
        </motion.div>
        
        <div className="bg-stone-900/90 px-4 py-2 rounded-xl border border-amber-500/50">
          <span className="text-emerald-400 font-bold text-lg">{destroyed}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-300">{gameWordsRef.current.length}</span>
        </div>
      </div>

      {/* Mountains with words */}
      <AnimatePresence>
        {mountains.map(mountain => (
          !mountain.destroyed ? (
            <motion.div
              key={mountain.id}
              className="absolute flex flex-col items-center"
              style={{ 
                left: `${mountain.x}%`, 
                bottom: '15%',
              }}
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {/* Word above mountain */}
              <motion.div
                className="bg-amber-900/95 px-4 py-2 rounded-lg mb-2 border-2 border-amber-500 shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <span className="text-white font-black text-xl uppercase tracking-wider">
                  {mountain.word}
                </span>
              </motion.div>
              
              {/* Mountain visual */}
              <svg 
                width={80} 
                height={mountain.height} 
                viewBox="0 0 80 100" 
                className="drop-shadow-2xl"
              >
                <defs>
                  <linearGradient id={`mountainGrad-${mountain.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#78716c" />
                    <stop offset="50%" stopColor="#57534e" />
                    <stop offset="100%" stopColor="#44403c" />
                  </linearGradient>
                </defs>
                {/* Mountain shape */}
                <path 
                  d="M40 5 L75 95 L5 95 Z" 
                  fill={`url(#mountainGrad-${mountain.id})`}
                  stroke="#292524"
                  strokeWidth="2"
                />
                {/* Snow cap */}
                <path 
                  d="M40 5 L55 35 L25 35 Z" 
                  fill="#d6d3d1"
                  opacity="0.8"
                />
                {/* Rocky texture */}
                <path d="M30 50 L35 60" stroke="#292524" strokeWidth="2"/>
                <path d="M50 55 L55 70" stroke="#292524" strokeWidth="2"/>
                <path d="M35 75 L45 85" stroke="#292524" strokeWidth="2"/>
              </svg>
              
              {/* Dust cloud at base */}
              <motion.div
                className="absolute -bottom-2 w-24 h-6 bg-amber-700/40 rounded-full blur-md"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`destroyed-${mountain.id}`}
              className="absolute"
              style={{ left: `${mountain.x}%`, bottom: '20%' }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 2, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-5xl">💥</div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
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
          {isMicActive ? (
            <Mic className="h-10 w-10 text-white" />
          ) : (
            <MicOff className="h-10 w-10 text-slate-400" />
          )}
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
      <div className="absolute bottom-4 right-4 flex gap-3 z-20">
        <div className="px-4 py-2 bg-emerald-700/90 rounded-lg border border-emerald-500">
          <span className="text-white font-bold">Crushed: {destroyed}</span>
        </div>
        <div className="px-4 py-2 bg-red-700/90 rounded-lg border border-red-500">
          <span className="text-white font-bold">Hit: {missed}</span>
        </div>
      </div>
    </motion.div>
  );
};
