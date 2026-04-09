import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Crosshair, Zap } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";
import { speechManager } from "@/lib/speechRecognitionManager";

const agentMode = isAgentMode();
const theme = getMinigameTheme('wordCannon');

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

  const isMountedRef = useRef(true);
  const scoreRef = useRef(0);
  const targetsRef = useRef<CannonTarget[]>([]);
  const completionTriggeredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const completeGame = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    speechManager.stop('word_cannon');
    setIsMicActive(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    
    const missed = targetsRef.current.filter(t => !t.destroyed).length;
    if (missed > 0) onDamage(missed * 8);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        onCompleteRef.current(scoreRef.current, scoreRef.current * 12);
      }
    }, 500);
  }, [onDamage]);

  // Initialize targets
  useEffect(() => {
    completionTriggeredRef.current = false;
    scoreRef.current = 0;
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
    if (completionTriggeredRef.current) return;

    timerRef.current = setInterval(() => {
      if (completionTriggeredRef.current) return;
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [completeGame]);

  const destroyTarget = useCallback((targetId: string) => {
    if (completionTriggeredRef.current) return;
    setTargets(prev => {
      const updated = prev.map(t => t.id === targetId ? { ...t, destroyed: true } : t);
      targetsRef.current = updated;
      return updated;
    });
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setShowBlast(targetId);
    soundEffects.correctWord();
    setTimeout(() => setShowBlast(null), 400);

    setCurrentTargetIndex(() => {
      const updated = targetsRef.current;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i].destroyed) return i;
      }
      return 0;
    });

    if (targetsRef.current.every(t => t.destroyed)) {
      completeGame();
    }
  }, [completeGame]);

  // Start listening via speechManager
  const startListening = useCallback(() => {
    if (completionTriggeredRef.current) return;

    speechManager.start({
      owner: 'word_cannon',
      continuous: true,
      interimResults: true,
      onStart: () => { if (isMountedRef.current) setIsMicActive(true); },
      onEnd: () => { if (isMountedRef.current) setIsMicActive(false); },
      onResult: (transcript, alternatives) => {
        if (completionTriggeredRef.current) return;

        const allTranscripts = [transcript, ...alternatives];
        for (const t of allTranscripts) {
          const spokenWords = t.toLowerCase().trim().split(/\s+/);
          for (const target of targetsRef.current) {
            if (target.destroyed) continue;
            for (const spoken of spokenWords) {
              const cleanSpoken = spoken.replace(/[^a-z']/g, '');
              if (cleanSpoken.length >= 1 && isWordMatchLenient(cleanSpoken, target.word)) {
                destroyTarget(target.id);
                break;
              }
            }
          }
        }
      },
      onError: (error) => {
        console.log('[WordCannon] Recognition error:', error);
      },
    });
  }, [destroyTarget]);

  // Auto-start mic on mount
  useEffect(() => {
    const timer = setTimeout(() => startListening(), 500);
    return () => clearTimeout(timer);
  }, [startListening]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechManager.abort('word_cannon');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, []);

  const currentTarget = targets[currentTargetIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 bg-gradient-to-br ${agentMode ? 'from-slate-950 via-gray-900 to-slate-950' : 'from-slate-950 via-indigo-950 to-violet-950'}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
        ))}
      </div>

      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-16 left-1/2 -translate-x-1/2 z-50">
        <div className={`bg-gradient-to-r ${theme.accentGradient} px-6 py-3 rounded-lg shadow-lg border ${theme.accentColor}/50`}>
          <div className="flex items-center gap-3 text-white">
            <Crosshair className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">{agentMode ? 'PRECISION STRIKE! Speak to eliminate targets!' : 'WORD CANNON! Speak to blast targets!'}</span>
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
      </div>

      <div className="absolute inset-0">
        <AnimatePresence>
          {targets.map((target, index) => (
            !target.destroyed && (
              <motion.div key={target.id} className="absolute z-20" style={{ left: `${target.x}%`, top: `${target.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: target.scale, opacity: 1, y: [0, -8, 0] }}
                exit={{ scale: 2.5, opacity: 0, transition: { duration: 0.3 } }}
                transition={{ y: { repeat: Infinity, duration: 2 + index * 0.3, ease: "easeInOut" } }}
              >
                <motion.div
                  className={`relative w-32 h-20 rounded-2xl flex items-center justify-center border-2 ${
                    index === currentTargetIndex
                      ? 'bg-gradient-to-br from-violet-600/90 to-indigo-700/90 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]'
                      : 'bg-gradient-to-br from-slate-700/90 to-slate-800/90 border-violet-500/50'
                  }`}
                  animate={index === currentTargetIndex ? { boxShadow: ['0 0 20px rgba(250,204,21,0.3)', '0 0 40px rgba(250,204,21,0.6)', '0 0 20px rgba(250,204,21,0.3)'] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <span className="font-black text-xl uppercase tracking-wider text-white px-2" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000' }}>
                    {target.word}
                  </span>
                  {index === currentTargetIndex && (
                    <motion.div className="absolute -inset-3 rounded-3xl border-2 border-yellow-400/50" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                  )}
                </motion.div>
                {showBlast === target.id && (
                  <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.4 }}>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 via-violet-500 to-indigo-500 blur-lg" />
                  </motion.div>
                )}
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {currentTarget && !currentTarget.destroyed && (
        <motion.div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <div className="bg-slate-900/95 border-2 border-yellow-400/60 rounded-xl px-8 py-4 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
            <p className="text-yellow-300 text-sm mb-1 text-center font-medium">🎯 Say this word:</p>
            <p className="text-3xl font-black text-white text-center uppercase tracking-wider">{currentTarget.word}</p>
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          className={`p-5 rounded-full cursor-pointer ${isMicActive ? 'bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.6)]' : 'bg-slate-700'}`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Mic className={`h-8 w-8 ${isMicActive ? 'text-white' : 'text-slate-400'}`} />
        </motion.div>
        {isMicActive && (
          <motion.p className="text-center text-violet-300 mt-2 font-medium text-sm" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
            🎤 Listening...
          </motion.p>
        )}
      </div>

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
