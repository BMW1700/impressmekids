import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake } from "lucide-react";

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
  const recognitionRef = useRef<any>(null);
  const freezeStartRef = useRef<number>(Date.now());

  // Initialize crystals - but only show one at a time
  useEffect(() => {
    const initialCrystals: IceCrystal[] = words.map((word, i) => ({
      id: i,
      word,
      x: 50, // Center position for the active crystal
      y: 40,
      rotation: 0,
      freezeProgress: 0,
      destroyed: false,
      selected: false,
    }));
    setCrystals(initialCrystals);
    freezeStartRef.current = Date.now();
  }, [words]);

  const currentCrystal = crystals[currentCrystalIndex];

  // Move to next crystal
  const advanceToNextCrystal = useCallback((wasDestroyed: boolean) => {
    if (wasDestroyed) {
      setDestroyed(d => d + 1);
    } else {
      setMissed(m => m + 1);
      onWordHit(8);
    }

    // Mark current crystal as destroyed
    setCrystals(prev => prev.map((c, idx) => 
      idx === currentCrystalIndex ? { ...c, destroyed: true } : c
    ));

    // Move to next
    const nextIndex = currentCrystalIndex + 1;
    if (nextIndex >= crystals.length) {
      // Game complete
      setGameComplete(true);
    } else {
      setCurrentCrystalIndex(nextIndex);
      freezeStartRef.current = Date.now();
    }
  }, [currentCrystalIndex, crystals.length, onWordHit]);

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

  // Complete callback
  useEffect(() => {
    if (gameComplete) {
      setTimeout(() => onComplete(destroyed, missed), 500);
    }
  }, [gameComplete, destroyed, missed, onComplete]);

  // Handle crystal selection (auto-select current one)
  const handleSelectCrystal = useCallback(() => {
    if (!currentCrystal || currentCrystal.destroyed || isListening) return;
    
    setCrystals(prev => prev.map((c, idx) => ({
      ...c,
      selected: idx === currentCrystalIndex
    })));
    startListening();
  }, [currentCrystal, currentCrystalIndex, isListening]);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!currentCrystal) return;

    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => {
      setIsListening(false);
      // Clear selection
      setCrystals(prev => prev.map(c => ({ ...c, selected: false })));
    };

    recognitionRef.current.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript.toLowerCase().trim();
      const expected = currentCrystal.word.toLowerCase().replace(/[^a-z]/g, '');
      
      if (spoken.includes(expected) || expected.includes(spoken)) {
        // Success - shatter crystal
        advanceToNextCrystal(true);
      }
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      setCrystals(prev => prev.map(c => ({ ...c, selected: false })));
    };

    recognitionRef.current.start();
  }, [currentCrystal, advanceToNextCrystal]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-50">
      {/* Frozen background overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-cyan-900/60 via-blue-900/40 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Snowflakes */}
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
          <Snowflake size={12 + Math.random() * 12} />
        </motion.div>
      ))}

      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="px-6 py-2 bg-cyan-600/90 rounded-lg border-2 border-cyan-300">
          <span className="text-white font-black text-lg">❄️ ICE CRYSTAL BARRAGE ❄️</span>
        </div>
      </motion.div>

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
            style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, rotate: -15 }}
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
