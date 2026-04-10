import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheWardenState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'ground_slam';

interface TheWardenProps {
  state: TheWardenState;
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

export const TheWarden = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'large', flipX = false }: TheWardenProps) => {
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
      case 'attacking': return { x: [0, -15, 0], scale: [1, 1.1, 1] };
      case 'hit': return { x: [0, 8, -8, 0], opacity: [1, 0.5, 1] };
      case 'defeated': return { y: [0, 20], opacity: [1, 0], rotate: [0, -15] };
      case 'ground_slam': return { y: [0, -10, 5], scale: [1, 1.15, 1] };
      default: return { y: [0, -3, 0] };
    }
  };

  return (
    <motion.div
      className="relative"
      animate={getAnimation()}
      transition={{ duration: state === 'idle' ? 2 : 0.5, repeat: state === 'idle' ? Infinity : 0 }}
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
    >
      <svg width={width} height={height} viewBox="0 0 130 220" fill="none">
        <defs>
          <linearGradient id="wardenArmor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#065F46" />
            <stop offset="50%" stopColor="#064E3B" />
            <stop offset="100%" stopColor="#022C22" />
          </linearGradient>
          <linearGradient id="wardenVisor" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        {/* Boots */}
        <rect x="38" y="190" width="22" height="25" rx="4" fill="#1C1917" />
        <rect x="70" y="190" width="22" height="25" rx="4" fill="#1C1917" />

        {/* Legs — armored cargo pants */}
        <rect x="40" y="145" width="20" height="50" rx="3" fill="#374151" />
        <rect x="70" y="145" width="20" height="50" rx="3" fill="#374151" />
        <rect x="42" y="155" width="16" height="8" rx="2" fill="#4B5563" opacity="0.5" />
        <rect x="72" y="155" width="16" height="8" rx="2" fill="#4B5563" opacity="0.5" />

        {/* Body — heavy tactical vest */}
        <rect x="30" y="75" width="70" height="75" rx="8" fill="url(#wardenArmor)" />
        {/* Vest plate details */}
        <rect x="38" y="82" width="54" height="30" rx="4" fill="#047857" opacity="0.4" />
        <rect x="42" y="88" width="46" height="18" rx="2" fill="#059669" opacity="0.2" />
        {/* Belt with holster */}
        <rect x="30" y="140" width="70" height="8" rx="2" fill="#292524" />
        <rect x="85" y="135" width="12" height="18" rx="2" fill="#1C1917" />

        {/* Arms — rolled sleeves, muscular */}
        <rect x="12" y="80" width="22" height="55" rx="6" fill="url(#wardenArmor)" />
        <rect x="96" y="80" width="22" height="55" rx="6" fill="url(#wardenArmor)" />
        {/* Forearm wraps */}
        <rect x="14" y="115" width="18" height="12" rx="3" fill="#44403C" />
        <rect x="98" y="115" width="18" height="12" rx="3" fill="#44403C" />

        {/* Baton / shock rod in right hand */}
        <motion.g animate={state === 'attacking' ? { rotate: [0, -30, 0] } : {}} style={{ originX: '108px', originY: '130px' }}>
          <rect x="104" y="125" width="6" height="40" rx="2" fill="#57534E" />
          <motion.rect x="102" y="122" width="10" height="6" rx="2" fill="#10B981"
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.8, repeat: Infinity }} />
        </motion.g>

        {/* Neck */}
        <rect x="52" y="65" width="26" height="14" rx="4" fill="#92400E" />

        {/* Head — military beret + stern face */}
        <circle cx="65" cy="45" r="24" fill="#A16207" />
        {/* Beret */}
        <ellipse cx="65" cy="28" rx="26" ry="10" fill="#065F46" />
        <circle cx="48" cy="26" r="3" fill="#047857" />
        {/* Visor / tactical glasses */}
        <rect x="48" y="40" width="34" height="8" rx="3" fill="url(#wardenVisor)" opacity="0.85" />
        <motion.rect x="50" y="41" width="30" height="6" rx="2" fill="#10B981" opacity="0.3"
          animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
        {/* Scar across left cheek */}
        <line x1="48" y1="52" x2="42" y2="58" stroke="#78350F" strokeWidth="1.5" />
        {/* Mouth — firm line */}
        <rect x="56" y="55" width="18" height="2" rx="1" fill="#78350F" />

        {/* Rank insignia on shoulder */}
        <g>
          <rect x="14" y="78" width="18" height="6" rx="1" fill="#D97706" opacity="0.8" />
          <line x1="16" y1="81" x2="30" y2="81" stroke="#F59E0B" strokeWidth="1" />
        </g>
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

      {/* Damage number */}
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
