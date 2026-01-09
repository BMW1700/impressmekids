import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type WindLordState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface WindLordProps {
  state: WindLordState;
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

export const WindLord = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: WindLordProps) => {
  const [swirl, setSwirl] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setSwirl(prev => (prev + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -10, 0],
          rotate: [0, 3, -3, 0],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -15, 10, 0],
          filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          rotate: [0, 360, 720],
          scale: [1, 1.3, 1],
          transition: { duration: 0.6, ease: 'easeOut' as const },
        };
      case 'defeated':
        return {
          rotate: [0, 180],
          scale: [1, 0.5],
          opacity: [1, 0],
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
          <linearGradient id="windCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.9"/>
            <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#0891B2" stopOpacity="0.5"/>
          </linearGradient>
          
          <linearGradient id="windSpiral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3"/>
          </linearGradient>

          <filter id="windGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Swirling wind layers */}
        {[...Array(5)].map((_, i) => (
          <motion.ellipse
            key={i}
            cx="75"
            cy="100"
            rx={50 - i * 8}
            ry={60 - i * 10}
            fill="none"
            stroke="url(#windSpiral)"
            strokeWidth={3 - i * 0.4}
            opacity={0.6 - i * 0.1}
            style={{
              transformOrigin: '75px 100px',
            }}
            animate={{
              rotate: swirl * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.2),
            }}
            transition={{ duration: 0 }}
          />
        ))}

        {/* Core body - ethereal humanoid form */}
        <motion.g filter="url(#windGlow)">
          {/* Torso */}
          <ellipse cx="75" cy="100" rx="25" ry="35" fill="url(#windCore)"/>
          
          {/* Head */}
          <circle cx="75" cy="55" r="22" fill="url(#windCore)"/>
          
          {/* Eyes - piercing cyan */}
          <g>
            <ellipse cx="65" cy="52" rx="6" ry="5" fill="#ECFEFF"/>
            <ellipse cx="85" cy="52" rx="6" ry="5" fill="#ECFEFF"/>
            <circle cx="65" cy="52" r="3" fill="#0E7490"/>
            <circle cx="85" cy="52" r="3" fill="#0E7490"/>
          </g>
          
          {/* Crown of wind */}
          <motion.path
            d="M50 40 Q60 20 75 25 Q90 20 100 40"
            fill="none"
            stroke="#A5F3FC"
            strokeWidth="3"
            animate={{ 
              d: [
                "M50 40 Q60 20 75 25 Q90 20 100 40",
                "M50 38 Q60 15 75 22 Q90 15 100 38",
                "M50 40 Q60 20 75 25 Q90 20 100 40",
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.g>

        {/* Wind arms */}
        <motion.path
          d="M50 85 Q20 70 10 90 Q5 110 25 115"
          fill="none"
          stroke="url(#windSpiral)"
          strokeWidth="8"
          strokeLinecap="round"
          animate={state === 'attacking' ? { 
            d: [
              "M50 85 Q20 70 10 90 Q5 110 25 115",
              "M50 85 Q0 50 -10 80 Q-15 120 15 130",
              "M50 85 Q20 70 10 90 Q5 110 25 115",
            ]
          } : {}}
          transition={{ duration: 0.3 }}
        />
        
        <motion.path
          d="M100 85 Q130 70 140 90 Q145 110 125 115"
          fill="none"
          stroke="url(#windSpiral)"
          strokeWidth="8"
          strokeLinecap="round"
          animate={state === 'attacking' ? { 
            d: [
              "M100 85 Q130 70 140 90 Q145 110 125 115",
              "M100 85 Q150 50 160 80 Q165 120 135 130",
              "M100 85 Q130 70 140 90 Q145 110 125 115",
            ]
          } : {}}
          transition={{ duration: 0.3 }}
        />

        {/* Lower wind trail */}
        <motion.path
          d="M60 130 Q75 180 90 130"
          fill="none"
          stroke="url(#windSpiral)"
          strokeWidth="12"
          strokeLinecap="round"
          animate={{
            d: [
              "M60 130 Q75 180 90 130",
              "M55 130 Q75 190 95 130",
              "M60 130 Q75 180 90 130",
            ]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />

        {/* Wind particles */}
        {[...Array(8)].map((_, i) => (
          <motion.circle
            key={i}
            r={3}
            fill="#A5F3FC"
            opacity={0.7}
            animate={{
              cx: [75, 75 + Math.cos((swirl + i * 45) * Math.PI / 180) * (40 + i * 5)],
              cy: [100, 100 + Math.sin((swirl + i * 45) * Math.PI / 180) * (50 + i * 5)],
            }}
            transition={{ duration: 0 }}
          />
        ))}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="150" height="195" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.2s" fill="freeze"/>
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

      {/* Defeat - wind dissipates */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: 4,
                height: 20 + Math.random() * 20,
                background: 'linear-gradient(180deg, #67E8F9, transparent)',
                borderRadius: 2,
              }}
              initial={{ x: 0, y: 0, rotate: i * 24, opacity: 0.8 }}
              animate={{
                x: Math.cos(i * 24 * Math.PI / 180) * 100,
                y: Math.sin(i * 24 * Math.PI / 180) * 100,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 1.2, delay: i * 0.03 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
