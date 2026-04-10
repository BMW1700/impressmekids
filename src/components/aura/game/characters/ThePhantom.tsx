import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type ThePhantomState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'ground_slam';

interface ThePhantomProps {
  state: ThePhantomState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 70, height: 120 },
  medium: { width: 100, height: 170 },
  large: { width: 130, height: 220 },
};

export const ThePhantom = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'large', flipX = false }: ThePhantomProps) => {
  const { width, height } = sizeConfig[size];
  const [showDamageNum, setShowDamageNum] = useState(false);

  useEffect(() => {
    if (showDamage) {
      setShowDamageNum(true);
      const timer = setTimeout(() => setShowDamageNum(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showDamage]);

  const getAnimation = () => {
    switch (state) {
      case 'attacking': return { x: [0, -10, 10, 0], opacity: [1, 0.3, 1] };
      case 'hit': return { x: [0, 5, -5, 0], opacity: [1, 0.6, 1] };
      case 'defeated': return { opacity: [1, 0], scale: [1, 0.5], filter: ['blur(0px)', 'blur(10px)'] };
      case 'ground_slam': return { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] };
      default: return { opacity: [0.85, 1, 0.85], y: [0, -4, 0] };
    }
  };

  return (
    <motion.div
      className="relative"
      animate={getAnimation()}
      transition={{ duration: state === 'idle' ? 3 : 0.6, repeat: state === 'idle' ? Infinity : 0 }}
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
    >
      <svg width={width} height={height} viewBox="0 0 130 220" fill="none">
        <defs>
          <linearGradient id="phantomCloak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14532D" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#064E3B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#022C22" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="phantomGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Digital glitch aura */}
        <motion.ellipse cx="65" cy="110" rx="55" ry="100" fill="url(#phantomGlow)" opacity="0.15"
          animate={{ rx: [55, 60, 55], ry: [100, 105, 100], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }} />

        {/* Flowing hooded cloak */}
        <motion.path
          d="M65 20 L20 70 L15 200 L45 210 L65 205 L85 210 L115 200 L110 70 Z"
          fill="url(#phantomCloak)"
          animate={{ d: [
            "M65 20 L20 70 L15 200 L45 210 L65 205 L85 210 L115 200 L110 70 Z",
            "M65 18 L18 68 L13 202 L44 212 L65 207 L86 212 L117 202 L112 68 Z",
            "M65 20 L20 70 L15 200 L45 210 L65 205 L85 210 L115 200 L110 70 Z",
          ] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Hood */}
        <path d="M40 30 Q65 10 90 30 Q92 55 65 60 Q38 55 40 30" fill="#064E3B" />

        {/* Face — mostly hidden, only eyes visible */}
        <ellipse cx="65" cy="42" rx="18" ry="14" fill="#0A0A0A" opacity="0.8" />
        {/* Eyes — piercing green */}
        <motion.circle cx="56" cy="40" r="3" fill="#4ADE80"
          animate={{ opacity: [0.6, 1, 0.6], filter: ['drop-shadow(0 0 3px #4ADE80)', 'drop-shadow(0 0 8px #4ADE80)', 'drop-shadow(0 0 3px #4ADE80)'] }}
          transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="74" cy="40" r="3" fill="#4ADE80"
          animate={{ opacity: [0.6, 1, 0.6], filter: ['drop-shadow(0 0 3px #4ADE80)', 'drop-shadow(0 0 8px #4ADE80)', 'drop-shadow(0 0 3px #4ADE80)'] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
        {/* Eye pupils */}
        <circle cx="56" cy="40" r="1.5" fill="#166534" />
        <circle cx="74" cy="40" r="1.5" fill="#166534" />

        {/* Floating data fragments around the figure */}
        <motion.text x="20" y="100" fill="#4ADE80" fontSize="8" fontFamily="monospace" opacity="0.4"
          animate={{ y: [100, 90, 100], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}>
          01101
        </motion.text>
        <motion.text x="95" y="130" fill="#4ADE80" fontSize="7" fontFamily="monospace" opacity="0.3"
          animate={{ y: [130, 120, 130], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
          10010
        </motion.text>
        <motion.text x="30" y="160" fill="#4ADE80" fontSize="6" fontFamily="monospace" opacity="0.3"
          animate={{ y: [160, 150, 160], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}>
          11001
        </motion.text>

        {/* Hands emerging from cloak — skeletal/pale */}
        <ellipse cx="25" cy="140" rx="8" ry="5" fill="#D1D5DB" opacity="0.7" />
        <ellipse cx="105" cy="140" rx="8" ry="5" fill="#D1D5DB" opacity="0.7" />

        {/* Holographic keyboard effect near hands */}
        <motion.rect x="95" y="145" width="20" height="12" rx="2" fill="#4ADE80" opacity="0.15"
          animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 1.5, repeat: Infinity }} />
      </svg>

      {/* Health bar */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[85%]">
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-600">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthPercent > 50 ? 'linear-gradient(90deg, #22c55e, #4ade80)' :
                healthPercent > 25 ? 'linear-gradient(90deg, #eab308, #facc15)' :
                'linear-gradient(90deg, #dc2626, #ef4444)',
            }}
            animate={{ width: `${Math.max(0, healthPercent)}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        {currentHp !== undefined && maxHp !== undefined && (
          <p className="text-[8px] text-center text-gray-400 mt-0.5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{currentHp}/{maxHp}</p>
        )}
      </div>

      {showDamageNum && showDamage && (
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 text-red-400 font-bold text-lg"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          -{showDamage}
        </motion.div>
      )}
    </motion.div>
  );
};
