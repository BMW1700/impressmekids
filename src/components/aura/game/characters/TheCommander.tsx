import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheCommanderState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'ground_slam';

interface TheCommanderProps {
  state: TheCommanderState;
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

export const TheCommander = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'large', flipX = false }: TheCommanderProps) => {
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
      case 'attacking': return { x: [0, -12, 0], scale: [1, 1.08, 1] };
      case 'hit': return { x: [0, 6, -6, 0], opacity: [1, 0.5, 1] };
      case 'defeated': return { y: [0, 25], opacity: [1, 0], rotate: [0, 10] };
      case 'ground_slam': return { y: [0, -8, 4], scale: [1, 1.12, 1] };
      default: return { y: [0, -2, 0] };
    }
  };

  return (
    <motion.div
      className="relative"
      animate={getAnimation()}
      transition={{ duration: state === 'idle' ? 2.5 : 0.5, repeat: state === 'idle' ? Infinity : 0 }}
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
    >
      <svg width={width} height={height} viewBox="0 0 130 220" fill="none">
        <defs>
          <linearGradient id="cmdSuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="cmdVisor" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>

        {/* Boots — space-rated */}
        <rect x="38" y="192" width="22" height="24" rx="5" fill="#1E1B4B" />
        <rect x="70" y="192" width="22" height="24" rx="5" fill="#1E1B4B" />
        <rect x="38" y="210" width="22" height="6" rx="2" fill="#4338CA" opacity="0.4" />
        <rect x="70" y="210" width="22" height="6" rx="2" fill="#4338CA" opacity="0.4" />

        {/* Legs */}
        <rect x="40" y="148" width="20" height="48" rx="4" fill="#312E81" />
        <rect x="70" y="148" width="20" height="48" rx="4" fill="#312E81" />

        {/* Body — commander flight suit */}
        <rect x="30" y="78" width="70" height="74" rx="8" fill="url(#cmdSuit)" />
        {/* Chest panel with status lights */}
        <rect x="42" y="85" width="46" height="25" rx="4" fill="#3730A3" opacity="0.5" />
        <motion.circle cx="52" cy="95" r="3" fill="#34D399"
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <motion.circle cx="65" cy="95" r="3" fill="#818CF8"
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
        <motion.circle cx="78" cy="95" r="3" fill="#F472B6"
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }} />

        {/* Belt */}
        <rect x="30" y="145" width="70" height="6" rx="2" fill="#1E1B4B" />

        {/* Arms */}
        <rect x="12" y="82" width="22" height="50" rx="6" fill="url(#cmdSuit)" />
        <rect x="96" y="82" width="22" height="50" rx="6" fill="url(#cmdSuit)" />
        {/* Rank stripes */}
        <rect x="14" y="84" width="4" height="15" rx="1" fill="#F59E0B" />
        <rect x="20" y="84" width="4" height="15" rx="1" fill="#F59E0B" />
        <rect x="106" y="84" width="4" height="15" rx="1" fill="#F59E0B" />
        <rect x="112" y="84" width="4" height="15" rx="1" fill="#F59E0B" />

        {/* Neck */}
        <rect x="52" y="66" width="26" height="15" rx="4" fill="#D4A574" />

        {/* Head */}
        <circle cx="65" cy="42" r="24" fill="#D4A574" />
        {/* Short military hair */}
        <path d="M42 35 Q42 18 65 15 Q88 18 88 35" fill="#44403C" />
        {/* Visor — holographic display */}
        <rect x="46" y="38" width="38" height="10" rx="5" fill="url(#cmdVisor)" opacity="0.8" />
        <motion.rect x="48" y="40" width="34" height="6" rx="3" fill="#818CF8" opacity="0.3"
          animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Eyes behind visor */}
        <circle cx="56" cy="43" r="2" fill="#1E1B4B" />
        <circle cx="74" cy="43" r="2" fill="#1E1B4B" />
        {/* Stern mouth */}
        <rect x="57" y="53" width="16" height="2" rx="1" fill="#92400E" />
        {/* Jawline detail */}
        <path d="M45 48 Q65 62 85 48" fill="none" stroke="#C2956A" strokeWidth="0.8" />

        {/* Medal on chest */}
        <motion.g animate={{ filter: ['drop-shadow(0 0 2px #F59E0B)', 'drop-shadow(0 0 6px #F59E0B)', 'drop-shadow(0 0 2px #F59E0B)'] }}
          transition={{ duration: 2, repeat: Infinity }}>
          <polygon points="65,112 68,118 75,118 70,122 72,129 65,125 58,129 60,122 55,118 62,118" fill="#F59E0B" />
        </motion.g>
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
