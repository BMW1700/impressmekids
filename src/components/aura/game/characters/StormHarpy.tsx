import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type StormHarpyState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface StormHarpyProps {
  state: StormHarpyState;
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

export const StormHarpy = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: StormHarpyProps) => {
  const [wingFlap, setWingFlap] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setWingFlap(prev => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const wingAngle = Math.sin(wingFlap * 0.2) * 25;

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -8, 0],
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -15, 10, 0],
          filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          x: [0, 40, 0],
          y: [0, -30, 0],
          rotate: [0, -20, 0],
          transition: { duration: 0.5 },
        };
      case 'defeated':
        return {
          rotate: [0, 45],
          y: [0, 60],
          opacity: [1, 0.3],
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
          <linearGradient id="harpyFeathers" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>
          
          <linearGradient id="harpySkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DDD6FE" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>

          <linearGradient id="lightningWing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0ABFC" />
            <stop offset="30%" stopColor="#7C3AED" />
            <stop offset="60%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>

          <filter id="harpyGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="75" cy="190" rx="35" ry="8" fill="#000000" opacity="0.3"/>

        {/* Left Wing */}
        <motion.g
          style={{ transformOrigin: '50px 80px' }}
          animate={{ rotate: wingAngle }}
        >
          <path
            d="M50 80 L10 40 L5 60 L15 75 L5 90 L15 100 L25 95 L50 100"
            fill="url(#lightningWing)"
            stroke="#4F46E5"
            strokeWidth="1"
          />
          {/* Lightning streaks on wing */}
          <path d="M20 55 L25 65 L18 70" stroke="#F0ABFC" strokeWidth="2" fill="none"/>
          <path d="M15 80 L22 85" stroke="#F0ABFC" strokeWidth="2" fill="none"/>
        </motion.g>

        {/* Right Wing */}
        <motion.g
          style={{ transformOrigin: '100px 80px' }}
          animate={{ rotate: -wingAngle }}
        >
          <path
            d="M100 80 L140 40 L145 60 L135 75 L145 90 L135 100 L125 95 L100 100"
            fill="url(#lightningWing)"
            stroke="#4F46E5"
            strokeWidth="1"
          />
          <path d="M130 55 L125 65 L132 70" stroke="#F0ABFC" strokeWidth="2" fill="none"/>
          <path d="M135 80 L128 85" stroke="#F0ABFC" strokeWidth="2" fill="none"/>
        </motion.g>

        {/* Body */}
        <ellipse cx="75" cy="100" rx="28" ry="35" fill="url(#harpyFeathers)"/>
        
        {/* Chest/torso (humanoid upper body) */}
        <ellipse cx="75" cy="75" rx="22" ry="20" fill="url(#harpySkin)"/>
        
        {/* Head */}
        <circle cx="75" cy="45" r="20" fill="url(#harpySkin)"/>
        
        {/* Hair/feather crest */}
        <path
          d="M55 35 Q60 15 75 10 Q90 15 95 35"
          fill="url(#harpyFeathers)"
          stroke="#7C3AED"
          strokeWidth="1"
        />
        <path d="M65 25 Q75 5 85 25" fill="#A78BFA" stroke="#7C3AED" strokeWidth="1"/>
        
        {/* Eyes */}
        <g filter="url(#harpyGlow)">
          <ellipse cx="65" cy="42" rx="6" ry="5" fill="#FEF08A"/>
          <ellipse cx="85" cy="42" rx="6" ry="5" fill="#FEF08A"/>
          <circle cx="65" cy="42" r="3" fill="#7C3AED"/>
          <circle cx="85" cy="42" r="3" fill="#7C3AED"/>
        </g>
        
        {/* Beak-like nose */}
        <path d="M75 48 L72 55 L78 55 Z" fill="#F59E0B"/>
        
        {/* Talons */}
        <g>
          {/* Left talon */}
          <path d="M55 130 Q50 145 45 155 L48 155 Q53 145 58 135" fill="#F59E0B"/>
          <path d="M60 130 Q58 145 55 155 L58 155 Q62 145 65 135" fill="#F59E0B"/>
          {/* Right talon */}
          <path d="M95 130 Q100 145 105 155 L102 155 Q97 145 92 135" fill="#F59E0B"/>
          <path d="M90 130 Q92 145 95 155 L92 155 Q88 145 85 135" fill="#F59E0B"/>
        </g>

        {/* Lightning effects when attacking */}
        {state === 'attacking' && (
          <g filter="url(#harpyGlow)">
            <path d="M75 0 L70 30 L80 35 L65 70" stroke="#FEF08A" strokeWidth="3" fill="none"/>
            <path d="M40 20 L55 45" stroke="#F0ABFC" strokeWidth="2" fill="none"/>
            <path d="M110 20 L95 45" stroke="#F0ABFC" strokeWidth="2" fill="none"/>
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

      {/* Defeat particles */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3"
              style={{
                left: '50%',
                top: '50%',
                background: i % 2 === 0 ? '#7C3AED' : '#F0ABFC',
                borderRadius: '50%',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 70,
                y: Math.sin((i / 12) * Math.PI * 2) * 70,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 1, delay: i * 0.04 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
