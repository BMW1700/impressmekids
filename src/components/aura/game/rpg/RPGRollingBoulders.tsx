import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Boulder {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  rotation: number;
  destroyed: boolean;
  selected: boolean;
  cracked: boolean;
}

interface RPGRollingBouldersProps {
  words: string[];
  onComplete: (destroyed: number, missed: number) => void;
  onWordHit: (damage: number) => void;
}

export const RPGRollingBoulders = ({
  words,
  onComplete,
  onWordHit,
}: RPGRollingBouldersProps) => {
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<Boulder | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize boulders
  useEffect(() => {
    const initialBoulders: Boulder[] = words.map((word, i) => ({
      id: i,
      word,
      x: 100 + i * 15, // Stagger starting positions
      y: 30 + Math.random() * 40,
      speed: 0.8 + Math.random() * 0.4,
      size: Math.min(100, Math.max(60, word.length * 12)),
      rotation: 0,
      destroyed: false,
      selected: false,
      cracked: false,
    }));
    setBoulders(initialBoulders);
  }, [words]);

  // Rolling animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBoulders(prev => {
        const updated = prev.map(boulder => {
          if (boulder.destroyed) return boulder;
          const newX = boulder.x - boulder.speed;
          const newRotation = boulder.rotation - boulder.speed * 5;
          
          // Boulder reaches hero zone
          if (newX <= 10) {
            setMissed(m => m + 1);
            onWordHit(12);
            return { ...boulder, destroyed: true, x: newX };
          }
          
          return { ...boulder, x: newX, rotation: newRotation };
        });
        
        // Check completion
        const allDone = updated.every(b => b.destroyed);
        if (allDone) {
          setTimeout(() => onComplete(destroyed, missed), 500);
        }
        
        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [destroyed, missed, onComplete, onWordHit]);

  // Handle boulder selection
  const handleSelectBoulder = useCallback((boulder: Boulder) => {
    if (boulder.destroyed || isListening) return;
    
    setBoulders(prev => prev.map(b => ({
      ...b,
      selected: b.id === boulder.id,
      cracked: b.id === boulder.id ? true : b.cracked,
    })));
    setSelectedBoulder(boulder);
    startListening(boulder);
  }, [isListening]);

  // Start speech recognition
  const startListening = useCallback((boulder: Boulder) => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event) => {
      const spoken = event.results[0][0].transcript.toLowerCase().trim();
      const expected = boulder.word.toLowerCase().replace(/[^a-z]/g, '');
      
      if (spoken.includes(expected) || expected.includes(spoken)) {
        // Success - shatter boulder
        setBoulders(prev => prev.map(b => 
          b.id === boulder.id ? { ...b, destroyed: true } : b
        ));
        setDestroyed(d => d + 1);
      }
      setSelectedBoulder(null);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      setSelectedBoulder(null);
    };

    recognitionRef.current.start();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-50">
      {/* Rocky background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-stone-800/70 via-amber-900/50 to-stone-900/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Dust clouds at bottom */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 w-40 h-20 bg-amber-700/20 rounded-full blur-2xl"
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
        <div className="px-6 py-2 bg-stone-700/90 rounded-lg border-2 border-amber-600">
          <span className="text-white font-black text-lg">🪨 ROLLING BOULDERS 🪨</span>
        </div>
      </motion.div>

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
            <motion.button
              key={boulder.id}
              className={`absolute pointer-events-auto cursor-pointer ${
                boulder.selected ? 'z-30' : 'z-20'
              }`}
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
              onClick={() => handleSelectBoulder(boulder)}
            >
              {/* Boulder body */}
              <div 
                className={`relative w-full h-full rounded-full 
                  bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700
                  shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.5),5px_5px_15px_rgba(0,0,0,0.4)]
                  border-2 ${boulder.selected ? 'border-yellow-400' : 'border-stone-600'}
                  flex items-center justify-center`}
              >
                {/* Crack effect */}
                {boulder.cracked && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <path
                        d="M50 20 L45 35 L30 40 L40 50 L35 70 L50 60 L55 80"
                        stroke="rgba(0,0,0,0.6)"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                )}

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
            </motion.button>
          )
        ))}
      </AnimatePresence>

      {/* Selected boulder speaking panel */}
      <AnimatePresence>
        {selectedBoulder && (
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="px-8 py-4 bg-stone-800/95 rounded-xl border-2 border-amber-500 shadow-2xl">
              <p className="text-amber-300 text-sm mb-2">Speak to shatter:</p>
              <p className="text-3xl font-black text-white">{selectedBoulder.word}</p>
              {isListening && (
                <motion.div 
                  className="mt-2 flex items-center justify-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                  <span className="text-amber-400 text-sm">Listening...</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
