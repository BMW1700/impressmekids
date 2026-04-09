import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Zap } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";
import { speechManager } from "@/lib/speechRecognitionManager";

interface IceCrystal {
  id: number;
  word: string;
  x: number;
  y: number;
  rotation: number;
  freezeProgress: number;
  destroyed: boolean;
  selected: boolean;
}

interface RPGIceCrystalBarrageProps {
  words: string[];
  onComplete: (destroyed: number, missed: number) => void;
  onWordHit: (damage: number) => void;
}

export const RPGIceCrystalBarrage = ({
  words,
  onComplete,
  onWordHit,
}: RPGIceCrystalBarrageProps) => {
  const [crystals, setCrystals] = useState<IceCrystal[]>([]);
  const [currentCrystalIndex, setCurrentCrystalIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const freezeStartRef = useRef<number>(Date.now());
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);
  const currentCrystalIndexRef = useRef(0);
  const crystalsRef = useRef<IceCrystal[]>([]);
  const completionTriggeredRef = useRef(false);
  const gameCompleteRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onWordHitRef = useRef(onWordHit);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onWordHitRef.current = onWordHit; }, [onWordHit]);
  useEffect(() => { currentCrystalIndexRef.current = currentCrystalIndex; }, [currentCrystalIndex]);
  useEffect(() => { crystalsRef.current = crystals; }, [crystals]);

  // Initialize crystals - each with random positions
  useEffect(() => {
    completionTriggeredRef.current = false;
    gameCompleteRef.current = false;
    destroyedRef.current = 0;
    missedRef.current = 0;
    setDestroyed(0);
    setMissed(0);
    setCurrentCrystalIndex(0);
    currentCrystalIndexRef.current = 0;
    setGameComplete(false);
    setIsListening(false);
    speechManager.stop('ice_crystal');

    const initialCrystals: IceCrystal[] = words.map((word, i) => ({
      id: i,
      word,
      x: 20 + Math.random() * 60, // Random X position: 20% to 80%
      y: 25 + Math.random() * 30, // Random Y position: 25% to 55%
      rotation: Math.random() * 30 - 15, // Random rotation -15 to 15
      freezeProgress: 0,
      destroyed: false,
      selected: false,
    }));
    setCrystals(initialCrystals);
    crystalsRef.current = initialCrystals;
    freezeStartRef.current = Date.now();
  }, [words]);

  const currentCrystal = crystals[currentCrystalIndex];

  const completeGame = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    gameCompleteRef.current = true;
    speechManager.stop('ice_crystal');
    setIsListening(false);
    setGameComplete(true);
    setTimeout(() => {
      onCompleteRef.current(destroyedRef.current, missedRef.current);
    }, 500);
  }, []);

  // Move to next crystal
  const advanceToNextCrystal = useCallback((wasDestroyed: boolean) => {
    if (gameCompleteRef.current || completionTriggeredRef.current) return;

    speechManager.stop('ice_crystal');
    setIsListening(false);

    const activeIndex = currentCrystalIndexRef.current;

    if (wasDestroyed) {
      destroyedRef.current += 1;
      setDestroyed(destroyedRef.current);
    } else {
      missedRef.current += 1;
      setMissed(missedRef.current);
      onWordHitRef.current(8);
    }

    // Mark current crystal as destroyed
    setCrystals(prev => {
      const updated = prev.map((c, idx) => 
        idx === activeIndex ? { ...c, destroyed: true, selected: false } : c
      );
      crystalsRef.current = updated;
      return updated;
    });

    // Move to next
    const nextIndex = activeIndex + 1;
    if (nextIndex >= crystalsRef.current.length) {
      completeGame();
    } else {
      currentCrystalIndexRef.current = nextIndex;
      setCurrentCrystalIndex(nextIndex);
      freezeStartRef.current = Date.now();
      // Randomize position for the next crystal
      setCrystals(prev => {
        const updated = prev.map((c, idx) => 
          idx === nextIndex ? { 
            ...c, 
            x: 20 + Math.random() * 60,
            y: 25 + Math.random() * 30,
            rotation: Math.random() * 30 - 15,
            freezeProgress: 0,
            selected: false,
          } : c
        );
        crystalsRef.current = updated;
        return updated;
      });
    }
  }, [completeGame]);

  // Freeze progress animation - only for current crystal
  useEffect(() => {
    if (gameComplete || !currentCrystal || currentCrystal.destroyed) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - freezeStartRef.current;
      const progress = Math.min((elapsed / 8000) * 100, 100); // 8 seconds to freeze

      setCrystals(prev => prev.map((crystal, idx) => {
        if (idx !== currentCrystalIndex || crystal.destroyed) return crystal;
        return { ...crystal, freezeProgress: progress };
      }));

      // Crystal fully frozen
      if (progress >= 100) {
        advanceToNextCrystal(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentCrystalIndex, gameComplete, currentCrystal, advanceToNextCrystal]);

  // Handle crystal selection (auto-select current one)
  const handleSelectCrystal = useCallback(() => {
    const activeIndex = currentCrystalIndexRef.current;
    const activeCrystal = crystalsRef.current[activeIndex];
    if (!activeCrystal || activeCrystal.destroyed || gameCompleteRef.current) return;
    
    setCrystals(prev => {
      const updated = prev.map((c, idx) => ({
        ...c,
        selected: idx === activeIndex,
      }));
      crystalsRef.current = updated;
      return updated;
    });
    startListening();
  }, []);

  // Start speech recognition
  const startListening = useCallback(() => {
    const activeCrystal = crystalsRef.current[currentCrystalIndexRef.current];
    if (!activeCrystal || activeCrystal.destroyed || gameCompleteRef.current) return;

    speechManager.start({
      owner: 'ice_crystal',
      continuous: true,
      interimResults: true,
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onResult: (transcript, alternatives) => {
        const crystal = crystalsRef.current[currentCrystalIndexRef.current];
        if (!crystal || crystal.destroyed || gameCompleteRef.current) return;

        const targetWord = crystal.word.toLowerCase().replace(/[^a-z']/g, '');
        const matched = [transcript, ...alternatives].some((candidate) =>
          candidate
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .some((spoken) => {
              const cleanSpoken = spoken.replace(/[^a-z']/g, '');
              return cleanSpoken.length >= 1 && isWordMatchLenient(cleanSpoken, targetWord);
            })
        );

        if (matched) {
          advanceToNextCrystal(true);
        }
      },
      onError: () => setIsListening(false),
    });
  }, [advanceToNextCrystal]);

  useEffect(() => {
    return () => {
      speechManager.abort('ice_crystal');
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-50">
      {/* Frozen background overlay */}
      {(() => { const t = getMinigameTheme('iceCrystalBarrage'); const agent = isAgentMode(); return (
      <>
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${t.bgGradient}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Snowflakes / particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/60"
          style={{ left: `${Math.random() * 100}%`, top: -20 }}
          animate={{
            y: [0, window.innerHeight + 40],
            x: [0, Math.random() * 100 - 50],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          {agent ? <Zap size={12 + Math.random() * 12} /> : <Snowflake size={12 + Math.random() * 12} />}
        </motion.div>
      ))}

      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className={`px-6 py-2 ${agent ? 'bg-blue-800/90' : 'bg-cyan-600/90'} rounded-lg border-2 ${t.accentColor}`}>
          <span className="text-white font-black text-lg">{t.emoji} {t.title} {t.emoji}</span>
        </div>
      </motion.div>
      </>
      ); })()}

      {/* Progress indicator */}
      <motion.div
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="px-4 py-2 bg-slate-800/80 rounded-lg border border-cyan-500/50">
          <span className="text-cyan-300 text-sm font-bold">
            Crystal {currentCrystalIndex + 1} of {crystals.length}
          </span>
        </div>
      </motion.div>

      {/* Current Crystal - Large and centered */}
      <AnimatePresence mode="wait">
        {currentCrystal && !currentCrystal.destroyed && !gameComplete && (
          <motion.button
            key={currentCrystal.id}
            className="absolute pointer-events-auto cursor-pointer z-30"
            style={{ left: `${currentCrystal.x}%`, top: `${currentCrystal.y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, rotate: currentCrystal.rotation }}
            animate={{ 
              scale: 1, 
              rotate: [0, 3, -3, 0],
            }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 3 },
              scale: { duration: 0.4 },
            }}
            onClick={handleSelectCrystal}
          >
            {/* Large Crystal shape */}
            <div className={`relative p-6 ${currentCrystal.selected ? 'scale-110' : ''}`}>
              {/* Crystal body - larger */}
              <div 
                className="relative px-12 py-8 bg-gradient-to-br from-cyan-200 via-blue-300 to-cyan-400 
                  rounded-lg border-4 border-cyan-100 shadow-[0_0_50px_rgba(34,211,238,0.7)]"
                style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              >
                {/* Word */}
                <span className="font-black text-3xl text-cyan-900 drop-shadow-sm">
                  {currentCrystal.word}
                </span>

                {/* Freeze overlay - grows from bottom */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-white/90 via-cyan-100/70 to-transparent rounded-lg pointer-events-none"
                  style={{ 
                    height: `${currentCrystal.freezeProgress}%`, 
                    bottom: 0, 
                    top: 'auto',
                    position: 'absolute'
                  }}
                />
              </div>

              {/* Large freeze progress bar */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-3 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${100 - currentCrystal.freezeProgress}%` }}
                />
              </div>

              {/* Time remaining text */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-cyan-300 text-sm font-bold">
                {Math.ceil((100 - currentCrystal.freezeProgress) / 12.5)}s remaining
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Click to speak instruction */}
      {!isListening && currentCrystal && !currentCrystal.destroyed && !gameComplete && (
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="px-6 py-3 bg-cyan-800/90 rounded-xl border-2 border-cyan-400 shadow-lg">
            <p className="text-cyan-100 text-lg font-bold">👆 Tap the crystal and speak:</p>
            <p className="text-4xl font-black text-white text-center mt-1">{currentCrystal.word}</p>
          </div>
        </motion.div>
      )}

      {/* Listening panel */}
      <AnimatePresence>
        {isListening && currentCrystal && (
          <motion.div
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="px-8 py-4 bg-cyan-900/95 rounded-xl border-2 border-cyan-400 shadow-2xl">
              <p className="text-cyan-300 text-sm mb-2">Speak the word:</p>
              <p className="text-4xl font-black text-white">{currentCrystal.word}</p>
              <motion.div 
                className="mt-3 flex items-center justify-center gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className="w-3 h-3 bg-cyan-400 rounded-full" />
                <span className="text-cyan-400 text-lg">Listening...</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini crystal progress - shows completed/remaining */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {crystals.map((crystal, idx) => (
          <motion.div
            key={crystal.id}
            className={`w-4 h-4 rounded-full border-2 ${
              idx < currentCrystalIndex
                ? crystal.destroyed && idx <= currentCrystalIndex - 1 && destroyed > missed - (crystals.slice(0, idx + 1).filter(c => c.destroyed).length - destroyed) 
                  ? 'bg-emerald-400 border-emerald-300' // Shattered (success)
                  : 'bg-red-400 border-red-300' // Frozen (missed)
                : idx === currentCrystalIndex
                  ? 'bg-cyan-400 border-cyan-200 animate-pulse'
                  : 'bg-slate-600 border-slate-500'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          />
        ))}
      </div>

      {/* Score display */}
      <div className="absolute bottom-4 right-4 flex gap-4 z-50">
        <div className="px-4 py-2 bg-emerald-600/90 rounded-lg">
          <span className="text-white font-bold">Shattered: {destroyed}</span>
        </div>
        <div className="px-4 py-2 bg-red-600/90 rounded-lg">
          <span className="text-white font-bold">Frozen: {missed}</span>
        </div>
      </div>
    </div>
  );
};
