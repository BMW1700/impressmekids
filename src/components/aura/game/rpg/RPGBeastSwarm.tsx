import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, X } from "lucide-react";

// Add speech recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface Beast {
  id: string;
  word: string;
  type: 'fire_imp' | 'shadow_bat' | 'frost_sprite';
  x: number;
  y: number;
  speed: number;
  angle: number;
  destroyed: boolean;
  selected: boolean;
  size: number;
}

interface RPGBeastSwarmProps {
  words: string[];
  onComplete: (destroyed: number, missed: number) => void;
  onWordHit: (damage: number) => void;
}

const beastTypes: Beast['type'][] = ['fire_imp', 'shadow_bat', 'frost_sprite'];

const beastEmojis: Record<Beast['type'], string> = {
  fire_imp: '🔥',
  shadow_bat: '🦇',
  frost_sprite: '❄️',
};

const beastColors: Record<Beast['type'], string> = {
  fire_imp: 'from-orange-500 to-red-600',
  shadow_bat: 'from-purple-600 to-indigo-800',
  frost_sprite: 'from-cyan-400 to-blue-600',
};

export const RPGBeastSwarm = ({
  words,
  onComplete,
  onWordHit,
}: RPGBeastSwarmProps) => {
  const [beasts, setBeasts] = useState<Beast[]>([]);
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenWord, setSpokenWord] = useState("");
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize beasts
  useEffect(() => {
    const initialBeasts: Beast[] = words.map((word, index) => ({
      id: `beast-${index}`,
      word,
      type: beastTypes[index % beastTypes.length],
      x: -10 - (index * 15), // Stagger spawn from left
      y: 20 + Math.random() * 60,
      speed: 0.15 + Math.random() * 0.1,
      angle: (Math.random() - 0.5) * 0.3,
      destroyed: false,
      selected: false,
      size: 60 + Math.random() * 20,
    }));
    setBeasts(initialBeasts);
  }, [words]);

  // Animation loop - beasts fly toward heroes (right side)
  useEffect(() => {
    const animate = () => {
      setBeasts(prev => {
        const updated = prev.map(beast => {
          if (beast.destroyed) return beast;
          
          const newX = beast.x + beast.speed;
          const newY = beast.y + Math.sin(newX * 0.05) * 0.5; // Wave pattern
          
          // Beast reaches heroes (right side)
          if (newX > 100) {
            if (!beast.destroyed) {
              onWordHit(10); // Damage when beast reaches
              return { ...beast, destroyed: true };
            }
          }
          
          return { ...beast, x: newX, y: newY };
        });
        
        // Check if all beasts are done
        const remaining = updated.filter(b => !b.destroyed && b.x <= 100);
        if (remaining.length === 0) {
          const destroyedCount = updated.filter(b => b.destroyed && b.x <= 100).length;
          const missedCount = updated.filter(b => b.destroyed && b.x > 100).length;
          setTimeout(() => onComplete(destroyedCount, missedCount), 500);
        }
        
        return updated;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onComplete, onWordHit]);

  // Handle beast selection
  const handleSelectBeast = useCallback((beast: Beast) => {
    if (beast.destroyed || isListening) return;
    
    setSelectedBeast(beast);
    setBeasts(prev => prev.map(b => ({
      ...b,
      selected: b.id === beast.id,
    })));
    
    startListening(beast.word);
  }, [isListening]);

  // Start speech recognition
  const startListening = useCallback((targetWord: string) => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      console.error('Speech recognition not supported');
      return;
    }
    
    const recognition = new SpeechRecognitionClass();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setSpokenWord("");
    };
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
        .toLowerCase()
        .trim();
      
      setSpokenWord(transcript);
      
      // Check if word matches
      const cleanTarget = targetWord.toLowerCase().replace(/[^\w]/g, '');
      const cleanSpoken = transcript.replace(/[^\w]/g, '');
      
      if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
        recognition.stop();
        destroyBeast();
      }
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      setSelectedBeast(null);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    
    // Auto-stop after 3 seconds
    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 3000);
  }, []);

  // Destroy the selected beast
  const destroyBeast = useCallback(() => {
    if (!selectedBeast) return;
    
    setBeasts(prev => prev.map(b => 
      b.id === selectedBeast.id 
        ? { ...b, destroyed: true, selected: false }
        : b
    ));
    
    setDestroyed(prev => prev + 1);
    setSelectedBeast(null);
    setSpokenWord("");
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [selectedBeast]);

  // Cancel selection
  const cancelSelection = useCallback(() => {
    setSelectedBeast(null);
    setBeasts(prev => prev.map(b => ({ ...b, selected: false })));
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setSpokenWord("");
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 overflow-hidden"
    >
      {/* Dark overlay with swarm effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-indigo-900/70 to-slate-900/80" />
      
      {/* Swarm particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 20, 0],
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-60"
      >
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-8 py-3 rounded-lg
          border-2 border-purple-400 shadow-[0_0_30px_rgba(147,51,234,0.5)]">
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="text-white font-black text-2xl tracking-wider"
          >
            🦇 BEAST SWARM! 🦇
          </motion.span>
        </div>
      </motion.div>
      
      {/* Score display */}
      <div className="absolute top-20 right-4 z-60 space-y-2">
        <div className="bg-green-900/80 px-4 py-2 rounded-lg border border-green-500">
          <span className="text-green-300 font-bold">Destroyed: {destroyed}</span>
        </div>
        <div className="bg-red-900/80 px-4 py-2 rounded-lg border border-red-500">
          <span className="text-red-300 font-bold">Escaped: {missed}</span>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-60 text-center">
        <p className="text-white/80 text-lg">
          👆 Click a beast and 🎤 speak its word to destroy it!
        </p>
      </div>
      
      {/* Beasts */}
      <AnimatePresence>
        {beasts.map(beast => (
          !beast.destroyed && (
            <motion.button
              key={beast.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: beast.selected ? 1.3 : 1,
                rotate: 0,
                x: 0,
                y: [0, -5, 0],
              }}
              exit={{ 
                scale: 1.5,
                opacity: 0,
              }}
              transition={{
                y: { repeat: Infinity, duration: 0.5 },
              }}
              onClick={() => handleSelectBeast(beast)}
              style={{
                position: 'absolute',
                left: `${beast.x}%`,
                top: `${beast.y}%`,
                width: beast.size,
                height: beast.size,
              }}
              className={`rounded-full flex flex-col items-center justify-center cursor-pointer
                bg-gradient-to-br ${beastColors[beast.type]}
                ${beast.selected ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent z-50' : 'z-40'}
                shadow-lg hover:scale-110 transition-transform
                border-2 border-white/30`}
            >
              {/* Beast emoji */}
              <span className="text-2xl">{beastEmojis[beast.type]}</span>
              
              {/* Word in center */}
              <span className="text-white font-bold text-xs px-1 text-center leading-tight
                drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {beast.word}
              </span>
              
              {/* Wings animation */}
              <motion.div
                animate={{ rotate: [-15, 15, -15] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="absolute -left-2 top-1/2 -translate-y-1/2 text-lg opacity-50"
              >
                ◀
              </motion.div>
              <motion.div
                animate={{ rotate: [15, -15, 15] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="absolute -right-2 top-1/2 -translate-y-1/2 text-lg opacity-50"
              >
                ▶
              </motion.div>
            </motion.button>
          )
        ))}
      </AnimatePresence>
      
      {/* Selected Beast Panel */}
      <AnimatePresence>
        {selectedBeast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-60"
          >
            <div className={`bg-gradient-to-br ${beastColors[selectedBeast.type]} p-6 rounded-2xl
              border-2 border-white/50 shadow-2xl min-w-[280px]`}>
              <button
                onClick={cancelSelection}
                className="absolute top-2 right-2 text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center space-y-4">
                <p className="text-white/70 text-sm">SPEAK THIS WORD:</p>
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-white font-black text-4xl tracking-wide"
                >
                  "{selectedBeast.word}"
                </motion.p>
                
                {/* Listening indicator */}
                <div className="flex items-center justify-center gap-2">
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="flex items-center gap-2 text-yellow-300"
                    >
                      <Volume2 className="h-6 w-6" />
                      <span className="font-bold">Listening...</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2 text-white/50">
                      <VolumeX className="h-6 w-6" />
                      <span>Tap mic to start</span>
                    </div>
                  )}
                </div>
                
                {/* Spoken word feedback */}
                {spokenWord && (
                  <p className="text-yellow-200 text-lg">
                    You said: "{spokenWord}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};