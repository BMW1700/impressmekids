import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GhostWord {
  id: number;
  word: string;
  x: number;
  y: number;
  opacity: number;
  destroyed: boolean;
  selected: boolean;
}

interface RPGGhostlyWhispersProps {
  words: string[];
  onComplete: (destroyed: number, missed: number) => void;
  onWordHit: (damage: number) => void;
}

export const RPGGhostlyWhispers = ({
  words,
  onComplete,
  onWordHit,
}: RPGGhostlyWhispersProps) => {
  const [ghosts, setGhosts] = useState<GhostWord[]>([]);
  const [selectedGhost, setSelectedGhost] = useState<GhostWord | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Initialize ghosts
  useEffect(() => {
    const initialGhosts: GhostWord[] = words.map((word, i) => ({
      id: i,
      word,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 60,
      opacity: 1,
      destroyed: false,
      selected: false,
    }));
    setGhosts(initialGhosts);
  }, [words]);

  // Fade animation - words fade over time
  useEffect(() => {
    const interval = setInterval(() => {
      setGhosts(prev => {
        const updated = prev.map(ghost => {
          if (ghost.destroyed) return ghost;
          const newOpacity = ghost.opacity - 0.02;
          if (newOpacity <= 0) {
            setMissed(m => m + 1);
            onWordHit(10);
            return { ...ghost, destroyed: true, opacity: 0 };
          }
          return { ...ghost, opacity: newOpacity };
        });
        
        // Check completion
        const allDone = updated.every(g => g.destroyed);
        if (allDone) {
          setTimeout(() => onComplete(destroyed, missed), 500);
        }
        
        return updated;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [destroyed, missed, onComplete, onWordHit]);

  // Handle ghost selection
  const handleSelectGhost = useCallback((ghost: GhostWord) => {
    if (ghost.destroyed || isListening) return;
    
    setGhosts(prev => prev.map(g => ({
      ...g,
      selected: g.id === ghost.id
    })));
    setSelectedGhost(ghost);
    startListening(ghost);
  }, [isListening]);

  // Start speech recognition
  const startListening = useCallback((ghost: GhostWord) => {
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event) => {
      const spoken = event.results[0][0].transcript.toLowerCase().trim();
      const expected = ghost.word.toLowerCase().replace(/[^a-z]/g, '');
      
      if (spoken.includes(expected) || expected.includes(spoken)) {
        // Success - disperse ghost
        setGhosts(prev => prev.map(g => 
          g.id === ghost.id ? { ...g, destroyed: true } : g
        ));
        setDestroyed(d => d + 1);
      }
      setSelectedGhost(null);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      setSelectedGhost(null);
    };

    recognitionRef.current.start();
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
          <span className="text-white font-black text-lg">👻 GHOSTLY WHISPERS 👻</span>
        </div>
      </motion.div>

      {/* Ghost words */}
      <AnimatePresence>
        {ghosts.map((ghost) => (
          !ghost.destroyed && (
            <motion.button
              key={ghost.id}
              className={`absolute pointer-events-auto cursor-pointer ${
                ghost.selected ? 'z-30' : 'z-20'
              }`}
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
              onClick={() => handleSelectGhost(ghost)}
            >
              {/* Ghost word container */}
              <div className={`relative ${ghost.selected ? 'scale-110' : ''}`}>
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
            </motion.button>
          )
        ))}
      </AnimatePresence>

      {/* Selected ghost speaking panel */}
      <AnimatePresence>
        {selectedGhost && (
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="px-8 py-4 bg-purple-950/95 rounded-xl border-2 border-purple-400 shadow-2xl">
              <p className="text-purple-300 text-sm mb-2">Speak before it fades:</p>
              <p className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                {selectedGhost.word}
              </p>
              {isListening && (
                <motion.div 
                  className="mt-2 flex items-center justify-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-purple-400 text-sm">Listening...</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
