import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheVaultKeeperState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface Props {
  state: TheVaultKeeperState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
  flipX?: boolean;
}

const sizeConfig = { small: { width: 70, height: 130 }, medium: { width: 100, height: 170 }, large: { width: 130, height: 210 } };

export const TheVaultKeeper = ({ state, healthPercent, currentHp, maxHp, size = 'large', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 30 } : isHit ? { x: [0, -10, 10, -5, 0] } : isAttacking ? { scale: [1, 1.1, 1], x: [0, -20, 0] } : { y: [0, -4, 0] }}
      transition={isDefeated ? { duration: 1.5 } : isHit ? { duration: 0.4 } : isAttacking ? { duration: 0.5 } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 120 200" width={width} height={height}>
        <defs>
          <linearGradient id="vkArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#78350F" /></linearGradient>
          <linearGradient id="vkCape" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#92400E" /><stop offset="100%" stopColor="#451A03" /></linearGradient>
        </defs>
        {/* Cape */}
        <motion.path d="M30 50 L20 180 L100 180 L90 50" fill="url(#vkCape)" opacity="0.7"
          animate={{ d: ['M30 50 L20 180 L100 180 L90 50', 'M30 50 L15 185 L105 185 L90 50', 'M30 50 L20 180 L100 180 L90 50'] }}
          transition={{ duration: 3, repeat: Infinity }} />
        {/* Body */}
        <rect x="30" y="55" width="60" height="75" rx="8" fill="url(#vkArmor)" />
        <path d="M45 65 L60 80 L75 65" stroke="#451A03" strokeWidth="3" fill="none" />
        {/* Helmet */}
        <rect x="35" y="10" width="50" height="45" rx="8" fill="url(#vkArmor)" />
        <rect x="40" y="28" width="40" height="12" rx="3" fill="#1C1917" opacity="0.9" />
        <motion.circle cx="52" cy="33" r="3" fill="#EF4444" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <motion.circle cx="68" cy="33" r="3" fill="#EF4444" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
        {/* Crown ornament */}
        <path d="M40 10 L45 0 L50 8 L55 -2 L60 8 L65 0 L70 8 L75 0 L80 10" fill="#FCD34D" />
        {/* Arms */}
        <rect x="10" y="58" width="22" height="55" rx="5" fill="url(#vkArmor)" />
        <rect x="88" y="58" width="22" height="55" rx="5" fill="url(#vkArmor)" />
        {/* Key weapon */}
        <motion.g animate={isAttacking ? { rotate: [0, -45, 0] } : {}} transition={{ duration: 0.4 }} style={{ transformOrigin: '105px 85px' }}>
          <rect x="100" y="75" width="8" height="40" rx="2" fill="#FCD34D" />
          <rect x="95" y="110" width="18" height="8" rx="2" fill="#FCD34D" />
          <rect x="100" y="115" width="8" height="8" rx="1" fill="#FCD34D" />
        </motion.g>
        {/* Legs */}
        <rect x="35" y="130" width="20" height="50" rx="5" fill="#57534E" />
        <rect x="65" y="130" width="20" height="50" rx="5" fill="#57534E" />
        <rect x="32" y="175" width="26" height="12" rx="4" fill="#44403C" />
        <rect x="62" y="175" width="26" height="12" rx="4" fill="#44403C" />
      </svg>
    </motion.div>
  );
};
