import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheOverseerState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'ground_slam';

interface TheOverseerProps {
  state: TheOverseerState;
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
  large: { width: 140, height: 230 },
};

export const TheOverseer = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'large', flipX = false }: TheOverseerProps) => {
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
      case 'attacking': return { scale: [1, 1.15, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] };
      case 'hit': return { x: [0, 5, -5, 0], opacity: [1, 0.5, 1] };
      case 'defeated': return { y: [0, 30], opacity: [1, 0], scale: [1, 0.7] };
      case 'ground_slam': return { y: [0, -12, 6], scale: [1, 1.2, 1] };
      default: return { y: [0, -3, 0] };
    }
  };

  return (
    <motion.div
      className="relative"
      animate={getAnimation()}
      transition={{ duration: state === 'idle' ? 2.5 : 0.6, repeat: state === 'idle' ? Infinity : 0 }}
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
    >
      <svg width={width} height={height} viewBox="0 0 140 230" fill="none">
        <defs>
          <linearGradient id="overseerSuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C1917" />
            <stop offset="50%" stopColor="#0C0A09" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <radialGradient id="overseerAura" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#BE123C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="overseerTie" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BE123C" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>
        </defs>

        {/* Menacing aura */}
        <motion.ellipse cx="70" cy="100" rx="65" ry="105" fill="url(#overseerAura)"
          animate={{ rx: [65, 70, 65], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }} />

        {/* Shoes — polished black */}
        <rect x="42" y="200" width="22" height="22" rx="5" fill="#0C0A09" />
        <rect x="76" y="200" width="22" height="22" rx="5" fill="#0C0A09" />

        {/* Legs — tailored trousers */}
        <rect x="44" y="150" width="20" height="55" rx="4" fill="#1C1917" />
        <rect x="76" y="150" width="20" height="55" rx="4" fill="#1C1917" />
        {/* Crease lines */}
        <line x1="54" y1="155" x2="54" y2="200" stroke="#292524" strokeWidth="0.8" />
        <line x1="86" y1="155" x2="86" y2="200" stroke="#292524" strokeWidth="0.8" />

        {/* Body — exquisite three-piece suit */}
        <rect x="32" y="78" width="76" height="78" rx="8" fill="url(#overseerSuit)" />
        {/* Suit lapels */}
        <path d="M55 78 L45 95 L55 110" fill="#292524" />
        <path d="M85 78 L95 95 L85 110" fill="#292524" />
        {/* Shirt visible underneath */}
        <rect x="55" y="82" width="30" height="50" rx="2" fill="#F5F5F4" opacity="0.9" />
        {/* Tie */}
        <polygon points="70,85 65,95 70,135 75,95" fill="url(#overseerTie)" />
        {/* Tie pin */}
        <motion.rect x="66" y="105" width="8" height="2" rx="1" fill="#F59E0B"
          animate={{ filter: ['drop-shadow(0 0 2px #F59E0B)', 'drop-shadow(0 0 5px #F59E0B)', 'drop-shadow(0 0 2px #F59E0B)'] }}
          transition={{ duration: 2, repeat: Infinity }} />
        {/* Pocket square */}
        <polygon points="40,85 35,78 42,78" fill="#BE123C" opacity="0.8" />

        {/* Belt */}
        <rect x="32" y="148" width="76" height="6" rx="2" fill="#0C0A09" />
        <rect x="66" y="146" width="8" height="10" rx="2" fill="#D4A574" />

        {/* Arms — suit sleeves */}
        <rect x="12" y="82" width="24" height="55" rx="6" fill="url(#overseerSuit)" />
        <rect x="104" y="82" width="24" height="55" rx="6" fill="url(#overseerSuit)" />
        {/* Cufflinks */}
        <motion.circle cx="24" cy="135" r="3" fill="#F59E0B"
          animate={{ filter: ['drop-shadow(0 0 2px #F59E0B)', 'drop-shadow(0 0 4px #F59E0B)', 'drop-shadow(0 0 2px #F59E0B)'] }}
          transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="116" cy="135" r="3" fill="#F59E0B"
          animate={{ filter: ['drop-shadow(0 0 2px #F59E0B)', 'drop-shadow(0 0 4px #F59E0B)', 'drop-shadow(0 0 2px #F59E0B)'] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
        {/* Hands */}
        <ellipse cx="18" cy="140" rx="8" ry="5" fill="#D4A574" />
        <ellipse cx="122" cy="140" rx="8" ry="5" fill="#D4A574" />

        {/* Neck */}
        <rect x="56" y="66" width="28" height="16" rx="4" fill="#D4A574" />

        {/* Head */}
        <circle cx="70" cy="42" r="26" fill="#D4A574" />
        {/* Silver swept-back hair */}
        <path d="M45 35 Q50 12 70 10 Q90 12 95 35 L92 28 Q70 15 48 28 Z" fill="#9CA3AF" />
        <path d="M46 33 Q48 28 52 30" fill="#6B7280" opacity="0.5" />
        {/* Eyes — cold and calculating */}
        <ellipse cx="60" cy="40" rx="4" ry="3" fill="white" />
        <ellipse cx="80" cy="40" rx="4" ry="3" fill="white" />
        <circle cx="60" cy="40" r="2" fill="#1C1917" />
        <circle cx="80" cy="40" r="2" fill="#1C1917" />
        {/* Red eye glint */}
        <motion.circle cx="61" cy="39" r="0.8" fill="#F43F5E"
          animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="81" cy="39" r="0.8" fill="#F43F5E"
          animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
        {/* Thin eyebrows */}
        <line x1="54" y1="35" x2="66" y2="36" stroke="#6B7280" strokeWidth="1.5" />
        <line x1="74" y1="36" x2="86" y2="35" stroke="#6B7280" strokeWidth="1.5" />
        {/* Nose */}
        <line x1="70" y1="42" x2="70" y2="50" stroke="#C2956A" strokeWidth="1" />
        {/* Thin smile — unsettling */}
        <path d="M60 55 Q70 60 80 55" fill="none" stroke="#92400E" strokeWidth="1.2" />

        {/* Chess piece (king) held subtly near hand */}
        <motion.g animate={state === 'attacking' ? { scale: [1, 1.3, 1] } : { opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}>
          <rect x="112" y="138" width="6" height="15" rx="1" fill="#F59E0B" opacity="0.8" />
          <line x1="112" y1="140" x2="118" y2="140" stroke="#F59E0B" strokeWidth="1" />
          <circle cx="115" cy="136" r="3" fill="#F59E0B" opacity="0.8" />
        </motion.g>
      </svg>

      {showDamageNum && showDamage && (
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 text-red-400 font-bold text-xl"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -35, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          -{showDamage}
        </motion.div>
      )}
    </motion.div>
  );
};
