import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { speechManager } from "@/lib/speechRecognitionManager";
import { Sword, Flame, Star, Zap } from "lucide-react";

interface WordProjectile {
  id: string;
  word: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  unlocked: boolean;
  sliced: boolean;
  missed: boolean;
  isBomb: boolean;
  spawnTime: number;
  angle: number;
}

interface SliceTrail {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  time: number;
}

interface SliceParticle {
  id: string;
  x: number;
  y: number;
  word: string;
  half: 'left' | 'right';
  vx: number;
  vy: number;
}

interface RPGWordNinjaProps {
  words: string[];
  onComplete: (completed: number, failed: number) => void;
  onDamage?: (damage: number) => void;
}

const GAME_DURATION = 20; // seconds
const GRAVITY = 0.15;
const WORD_LIFETIME = 5000; // ms before a word is "missed"
const SPAWN_INTERVAL = 1200; // ms between word spawns

export const RPGWordNinja = ({ words, onComplete, onDamage }: RPGWordNinjaProps) => {
  const [projectiles, setProjectiles] = useState<WordProjectile[]>([]);
  const [sliceTrails, setSliceTrails] = useState<SliceTrail[]>([]);
  const [sliceParticles, setSliceParticles] = useState<SliceParticle[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [slicedCount, setSlicedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isSlicing, setIsSlicing] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const projectilesRef = useRef<WordProjectile[]>([]);
  const completionTriggeredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const wordIndexRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const slicedCountRef = useRef(0);
  const missedCountRef = useRef(0);
  const comboRef = useRef(0);

  onCompleteRef.current = onComplete;

  // Available words pool
  const wordPool = useMemo(() => {
    const pool = words.filter(w => w.length >= 2).slice(0, 30);
    // Add some "bomb" words (short common words marked as bombs)
    return pool;
  }, [words]);

  // Speech recognition for unlocking words
  useEffect(() => {
    const handleSpeech = (transcript: string) => {
      const spoken = transcript.toLowerCase().trim();
      const spokenWords = spoken.split(/\s+/);

      setProjectiles(prev => {
        const updated = prev.map(p => {
          if (p.unlocked || p.sliced || p.missed || p.isBomb) return p;
          const wordLower = p.word.toLowerCase();
          const matched = spokenWords.some(sw => {
            if (sw === wordLower) return true;
            if (sw.length >= 3 && wordLower.length >= 3) {
              let diff = 0;
              const minLen = Math.min(sw.length, wordLower.length);
              const maxLen = Math.max(sw.length, wordLower.length);
              for (let i = 0; i < minLen; i++) {
                if (sw[i] !== wordLower[i]) diff++;
              }
              diff += maxLen - minLen;
              return diff <= 1;
            }
            return false;
          });
          if (matched) return { ...p, unlocked: true };
          return p;
        });
        projectilesRef.current = updated;
        return updated;
      });
    };

    speechManager.startListening({
      continuous: true,
      interimResults: true,
      onResult: handleSpeech,
      onError: () => {},
    });

    return () => { speechManager.stopListening(); };
  }, []);

  // Spawn words periodically
  const spawnWord = useCallback(() => {
    if (wordIndexRef.current >= wordPool.length) wordIndexRef.current = 0;
    const word = wordPool[wordIndexRef.current];
    wordIndexRef.current++;
    if (!word) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Launch from bottom with random arc
    const startX = 0.15 + Math.random() * 0.7; // 15-85% of width
    const vx = (Math.random() - 0.5) * 3;
    const vy = -(5 + Math.random() * 3); // upward velocity
    const isBomb = Math.random() < 0.12; // 12% chance of bomb

    const newProjectile: WordProjectile = {
      id: `wp-${Date.now()}-${Math.random()}`,
      word: isBomb ? "💣" : word,
      x: startX * rect.width,
      y: rect.height - 20,
      vx,
      vy,
      unlocked: isBomb, // bombs are always "sliceable" but shouldn't be sliced
      sliced: false,
      missed: false,
      isBomb,
      spawnTime: Date.now(),
      angle: 0,
    };

    setProjectiles(prev => {
      const updated = [...prev, newProjectile];
      projectilesRef.current = updated;
      return updated;
    });
  }, [wordPool]);

  // Main game loop
  useEffect(() => {
    if (gameOver) return;

    let lastTime = performance.now();
    let lastSpawn = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 16.67; // normalize to ~60fps
      lastTime = now;

      // Spawn timer
      if (now - lastSpawn > SPAWN_INTERVAL) {
        spawnWord();
        lastSpawn = now;
      }

      // Update positions
      setProjectiles(prev => {
        const updated = prev.map(p => {
          if (p.sliced || p.missed) return p;
          const newVy = p.vy + GRAVITY * dt;
          const newX = p.x + p.vx * dt;
          const newY = p.y + newVy * dt;
          const newAngle = p.angle + p.vx * 2;

          // Check if fallen off screen or timed out
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            if (newY > rect.height + 50 || Date.now() - p.spawnTime > WORD_LIFETIME) {
              if (!p.isBomb) {
                missedCountRef.current++;
                setMissedCount(missedCountRef.current);
                comboRef.current = 0;
                setCombo(0);
              }
              return { ...p, missed: true };
            }
          }

          return { ...p, x: newX, y: newY, vy: newVy, angle: newAngle };
        }).filter(p => !(p.missed && Date.now() - p.spawnTime > WORD_LIFETIME + 1000));

        projectilesRef.current = updated;
        return updated;
      });

      // Clean old trails
      setSliceTrails(prev => prev.filter(t => Date.now() - t.time < 200));
      setSliceParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.3,
      })).filter(p => p.y < 1000));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameOver, spawnWord]);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Game over handler
  useEffect(() => {
    if (gameOver && !completionTriggeredRef.current) {
      completionTriggeredRef.current = true;
      speechManager.stopListening();
      setTimeout(() => {
        onCompleteRef.current(slicedCountRef.current, missedCountRef.current);
      }, 1500);
    }
  }, [gameOver]);

  // Slice detection on pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isSlicing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (lastPointer) {
      // Add trail
      setSliceTrails(prev => [...prev, {
        id: `trail-${Date.now()}`,
        x1: lastPointer.x, y1: lastPointer.y,
        x2: x, y2: y,
        time: Date.now(),
      }]);

      // Check intersection with unlocked words
      setProjectiles(prev => {
        let changed = false;
        const updated = prev.map(p => {
          if (p.sliced || p.missed) return p;
          
          // Check if slice line crosses near the word
          const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
          if (dist < 50) {
            if (p.isBomb) {
              // Sliced a bomb! Damage player
              onDamage?.(15);
              changed = true;
              return { ...p, sliced: true };
            }
            if (p.unlocked) {
              // Successfully sliced!
              slicedCountRef.current++;
              setSlicedCount(slicedCountRef.current);
              comboRef.current++;
              setCombo(comboRef.current);
              setMaxCombo(prev => Math.max(prev, comboRef.current));

              // Create split particles
              setSliceParticles(prev => [
                ...prev,
                { id: `sp-${Date.now()}-l`, x: p.x - 10, y: p.y, word: p.word.slice(0, Math.ceil(p.word.length / 2)), half: 'left', vx: -3, vy: -2 },
                { id: `sp-${Date.now()}-r`, x: p.x + 10, y: p.y, word: p.word.slice(Math.ceil(p.word.length / 2)), half: 'right', vx: 3, vy: -2 },
              ]);

              changed = true;
              return { ...p, sliced: true };
            }
          }
          return p;
        });
        if (changed) projectilesRef.current = updated;
        return changed ? updated : prev;
      });
    }

    setLastPointer({ x, y });
  }, [isSlicing, lastPointer, onDamage]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsSlicing(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setLastPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsSlicing(false);
    setLastPointer(null);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-indigo-950 to-black overflow-hidden select-none"
      style={{ cursor: isSlicing ? 'none' : 'crosshair', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* HUD */}
      <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6 z-[110]">
        <div className="flex items-center gap-3">
          <Sword className="h-6 w-6 text-yellow-400" />
          <span className="text-2xl font-black text-white">WORD NINJA</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-black/50 rounded-lg px-3 py-1 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{slicedCount}</span>
          </div>
          {combo > 1 && (
            <motion.div
              key={combo}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="bg-orange-500/80 rounded-lg px-3 py-1"
            >
              <span className="text-white font-black">{combo}x COMBO!</span>
            </motion.div>
          )}
          <div className="bg-black/50 rounded-lg px-3 py-1">
            <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[110]">
        <p className="text-slate-400 text-sm text-center">
          🎤 Speak words to unlock them • ✂️ Swipe to slice • 💣 Avoid bombs!
        </p>
      </div>

      {/* Word Projectiles */}
      <AnimatePresence>
        {projectiles.map(p => {
          if (p.sliced || p.missed) return null;
          return (
            <motion.div
              key={p.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: p.angle }}
              exit={{ scale: 0, opacity: 0 }}
              className={`absolute z-[105] pointer-events-none`}
              style={{
                left: p.x,
                top: p.y,
                transform: `translate(-50%, -50%) rotate(${p.angle}deg)`,
              }}
            >
              <div className={`px-4 py-2 rounded-xl font-bold text-lg shadow-lg
                ${p.isBomb 
                  ? 'bg-red-900/90 border-2 border-red-500 text-red-200 animate-pulse' 
                  : p.unlocked 
                    ? 'bg-green-500/90 border-2 border-green-300 text-white shadow-green-500/50 shadow-lg' 
                    : 'bg-slate-700/90 border-2 border-slate-500 text-slate-300'
                }`}
              >
                {p.word}
                {p.unlocked && !p.isBomb && (
                  <Zap className="inline-block ml-1 h-4 w-4 text-yellow-300" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Slice Particles (split word halves) */}
      {sliceParticles.map(sp => (
        <div
          key={sp.id}
          className="absolute z-[106] pointer-events-none text-green-400 font-bold text-lg opacity-70"
          style={{
            left: sp.x,
            top: sp.y,
            transform: `rotate(${sp.half === 'left' ? -25 : 25}deg)`,
          }}
        >
          {sp.word}
        </div>
      ))}

      {/* Slice Trails */}
      <svg className="absolute inset-0 z-[104] pointer-events-none" width="100%" height="100%">
        {sliceTrails.map(t => (
          <line
            key={t.id}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="rgba(255,255,100,0.8)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[120] flex items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="text-center"
            >
              <Sword className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-4xl font-black text-white mb-2">WORD NINJA!</h2>
              <p className="text-2xl text-yellow-400 font-bold">{slicedCount} Words Sliced</p>
              {maxCombo > 1 && (
                <p className="text-lg text-orange-400 mt-1">Best Combo: {maxCombo}x</p>
              )}
              <p className="text-slate-400 mt-1">{missedCount} Missed</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
