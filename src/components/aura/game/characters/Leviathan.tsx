import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type LeviathanState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface LeviathanProps {
  state: LeviathanState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 130, height: 150 },
  medium: { width: 195, height: 225 },
  large: { width: 260, height: 300 },
};

export const Leviathan = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: LeviathanProps) => {
  const [undulate, setUndulate] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setUndulate(prev => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const wave = Math.sin(undulate * 0.12) * 8;

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -8, 0],
          x: [0, 5, -5, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -20, 15, 0],
          filter: ['brightness(1)', 'brightness(1.7)', 'brightness(1)'],
          transition: { duration: 0.4 },
        };
      case 'attacking':
        return {
          x: [0, 60, 0],
          scale: [1, 1.1, 1],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          rotate: [0, 30],
          y: [0, 60],
          opacity: [1, 0.3],
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
        viewBox="0 0 195 225"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="leviathanBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891B2"/>
            <stop offset="50%" stopColor="#0E7490"/>
            <stop offset="100%" stopColor="#164E63"/>
          </linearGradient>
          
          <linearGradient id="leviathanBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9"/>
            <stop offset="100%" stopColor="#22D3EE"/>
          </linearGradient>

          <linearGradient id="leviathanFin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4"/>
            <stop offset="100%" stopColor="#0E7490"/>
          </linearGradient>

          <filter id="leviathanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="100" cy="220" rx="70" ry="12" fill="#000000" opacity="0.25"/>

        {/* Tail - serpentine */}
        <motion.path
          d={`M30 160 Q${20 + wave} 180 ${30 + wave * 0.5} 200 Q${40 + wave} 215 50 210`}
          stroke="url(#leviathanBody)"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
        />

        {/* Tail fin */}
        <motion.path
          d={`M${25 + wave} 195 L${10 + wave} 220 L${35 + wave} 210`}
          fill="url(#leviathanFin)"
        />

        {/* Main body - massive serpent */}
        <ellipse cx="100" cy="120" rx="65" ry="50" fill="url(#leviathanBody)"/>
        
        {/* Belly */}
        <ellipse cx="100" cy="130" rx="45" ry="30" fill="url(#leviathanBelly)"/>
        
        {/* Scales pattern */}
        {[...Array(5)].map((_, row) => (
          [...Array(6)].map((_, col) => (
            <ellipse
              key={`${row}-${col}`}
              cx={55 + col * 18}
              cy={95 + row * 15}
              rx="6"
              ry="5"
              fill="#0E7490"
              opacity="0.3"
            />
          ))
        ))}

        {/* Head */}
        <ellipse cx="155" cy="100" rx="40" ry="35" fill="url(#leviathanBody)"/>
        
        {/* Snout */}
        <ellipse cx="180" cy="105" rx="20" ry="18" fill="url(#leviathanBody)"/>

        {/* Jaw */}
        <path
          d="M160 115 Q180 130 195 120 L195 125 Q175 140 155 125 Z"
          fill="#164E63"
        />

        {/* Teeth */}
        {state === 'attacking' && (
          <g>
            {[...Array(5)].map((_, i) => (
              <path
                key={i}
                d={`M${162 + i * 7} 118 L${165 + i * 7} 128 L${168 + i * 7} 118`}
                fill="white"
              />
            ))}
          </g>
        )}

        {/* Eyes - glowing */}
        <g filter="url(#leviathanGlow)">
          <circle cx="145" cy="90" r="12" fill="#FBBF24"/>
          <circle cx="165" cy="88" r="10" fill="#FBBF24"/>
          <ellipse cx="145" cy="90" rx="5" ry="8" fill="#0F172A"/>
          <ellipse cx="165" cy="88" rx="4" ry="7" fill="#0F172A"/>
          <circle cx="142" cy="87" r="3" fill="white" opacity="0.8"/>
          <circle cx="162" cy="85" r="2.5" fill="white" opacity="0.8"/>
        </g>

        {/* Dorsal fins */}
        <path
          d="M80 75 L70 40 L90 70 L85 35 L100 65 L105 30 L115 65 L130 45 L125 75"
          fill="url(#leviathanFin)"
          stroke="#0E7490"
          strokeWidth="1"
        />

        {/* Side fins */}
        <motion.path
          d="M50 130 L20 150 L25 170 L50 150"
          fill="url(#leviathanFin)"
          animate={{ rotate: [0, -10, 0] }}
          style={{ transformOrigin: '50px 140px' }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        <motion.path
          d="M150 130 L175 155 L165 175 L145 150"
          fill="url(#leviathanFin)"
          animate={{ rotate: [0, 10, 0] }}
          style={{ transformOrigin: '150px 145px' }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />

        {/* Water splash when attacking */}
        {state === 'attacking' && (
          <g>
            {[...Array(6)].map((_, i) => (
              <motion.ellipse
                key={i}
                cx={170 + i * 10}
                cy={80 + i * 5}
                rx={5}
                ry={3}
                fill="#67E8F9"
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 2, y: -20 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              />
            ))}
          </g>
        )}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="195" height="225" fill="white" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[130px]">
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

      {/* Defeat - sinking */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${30 + i * 10}%`,
                top: '50%',
                width: 8,
                height: 8,
                background: '#67E8F9',
              }}
              initial={{ opacity: 0.8, y: 0 }}
              animate={{ opacity: 0, y: -60 }}
              transition={{ duration: 1, delay: i * 0.1 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
