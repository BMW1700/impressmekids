import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type DragonState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface DrakeTheDragonProps {
  state: DragonState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 100, height: 120 },
  medium: { width: 150, height: 180 },
  large: { width: 200, height: 240 },
};

export const DrakeTheDragon = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'medium',
  flipX = false,
}: DrakeTheDragonProps) => {
  const [wingPhase, setWingPhase] = useState(0);
  const [fireParticles, setFireParticles] = useState<number[]>([]);
  const [eyeGlow, setEyeGlow] = useState(0.8);
  const { width, height } = sizeConfig[size];

  // Wing flap animation
  useEffect(() => {
    const interval = setInterval(() => {
      setWingPhase(prev => (prev + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Eye glow pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setEyeGlow(prev => prev === 0.8 ? 1 : 0.8);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Fire particles when attacking
  useEffect(() => {
    if (state === 'attacking') {
      setFireParticles([0, 1, 2, 3, 4, 5]);
    } else {
      setFireParticles([]);
    }
  }, [state]);

  const getWingPath = (isLeft: boolean) => {
    const phases = isLeft ? [
      "M30 60 Q10 40 5 20 Q15 30 25 25 Q20 40 30 50 Z",
      "M30 60 Q5 35 0 15 Q12 28 22 22 Q18 38 30 48 Z",
      "M30 60 Q8 38 3 18 Q14 29 24 24 Q19 39 30 49 Z",
      "M30 60 Q12 42 8 22 Q16 32 26 28 Q21 42 30 52 Z",
    ] : [
      "M90 60 Q110 40 115 20 Q105 30 95 25 Q100 40 90 50 Z",
      "M90 60 Q115 35 120 15 Q108 28 98 22 Q102 38 90 48 Z",
      "M90 60 Q112 38 117 18 Q106 29 96 24 Q101 39 90 49 Z",
      "M90 60 Q108 42 112 22 Q104 32 94 28 Q99 42 90 52 Z",
    ];
    return phases[wingPhase];
  };

  const getStateAnimation = (): {
    y?: number[];
    x?: number[];
    scale?: number[];
    rotate?: number[];
    opacity?: number[];
    transition?: { duration: number; repeat?: number; ease?: 'easeInOut' | 'easeOut' };
  } => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -5, 0],
          scale: [1, 1.02, 1],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'hit':
        return {
          x: [0, -10, 5, 0],
          rotate: [0, -5, 3, 0],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          x: [0, 20, -5, 0],
          scale: [1, 1.1, 1],
          transition: { duration: 0.5 },
        };
      case 'defeated':
        return {
          y: [0, 30],
          rotate: [0, 15],
          opacity: [1, 0.5],
          transition: { duration: 1.2 },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className="relative"
      style={{
        width,
        height,
        transform: flipX ? 'scaleX(-1)' : undefined,
      }}
      animate={getStateAnimation()}
    >
      <svg
        viewBox="0 0 120 150"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Dragon body gradient - Deep orange/red */}
          <linearGradient id="dragonBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="50%" stopColor="#B91C1C" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          {/* Dragon belly gradient - Amber */}
          <linearGradient id="dragonBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Wing membrane */}
          <linearGradient id="wingMembrane" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#991B1B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.7" />
          </linearGradient>

          {/* Fire gradient */}
          <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>

          {/* Horn gradient */}
          <linearGradient id="hornGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#44403C" />
            <stop offset="100%" stopColor="#1C1917" />
          </linearGradient>

          {/* Eye glow */}
          <radialGradient id="dragonEyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity={eyeGlow} />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity={eyeGlow * 0.7} />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </radialGradient>

          {/* Filters */}
          <filter id="dragonShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.5"/>
          </filter>

          <filter id="fireGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Drop shadow */}
        <ellipse cx="60" cy="145" rx="40" ry="8" fill="#000000" opacity="0.4"/>

        {/* Left Wing */}
        <motion.path
          d={getWingPath(true)}
          fill="url(#wingMembrane)"
          stroke="#7F1D1D"
          strokeWidth="1"
          filter="url(#dragonShadow)"
        />

        {/* Right Wing */}
        <motion.path
          d={getWingPath(false)}
          fill="url(#wingMembrane)"
          stroke="#7F1D1D"
          strokeWidth="1"
          filter="url(#dragonShadow)"
        />

        {/* Tail */}
        <path
          d="M60 120 Q30 130 20 140 Q25 135 15 145 L25 138 Q35 125 55 115"
          fill="url(#dragonBody)"
          filter="url(#dragonShadow)"
        />

        {/* Tail spikes */}
        <path d="M25 138 L20 130 L28 135" fill="url(#hornGrad)"/>
        <path d="M35 132 L32 124 L38 130" fill="url(#hornGrad)"/>

        {/* Body */}
        <ellipse 
          cx="60" cy="90" rx="30" ry="35" 
          fill="url(#dragonBody)"
          filter="url(#dragonShadow)"
        />

        {/* Belly */}
        <ellipse 
          cx="60" cy="95" rx="18" ry="22" 
          fill="url(#dragonBelly)"
        />

        {/* Belly scales */}
        <path d="M50 80 Q60 78 70 80" stroke="#D97706" strokeWidth="1" fill="none"/>
        <path d="M48 88 Q60 86 72 88" stroke="#D97706" strokeWidth="1" fill="none"/>
        <path d="M50 96 Q60 94 70 96" stroke="#D97706" strokeWidth="1" fill="none"/>
        <path d="M52 104 Q60 102 68 104" stroke="#D97706" strokeWidth="1" fill="none"/>

        {/* Neck */}
        <path
          d="M45 75 Q50 55 55 45 L65 45 Q70 55 75 75 Z"
          fill="url(#dragonBody)"
          filter="url(#dragonShadow)"
        />

        {/* Head */}
        <ellipse 
          cx="60" cy="40" rx="22" ry="18" 
          fill="url(#dragonBody)"
          filter="url(#dragonShadow)"
        />

        {/* Snout */}
        <path
          d="M60 48 L50 55 Q60 60 70 55 Z"
          fill="url(#dragonBody)"
        />

        {/* Nostrils with smoke */}
        <circle cx="54" cy="52" r="2" fill="#1C1917"/>
        <circle cx="66" cy="52" r="2" fill="#1C1917"/>

        {/* Horns */}
        <path
          d="M45 28 Q40 15 45 5 Q48 18 50 28"
          fill="url(#hornGrad)"
          filter="url(#dragonShadow)"
        />
        <path
          d="M75 28 Q80 15 75 5 Q72 18 70 28"
          fill="url(#hornGrad)"
          filter="url(#dragonShadow)"
        />

        {/* Smaller horns */}
        <path d="M40 35 Q35 28 38 22 Q42 28 43 34" fill="url(#hornGrad)"/>
        <path d="M80 35 Q85 28 82 22 Q78 28 77 34" fill="url(#hornGrad)"/>

        {/* Eyes */}
        <motion.g filter="url(#fireGlow)">
          <ellipse cx="50" cy="38" rx="6" ry="5" fill="url(#dragonEyeGlow)"/>
          <ellipse cx="70" cy="38" rx="6" ry="5" fill="url(#dragonEyeGlow)"/>
          <ellipse cx="50" cy="38" rx="2" ry="4" fill="#1C1917"/>
          <ellipse cx="70" cy="38" rx="2" ry="4" fill="#1C1917"/>
        </motion.g>

        {/* Brow ridges */}
        <path d="M42 32 Q50 30 55 34" stroke="#7F1D1D" strokeWidth="2" fill="none"/>
        <path d="M78 32 Q70 30 65 34" stroke="#7F1D1D" strokeWidth="2" fill="none"/>

        {/* Front legs */}
        <path
          d="M35 95 Q30 110 25 125 L35 125 Q38 112 42 100 Z"
          fill="url(#dragonBody)"
          filter="url(#dragonShadow)"
        />
        <path
          d="M85 95 Q90 110 95 125 L85 125 Q82 112 78 100 Z"
          fill="url(#dragonBody)"
          filter="url(#dragonShadow)"
        />

        {/* Claws */}
        <path d="M25 125 L22 132 L28 128" fill="url(#hornGrad)"/>
        <path d="M30 125 L28 133 L34 128" fill="url(#hornGrad)"/>
        <path d="M95 125 L98 132 L92 128" fill="url(#hornGrad)"/>
        <path d="M90 125 L92 133 L86 128" fill="url(#hornGrad)"/>

        {/* Back spines */}
        <path d="M58 58 L55 48 L62 58" fill="url(#hornGrad)"/>
        <path d="M56 68 L52 58 L60 68" fill="url(#hornGrad)"/>
        <path d="M55 78 L50 68 L58 78" fill="url(#hornGrad)"/>

        {/* Fire breath when attacking */}
        {state === 'attacking' && (
          <motion.g filter="url(#fireGlow)">
            <motion.path
              d="M60 55 Q80 50 100 40 Q90 55 110 50 Q95 60 100 70 Q80 60 60 60 Z"
              fill="url(#fireGrad)"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: '60px 57px' }}
            />
            {/* Fire particles */}
            {fireParticles.map((_, i) => (
              <motion.circle
                key={i}
                r={3 + Math.random() * 3}
                fill={i % 2 === 0 ? '#FCD34D' : '#F59E0B'}
                initial={{ cx: 70, cy: 55, opacity: 1 }}
                animate={{ 
                  cx: 100 + Math.random() * 20,
                  cy: 45 + Math.random() * 20,
                  opacity: 0,
                  r: 0,
                }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              />
            ))}
          </motion.g>
        )}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="120" height="150" fill="white" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[100px]">
        {currentHp !== undefined && maxHp !== undefined && (
          <div className="text-center text-xs font-bold text-white mb-0.5" 
               style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
            {currentHp}/{maxHp}
          </div>
        )}
        <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-black/40">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthPercent > 50 
                ? 'linear-gradient(90deg, #DC2626, #EF4444)' 
                : healthPercent > 25 
                  ? 'linear-gradient(90deg, #eab308, #facc15)'
                  : 'linear-gradient(90deg, #7F1D1D, #991B1B)',
            }}
            initial={{ width: '100%' }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Defeat ember particles */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                background: i % 3 === 0 ? '#FCD34D' : i % 3 === 1 ? '#F59E0B' : '#DC2626',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 70,
                y: Math.sin((i / 12) * Math.PI * 2) * 50 - 20,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 1, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
