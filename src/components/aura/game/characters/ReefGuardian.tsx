import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type ReefGuardianState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface ReefGuardianProps {
  state: ReefGuardianState;
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

export const ReefGuardian = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: ReefGuardianProps) => {
  const [bubblePhase, setBubblePhase] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setBubblePhase(prev => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -4, 0],
          rotate: [0, 2, -2, 0],
          transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -12, 8, 0],
          filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)'],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          x: [0, 30, 0],
          rotate: [0, 10, -10, 0],
          transition: { duration: 0.5 },
        };
      case 'defeated':
        return {
          y: [0, 40],
          opacity: [1, 0.3],
          rotate: [0, -30],
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
          <linearGradient id="coralBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB7185"/>
            <stop offset="50%" stopColor="#F43F5E"/>
            <stop offset="100%" stopColor="#BE123C"/>
          </linearGradient>
          
          <linearGradient id="shellArmor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FECDD3"/>
            <stop offset="50%" stopColor="#FDA4AF"/>
            <stop offset="100%" stopColor="#FB7185"/>
          </linearGradient>

          <linearGradient id="seaweed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80"/>
            <stop offset="100%" stopColor="#166534"/>
          </linearGradient>

          <filter id="reefGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="75" cy="190" rx="40" ry="10" fill="#000000" opacity="0.3"/>

        {/* Seaweed hair/tendrils */}
        {[...Array(5)].map((_, i) => (
          <motion.path
            key={i}
            d={`M${55 + i * 10} 45 Q${50 + i * 10 + Math.sin(bubblePhase * 0.1 + i) * 5} 20 ${55 + i * 10} 10`}
            stroke="url(#seaweed)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Main body - coral humanoid */}
        <ellipse cx="75" cy="110" rx="35" ry="45" fill="url(#coralBody)"/>
        
        {/* Shell armor plates */}
        <ellipse cx="75" cy="95" rx="30" ry="25" fill="url(#shellArmor)"/>
        <ellipse cx="75" cy="125" rx="28" ry="20" fill="url(#shellArmor)" opacity="0.8"/>
        
        {/* Head */}
        <circle cx="75" cy="55" r="25" fill="url(#coralBody)"/>
        
        {/* Shell helmet */}
        <path
          d="M50 50 Q50 30 75 25 Q100 30 100 50 Q100 40 75 35 Q50 40 50 50"
          fill="url(#shellArmor)"
          stroke="#FDA4AF"
          strokeWidth="1"
        />

        {/* Eyes - sea creature style */}
        <g filter="url(#reefGlow)">
          <ellipse cx="63" cy="52" rx="8" ry="6" fill="#0EA5E9"/>
          <ellipse cx="87" cy="52" rx="8" ry="6" fill="#0EA5E9"/>
          <circle cx="63" cy="52" r="3" fill="#0C4A6E"/>
          <circle cx="87" cy="52" r="3" fill="#0C4A6E"/>
          <circle cx="61" cy="50" r="2" fill="white" opacity="0.8"/>
          <circle cx="85" cy="50" r="2" fill="white" opacity="0.8"/>
        </g>

        {/* Coral mouth */}
        <ellipse cx="75" cy="68" rx="8" ry="4" fill="#BE123C"/>

        {/* Arms - coral branches */}
        <motion.g
          animate={state === 'attacking' ? { rotate: [0, -20, 0] } : {}}
          style={{ transformOrigin: '45px 100px' }}
        >
          <path
            d="M45 95 L25 80 L20 90 L30 95 L15 105 L25 110 L40 105"
            fill="url(#coralBody)"
            stroke="#FB7185"
            strokeWidth="1"
          />
        </motion.g>
        
        <motion.g
          animate={state === 'attacking' ? { rotate: [0, 20, 0] } : {}}
          style={{ transformOrigin: '105px 100px' }}
        >
          <path
            d="M105 95 L125 80 L130 90 L120 95 L135 105 L125 110 L110 105"
            fill="url(#coralBody)"
            stroke="#FB7185"
            strokeWidth="1"
          />
        </motion.g>

        {/* Legs - coral pillars */}
        <rect x="55" y="150" width="15" height="40" rx="5" fill="url(#coralBody)"/>
        <rect x="80" y="150" width="15" height="40" rx="5" fill="url(#coralBody)"/>

        {/* Bubbles */}
        {[...Array(4)].map((_, i) => (
          <motion.circle
            key={i}
            r={3 + i}
            fill="#0EA5E9"
            opacity={0.5}
            animate={{
              cx: [60 + i * 15, 55 + i * 15, 65 + i * 15, 60 + i * 15],
              cy: [30 - i * 10 - (bubblePhase % 30), 25 - i * 10, 20 - i * 10, 30 - i * 10],
              opacity: [0.5, 0.3, 0.1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

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

      {/* Defeat - coral crumbling */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: 8 + Math.random() * 10,
                height: 8 + Math.random() * 10,
                background: i % 2 === 0 ? '#FB7185' : '#FDA4AF',
                borderRadius: '2px',
              }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 100,
                y: Math.random() * 80 + 20,
                rotate: Math.random() * 360,
                opacity: 0,
              }}
              transition={{ duration: 1.2, delay: i * 0.04 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
