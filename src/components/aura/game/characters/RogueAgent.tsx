import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type RogueAgentState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface RogueAgentProps {
  state: RogueAgentState;
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

export const RogueAgent = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: RogueAgentProps) => {
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
      animate={
        isDefeated ? { opacity: 0, y: 20, rotate: -10 } :
        isHit ? { x: [0, -6, 6, -3, 0] } :
        isAttacking ? { x: [0, -20, 10, 0], scale: [1, 1.05, 1] } :
        { y: [0, -2, 0] }
      }
      transition={
        isDefeated ? { duration: 1 } :
        isHit ? { duration: 0.3 } :
        isAttacking ? { duration: 0.35 } :
        { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs>
          <linearGradient id="rogueCoat2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#0F1B2D" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="175" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs */}
        <rect x="35" y="125" width="12" height="40" rx="4" fill="#1F2937" />
        <rect x="53" y="125" width="12" height="40" rx="4" fill="#1F2937" />
        <rect x="33" y="158" width="16" height="13" rx="3" fill="#111827" />
        <rect x="51" y="158" width="16" height="13" rx="3" fill="#111827" />
        <rect x="33" y="158" width="16" height="4" rx="1" fill="#374151" />
        <rect x="51" y="158" width="16" height="4" rx="1" fill="#374151" />

        {/* Trenchcoat */}
        <path d="M25 65 L25 145 L35 150 L35 125 L65 125 L65 150 L75 145 L75 65 Z" fill="url(#rogueCoat2)" />
        <path d="M38 65 L50 85 L62 65" fill="none" stroke="#2D4A6F" strokeWidth="1.5" />
        <rect x="28" y="110" width="44" height="4" rx="1" fill="#374151" />
        <rect x="47" y="108" width="6" height="8" rx="1" fill="#6B7280" />
        <rect x="40" y="68" width="20" height="40" rx="2" fill="#111827" />
        <line x1="50" y1="68" x2="50" y2="108" stroke="#1F2937" strokeWidth="1" />
        
        {/* Arms */}
        <rect x="15" y="68" width="12" height="38" rx="5" fill="url(#rogueCoat2)" />
        <rect x="73" y="68" width="12" height="38" rx="5" fill="url(#rogueCoat2)" />
        
        {/* Dual pistols */}
        {isAttacking ? (
          <>
            <motion.g animate={{ rotate: [0, -15, 0] }} transition={{ duration: 0.15 }}>
              <rect x="5" y="100" width="16" height="5" rx="2" fill="#6B7280" />
              <circle cx="4" cy="102" r="4" fill="#FDE047" opacity="0.8" />
            </motion.g>
            <motion.g animate={{ rotate: [0, -15, 0] }} transition={{ duration: 0.15, delay: 0.08 }}>
              <rect x="79" y="100" width="16" height="5" rx="2" fill="#6B7280" />
              <circle cx="96" cy="102" r="4" fill="#FDE047" opacity="0.8" />
            </motion.g>
          </>
        ) : (
          <>
            <rect x="8" y="102" width="14" height="4" rx="2" fill="#6B7280" transform="rotate(-10, 15, 104)" />
            <rect x="78" y="102" width="14" height="4" rx="2" fill="#6B7280" transform="rotate(10, 85, 104)" />
          </>
        )}
        
        {/* Gloved hands */}
        <circle cx="21" cy="108" r="5" fill="#1F2937" />
        <circle cx="79" cy="108" r="5" fill="#1F2937" />
        
        {/* Head */}
        <circle cx="50" cy="48" r="18" fill="#C4A882" />
        <path d="M32 48 Q32 28 50 22 Q68 28 68 48 L68 38 Q68 24 50 18 Q32 24 32 38 Z" fill="#1F2937" />
        
        {/* Sunglasses */}
        <rect x="34" y="40" width="13" height="9" rx="2" fill="#111827" />
        <rect x="53" y="40" width="13" height="9" rx="2" fill="#111827" />
        <line x1="47" y1="44" x2="53" y2="44" stroke="#374151" strokeWidth="1.5" />
        <line x1="34" y1="44" x2="30" y2="42" stroke="#374151" strokeWidth="1" />
        <line x1="66" y1="44" x2="70" y2="42" stroke="#374151" strokeWidth="1" />
        <rect x="36" y="41" width="4" height="2" rx="1" fill="#3B82F6" opacity="0.4" />
        <rect x="55" y="41" width="4" height="2" rx="1" fill="#3B82F6" opacity="0.4" />
        
        {/* Stubble jaw */}
        <rect x="40" y="54" width="20" height="6" rx="3" fill="#B8977A" />
        <path d="M42 58 Q50 62 58 57" fill="none" stroke="#8B7355" strokeWidth="1" />
        
        {/* Earpiece */}
        <rect x="67" y="43" width="4" height="7" rx="2" fill="#374151" />
        <motion.circle cx="69" cy="43" r="1.5" fill="#3B82F6" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Coat collar */}
        <rect x="28" y="58" width="8" height="12" rx="2" fill="#1E3A5F" />
        <rect x="64" y="58" width="8" height="12" rx="2" fill="#1E3A5F" />

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
