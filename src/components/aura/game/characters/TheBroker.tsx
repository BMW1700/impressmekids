import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheBrokerState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'ground_slam';

interface TheBrokerProps {
  state: TheBrokerState;
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

export const TheBroker = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'large', flipX = false }: TheBrokerProps) => {
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
  const isAttacking = state === 'attacking' || state === 'ground_slam';
  const isDefeated = state === 'defeated';

  return (
    <motion.div
      className="relative"
      style={{ width, height, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -5, 5, -3, 0] } : isAttacking ? { scale: [1, 1.1, 1] } : { y: [0, -2, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.5 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <ellipse cx="50" cy="175" rx="28" ry="5" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs - expensive slacks */}
        <rect x="34" y="120" width="13" height="42" rx="4" fill="#292524" />
        <rect x="53" y="120" width="13" height="42" rx="4" fill="#292524" />
        {/* Polished shoes */}
        <rect x="32" y="157" width="17" height="13" rx="3" fill="#1C1917" />
        <rect x="51" y="157" width="17" height="13" rx="3" fill="#1C1917" />
        {/* Shoe shine */}
        <rect x="34" y="159" width="8" height="3" rx="1" fill="#44403C" opacity="0.5" />
        <rect x="53" y="159" width="8" height="3" rx="1" fill="#44403C" opacity="0.5" />
        
        {/* Body - expensive suit */}
        <rect x="26" y="58" width="48" height="65" rx="6" fill="#292524" />
        {/* Suit lapels */}
        <path d="M38 58 L50 80 L62 58" fill="none" stroke="#D97706" strokeWidth="1.5" />
        {/* Shirt/tie */}
        <rect x="47" y="62" width="6" height="35" rx="1" fill="#F5F5F4" />
        <rect x="48" y="62" width="4" height="35" rx="1" fill="#B45309" />
        {/* Gold tie pin */}
        <rect x="46" y="78" width="8" height="2" rx="1" fill="#F59E0B" />
        {/* Pocket square */}
        <path d="M62 65 L68 62 L68 70 Z" fill="#F59E0B" />
        
        {/* Arms */}
        <rect x="16" y="63" width="13" height="40" rx="5" fill="#292524" />
        <rect x="71" y="63" width="13" height="40" rx="5" fill="#292524" />
        
        {/* Briefcase in left hand */}
        <rect x="5" y="102" width="20" height="15" rx="3" fill="#78350F" />
        <rect x="5" y="102" width="20" height="2" rx="1" fill="#92400E" />
        <rect x="13" y="99" width="6" height="4" rx="1" fill="#B45309" />
        {/* Gold lock */}
        <circle cx="15" cy="110" r="2" fill="#F59E0B" />
        
        {/* Hands */}
        <circle cx="22" cy="105" r="5" fill="#C4A882" />
        <circle cx="78" cy="105" r="5" fill="#C4A882" />
        
        {/* Gold rings */}
        <circle cx="78" cy="105" r="3" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
        
        {/* Head */}
        <circle cx="50" cy="43" r="22" fill="#C4A882" />
        {/* Slicked back hair */}
        <path d="M28 38 Q28 18 50 14 Q72 18 72 38 L72 30 Q72 15 50 10 Q28 15 28 30 Z" fill="#292524" />
        
        {/* Sunglasses */}
        <rect x="32" y="36" width="15" height="10" rx="3" fill="#1C1917" />
        <rect x="53" y="36" width="15" height="10" rx="3" fill="#1C1917" />
        <line x1="47" y1="41" x2="53" y2="41" stroke="#44403C" strokeWidth="1.5" />
        {/* Lens glare */}
        <rect x="34" y="37" width="5" height="2" rx="1" fill="#F59E0B" opacity="0.3" />
        <rect x="55" y="37" width="5" height="2" rx="1" fill="#F59E0B" opacity="0.3" />
        
        {/* Smug grin */}
        <path d="M40 54 Q50 60 60 54" fill="none" stroke="#78716C" strokeWidth="1.5" />
        
        {/* Cigar */}
        <rect x="60" y="53" width="15" height="3" rx="1" fill="#92400E" />
        <motion.circle cx="76" cy="54" r="2" fill="#F97316" opacity="0.7"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Gold aura for boss */}
        <motion.ellipse cx="50" cy="90" rx="45" ry="85" fill="none" stroke="#F59E0B" strokeWidth="0.5"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
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
