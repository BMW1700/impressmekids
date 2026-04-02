import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type DroneSentryState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface DroneSentryProps {
  state: DroneSentryState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 70, height: 100 },
  medium: { width: 95, height: 140 },
  large: { width: 120, height: 175 },
};

export const DroneSentry = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: DroneSentryProps) => {
  const { width, height } = sizeConfig[size];
  const [showDamageNum, setShowDamageNum] = useState(false);

  useEffect(() => {
    if (showDamage) {
      setShowDamageNum(true);
      const timer = setTimeout(() => setShowDamageNum(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showDamage]);

  const isHit = state === 'hit';
  const isAttacking = state === 'attacking';
  const isDefeated = state === 'defeated';

  return (
    <motion.div
      className="relative"
      style={{ width, height, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={
        isDefeated ? { opacity: 0, y: 40, rotate: 45 } :
        isHit ? { x: [0, -6, 6, -3, 0], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } :
        isAttacking ? { y: [0, -10, 5, 0], scale: [1, 1.05, 1] } :
        { y: [0, -5, 0, -3, 0] }
      }
      transition={
        isDefeated ? { duration: 1.2 } :
        isHit ? { duration: 0.3 } :
        isAttacking ? { duration: 0.4 } :
        { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 120 140" width={width} height={height}>
        <defs>
          <linearGradient id="droneBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <linearGradient id="droneLens" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <filter id="droneGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Shadow on ground */}
        <ellipse cx="60" cy="135" rx="30" ry="5" fill="rgba(0,0,0,0.2)" />

        {/* Rotor arms */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '30px 45px' }}
        >
          <rect x="15" y="43" width="30" height="4" rx="2" fill="#9CA3AF" opacity="0.6" />
        </motion.g>
        <motion.g
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '90px 45px' }}
        >
          <rect x="75" y="43" width="30" height="4" rx="2" fill="#9CA3AF" opacity="0.6" />
        </motion.g>

        {/* Rotor mounts */}
        <rect x="22" y="48" width="16" height="6" rx="3" fill="#4B5563" />
        <rect x="82" y="48" width="16" height="6" rx="3" fill="#4B5563" />
        
        {/* Arms connecting to body */}
        <rect x="38" y="50" width="12" height="4" rx="1" fill="#6B7280" />
        <rect x="70" y="50" width="12" height="4" rx="1" fill="#6B7280" />

        {/* Main body */}
        <ellipse cx="60" cy="70" rx="22" ry="18" fill="url(#droneBody)" />
        <ellipse cx="60" cy="65" rx="18" ry="12" fill="#4B5563" />
        
        {/* Top plate details */}
        <rect x="52" y="55" width="16" height="3" rx="1" fill="#9CA3AF" />
        <circle cx="60" cy="56" r="2" fill="#22D3EE" opacity="0.8" />
        
        {/* Camera lens - center eye */}
        <circle cx="60" cy="72" r="8" fill="#1F2937" stroke="#6B7280" strokeWidth="1.5" />
        <circle cx="60" cy="72" r="5" fill="url(#droneLens)" filter="url(#droneGlow)" />
        <circle cx="58" cy="70" r="1.5" fill="white" opacity="0.6" />

        {/* Side sensors */}
        <circle cx="42" cy="70" r="3" fill="#1F2937" stroke="#4B5563" strokeWidth="1" />
        <circle cx="42" cy="70" r="1.5" fill="#22D3EE" opacity="0.7" />
        <circle cx="78" cy="70" r="3" fill="#1F2937" stroke="#4B5563" strokeWidth="1" />
        <circle cx="78" cy="70" r="1.5" fill="#22D3EE" opacity="0.7" />

        {/* Bottom turret / weapon */}
        <rect x="55" y="85" width="10" height="12" rx="2" fill="#374151" />
        <rect x="57" y="95" width="6" height="8" rx="1" fill="#4B5563" />
        
        {/* Weapon fire */}
        {isAttacking && (
          <motion.g animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.1, repeat: 3 }}>
            <rect x="58" y="103" width="4" height="12" rx="1" fill="#EF4444" opacity="0.9" />
            <circle cx="60" cy="116" r="4" fill="#FDE047" opacity="0.7" />
          </motion.g>
        )}

        {/* Status LEDs */}
        <circle cx="48" cy="82" r="1.5" fill={healthPercent > 50 ? '#22C55E' : healthPercent > 25 ? '#EAB308' : '#EF4444'} />
        <circle cx="72" cy="82" r="1.5" fill={healthPercent > 50 ? '#22C55E' : healthPercent > 25 ? '#EAB308' : '#EF4444'} />

        {/* Antenna */}
        <line x1="60" y1="52" x2="60" y2="42" stroke="#9CA3AF" strokeWidth="1" />
        <circle cx="60" cy="41" r="2" fill="#EF4444" opacity="0.8" />

        {isHit && <ellipse cx="60" cy="70" rx="30" ry="25" fill="rgba(255,255,255,0.35)" />}
      </svg>

      {showDamageNum && showDamage && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl font-black text-red-500 pointer-events-none"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -40 }}
          style={{ textShadow: '1px 1px 0 #000' }}
        >
          -{showDamage}
        </motion.div>
      )}
    </motion.div>
  );
};
