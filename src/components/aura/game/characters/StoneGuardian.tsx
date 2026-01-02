import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type GuardianState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface StoneGuardianProps {
  state: GuardianState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 90, height: 120 },
  medium: { width: 135, height: 180 },
  large: { width: 180, height: 240 },
};

export const StoneGuardian = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'medium',
  flipX = false,
}: StoneGuardianProps) => {
  const [runeGlow, setRuneGlow] = useState(0.5);
  const [groundShake, setGroundShake] = useState(false);
  const { width, height } = sizeConfig[size];

  // Rune pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setRuneGlow(prev => prev === 0.5 ? 0.9 : 0.5);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Ground shake on attack
  useEffect(() => {
    if (state === 'attacking') {
      setGroundShake(true);
      setTimeout(() => setGroundShake(false), 500);
    }
  }, [state]);

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
          y: [0, -2, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'hit':
        return {
          x: [0, -5, 3, 0],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          y: [0, 10, -5, 0],
          scale: [1, 0.95, 1.05, 1],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          y: [0, 5, 15],
          scale: [1, 0.9, 0.8],
          rotate: [0, -3, 8],
          opacity: [1, 0.8, 0.5],
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
        viewBox="0 0 100 140"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Stone gradient */}
          <linearGradient id="stoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78716C" />
            <stop offset="50%" stopColor="#57534E" />
            <stop offset="100%" stopColor="#44403C" />
          </linearGradient>

          {/* Dark stone */}
          <linearGradient id="darkStone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#44403C" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>

          {/* Amber rune glow */}
          <radialGradient id="runeGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity={runeGlow} />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity={runeGlow * 0.6} />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>

          {/* Moss gradient */}
          <linearGradient id="mossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4D7C0F" />
            <stop offset="100%" stopColor="#365314" />
          </linearGradient>

          {/* Eye glow */}
          <radialGradient id="stoneEyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>

          {/* Filters */}
          <filter id="stoneShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.6"/>
          </filter>

          <filter id="runeGlowFilter" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ground cracks when attacking */}
        {groundShake && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
          >
            <path d="M30 135 L25 140 L35 138" stroke="#44403C" strokeWidth="2" fill="none"/>
            <path d="M50 137 L48 142 L55 140" stroke="#44403C" strokeWidth="2" fill="none"/>
            <path d="M70 135 L75 140 L65 138" stroke="#44403C" strokeWidth="2" fill="none"/>
          </motion.g>
        )}

        {/* Drop shadow */}
        <ellipse cx="50" cy="135" rx="35" ry="8" fill="#1C1917" opacity="0.5"/>

        {/* Left leg - massive stone column */}
        <path
          d="M25 95 L20 130 L40 130 L35 95 Z"
          fill="url(#stoneBody)"
          filter="url(#stoneShadow)"
        />
        
        {/* Right leg */}
        <path
          d="M65 95 L60 130 L80 130 L75 95 Z"
          fill="url(#stoneBody)"
          filter="url(#stoneShadow)"
        />

        {/* Stone cracks on legs */}
        <path d="M28 100 L24 115" stroke="#292524" strokeWidth="1.5"/>
        <path d="M32 105 L30 120" stroke="#292524" strokeWidth="1"/>
        <path d="M72 100 L76 115" stroke="#292524" strokeWidth="1.5"/>
        <path d="M68 105 L70 120" stroke="#292524" strokeWidth="1"/>

        {/* Main body - massive torso */}
        <path
          d="M15 45 L50 30 L85 45 L90 90 Q50 105 10 90 Z"
          fill="url(#stoneBody)"
          filter="url(#stoneShadow)"
        />

        {/* Body stone texture/cracks */}
        <path d="M25 50 L30 75 L20 85" stroke="#44403C" strokeWidth="1.5" fill="none"/>
        <path d="M75 50 L70 75 L80 85" stroke="#44403C" strokeWidth="1.5" fill="none"/>
        <path d="M50 35 L48 55 L55 70" stroke="#44403C" strokeWidth="1" fill="none"/>

        {/* Rune on chest - glowing */}
        <motion.g filter="url(#runeGlowFilter)">
          <circle cx="50" cy="65" r="12" fill="url(#runeGlowGrad)"/>
          <motion.path
            d="M50 55 L45 65 L50 75 L55 65 Z M43 62 L57 62 M43 68 L57 68"
            stroke="#FCD34D"
            strokeWidth="2"
            fill="none"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.g>

        {/* Shoulder runes */}
        <motion.circle
          cx="25" cy="55"
          r="5"
          fill="url(#runeGlowGrad)"
          filter="url(#runeGlowFilter)"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.circle
          cx="75" cy="55"
          r="5"
          fill="url(#runeGlowGrad)"
          filter="url(#runeGlowFilter)"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />

        {/* Moss patches */}
        <ellipse cx="20" cy="80" rx="8" ry="4" fill="url(#mossGrad)" opacity="0.7"/>
        <ellipse cx="80" cy="75" rx="6" ry="3" fill="url(#mossGrad)" opacity="0.7"/>
        <ellipse cx="55" cy="90" rx="5" ry="3" fill="url(#mossGrad)" opacity="0.6"/>

        {/* Left arm - massive */}
        <path
          d="M10 50 L0 70 L5 90 L15 85 L12 65 L20 55 Z"
          fill="url(#stoneBody)"
          filter="url(#stoneShadow)"
        />

        {/* Right arm - attacking motion */}
        <motion.path
          d="M90 50 L100 70 L95 90 L85 85 L88 65 L80 55 Z"
          fill="url(#stoneBody)"
          filter="url(#stoneShadow)"
          animate={state === 'attacking' ? { rotate: [0, 45, 0] } : {}}
          transition={{ duration: 0.6 }}
          style={{ transformOrigin: '85px 55px' }}
        />

        {/* Stone fists */}
        <circle cx="5" cy="90" r="8" fill="url(#darkStone)" filter="url(#stoneShadow)"/>
        <motion.circle 
          cx="95" cy="90" r="8" 
          fill="url(#darkStone)" 
          filter="url(#stoneShadow)"
          animate={state === 'attacking' ? { cx: [95, 110, 95], cy: [90, 70, 90] } : {}}
          transition={{ duration: 0.6 }}
        />

        {/* Head - angular stone */}
        <path
          d="M35 15 L50 5 L65 15 L68 35 Q50 42 32 35 Z"
          fill="url(#stoneBody)"
          filter="url(#stoneShadow)"
        />

        {/* Head cracks */}
        <path d="M40 20 L38 30" stroke="#292524" strokeWidth="1"/>
        <path d="M60 20 L62 30" stroke="#292524" strokeWidth="1"/>

        {/* Stone brow */}
        <path
          d="M35 22 Q50 18 65 22"
          stroke="#44403C"
          strokeWidth="3"
          fill="none"
        />

        {/* Glowing eyes */}
        <motion.g
          filter="url(#runeGlowFilter)"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ellipse cx="42" cy="28" rx="5" ry="4" fill="url(#stoneEyeGlow)"/>
          <ellipse cx="58" cy="28" rx="5" ry="4" fill="url(#stoneEyeGlow)"/>
          <ellipse cx="42" cy="28" rx="2" ry="3" fill="#FCD34D"/>
          <ellipse cx="58" cy="28" rx="2" ry="3" fill="#FCD34D"/>
        </motion.g>

        {/* Ground pound shockwave when attacking */}
        {state === 'attacking' && (
          <motion.g>
            <motion.ellipse
              cx="50" cy="135"
              rx="30" ry="5"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              initial={{ rx: 10, ry: 2, opacity: 1 }}
              animate={{ rx: 60, ry: 10, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
            <motion.ellipse
              cx="50" cy="135"
              rx="20" ry="3"
              fill="none"
              stroke="#FCD34D"
              strokeWidth="1.5"
              initial={{ rx: 5, ry: 1, opacity: 1 }}
              animate={{ rx: 45, ry: 8, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            />
          </motion.g>
        )}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="100" height="140" fill="white" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0" dur="0.2s" fill="freeze"/>
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
                ? 'linear-gradient(90deg, #78716C, #A8A29E)' 
                : healthPercent > 25 
                  ? 'linear-gradient(90deg, #eab308, #facc15)'
                  : 'linear-gradient(90deg, #dc2626, #ef4444)',
            }}
            initial={{ width: '100%' }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Crumble particles on defeat */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${30 + Math.random() * 40}%`,
                top: `${30 + Math.random() * 50}%`,
                width: 6 + Math.random() * 10,
                height: 6 + Math.random() * 10,
                background: i % 3 === 0 ? '#78716C' : i % 3 === 1 ? '#57534E' : '#44403C',
                borderRadius: '2px',
              }}
              initial={{ opacity: 1, y: 0, rotate: 0 }}
              animate={{
                opacity: 0,
                y: 50 + Math.random() * 30,
                x: (Math.random() - 0.5) * 60,
                rotate: Math.random() * 180,
              }}
              transition={{ duration: 1, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
