import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { speechManager } from "@/lib/speechRecognitionManager";

const battleSounds = new SoundEffects();

interface Fireball {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  size: 'small' | 'medium' | 'large';
  isDestroyed: boolean;
  isSelected: boolean;
}

interface RPGFireballDefenseProps {
  words: string[];
  onComplete: (blocked: number, hit: number, damage: number) => void;
  onDamage?: (damage: number) => void;
}

export const RPGFireballDefense = ({
  words,
  onComplete,
  onDamage,
}: RPGFireballDefenseProps) => {
  const [fireballs, setFireballs] = useState<Fireball[]>([]);
  const [selectedFireball, setSelectedFireball] = useState<Fireball | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenWord, setSpokenWord] = useState('');
  const [blocked, setBlocked] = useState(0);
  const [hit, setHit] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const animationRef = useRef<number>();
  const recognitionRef = useRef<any>(null);

  // Initialize fireballs from words
  useEffect(() => {
    const initialFireballs: Fireball[] = words.slice(0, 8).map((word, index) => ({
      id: index,
      word,
      x: -10 - (index * 15), // Start off screen left, staggered
      y: 20 + Math.random() * 60, // Random vertical position
      speed: 0.3 + Math.random() * 0.2, // Variable speed
      size: word.length > 6 ? 'large' : word.length > 3 ? 'medium' : 'small',
      isDestroyed: false,
      isSelected: false,
    }));
    setFireballs(initialFireballs);
    battleSounds.fireWhoosh();
  }, [words]);

  // Animation loop - move fireballs right
  useEffect(() => {
    if (!gameActive) return;

    const animate = () => {
      setFireballs(prev => {
        let hitThisFrame = 0;
        let damageThisFrame = 0;

        const updated = prev.map(fireball => {
          if (fireball.isDestroyed) return fireball;

          const newX = fireball.x + fireball.speed;

          // Fireball reached player (right side)
          if (newX >= 90) {
            hitThisFrame++;
            const damage = fireball.size === 'large' ? 15 : fireball.size === 'medium' ? 10 : 5;
            damageThisFrame += damage;
            return { ...fireball, isDestroyed: true };
          }

          return { ...fireball, x: newX };
        });

        // Apply damage and track hits
        if (hitThisFrame > 0) {
          setHit(p => p + hitThisFrame);
          setTotalDamage(p => p + damageThisFrame);
          if (onDamage) onDamage(damageThisFrame);
          battleSounds.incorrectWord(); // Use existing sound for damage
        }

        // Check if game is over (all fireballs destroyed or hit)
        const allDone = updated.every(f => f.isDestroyed);
        if (allDone) {
          setGameActive(false);
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameActive, onDamage]);

  // Game over - call onComplete
  useEffect(() => {
    if (!gameActive && fireballs.length > 0) {
      const timer = setTimeout(() => {
        onComplete(blocked, hit, totalDamage);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameActive, blocked, hit, totalDamage, onComplete, fireballs.length]);

  // Select a fireball to destroy
  const handleSelectFireball = useCallback((fireball: Fireball) => {
    if (fireball.isDestroyed || selectedFireball) return;
    
    setSelectedFireball(fireball);
    setFireballs(prev => prev.map(f => ({
      ...f,
      isSelected: f.id === fireball.id,
    })));
    
    // Start speech recognition
    startListening(fireball.word);
  }, [selectedFireball]);

  // Start listening for the word
  const startListening = useCallback((targetWord: string) => {
    setIsListening(true);
    setSpokenWord('');

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('[FireballDefense] Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setSpokenWord(transcript);

      if (event.results[0].isFinal) {
        const isCorrect = transcript === targetWord.toLowerCase() || 
                          transcript.includes(targetWord.toLowerCase());
        
        if (isCorrect) {
          destroyFireball();
        } else {
          setFeedback('incorrect');
          setTimeout(() => {
            setFeedback(null);
            cancelSelection();
          }, 500);
        }
      }
    };

    recognitionRef.current.onerror = () => {
      cancelSelection();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, []);

  // Destroy the selected fireball
  const destroyFireball = useCallback(() => {
    if (!selectedFireball) return;

    setFeedback('correct');
    battleSounds.correctWord(); // Use existing sound for hit
    setBlocked(p => p + 1);

    setFireballs(prev => prev.map(f => 
      f.id === selectedFireball.id ? { ...f, isDestroyed: true, isSelected: false } : f
    ));

    setTimeout(() => {
      setSelectedFireball(null);
      setFeedback(null);
      setSpokenWord('');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 300);
  }, [selectedFireball]);

  // Cancel current selection
  const cancelSelection = useCallback(() => {
    setSelectedFireball(null);
    setFireballs(prev => prev.map(f => ({ ...f, isSelected: false })));
    setSpokenWord('');
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const getFireballSize = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'large': return 'w-20 h-20 text-sm';
      case 'medium': return 'w-16 h-16 text-xs';
      case 'small': return 'w-12 h-12 text-xs';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-r from-orange-950 via-red-900 to-yellow-900"
    >
      {/* Fire particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-500 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-10, -50],
              opacity: [0.6, 0],
              scale: [1, 0.5],
            }}
            transition={{
              duration: 1 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 text-center z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-block bg-red-900/80 border-2 border-red-500 px-6 py-3 rounded-lg"
        >
          <h2 className="text-2xl font-black text-red-300">🔥 FIREBALL ASSAULT! 🔥</h2>
          <p className="text-red-200 text-sm">Tap a fireball and speak the word to destroy it!</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <div className="bg-green-900/80 border border-green-500 px-4 py-2 rounded-lg">
          <span className="text-green-300 font-bold">Blocked: {blocked}</span>
        </div>
        <div className="bg-red-900/80 border border-red-500 px-4 py-2 rounded-lg">
          <span className="text-red-300 font-bold">Damage: {totalDamage}</span>
        </div>
      </div>

      {/* Hero target zone */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-32 bg-blue-600/30 border-2 border-blue-400 rounded-lg flex items-center justify-center"
        >
          <span className="text-6xl">🛡️</span>
        </motion.div>
      </div>

      {/* Drake on the left */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2">
        <motion.div
          animate={{ 
            x: [0, 5, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl"
        >
          🐉
        </motion.div>
      </div>

      {/* Fireballs */}
      <AnimatePresence>
        {fireballs.map(fireball => !fireball.isDestroyed && (
          <motion.button
            key={fireball.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: fireball.isSelected ? 1.2 : 1, 
              opacity: 1,
            }}
            exit={{ 
              scale: 1.5, 
              opacity: 0,
              transition: { duration: 0.15 }
            }}
            onClick={() => handleSelectFireball(fireball)}
            className={`absolute ${getFireballSize(fireball.size)} rounded-full cursor-pointer 
              ${fireball.isSelected ? 'ring-4 ring-yellow-400' : ''}
              bg-gradient-to-br from-yellow-500 via-orange-600 to-red-700
              flex items-center justify-center shadow-lg shadow-orange-500/50
              hover:scale-110 transition-transform`}
            style={{
              left: `${fireball.x}%`,
              top: `${fireball.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Fire glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-transparent opacity-50 animate-pulse" />
            
            {/* Word */}
            <span className="relative z-10 font-bold text-white drop-shadow-lg text-center px-1">
              {fireball.word}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Selected fireball panel */}
      <AnimatePresence>
        {selectedFireball && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          >
            <div className={`bg-slate-900/95 border-2 rounded-xl p-6 min-w-[300px] text-center
              ${feedback === 'correct' ? 'border-green-500' : feedback === 'incorrect' ? 'border-red-500' : 'border-orange-500'}`}>
              <p className="text-slate-400 text-sm mb-2">Speak to destroy:</p>
              <p className="text-3xl font-black text-orange-400 mb-4">{selectedFireball.word}</p>
              
              {isListening && (
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-3 h-3 bg-red-500 rounded-full"
                  />
                  <span className="text-sm">Listening: {spokenWord || '...'}</span>
                </div>
              )}
              
              {feedback === 'correct' && (
                <p className="text-green-400 font-bold">✓ DESTROYED!</p>
              )}
              {feedback === 'incorrect' && (
                <p className="text-red-400 font-bold">✗ Try again!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game over overlay */}
      <AnimatePresence>
        {!gameActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-slate-900 border-2 border-orange-500 rounded-xl p-8 text-center"
            >
              <h2 className="text-3xl font-black text-orange-400 mb-4">
                {blocked > hit ? '🛡️ DEFENSE SUCCESS!' : '🔥 OVERWHELMED!'}
              </h2>
              <div className="flex gap-8 justify-center">
                <div>
                  <p className="text-slate-400 text-sm">Fireballs Blocked</p>
                  <p className="text-2xl font-bold text-green-400">{blocked}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Damage Taken</p>
                  <p className="text-2xl font-bold text-red-400">{totalDamage}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
