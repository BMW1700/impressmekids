import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type VaultDroneState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface VaultDroneProps {
  state: VaultDroneState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = { small: { width: 60, height: 60 }, medium: { width: 85, height: 85 }, large: { width: 110, height: 110 } };

export const VaultDrone = ({ state, healthPercent, currentHp, maxHp, size = 'medium', flipX = false }: VaultDroneProps) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, rotate: 180 } : isHit ? { x: [0, -5, 5, 0] } : isAttacking ? { y: [0, -20, 0] } : { y: [0, -8, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.3 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 100" width={width} height={height}>
        <defs><linearGradient id="vaultDroneBody" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#D97706" /><stop offset="100%" stopColor="#92400E" /></linearGradient></defs>
        <ellipse cx="50" cy="50" rx="30" ry="20" fill="url(#vaultDroneBody)" />
        <motion.circle cx="50" cy="45" r="8" fill="#1C1917" stroke="#F59E0B" strokeWidth="2"
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="50" cy="45" r="3" fill="#EF4444" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }} />
        {/* Rotors */}
        <motion.rect x="15" y="30" width="20" height="3" rx="1" fill="#78350F" animate={{ rotate: [0, 360] }} transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '25px 31px' }} />
        <motion.rect x="65" y="30" width="20" height="3" rx="1" fill="#78350F" animate={{ rotate: [0, 360] }} transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '75px 31px' }} />
        {/* Gun */}
        <rect x="45" y="65" width="10" height="15" rx="2" fill="#44403C" />
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
