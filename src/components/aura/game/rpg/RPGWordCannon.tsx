import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Crosshair, Zap } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";

interface CannonTarget {
  id: string;
  word: string;
  x: number;
  y: number;
  destroyed: boolean;
  scale: number;
}

interface RPGWordCannonProps {
  words: string[];
  onComplete: (score: number, damage: number) => void;
  onDamage: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGWordCannon = ({
  words,
  onComplete,
  onDamage,
}: RPGWordCannonProps) => {
  const [targets, setTargets] = useState<CannonTarget[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [showBlast, setShowBlast] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const scoreRef = useRef(0);
  const targetsRef = useRef<CannonTarget[]>([]);
  const isActiveRef = useRef(true);

  // Initialize targets in a grid/scatter layout
  useEffect(() => {
    const limitedWords = words.slice(0, 6);
    const initialTargets: CannonTarget[] = limitedWords.map((word, index) => ({
      id: `target-${index}`,
      word: word.replace(/[^a-zA-Z']/g, '').toLowerCase(),
      x: 15 + (index % 3) * 30 + Math.random() * 10,
      y: 30 + Math.floor(index / 3) * 25 + Math.random() * 10,
      destroyed: false,
      scale: 0.9 + Math.random() * 0.3,
    }));
    setTargets(initialTargets);
    targetsRef.current = initialTargets;
  }, [words]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          isActiveRef.current = false;
          setIsActive(false);
          // Count missed targets as damage
          const missed = targetsRef.current.filter(t => !t.destroyed).length;
          if (missed > 0) onDamage(missed * 8);
          setTimeout(() => {
            onComplete(scoreRef.current, scoreRef.current * 12);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete, onDamage]);

  // Handle target destruction
  const destroyTarget = useCallback((targetId: string) => {
    setTargets(prev => {
      const updated = prev.map(t =>
        t.id === targetId ? { ...t, destroyed: true } : t
      );
      targetsRef.current = updated;
      return updated;
    });
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setShowBlast(targetId);
    soundEffects.correctWord();

    setTimeout(() => setShowBlast(null), 400);

    // Auto-advance to next undestroyed target
    setCurrentTargetIndex(prev => {
      const updated = targetsRef.current;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i].destroyed) return i;
      }
      return prev;
    });

    // Check if all destroyed
    const allDone = targetsRef.current.every(t => t.destroyed);
    if (allDone) {
      isActiveRef.current = false;
      setIsActive(false);
      setTimeout(() => {
        onComplete(scoreRef.current, scoreRef.current * 12);
      }, 500);
    }
  }, [onComplete]);

  // Continuous speech recognition
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

          const currentTargets = targetsRef.current;
          for (const target of currentTargets) {
            if (target.destroyed) continue;

            for (const spoken of spokenWords) {
              const cleanSpoken = spoken.replace(/[^a-z']/g, '');
              if (cleanSpoken.length < 2) continue;

              const targetWord = target.word;
              const exactMatch = cleanSpoken === targetWord;
              const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 3)) ||
                cleanSpoken.startsWith(targetWord.slice(0, 3));
              const containsMatch = targetWord.includes(cleanSpoken) ||
                cleanSpoken.includes(targetWord);

              if (exactMatch || startsWithMatch || containsMatch) {
                destroyTarget(target.id);
                break;
              }
            }
          }
        }
      };

      recognition.onerror = () => {
        if (isListeningRef.current && isActiveRef.current) {
          setTimeout(() => startListening(), 200);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && isActiveRef.current) {
          setTimeout(() => startListening(), 100);
        }
      };

      recognition.start();
    } catch {}
  }, [destroyTarget]);

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

  const currentTarget = targets[currentTargetIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950"
    >
      {/* Star field background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-violet-400/50">
          <div className="flex items-center gap-3 text-white">
            <Crosshair className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">WORD CANNON! Speak to blast targets!</span>
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Timer */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Targets */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {targets.map((target, index) => (
            !target.destroyed && (
              <motion.div
                key={target.id}
                className="absolute z-20"
                style={{
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: target.scale,
                  opacity: 1,
                  y: [0, -8, 0],
                }}
                exit={{
                  scale: 2.5,
                  opacity: 0,
                  transition: { duration: 0.3 },
                }}
                transition={{
                  y: { repeat: Infinity, duration: 2 + index * 0.3, ease: "easeInOut" },
                }}
              >
                {/* Target bubble */}
                <motion.div
                  className={`relative w-32 h-20 rounded-2xl flex items-center justify-center border-2 ${
                    index === currentTargetIndex
                      ? 'bg-gradient-to-br from-violet-600/90 to-indigo-700/90 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]'
                      : 'bg-gradient-to-br from-slate-700/90 to-slate-800/90 border-violet-500/50'
                  }`}
                  animate={index === currentTargetIndex ? {
                    boxShadow: [
                      '0 0 20px rgba(250,204,21,0.3)',
                      '0 0 40px rgba(250,204,21,0.6)',
                      '0 0 20px rgba(250,204,21,0.3)',
                    ],
                  } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <span
                    className="font-black text-xl uppercase tracking-wider text-white px-2"
                    style={{
                      textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
                    }}
                  >
                    {target.word}
                  </span>

                  {/* Crosshair on active target */}
                  {index === currentTargetIndex && (
                    <motion.div
                      className="absolute -inset-3 rounded-3xl border-2 border-yellow-400/50"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  )}
                </motion.div>

                {/* Blast effect */}
                {showBlast === target.id && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 via-violet-500 to-indigo-500 blur-lg" />
                  </motion.div>
                )}
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Current target prompt */}
      {currentTarget && !currentTarget.destroyed && (
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="bg-slate-900/95 border-2 border-yellow-400/60 rounded-xl px-8 py-4
            shadow-[0_0_30px_rgba(250,204,21,0.3)]">
            <p className="text-yellow-300 text-sm mb-1 text-center font-medium">🎯 Say this word:</p>
            <p className="text-3xl font-black text-white text-center uppercase tracking-wider">
              {currentTarget.word}
            </p>
          </div>
        </motion.div>
      )}

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          className={`p-5 rounded-full cursor-pointer ${
            isMicActive
              ? 'bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.6)]'
              : 'bg-slate-700'
          }`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          onClick={() => isMicActive ? stopMic() : startMic()}
        >
          <Mic className={`h-8 w-8 ${isMicActive ? 'text-white' : 'text-slate-400'}`} />
        </motion.div>
        {isMicActive && (
          <motion.p
            className="text-center text-violet-300 mt-2 font-medium text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎤 Listening...
          </motion.p>
        )}
      </div>

      {/* Score */}
      <div className="absolute top-28 right-6 pointer-events-auto">
        <div className="bg-slate-900/90 rounded-lg p-4 border border-violet-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Zap className="h-5 w-5 text-violet-400" />
            <span className="font-bold text-lg">{score}</span>
            <span className="text-sm text-slate-400">blasted</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Remaining: {targets.filter(t => !t.destroyed).length}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
