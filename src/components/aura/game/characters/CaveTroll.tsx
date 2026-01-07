import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type CaveTrollState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface CaveTrollProps {
  state: CaveTrollState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 100, height: 130 },
  medium: { width: 150, height: 195 },
  large: { width: 200, height: 260 },
};

export const CaveTroll = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: CaveTrollProps) => {
  const [breathing, setBreathing] = useState(0);
  const { width, height } = sizeConfig[size];

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathing(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const breathScale = 1 + Math.sin(breathing * 0.1) * 0.02;

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -3, 0],
          scale: [1, 1.01, 1],
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -10, 6, 0],
          filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)'],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          y: [0, -20, 10, 0],
          rotate: [0, -8, 4, 0],
          transition: { duration: 0.5 },
        };
      case 'defeated':
        return {
          rotate: [0, 10],
          y: [0, 30],
          scale: [1, 0.85],
          opacity: [1, 0.5],
          transition: { duration: 1 },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className="relative"
      style={{ width, height }}
      animate={getStateAnimation()}
    >
      <svg
        viewBox="0 0 150 195"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Stone skin gradient */}
          <linearGradient id="trollSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="50%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          {/* Moss/dirt gradient */}
          <linearGradient id="trollMoss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A5D23" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3D4F1E" stopOpacity="0.3" />
          </linearGradient>
          
          {/* Club gradient */}
          <linearGradient id="trollClub" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78716C" />
            <stop offset="50%" stopColor="#57534E" />
            <stop offset="100%" stopColor="#44403C" />
          </linearGradient>

          <filter id="trollShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.5"/>
          </filter>

          {/* Glowing eyes */}
          <filter id="trollEyeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="75" cy="190" rx="50" ry="12" fill="#000000" opacity="0.4"/>

        {/* Massive body */}
        <motion.g style={{ scale: breathScale, transformOrigin: '75px 120px' }}>
          {/* Body - hunched massive torso */}
          <ellipse 
            cx="75" cy="120" rx="55" ry="50" 
            fill="url(#trollSkin)"
            filter="url(#trollShadow)"
          />
          
          {/* Moss patches on body */}
          <ellipse cx="45" cy="110" rx="15" ry="12" fill="url(#trollMoss)"/>
          <ellipse cx="100" cy="125" rx="12" ry="10" fill="url(#trollMoss)"/>
          
          {/* Hunched back hump */}
          <ellipse cx="75" cy="85" rx="35" ry="25" fill="url(#trollSkin)"/>
          
          {/* Head - small for body */}
          <ellipse cx="75" cy="55" rx="28" ry="24" fill="url(#trollSkin)" filter="url(#trollShadow)"/>
          
          {/* Heavy brow */}
          <path
            d="M50 48 Q75 40 100 48"
            fill="url(#trollSkin)"
            stroke="#374151"
            strokeWidth="4"
          />
          
          {/* Glowing eyes in shadow */}
          <g filter="url(#trollEyeGlow)">
            <circle cx="62" cy="52" r="5" fill="#EF4444"/>
            <circle cx="88" cy="52" r="5" fill="#EF4444"/>
            <circle cx="63" cy="51" r="2" fill="#FCA5A5"/>
            <circle cx="89" cy="51" r="2" fill="#FCA5A5"/>
          </g>
          
          {/* Tusks */}
          <path d="M58 68 Q52 78 56 82" stroke="#E5E7EB" strokeWidth="5" strokeLinecap="round" fill="none"/>
          <path d="M92 68 Q98 78 94 82" stroke="#E5E7EB" strokeWidth="5" strokeLinecap="round" fill="none"/>
          
          {/* Wide mouth */}
          <path
            d="M60 65 Q75 72 90 65"
            fill="none"
            stroke="#1F2937"
            strokeWidth="2"
          />
          
          {/* Ears - small and pointed */}
          <path d="M45 45 Q35 35 40 25 Q50 35 48 48" fill="url(#trollSkin)"/>
          <path d="M105 45 Q115 35 110 25 Q100 35 102 48" fill="url(#trollSkin)"/>
        </motion.g>

        {/* Left arm - massive */}
        <ellipse cx="25" cy="115" rx="22" ry="35" fill="url(#trollSkin)" filter="url(#trollShadow)"/>
        <ellipse cx="18" cy="150" rx="15" ry="18" fill="url(#trollSkin)"/>
        
        {/* Right arm with club */}
        <motion.g
          animate={state === 'attacking' ? { rotate: [-30, 60, -30] } : { rotate: 0 }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: '125px 110px' }}
        >
          <ellipse cx="125" cy="115" rx="22" ry="35" fill="url(#trollSkin)" filter="url(#trollShadow)"/>
          <ellipse cx="132" cy="150" rx="15" ry="18" fill="url(#trollSkin)"/>
          
          {/* Massive stone club */}
          <rect
            x="135" y="85" width="18" height="70" rx="4"
            fill="url(#trollClub)"
            filter="url(#trollShadow)"
            transform="rotate(20, 144, 120)"
          />
          {/* Club head - boulder */}
          <ellipse
            cx="155" cy="55" rx="25" ry="22"
            fill="url(#trollClub)"
            filter="url(#trollShadow)"
            transform="rotate(20, 155, 55)"
          />
          {/* Cracks in club head */}
          <path d="M145 45 L155 55 L148 65" stroke="#292524" strokeWidth="2" fill="none"/>
          <path d="M160 40 L165 52" stroke="#292524" strokeWidth="2" fill="none"/>
        </motion.g>

        {/* Legs - thick stumpy */}
        <ellipse cx="55" cy="165" rx="18" ry="25" fill="url(#trollSkin)" filter="url(#trollShadow)"/>
        <ellipse cx="95" cy="165" rx="18" ry="25" fill="url(#trollSkin)" filter="url(#trollShadow)"/>
        
        {/* Feet */}
        <ellipse cx="50" cy="185" rx="20" ry="8" fill="#374151"/>
        <ellipse cx="100" cy="185" rx="20" ry="8" fill="#374151"/>

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="150" height="195" fill="white" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
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
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
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
      )}

      {/* Defeat particles */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-5 h-5 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                background: 'radial-gradient(circle, #6B7280 0%, #374151 50%, transparent 100%)',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos((i / 10) * Math.PI * 2) * 60,
                y: Math.sin((i / 10) * Math.PI * 2) * 60 - 20,
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
