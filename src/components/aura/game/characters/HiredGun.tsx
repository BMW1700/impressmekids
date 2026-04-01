import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type HiredGunState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface HiredGunProps {
  state: HiredGunState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 65, height: 115 },
  medium: { width: 90, height: 160 },
  large: { width: 115, height: 200 },
};

export const HiredGun = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: HiredGunProps) => {
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
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -6, 6, -3, 0] } : isAttacking ? { x: [0, -15, 5, 0] } : { y: [0, -2, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.35 } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <ellipse cx="50" cy="175" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs - tactical pants */}
        <rect x="34" y="115" width="13" height="48" rx="4" fill="#374151" />
        <rect x="53" y="115" width="13" height="48" rx="4" fill="#374151" />
        {/* Knee pads */}
        <rect x="35" y="130" width="11" height="8" rx="3" fill="#4B5563" />
        <rect x="54" y="130" width="11" height="8" rx="3" fill="#4B5563" />
        {/* Combat boots */}
        <rect x="32" y="157" width="17" height="14" rx="3" fill="#1F2937" />
        <rect x="51" y="157" width="17" height="14" rx="3" fill="#1F2937" />
        
        {/* Body - tactical vest over dark shirt */}
        <rect x="28" y="60" width="44" height="58" rx="6" fill="#1F2937" />
        {/* Kevlar vest */}
        <rect x="30" y="62" width="40" height="40" rx="5" fill="#374151" />
        <line x1="50" y1="62" x2="50" y2="102" stroke="#4B5563" strokeWidth="1" />
        {/* Vest pouches */}
        <rect x="33" y="75" width="10" height="8" rx="2" fill="#4B5563" stroke="#6B7280" strokeWidth="0.5" />
        <rect x="57" y="75" width="10" height="8" rx="2" fill="#4B5563" stroke="#6B7280" strokeWidth="0.5" />
        
        {/* Arms */}
        <rect x="18" y="65" width="12" height="38" rx="5" fill="#1F2937" />
        <rect x="70" y="65" width="12" height="38" rx="5" fill="#1F2937" />
        
        {/* Weapon - suppressed pistol */}
        {isAttacking ? (
          <motion.g animate={{ rotate: [0, -10, 0] }} transition={{ duration: 0.2 }}>
            <rect x="76" y="90" width="22" height="6" rx="2" fill="#6B7280" />
            <rect x="94" y="89" width="8" height="8" rx="1" fill="#9CA3AF" />
            {/* Muzzle flash */}
            <circle cx="103" cy="93" r="6" fill="#FDE047" opacity="0.8" />
          </motion.g>
        ) : (
          <g>
            <rect x="78" y="95" width="18" height="5" rx="2" fill="#6B7280" transform="rotate(5, 87, 97)" />
          </g>
        )}
        
        {/* Hands - gloved */}
        <circle cx="24" cy="105" r="5" fill="#374151" />
        <circle cx="76" cy="105" r="5" fill="#374151" />
        
        {/* Head */}
        <circle cx="50" cy="45" r="20" fill="#C4A882" />
        
        {/* Balaclava / face cover */}
        <path d="M30 45 Q30 25 50 18 Q70 25 70 45 L70 35 Q70 20 50 13 Q30 20 30 35 Z" fill="#1F2937" />
        <rect x="32" y="42" width="36" height="10" rx="3" fill="#1F2937" />
        
        {/* Tactical goggles */}
        <rect x="34" y="36" width="14" height="8" rx="3" fill="#065F46" opacity="0.9" />
        <rect x="52" y="36" width="14" height="8" rx="3" fill="#065F46" opacity="0.9" />
        <rect x="48" y="38" width="4" height="4" rx="1" fill="#374151" />
        {/* Goggle glint */}
        <rect x="36" y="37" width="4" height="2" rx="1" fill="#34D399" opacity="0.6" />
        <rect x="54" y="37" width="4" height="2" rx="1" fill="#34D399" opacity="0.6" />
        
        {/* Earpiece */}
        <rect x="68" y="40" width="5" height="8" rx="2" fill="#374151" />
        
        {isHit && <rect x="0" y="0" width="100" height="180" fill="rgba(255,255,255,0.4)" rx="10" />}
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
