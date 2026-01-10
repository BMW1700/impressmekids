import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type VoidPhantomState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface VoidPhantomProps {
  state: VoidPhantomState;
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

export const VoidPhantom = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: VoidPhantomProps) => {
  const [flicker, setFlicker] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setFlicker(prev => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const flickerOpacity = 0.7 + Math.sin(flicker * 0.3) * 0.3;

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -15, 0],
          x: [0, 5, -5, 0],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -20, 15, 0],
          opacity: [1, 0.3, 1],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          x: [0, 50, 0],
          scale: [1, 1.3, 1],
          opacity: [1, 0.5, 1],
          transition: { duration: 0.4 },
        };
      case 'defeated':
        return {
          scale: [1, 1.2, 0],
          opacity: [1, 0.5, 0],
          rotate: [0, 180, 360],
          transition: { duration: 1.5 },
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
          <radialGradient id="voidCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#581C87" stopOpacity="0.9"/>
            <stop offset="50%" stopColor="#3B0764" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#0F0A1A" stopOpacity="0.5"/>
          </radialGradient>
          
          <radialGradient id="voidGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#581C87" stopOpacity="0"/>
          </radialGradient>

          <filter id="voidBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="distortion">
            <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence"/>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="5"/>
          </filter>
        </defs>

        {/* Outer void aura */}
        <motion.ellipse
          cx="75"
          cy="100"
          rx="60"
          ry="75"
          fill="url(#voidGlow)"
          opacity={flickerOpacity * 0.5}
          filter="url(#voidBlur)"
        />

        {/* Dark matter particles orbiting */}
        {[...Array(8)].map((_, i) => (
          <motion.circle
            key={i}
            r={4}
            fill="#A855F7"
            opacity={0.6}
            animate={{
              cx: [75, 75 + Math.cos((flicker * 0.05 + i * 0.785) * Math.PI) * (35 + i * 3)],
              cy: [100, 100 + Math.sin((flicker * 0.05 + i * 0.785) * Math.PI) * (45 + i * 3)],
            }}
            transition={{ duration: 0 }}
          />
        ))}

        {/* Main phantom body - flickering */}
        <motion.g opacity={flickerOpacity} filter="url(#voidBlur)">
          {/* Wispy body shape */}
          <path
            d="M50 60 Q40 100 45 140 Q50 170 60 180 Q75 190 90 180 Q100 170 105 140 Q110 100 100 60 Q90 40 75 35 Q60 40 50 60"
            fill="url(#voidCore)"
          />
          
          {/* Inner darker core */}
          <ellipse cx="75" cy="100" rx="25" ry="35" fill="#0F0A1A" opacity="0.8"/>
        </motion.g>

        {/* Hood/head shape */}
        <motion.path
          d="M45 50 Q45 20 75 15 Q105 20 105 50 Q105 70 75 75 Q45 70 45 50"
          fill="url(#voidCore)"
          opacity={flickerOpacity}
        />

        {/* Glowing eyes */}
        <g filter="url(#voidBlur)">
          <motion.ellipse
            cx="60"
            cy="50"
            rx="8"
            ry="6"
            fill="#F0ABFC"
            animate={{
              opacity: [0.8, 1, 0.8],
              rx: [8, 9, 8],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.ellipse
            cx="90"
            cy="50"
            rx="8"
            ry="6"
            fill="#F0ABFC"
            animate={{
              opacity: [0.8, 1, 0.8],
              rx: [8, 9, 8],
            }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
          />
          {/* Eye trails */}
          <motion.path
            d="M52 50 L40 45"
            stroke="#F0ABFC"
            strokeWidth="3"
            opacity={0.5}
            animate={{ opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.path
            d="M98 50 L110 45"
            stroke="#F0ABFC"
            strokeWidth="3"
            opacity={0.5}
            animate={{ opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
        </g>

        {/* Wispy arms */}
        <motion.path
          d="M45 90 Q25 85 15 100 Q10 120 20 130"
          stroke="url(#voidCore)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          opacity={flickerOpacity * 0.8}
          animate={state === 'attacking' ? {
            d: [
              "M45 90 Q25 85 15 100 Q10 120 20 130",
              "M45 90 Q15 75 0 85 Q-10 100 5 120",
              "M45 90 Q25 85 15 100 Q10 120 20 130",
            ]
          } : {}}
          transition={{ duration: 0.3 }}
        />
        
        <motion.path
          d="M105 90 Q125 85 135 100 Q140 120 130 130"
          stroke="url(#voidCore)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          opacity={flickerOpacity * 0.8}
          animate={state === 'attacking' ? {
            d: [
              "M105 90 Q125 85 135 100 Q140 120 130 130",
              "M105 90 Q135 75 150 85 Q160 100 145 120",
              "M105 90 Q125 85 135 100 Q140 120 130 130",
            ]
          } : {}}
          transition={{ duration: 0.3 }}
        />

        {/* Trailing wisps at bottom */}
        {[...Array(4)].map((_, i) => (
          <motion.path
            key={i}
            d={`M${55 + i * 15} 175 Q${50 + i * 15 + Math.sin(flicker * 0.1 + i) * 5} 190 ${55 + i * 15} 200`}
            stroke="#3B0764"
            strokeWidth="6"
            fill="none"
            opacity={0.6 - i * 0.1}
            strokeLinecap="round"
          />
        ))}

        {/* Attack energy burst */}
        {state === 'attacking' && (
          <g filter="url(#voidBlur)">
            {[...Array(6)].map((_, i) => (
              <motion.circle
                key={i}
                cx={75}
                cy={100}
                r={10}
                fill="#A855F7"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{
                  scale: [1, 3],
                  opacity: [0.8, 0],
                  cx: [75, 75 + Math.cos(i * 60 * Math.PI / 180) * 50],
                  cy: [100, 100 + Math.sin(i * 60 * Math.PI / 180) * 50],
                }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              />
            ))}
          </g>
        )}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="150" height="195" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.15s" fill="freeze"/>
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

      {/* Defeat - imploding into void */}
      {state === 'defeated' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="rounded-full"
            style={{
              width: 10,
              height: 10,
              background: 'radial-gradient(circle, #A855F7, #0F0A1A)',
            }}
            initial={{ scale: 10, opacity: 0.8 }}
            animate={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </div>
      )}
    </motion.div>
  );
};
