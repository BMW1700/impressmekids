import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type StreetThugState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface StreetThugProps {
  state: StreetThugState;
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

export const StreetThug = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: StreetThugProps) => {
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
      style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -8, 8, -4, 0] } : isAttacking ? { x: [0, -30, 0] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs>
          <linearGradient id="thugHoodie" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#57534E" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="175" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs */}
        <rect x="35" y="120" width="12" height="45" rx="4" fill="#374151" />
        <rect x="53" y="120" width="12" height="45" rx="4" fill="#374151" />
        {/* Boots */}
        <rect x="33" y="158" width="16" height="12" rx="3" fill="#1F2937" />
        <rect x="51" y="158" width="16" height="12" rx="3" fill="#1F2937" />
        <rect x="33" y="158" width="16" height="4" rx="1" fill="#374151" />
        <rect x="51" y="158" width="16" height="4" rx="1" fill="#374151" />
        
        {/* Body */}
        <rect x="28" y="65" width="44" height="60" rx="8" fill="url(#thugHoodie)" />
        {/* Hoodie strings */}
        <line x1="45" y1="68" x2="43" y2="80" stroke="#78716C" strokeWidth="0.8" />
        <line x1="55" y1="68" x2="57" y2="80" stroke="#78716C" strokeWidth="0.8" />
        {/* Hoodie pocket */}
        <rect x="38" y="95" width="24" height="15" rx="4" fill="#3A3733" stroke="#57534E" strokeWidth="0.5" />
        
        {/* Arms */}
        <rect x="18" y="70" width="12" height="40" rx="5" fill="url(#thugHoodie)" />
        <rect x="70" y="70" width="12" height="40" rx="5" fill="url(#thugHoodie)" />
        
        {/* Pipe weapon */}
        {isAttacking && (
          <motion.g animate={{ rotate: [-20, 60, -20] }} transition={{ duration: 0.3 }}>
            <rect x="75" y="55" width="4" height="50" rx="2" fill="#78716C" />
            <rect x="73" y="50" width="8" height="8" rx="2" fill="#A8A29E" />
          </motion.g>
        )}
        {!isAttacking && (
          <g>
            <rect x="78" y="85" width="4" height="30" rx="2" fill="#78716C" transform="rotate(15, 80, 100)" />
          </g>
        )}
        
        {/* Hands */}
        <circle cx="24" cy="112" r="5" fill="#D4A574" />
        <circle cx="76" cy="112" r="5" fill="#D4A574" />
        
        {/* Head */}
        <circle cx="50" cy="50" r="22" fill="#D4A574" />
        
        {/* Hood */}
        <path d="M28 50 Q28 25 50 20 Q72 25 72 50 L72 42 Q72 22 50 15 Q28 22 28 42 Z" fill="url(#thugHoodie)" />
        <path d="M28 42 Q28 30 50 25 Q72 30 72 42" fill="none" stroke="#57534E" strokeWidth="1" />
        
        {/* Face shadow */}
        <rect x="32" y="35" width="36" height="25" rx="5" fill="rgba(0,0,0,0.15)" />
        
        {/* Eyes */}
        <ellipse cx="42" cy="45" rx="3" ry="2" fill="white" />
        <ellipse cx="58" cy="45" rx="3" ry="2" fill="white" />
        <circle cx="42" cy="45" r="1.5" fill="#1F2937" />
        <circle cx="58" cy="45" r="1.5" fill="#1F2937" />
        
        {/* Scowl */}
        <path d="M40 57 Q50 53 60 57" fill="none" stroke="#78716C" strokeWidth="1.5" />
        
        {/* Scar */}
        <line x1="55" y1="38" x2="62" y2="48" stroke="#B8917A" strokeWidth="1" />
        
        {/* Tattoo on neck */}
        <path d="M35 62 L38 58 L41 62" fill="none" stroke="#57534E" strokeWidth="0.8" />
        
        {isHit && <rect x="0" y="0" width="100" height="180" fill="rgba(255,255,255,0.4)" rx="10" />}
      </svg>

      {/* Health bar */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[85%]" style={{ transform: flipX ? 'scaleX(-1)' : undefined }}>
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-600">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthPercent > 50 ? 'linear-gradient(90deg, #EF4444, #F87171)' :
                healthPercent > 25 ? 'linear-gradient(90deg, #EAB308, #FACC15)' :
                'linear-gradient(90deg, #DC2626, #991B1B)',
            }}
            animate={{ width: `${Math.max(0, healthPercent)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {currentHp !== undefined && maxHp !== undefined && (
          <p className="text-[8px] text-center text-gray-400 mt-0.5">{currentHp}/{maxHp}</p>
        )}
      </div>

      {/* Damage number */}
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
