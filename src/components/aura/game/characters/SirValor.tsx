import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type KnightState = 'idle' | 'hit' | 'attacking' | 'victory' | 'defeated' | 'blocking';

interface SirValorProps {
  state: KnightState;
  healthPercent: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  currentStreak?: number;
}

const sizeConfig = {
  small: { width: 70, height: 120 },
  medium: { width: 100, height: 170 },
  large: { width: 130, height: 220 },
};

export const SirValor = ({
  state,
  healthPercent,
  showDamage,
  size = 'medium',
  flipX = false,
  currentStreak = 0,
}: SirValorProps) => {
  const [coreGlow, setCoreGlow] = useState(0.8);
  const [capePhase, setCapePhase] = useState(0);
  const { width, height } = sizeConfig[size];

  // Core glow pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setCoreGlow(prev => prev === 0.8 ? 1 : 0.8);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cape wave animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCapePhase(prev => (prev + 1) % 4);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const getCapeWave = () => {
    const waves = [
      "M85 45 Q95 80 90 120 Q85 100 80 80 Q75 100 70 120 L70 45 Z",
      "M85 45 Q100 75 95 120 Q90 95 85 75 Q80 95 75 120 L70 45 Z",
      "M85 45 Q98 82 92 120 Q87 98 82 78 Q77 98 72 120 L70 45 Z",
      "M85 45 Q92 78 88 120 Q83 102 78 82 Q73 102 68 120 L70 45 Z",
    ];
    return waves[capePhase];
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
          y: [0, -2, 0],
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'hit':
        return {
          x: [0, -5, 3, 0],
          transition: { duration: 0.25 },
        };
      case 'attacking':
        return {
          x: [0, 20, -5, 0],
          rotate: [0, 5, -2, 0],
          transition: { duration: 0.4 },
        };
      case 'victory':
        return {
          y: [0, -10, 0],
          scale: [1, 1.1, 1],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          y: [0, 20],
          rotate: [0, -15],
          opacity: [1, 0],
          transition: { duration: 1 },
        };
      case 'blocking':
        return {
          x: [-5],
          transition: { duration: 0.15 },
        };
      default:
        return {};
    }
  };

  const streakGlowIntensity = Math.min(currentStreak * 0.15, 1);

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
        viewBox="0 0 100 170"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Armor gradient - Royal Blue */}
          <linearGradient id="knightArmor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          {/* Gold trim gradient */}
          <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>

          {/* Silver metal */}
          <linearGradient id="silverMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8E8E8" />
            <stop offset="50%" stopColor="#C0C0C0" />
            <stop offset="100%" stopColor="#808080" />
          </linearGradient>

          {/* Cape gradient */}
          <linearGradient id="redCape" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="50%" stopColor="#B91C1C" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          {/* Energy core glow */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity={coreGlow} />
            <stop offset="60%" stopColor="#3B82F6" stopOpacity={coreGlow * 0.6} />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0" />
          </radialGradient>

          {/* Sword rune glow */}
          <linearGradient id="runeGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Filters */}
          <filter id="knightShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
          </filter>

          <filter id="coreGlowFilter" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Streak glow filter */}
          <filter id="streakGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feFlood floodColor="#FFD700" floodOpacity={streakGlowIntensity} result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Drop shadow */}
        <ellipse cx="50" cy="165" rx="25" ry="6" fill="#000000" opacity="0.3"/>

        {/* Cape (behind body) */}
        <motion.path
          d={getCapeWave()}
          fill="url(#redCape)"
          filter="url(#knightShadow)"
        />

        {/* Cape clasp */}
        <circle cx="77" cy="45" r="4" fill="url(#goldTrim)" stroke="#8B6914" strokeWidth="0.5"/>

        {/* Body/Torso armor */}
        <path
          d="M35 50 L65 50 L70 90 Q70 110 65 120 L35 120 Q30 110 30 90 Z"
          fill="url(#knightArmor)"
          stroke="#1E3A8A"
          strokeWidth="1"
          filter={currentStreak >= 3 ? "url(#streakGlow)" : "url(#knightShadow)"}
        />

        {/* Chest plate details */}
        <path
          d="M38 55 L62 55 L65 75 L35 75 Z"
          fill="url(#knightArmor)"
          stroke="url(#goldTrim)"
          strokeWidth="1.5"
        />

        {/* Energy core */}
        <motion.circle
          cx="50"
          cy="70"
          r="8"
          fill="url(#coreGlow)"
          filter="url(#coreGlowFilter)"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="50" cy="70" r="4" fill="#93C5FD" opacity="0.9"/>

        {/* Helmet */}
        <path
          d="M35 15 Q35 5 50 5 Q65 5 65 15 L65 40 Q65 50 50 50 Q35 50 35 40 Z"
          fill="url(#silverMetal)"
          stroke="#666"
          strokeWidth="1"
          filter="url(#knightShadow)"
        />

        {/* Helmet T-visor */}
        <path
          d="M40 25 L60 25 L60 28 L52 28 L52 38 L48 38 L48 28 L40 28 Z"
          fill="#1a1a1a"
        />

        {/* Helmet plume */}
        <path
          d="M50 5 Q55 -5 50 -10 Q60 -5 55 5"
          fill="#DC2626"
          stroke="#B91C1C"
          strokeWidth="0.5"
        />

        {/* Gold trim on helmet */}
        <path
          d="M35 20 L65 20"
          stroke="url(#goldTrim)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Left arm with shoulder plate */}
        <ellipse cx="28" cy="55" rx="8" ry="10" fill="url(#knightArmor)" filter="url(#knightShadow)"/>
        <path
          d="M22 55 Q20 70 22 85"
          stroke="url(#knightArmor)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* Shield */}
        <motion.g
          animate={state === 'blocking' ? { x: 5, y: -5 } : {}}
          transition={{ duration: 0.15 }}
        >
          <path
            d="M10 50 L30 45 L30 85 Q20 95 10 85 Z"
            fill="url(#knightArmor)"
            stroke="url(#goldTrim)"
            strokeWidth="2"
            filter="url(#knightShadow)"
          />
          {/* Shield emblem */}
          <path
            d="M18 60 L22 55 L26 60 L22 75 Z"
            fill="url(#goldTrim)"
          />
          <circle cx="20" cy="65" r="3" fill="#1E3A8A"/>
        </motion.g>

        {/* Right arm */}
        <ellipse cx="72" cy="55" rx="8" ry="10" fill="url(#knightArmor)" filter="url(#knightShadow)"/>
        <path
          d="M72 55 Q80 70 75 85"
          stroke="url(#knightArmor)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Sword */}
        <motion.g
          animate={state === 'attacking' ? { rotate: [0, -45, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{ transformOrigin: '75px 85px' }}
        >
          {/* Sword blade */}
          <path
            d="M82 30 L85 85 L82 88 L79 85 L82 30"
            fill="url(#silverMetal)"
            stroke="#666"
            strokeWidth="0.5"
            filter="url(#knightShadow)"
          />
          
          {/* Sword runes */}
          <motion.path
            d="M82 40 L82 50 M82 55 L82 65 M82 70 L82 78"
            stroke="url(#runeGlow)"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Sword guard */}
          <rect x="74" y="84" width="16" height="4" rx="1" fill="url(#goldTrim)"/>
          
          {/* Sword handle */}
          <rect x="79" y="88" width="6" height="12" rx="1" fill="#4A3728"/>
          
          {/* Sword pommel */}
          <circle cx="82" cy="102" r="4" fill="url(#goldTrim)"/>
        </motion.g>

        {/* Legs */}
        <path
          d="M38 120 L38 145 Q38 150 42 150 L42 120"
          fill="url(#knightArmor)"
          filter="url(#knightShadow)"
        />
        <path
          d="M58 120 L58 145 Q58 150 62 150 L62 120"
          fill="url(#knightArmor)"
          filter="url(#knightShadow)"
        />

        {/* Knee plates */}
        <ellipse cx="40" cy="130" rx="6" ry="4" fill="url(#goldTrim)"/>
        <ellipse cx="60" cy="130" rx="6" ry="4" fill="url(#goldTrim)"/>

        {/* Boots */}
        <path
          d="M35 148 L45 148 L48 155 L32 155 Z"
          fill="url(#silverMetal)"
          stroke="#666"
          strokeWidth="0.5"
        />
        <path
          d="M55 148 L65 148 L68 155 L52 155 Z"
          fill="url(#silverMetal)"
          stroke="#666"
          strokeWidth="0.5"
        />

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="100" height="170" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[80px]">
        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-black/30">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthPercent > 50
                ? 'linear-gradient(90deg, #3B82F6, #60A5FA)'
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

      {/* Streak indicator */}
      {currentStreak >= 3 && (
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-400 whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🔥 {currentStreak}x COMBO
        </motion.div>
      )}

      {/* Victory particles */}
      {state === 'victory' && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                background: i % 2 === 0 ? '#FFD700' : '#60A5FA',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 60,
                y: Math.sin((i / 12) * Math.PI * 2) * 60 - 20,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 1, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}

      {/* Defeat fade to light */}
      {state === 'defeated' && (
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-blue-200 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}
    </motion.div>
  );
};
