import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type VaultSentinelState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface VaultSentinelProps {
  state: VaultSentinelState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 60, height: 110 },
  medium: { width: 85, height: 150 },
  large: { width: 110, height: 190 },
};

export const VaultSentinel = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: VaultSentinelProps) => {
  const { width, height } = sizeConfig[size];
  const [showDamageNum, setShowDamageNum] = useState(false);
  useEffect(() => { if (showDamage) { setShowDamageNum(true); const t = setTimeout(() => setShowDamageNum(false), 800); return () => clearTimeout(t); } }, [showDamage]);
  const isHit = state === 'hit';
  const isAttacking = state === 'attacking';
  const isDefeated = state === 'defeated';

  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -8, 8, -4, 0] } : isAttacking ? { x: [0, -30, 0] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs>
          <linearGradient id="vaultSentinelArmor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>
        {/* Helmet */}
        <rect x="30" y="10" width="40" height="35" rx="5" fill="url(#vaultSentinelArmor)" />
        <rect x="35" y="25" width="30" height="8" rx="2" fill="#1C1917" opacity="0.8" />
        <motion.circle cx="43" cy="28" r="2" fill="#F59E0B" animate={isHit ? {} : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="57" cy="28" r="2" fill="#F59E0B" animate={isHit ? {} : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
        {/* Body */}
        <rect x="25" y="45" width="50" height="60" rx="5" fill="url(#vaultSentinelArmor)" />
        <rect x="40" y="50" width="20" height="25" rx="3" fill="#292524" opacity="0.6" />
        {/* Arms */}
        <rect x="10" y="48" width="18" height="45" rx="4" fill="url(#vaultSentinelArmor)" />
        <rect x="72" y="48" width="18" height="45" rx="4" fill="url(#vaultSentinelArmor)" />
        {/* Shield */}
        <motion.rect x="2" y="55" width="14" height="30" rx="3" fill="#D97706" stroke="#92400E" strokeWidth="2"
          animate={isAttacking ? { x: [2, -10, 2] } : {}} transition={{ duration: 0.4 }} />
        {/* Legs */}
        <rect x="30" y="105" width="16" height="50" rx="4" fill="#57534E" />
        <rect x="54" y="105" width="16" height="50" rx="4" fill="#57534E" />
        <rect x="28" y="150" width="20" height="10" rx="3" fill="#44403C" />
        <rect x="52" y="150" width="20" height="10" rx="3" fill="#44403C" />
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
    </motion.div>
  );
};
