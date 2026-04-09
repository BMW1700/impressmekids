import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Bomb } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";
import { speechManager } from "@/lib/speechRecognitionManager";

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

  const isMountedRef = useRef(true);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);
  const bouldersRef = useRef<Boulder[]>([]);
  const completionTriggeredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const completeGame = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    speechManager.stop('rolling_boulders');
    setIsMicActive(false);
    setTimeout(() => {
      if (isMountedRef.current) {
        onCompleteRef.current(destroyedRef.current, missedRef.current);
      }
    }, 500);
  }, []);

  // Initialize boulders
  useEffect(() => {
    completionTriggeredRef.current = false;
    destroyedRef.current = 0;
    missedRef.current = 0;
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
    if (completionTriggeredRef.current) return;
    
    const interval = setInterval(() => {
      if (completionTriggeredRef.current) return;
      setBoulders(prev => {
        const updated = prev.map(boulder => {
          if (boulder.destroyed) return boulder;
          const newX = boulder.x - boulder.speed;
          const newRotation = boulder.rotation - boulder.speed * 5;
          
          if (newX <= 10) {
            missedRef.current += 1;
            setMissed(missedRef.current);
            onWordHit(12);
            soundEffects.incorrectWord();
            return { ...boulder, destroyed: true, x: newX };
          }
          
          return { ...boulder, x: newX, rotation: newRotation };
        });
        
        const allDone = updated.every(b => b.destroyed);
        if (allDone) {
          completeGame();
        }
        
        bouldersRef.current = updated;
        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [completeGame, onWordHit]);

  const handleBoulderDestroy = useCallback((boulderId: number) => {
    if (completionTriggeredRef.current) return;
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

  // Start listening via speechManager
  const startListening = useCallback(() => {
    if (completionTriggeredRef.current) return;

    speechManager.start({
      owner: 'rolling_boulders',
      continuous: true,
      interimResults: true,
      onStart: () => { if (isMountedRef.current) setIsMicActive(true); },
      onEnd: () => { if (isMountedRef.current) setIsMicActive(false); },
      onResult: (transcript, alternatives) => {
        if (completionTriggeredRef.current) return;

        const allTranscripts = [transcript, ...alternatives];
        for (const t of allTranscripts) {
          const spokenWords = t.toLowerCase().trim().split(/\s+/);
          const activeBoulders = bouldersRef.current.filter(b => !b.destroyed);
          
          for (const boulder of activeBoulders) {
            for (const spoken of spokenWords) {
              const cleanSpoken = spoken.replace(/[^a-z]/g, '');
              if (cleanSpoken.length >= 1 && isWordMatchLenient(cleanSpoken, boulder.word)) {
                handleBoulderDestroy(boulder.id);
                break;
              }
            }
          }
        }
      },
      onError: (error) => {
        console.log('[RollingBoulders] Recognition error:', error);
      },
    });
  }, [handleBoulderDestroy]);

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
      speechManager.abort('rolling_boulders');
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-50">
      {(() => { const t = getMinigameTheme('rollingBoulders'); const agent = isAgentMode(); return (
      <>
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${agent ? 'from-slate-800/70 via-gray-900/50 to-slate-900/80' : 'from-stone-800/70 via-amber-900/50 to-stone-900/80'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute bottom-0 w-40 h-20 ${agent ? 'bg-gray-700/20' : 'bg-amber-700/20'} rounded-full blur-2xl`}
          style={{ left: `${i * 12}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

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

      <div className="absolute left-[8%] top-[20%] bottom-[20%] w-2 bg-red-500/50 rounded-full">
        <motion.div
          className="absolute inset-0 bg-red-400"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>

      <AnimatePresence>
        {boulders.map((boulder) => (
          !boulder.destroyed && (
            <motion.div
              key={boulder.id}
              className="absolute z-20"
              style={{ left: `${boulder.x}%`, top: `${boulder.y}%`, width: boulder.size, height: boulder.size }}
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: boulder.rotation }}
              exit={{ scale: 1.5, opacity: 0, y: -50 }}
            >
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700 shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.5),5px_5px_15px_rgba(0,0,0,0.4)] border-2 border-stone-600 flex items-center justify-center">
                <span className="font-black text-sm text-stone-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.8)' }}>
                  {boulder.word}
                </span>
                <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-stone-600 rounded-full" />
                <div className="absolute top-[60%] right-[25%] w-3 h-3 bg-stone-600 rounded-full" />
                <div className="absolute bottom-[30%] left-[30%] w-2 h-2 bg-stone-700 rounded-full" />
              </div>
              <motion.div
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-700/30 rounded-full blur-md"
                animate={{ opacity: [0.5, 0.2, 0.5], x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />
            </motion.div>
          )
        ))}
      </AnimatePresence>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          className={`p-6 rounded-full cursor-pointer ${isMicActive ? 'bg-amber-600 shadow-[0_0_30px_rgba(217,119,6,0.6)]' : 'bg-slate-700'}`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Mic className={`h-10 w-10 ${isMicActive ? 'text-white' : 'text-slate-400'}`} />
        </motion.div>
        {isMicActive && (
          <motion.p className="text-center text-amber-300 mt-2 font-medium" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
            🎤 Listening...
          </motion.p>
        )}
      </div>

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
