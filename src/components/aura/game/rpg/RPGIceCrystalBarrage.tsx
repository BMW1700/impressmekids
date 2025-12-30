import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
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
  const [selectedCrystal, setSelectedCrystal] = useState<IceCrystal | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize crystals
  useEffect(() => {
    const initialCrystals: IceCrystal[] = words.map((word, i) => ({
      id: i,
      word,
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 50,
      rotation: Math.random() * 30 - 15,
      freezeProgress: 0,
      destroyed: false,
      selected: false,
    }));
    setCrystals(initialCrystals);
  }, [words]);

  // Freeze progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCrystals(prev => {
        const updated = prev.map(crystal => {
          if (crystal.destroyed) return crystal;
          const newProgress = crystal.freezeProgress + 2;
          if (newProgress >= 100) {
            setMissed(m => m + 1);
            onWordHit(8);
            return { ...crystal, destroyed: true, freezeProgress: 100 };
          }
          return { ...crystal, freezeProgress: newProgress };
        });
        
        // Check completion
        const allDone = updated.every(c => c.destroyed);
        if (allDone) {
          setTimeout(() => onComplete(destroyed, missed), 500);
        }
        
        return updated;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [destroyed, missed, onComplete, onWordHit]);

  // Handle crystal selection
  const handleSelectCrystal = useCallback((crystal: IceCrystal) => {
    if (crystal.destroyed || isListening) return;
    
    setCrystals(prev => prev.map(c => ({
      ...c,
      selected: c.id === crystal.id
    })));
    setSelectedCrystal(crystal);
    startListening(crystal);
  }, [isListening]);

  // Start speech recognition
  const startListening = useCallback((crystal: IceCrystal) => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event) => {
      const spoken = event.results[0][0].transcript.toLowerCase().trim();
      const expected = crystal.word.toLowerCase().replace(/[^a-z]/g, '');
      
      if (spoken.includes(expected) || expected.includes(spoken)) {
        // Success - shatter crystal
        setCrystals(prev => prev.map(c => 
          c.id === crystal.id ? { ...c, destroyed: true } : c
        ));
        setDestroyed(d => d + 1);
      }
      setSelectedCrystal(null);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      setSelectedCrystal(null);
    };

    recognitionRef.current.start();
  }, []);

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

      {/* Crystals */}
      <AnimatePresence>
        {crystals.map((crystal) => (
          !crystal.destroyed && (
            <motion.button
              key={crystal.id}
              className={`absolute pointer-events-auto cursor-pointer transition-all ${
                crystal.selected ? 'z-30' : 'z-20'
              }`}
              style={{ left: `${crystal.x}%`, top: `${crystal.y}%` }}
              initial={{ scale: 0, rotate: crystal.rotation }}
              animate={{ 
                scale: 1, 
                rotate: [crystal.rotation - 5, crystal.rotation + 5, crystal.rotation],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ rotate: { repeat: Infinity, duration: 3 } }}
              onClick={() => handleSelectCrystal(crystal)}
            >
              {/* Crystal shape */}
              <div className={`relative p-4 ${crystal.selected ? 'scale-110' : ''}`}>
                {/* Crystal body */}
                <div 
                  className="relative px-6 py-4 bg-gradient-to-br from-cyan-200 via-blue-300 to-cyan-400 
                    rounded-lg border-2 border-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.6)]"
                  style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  }}
                >
                  {/* Word */}
                  <span className="font-black text-lg text-cyan-900 drop-shadow-sm">
                    {crystal.word}
                  </span>

                  {/* Freeze overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-white/80 via-cyan-100/60 to-transparent rounded-lg"
                    style={{ height: `${crystal.freezeProgress}%`, bottom: 0, top: 'auto' }}
                  />
                </div>

                {/* Freeze progress indicator */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${100 - crystal.freezeProgress}%` }}
                  />
                </div>
              </div>
            </motion.button>
          )
        ))}
      </AnimatePresence>

      {/* Selected crystal speaking panel */}
      <AnimatePresence>
        {selectedCrystal && (
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="px-8 py-4 bg-cyan-900/95 rounded-xl border-2 border-cyan-400 shadow-2xl">
              <p className="text-cyan-300 text-sm mb-2">Speak the word:</p>
              <p className="text-3xl font-black text-white">{selectedCrystal.word}</p>
              {isListening && (
                <motion.div 
                  className="mt-2 flex items-center justify-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <span className="text-cyan-400 text-sm">Listening...</span>
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
          <span className="text-white font-bold">Frozen: {missed}</span>
        </div>
      </div>
    </div>
  );
};
