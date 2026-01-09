import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type InkKrakenState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface InkKrakenProps {
  state: InkKrakenState;
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

export const InkKraken = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: InkKrakenProps) => {
  const [tentacleWave, setTentacleWave] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setTentacleWave(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -5, 0],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -10, 8, 0],
          filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)'],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          scale: [1, 1.15, 1],
          y: [0, -15, 0],
          transition: { duration: 0.5 },
        };
      case 'defeated':
        return {
          rotate: [0, 20, -20, 0],
          y: [0, 50],
          opacity: [1, 0.4],
          transition: { duration: 1.2 },
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
          <linearGradient id="krakenBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#581C87"/>
            <stop offset="50%" stopColor="#3B0764"/>
            <stop offset="100%" stopColor="#1E1B4B"/>
          </linearGradient>
          
          <linearGradient id="krakenTentacle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7E22CE"/>
            <stop offset="100%" stopColor="#3B0764"/>
          </linearGradient>

          <linearGradient id="inkDrip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B"/>
            <stop offset="100%" stopColor="#0F172A"/>
          </linearGradient>

          <filter id="krakenGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ink pool shadow */}
        <ellipse cx="75" cy="190" rx="55" ry="12" fill="url(#inkDrip)" opacity="0.7"/>

        {/* Tentacles - 6 of them */}
        {[...Array(6)].map((_, i) => {
          const angle = (i - 2.5) * 25;
          const wave = Math.sin((tentacleWave + i * 15) * 0.1) * 10;
          return (
            <motion.path
              key={i}
              d={`M75 140 Q${75 + angle + wave} 160 ${75 + angle * 1.5 + wave * 1.5} 195`}
              stroke="url(#krakenTentacle)"
              strokeWidth={12 - Math.abs(i - 2.5) * 2}
              strokeLinecap="round"
              fill="none"
              animate={state === 'attacking' ? {
                d: [
                  `M75 140 Q${75 + angle + wave} 160 ${75 + angle * 1.5 + wave * 1.5} 195`,
                  `M75 140 Q${75 + angle * 2} 140 ${75 + angle * 2.5} 170`,
                  `M75 140 Q${75 + angle + wave} 160 ${75 + angle * 1.5 + wave * 1.5} 195`,
                ]
              } : {}}
              transition={{ duration: 0.4 }}
            />
          );
        })}

        {/* Main body - bulbous head */}
        <ellipse cx="75" cy="90" rx="45" ry="55" fill="url(#krakenBody)"/>
        
        {/* Body texture - bumps */}
        <ellipse cx="50" cy="75" rx="8" ry="10" fill="#7E22CE" opacity="0.5"/>
        <ellipse cx="100" cy="80" rx="10" ry="12" fill="#7E22CE" opacity="0.5"/>
        <ellipse cx="75" cy="110" rx="12" ry="8" fill="#7E22CE" opacity="0.4"/>

        {/* Glowing eyes */}
        <g filter="url(#krakenGlow)">
          <ellipse cx="55" cy="70" rx="12" ry="10" fill="#FBBF24"/>
          <ellipse cx="95" cy="70" rx="12" ry="10" fill="#FBBF24"/>
          {/* Pupils - vertical slits */}
          <ellipse cx="55" cy="70" rx="4" ry="8" fill="#0F172A"/>
          <ellipse cx="95" cy="70" rx="4" ry="8" fill="#0F172A"/>
          {/* Eye shine */}
          <circle cx="52" cy="67" r="3" fill="white" opacity="0.8"/>
          <circle cx="92" cy="67" r="3" fill="white" opacity="0.8"/>
        </g>

        {/* Beak/mouth */}
        <path
          d="M65 95 L75 110 L85 95 Z"
          fill="#1E1B4B"
          stroke="#0F172A"
          strokeWidth="2"
        />

        {/* Ink dripping effect */}
        {state === 'attacking' && (
          <g>
            {[...Array(5)].map((_, i) => (
              <motion.ellipse
                key={i}
                cx={40 + i * 20}
                cy={130}
                rx={4}
                ry={15}
                fill="url(#inkDrip)"
                initial={{ y: 0, opacity: 0.8 }}
                animate={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            ))}
          </g>
        )}

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

      {/* Defeat - ink explosion */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: 10 + Math.random() * 15,
                height: 10 + Math.random() * 15,
                background: i % 2 === 0 ? '#581C87' : '#7E22CE',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 0.9 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 80,
                y: Math.sin((i / 12) * Math.PI * 2) * 80,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 1, delay: i * 0.03 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
