import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getStoredTheme } from "@/lib/gameTheme";
import { isHomophone } from "@/lib/homophones";

const battleSounds = new SoundEffects();
const isAgent = () => getStoredTheme() === 'agent';

// Levenshtein edit distance
const editDistance = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
};

const checkWordMatch = (spoken: string, target: string): boolean => {
  const s = spoken.toLowerCase().replace(/[^a-z]/g, '');
  const t = target.toLowerCase().replace(/[^a-z]/g, '');
  if (!s || !t) return false;
  if (s === t) return true;
  if (isHomophone(s, t)) return true;
  const maxDist = t.length <= 3 ? 1 : 2;
  if (editDistance(s, t) <= maxDist) return true;
  return false;
};

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
  const selectedFireballRef = useRef<Fireball | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenWord, setSpokenWord] = useState('');
  const [blocked, setBlocked] = useState(0);
  const [hit, setHit] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const animationRef = useRef<number>();
  const recognitionRef = useRef<any>(null);
  const completionTriggeredRef = useRef(false);
  const gameActiveRef = useRef(true);

  // Initialize fireballs from words
  useEffect(() => {
    const initialFireballs: Fireball[] = words.slice(0, 8).map((word, index) => ({
      id: index,
      word,
      x: -10 - (index * 15),
      y: 20 + Math.random() * 60,
      speed: 0.05 + Math.random() * 0.04, // Even slower so parents can read AND speak the word
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

          if (newX >= 90) {
            hitThisFrame++;
            const damage = fireball.size === 'large' ? 15 : fireball.size === 'medium' ? 10 : 5;
            damageThisFrame += damage;
            return { ...fireball, isDestroyed: true };
          }

          return { ...fireball, x: newX };
        });

        if (hitThisFrame > 0) {
          setHit(p => p + hitThisFrame);
          setTotalDamage(p => p + damageThisFrame);
          if (onDamage) onDamage(damageThisFrame);
          battleSounds.incorrectWord();
        }

        const allDone = updated.every(f => f.isDestroyed);
        if (allDone) {
          setGameActive(false);
          gameActiveRef.current = false;
        }

        return updated;
      });

      if (gameActiveRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameActive, onDamage]);

  // Force-stop recognition when game ends
  useEffect(() => {
    if (!gameActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      setSelectedFireball(null);
    }
  }, [gameActive]);

  // Game over - call onComplete
  useEffect(() => {
    if (!gameActive && fireballs.length > 0 && !completionTriggeredRef.current) {
      completionTriggeredRef.current = true;
      const timer = setTimeout(() => {
        onComplete(blocked, hit, totalDamage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameActive, blocked, hit, totalDamage, onComplete, fireballs.length]);

  // Select a fireball to destroy
  const handleSelectFireball = useCallback((fireball: Fireball) => {
    if (fireball.isDestroyed || selectedFireball || !gameActiveRef.current) return;
    
    setSelectedFireball(fireball);
    selectedFireballRef.current = fireball;
    setFireballs(prev => prev.map(f => ({
      ...f,
      isSelected: f.id === fireball.id,
    })));
    
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
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    let matched = false;

    recognition.onresult = (event: any) => {
      if (matched || !gameActiveRef.current) return;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        setSpokenWord(transcript);

        // Check each spoken word against target using lenient matching
        const spokenWords = transcript.split(/\s+/);
        for (const word of spokenWords) {
          if (checkWordMatch(word, targetWord)) {
            matched = true;
            destroyFireball();
            return;
          }
        }

        // Also check full transcript
        if (checkWordMatch(transcript.replace(/\s+/g, ''), targetWord)) {
          matched = true;
          destroyFireball();
          return;
        }
      }
    };

    recognition.onerror = () => {
      if (!matched) cancelSelection();
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!matched && gameActiveRef.current) {
        setFeedback('incorrect');
        setTimeout(() => {
          setFeedback(null);
          cancelSelection();
        }, 400);
      }
    };

    recognition.start();
  }, []);

  // Destroy the selected fireball
  const destroyFireball = useCallback(() => {
    const fireball = selectedFireballRef.current;
    if (!fireball) return;

    setFeedback('correct');
    battleSounds.correctWord();
    setBlocked(p => p + 1);

    setFireballs(prev => prev.map(f => 
      f.id === fireball.id ? { ...f, isDestroyed: true, isSelected: false } : f
    ));

    setTimeout(() => {
      setSelectedFireball(null);
      selectedFireballRef.current = null;
      setFeedback(null);
      setSpokenWord('');
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    }, 300);
  }, []);

  // Cancel current selection
  const cancelSelection = useCallback(() => {
    setSelectedFireball(null);
    selectedFireballRef.current = null;
    setFireballs(prev => prev.map(f => ({ ...f, isSelected: false })));
    setSpokenWord('');
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gameActiveRef.current = false;
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const getFireballSize = (size: 'small' | 'medium' | 'large') => {
    // Bigger boxes so the word inside is always legible to a parent reading at a distance.
    switch (size) {
      case 'large': return 'w-32 h-32';
      case 'medium': return 'w-28 h-28';
      case 'small': return 'w-24 h-24';
    }
  };

  const getFireballTextSize = (word: string) => {
    if (word.length > 8) return 'text-base';
    if (word.length > 5) return 'text-lg';
    return 'text-xl';
  };

  const agent = isAgent();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 ${agent
        ? 'bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950'
        : 'bg-gradient-to-r from-orange-950 via-red-900 to-yellow-900'}`}
    >
      {/* Header */}
      <div className="absolute top-4 left-0 right-0 text-center z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`inline-block px-6 py-3 rounded-lg border-2 ${agent
            ? 'bg-slate-800/80 border-cyan-500'
            : 'bg-red-900/80 border-red-500'}`}
        >
          <h2 className={`text-2xl font-black ${agent ? 'text-cyan-300' : 'text-red-300'}`}>
            {agent ? '🚀 INCOMING MISSILES! 🚀' : '🔥 FIREBALL ASSAULT! 🔥'}
          </h2>
          <p className={`text-sm ${agent ? 'text-cyan-200' : 'text-red-200'}`}>
            {agent ? 'Tap a missile and speak the word to intercept!' : 'Tap a fireball and speak the word to destroy it!'}
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <div className="bg-green-900/80 border border-green-500 px-4 py-2 rounded-lg">
          <span className="text-green-300 font-bold">{agent ? 'Intercepted' : 'Blocked'}: {blocked}</span>
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
          className={`w-24 h-32 border-2 rounded-lg flex items-center justify-center ${agent
            ? 'bg-cyan-600/30 border-cyan-400'
            : 'bg-blue-600/30 border-blue-400'}`}
        >
          <span className="text-6xl">{agent ? '🎯' : '🛡️'}</span>
        </motion.div>
      </div>

      {/* Source on the left */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2">
        <motion.div
          animate={{ 
            x: [0, 5, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl"
        >
          {agent ? '🚀' : '🐉'}
        </motion.div>
      </div>

      {/* Fireballs / Missiles */}
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
            className={`absolute ${getFireballSize(fireball.size)} cursor-pointer z-20
              ${fireball.isSelected ? 'ring-4 ring-yellow-400' : ''}
              ${agent
                ? 'bg-gradient-to-r from-slate-400 via-cyan-500 to-slate-600 rounded-lg'
                : 'bg-gradient-to-br from-yellow-500 via-orange-600 to-red-700 rounded-full'}
              flex items-center justify-center shadow-lg ${agent ? 'shadow-cyan-500/50' : 'shadow-orange-500/50'}
              hover:scale-110 transition-transform`}
            style={{
              left: `${fireball.x}%`,
              top: `${fireball.y}%`,
              transform: 'translate(-50%, -50%)',
              ...(agent ? { borderRadius: '4px 20px 20px 4px' } : {}),
            }}
          >
            {/* Glow */}
            <div className={`absolute inset-0 opacity-50 animate-pulse pointer-events-none ${agent
              ? 'bg-gradient-to-r from-cyan-400 to-transparent rounded-lg'
              : 'bg-gradient-to-br from-yellow-400 to-transparent rounded-full'}`} />

            {/* High-contrast word label so the parent can ALWAYS read it,
                even while the fireball is moving. */}
            <span
              className={`relative z-10 font-black text-white text-center px-2 py-1 rounded-md
                bg-black/70 ring-1 ring-white/50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]
                ${getFireballTextSize(fireball.word)}`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.9)' }}
            >
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
              ${feedback === 'correct' ? 'border-green-500' : feedback === 'incorrect' ? 'border-red-500' : agent ? 'border-cyan-500' : 'border-orange-500'}`}>
              <p className="text-slate-400 text-sm mb-2">{agent ? 'Speak to intercept:' : 'Speak to destroy:'}</p>
              <p className={`text-3xl font-black mb-4 ${agent ? 'text-cyan-400' : 'text-orange-400'}`}>{selectedFireball.word}</p>
              
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
                <p className="text-green-400 font-bold">{agent ? '✓ INTERCEPTED!' : '✓ DESTROYED!'}</p>
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
              className={`bg-slate-900 border-2 rounded-xl p-8 text-center ${agent ? 'border-cyan-500' : 'border-orange-500'}`}
            >
              <h2 className={`text-3xl font-black mb-4 ${agent ? 'text-cyan-400' : 'text-orange-400'}`}>
                {blocked > hit
                  ? (agent ? '🎯 MISSILES INTERCEPTED!' : '🛡️ DEFENSE SUCCESS!')
                  : (agent ? '💥 DEFENSES BREACHED!' : '🔥 OVERWHELMED!')}
              </h2>
              <div className="flex gap-8 justify-center">
                <div>
                  <p className="text-slate-400 text-sm">{agent ? 'Intercepted' : 'Fireballs Blocked'}</p>
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
