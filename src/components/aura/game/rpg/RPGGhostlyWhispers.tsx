import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Radio } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";
import { speechManager } from "@/lib/speechRecognitionManager";

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

  const isMountedRef = useRef(true);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);
  const ghostsRef = useRef<GhostWord[]>([]);
  const gameOverRef = useRef(false);
  const completionTriggeredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onWordHitRef = useRef(onWordHit);

  // Keep refs in sync
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onWordHitRef.current = onWordHit; }, [onWordHit]);
  useEffect(() => { ghostsRef.current = ghosts; }, [ghosts]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

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
    ghostsRef.current = initialGhosts;
  }, [words]);

  // Fade animation - words fade over time
  useEffect(() => {
    if (gameOver) return;
    
    const interval = setInterval(() => {
      setGhosts(prev => {
        const updated = prev.map(ghost => {
          if (ghost.destroyed) return ghost;
          const newOpacity = ghost.opacity - 0.008;
          if (newOpacity <= 0) {
            missedRef.current += 1;
            setMissed(missedRef.current);
            onWordHitRef.current(10);
            soundEffects.incorrectWord();
            return { ...ghost, destroyed: true, opacity: 0 };
          }
          return { ...ghost, opacity: newOpacity };
        });
        
        // Check completion
        const allDone = updated.every(g => g.destroyed);
        if (allDone && !gameOverRef.current && !completionTriggeredRef.current) {
          completionTriggeredRef.current = true;
          setGameOver(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              onCompleteRef.current(destroyedRef.current, missedRef.current);
            }
          }, 500);
        }
        
        return updated;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Handle ghost destruction
  const handleGhostDestroy = useCallback((ghostId: number) => {
    setGhosts(prev => prev.map(g => 
      g.id === ghostId ? { ...g, destroyed: true } : g
    ));
    destroyedRef.current += 1;
    setDestroyed(destroyedRef.current);
    soundEffects.correctWord();
  }, []);

  // Speech recognition via speechManager
  useEffect(() => {
    if (gameOver) return;

    const timer = setTimeout(() => {
      setIsMicActive(true);
      speechManager.start({
        owner: 'ghostly_whispers',
        continuous: true,
        interimResults: true,
        onStart: () => { if (isMountedRef.current) setIsMicActive(true); },
        onEnd: () => { if (isMountedRef.current) setIsMicActive(false); },
        onResult: (transcript) => {
          if (!isMountedRef.current || gameOverRef.current) return;
          const spokenWords = transcript.toLowerCase().trim().split(/\s+/);
          const currentGhosts = ghostsRef.current;
          const activeGhosts = currentGhosts.filter(g => !g.destroyed);

          for (const ghost of activeGhosts) {
            const targetWord = ghost.word.toLowerCase();
            for (const spoken of spokenWords) {
              const cleanSpoken = spoken.replace(/[^a-z]/g, '');
              if (cleanSpoken.length >= 1) {
                const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 2)) || 
                                        cleanSpoken.startsWith(targetWord.slice(0, 2));
                const containsMatch = targetWord.includes(cleanSpoken) || 
                                      cleanSpoken.includes(targetWord);
                const exactMatch = cleanSpoken === targetWord;
                
                if (exactMatch || startsWithMatch || containsMatch) {
                  handleGhostDestroy(ghost.id);
                  return; // one match per result
                }
              }
            }
          }
        },
        onError: (error) => {
          console.log('[GhostlyWhispers] Recognition error:', error);
        },
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      speechManager.stop('ghostly_whispers');
    };
  }, [gameOver, handleGhostDestroy]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    completionTriggeredRef.current = false;
    return () => {
      isMountedRef.current = false;
      speechManager.abort('ghostly_whispers');
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-50">
      {/* Dark misty background */}
      {(() => { const t = getMinigameTheme('ghostlyWhispers'); const agent = isAgentMode(); return (
      <>
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${t.bgGradient}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Mist particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-32 h-32 ${agent ? 'bg-cyan-500/10' : 'bg-purple-500/10'} rounded-full blur-3xl`}
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
        <div className={`px-6 py-2 ${agent ? 'bg-slate-800/90' : 'bg-purple-900/90'} rounded-lg border-2 ${t.accentColor}`}>
          <span className="text-white font-black text-lg">{t.emoji} {t.title} {t.subtitle ? t.subtitle : ''} {t.emoji}</span>
        </div>
      </motion.div>
      </>
      ); })()}

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

      {/* Mic indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          className={`p-6 rounded-full ${
            isMicActive 
              ? 'bg-purple-600 shadow-[0_0_30px_rgba(147,51,234,0.6)]' 
              : 'bg-slate-700'
          }`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
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
