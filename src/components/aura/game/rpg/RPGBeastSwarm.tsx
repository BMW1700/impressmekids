import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";

interface Beast {
  id: string;
  word: string;
  type: 'fire_imp' | 'shadow_bat' | 'frost_sprite';
  x: number;
  y: number;
  speed: number;
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

const soundEffects = new SoundEffects();

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
  const [gameComplete, setGameComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const selectedBeastRef = useRef<Beast | null>(null);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    selectedBeastRef.current = selectedBeast;
  }, [selectedBeast]);
  
  useEffect(() => {
    destroyedRef.current = destroyed;
  }, [destroyed]);
  
  useEffect(() => {
    missedRef.current = missed;
  }, [missed]);

  // Initialize beasts
  useEffect(() => {
    const initialBeasts: Beast[] = words.map((word, index) => ({
      id: `beast-${index}`,
      word: word.toLowerCase().replace(/[^a-z]/g, ''),
      type: beastTypes[index % beastTypes.length],
      x: -10 - (index * 15),
      y: 20 + Math.random() * 60,
      speed: 0.18 + Math.random() * 0.08, // Faster beasts
      destroyed: false,
      selected: false,
      size: 60 + Math.random() * 20,
    }));
    setBeasts(initialBeasts);
  }, [words]);

  // Animation loop - beasts fly toward heroes (right side)
  useEffect(() => {
    if (gameComplete) return;
    
    const animate = () => {
      setBeasts(prev => {
        let newMissed = 0;
        const updated = prev.map(beast => {
          if (beast.destroyed) return beast;
          
          const newX = beast.x + beast.speed;
          const newY = beast.y + Math.sin(newX * 0.05) * 0.5;
          
          // Beast reaches heroes (right side)
          if (newX > 100) {
            if (!beast.destroyed) {
              newMissed++;
              onWordHit(10);
              return { ...beast, x: newX, destroyed: true };
            }
          }
          
          return { ...beast, x: newX, y: newY };
        });
        
        if (newMissed > 0) {
          setMissed(m => m + newMissed);
        }
        
        // Check if all beasts are done
        const remaining = updated.filter(b => !b.destroyed && b.x <= 100);
        if (remaining.length === 0 && !gameComplete) {
          const destroyedCount = updated.filter(b => b.destroyed && b.x <= 100).length;
          const missedCount = updated.filter(b => b.destroyed && b.x > 100).length;
          setGameComplete(true);
          speechManager.stop('beast_swarm');
          setTimeout(() => onComplete(destroyedCount, missedCount), 500);
        }
        
        return updated;
      });
      
      if (!gameComplete) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onComplete, onWordHit, gameComplete]);

  // Handle beast selection and start listening
  const handleSelectBeast = useCallback((beast: Beast) => {
    if (beast.destroyed || gameComplete) return;
    
    // Cancel any previous selection
    speechManager.stop('beast_swarm');
    
    setSelectedBeast(beast);
    setSpokenWord("");
    setBeasts(prev => prev.map(b => ({
      ...b,
      selected: b.id === beast.id,
    })));
    
    // Start listening for this beast's word using speechManager
    speechManager.start({
      owner: 'beast_swarm',
      continuous: true,
      interimResults: true,
      onResult: (transcript, alternatives, isFinal) => {
        const currentBeast = selectedBeastRef.current;
        if (!currentBeast) return;
        
        const targetWord = currentBeast.word.toLowerCase();
        const spokenWords = transcript.toLowerCase().split(/\s+/);
        
        setSpokenWord(transcript.toLowerCase());
        
        // Check for matches - super lenient
        for (const spoken of spokenWords) {
          const cleanSpoken = spoken.replace(/[^a-z]/g, '');
          if (cleanSpoken.length < 2) continue;
          
          const exactMatch = cleanSpoken === targetWord;
          const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 2)) || 
                                   cleanSpoken.startsWith(targetWord.slice(0, 2));
          const containsMatch = targetWord.includes(cleanSpoken) || 
                                cleanSpoken.includes(targetWord);
          
          if (exactMatch || (cleanSpoken.length >= 3 && (startsWithMatch || containsMatch))) {
            // Destroy the beast!
            soundEffects.correctWord();
            setBeasts(prev => prev.map(b => 
              b.id === currentBeast.id 
                ? { ...b, destroyed: true, selected: false }
                : b
            ));
            setDestroyed(d => d + 1);
            setSelectedBeast(null);
            setSpokenWord("");
            speechManager.stop('beast_swarm');
            return;
          }
        }
        
        // Also check alternatives
        for (const alt of alternatives) {
          const altWords = alt.toLowerCase().split(/\s+/);
          for (const spoken of altWords) {
            const cleanSpoken = spoken.replace(/[^a-z]/g, '');
            if (cleanSpoken.length < 2) continue;
            
            const exactMatch = cleanSpoken === targetWord;
            const containsMatch = targetWord.includes(cleanSpoken) || cleanSpoken.includes(targetWord);
            
            if (exactMatch || (cleanSpoken.length >= 3 && containsMatch)) {
              soundEffects.correctWord();
              setBeasts(prev => prev.map(b => 
                b.id === currentBeast.id 
                  ? { ...b, destroyed: true, selected: false }
                  : b
              ));
              setDestroyed(d => d + 1);
              setSelectedBeast(null);
              setSpokenWord("");
              speechManager.stop('beast_swarm');
              return;
            }
          }
        }
      },
      onStart: () => {
        setIsListening(true);
      },
      onEnd: () => {
        setIsListening(false);
      },
      onError: (error) => {
        console.log('[BeastSwarm] Recognition error:', error);
      },
    });
  }, [gameComplete]);

  // Cancel selection
  const cancelSelection = useCallback(() => {
    setSelectedBeast(null);
    setBeasts(prev => prev.map(b => ({ ...b, selected: false })));
    speechManager.stop('beast_swarm');
    setIsListening(false);
    setSpokenWord("");
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      speechManager.abort('beast_swarm');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <motion.div
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
                transition: { duration: 0.15 }
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
                ${beast.selected ? 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-purple-900 z-50' : 'z-40'}
                shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-110 transition-transform
                border-3 border-white/40`}
            >
              {/* Glowing aura */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ 
                  boxShadow: beast.selected 
                    ? ['0 0 30px rgba(251,191,36,0.8)', '0 0 50px rgba(251,191,36,1)', '0 0 30px rgba(251,191,36,0.8)']
                    : ['0 0 15px rgba(139,92,246,0.5)', '0 0 25px rgba(139,92,246,0.7)', '0 0 15px rgba(139,92,246,0.5)']
                }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
              
              {/* Beast emoji */}
              <span className="text-3xl">{beastEmojis[beast.type]}</span>
              
              {/* Word in center */}
              <span 
                className="text-white font-black text-sm px-2 py-0.5 rounded bg-black/50 text-center leading-tight mt-1"
                style={{
                  textShadow: '0 0 8px rgba(255,255,255,0.8), 1px 1px 0 #000',
                }}
              >
                {beast.word}
              </span>
              
              {/* Wings animation */}
              <motion.div
                animate={{ rotate: [-20, 20, -20] }}
                transition={{ repeat: Infinity, duration: 0.15 }}
                className="absolute -left-3 top-1/2 -translate-y-1/2 text-xl opacity-70"
              >
                ◀
              </motion.div>
              <motion.div
                animate={{ rotate: [20, -20, 20] }}
                transition={{ repeat: Infinity, duration: 0.15 }}
                className="absolute -right-3 top-1/2 -translate-y-1/2 text-xl opacity-70"
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
                      <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="font-bold">Listening...</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2 text-white/50">
                      <div className="w-4 h-4 bg-white/30 rounded-full" />
                      <span>Starting...</span>
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