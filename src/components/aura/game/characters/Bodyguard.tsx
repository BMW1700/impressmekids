import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type BodyguardState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface BodyguardProps {
  state: BodyguardState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 75, height: 120 },
  medium: { width: 105, height: 170 },
  large: { width: 130, height: 210 },
};

export const Bodyguard = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: BodyguardProps) => {
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
        isDefeated ? { opacity: 0, y: 20 } :
        isHit ? { x: [0, -4, 4, -2, 0] } :
        isAttacking ? { x: [0, -25, 5, 0], scale: [1, 1.08, 1] } :
        { y: [0, -1.5, 0] }
      }
      transition={
        isDefeated ? { duration: 1.2 } :
        isHit ? { duration: 0.25 } :
        isAttacking ? { duration: 0.4 } :
        { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 110 190" width={width} height={height}>
        <defs>
          <linearGradient id="bgSuit2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>
        <ellipse cx="55" cy="185" rx="28" ry="5" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs */}
        <rect x="32" y="125" width="16" height="50" rx="5" fill="#1F2937" />
        <rect x="62" y="125" width="16" height="50" rx="5" fill="#1F2937" />
        <rect x="29" y="168" width="22" height="14" rx="4" fill="#111827" />
        <rect x="59" y="168" width="22" height="14" rx="4" fill="#111827" />
        <rect x="29" y="168" width="22" height="5" rx="2" fill="#1F2937" />
        <rect x="59" y="168" width="22" height="5" rx="2" fill="#1F2937" />
        
        {/* Massive torso */}
        <rect x="22" y="60" width="66" height="70" rx="8" fill="url(#bgSuit2)" />
        <line x1="55" y1="65" x2="55" y2="125" stroke="#374151" strokeWidth="1" />
        <path d="M42 62 L55 80 L68 62" fill="none" stroke="#374151" strokeWidth="1.5" />
        <path d="M32 75 L36 70 L40 75" fill="#6B7280" stroke="none" />
        <circle cx="55" cy="85" r="2" fill="#374151" />
        <circle cx="55" cy="95" r="2" fill="#374151" />
        <rect x="46" y="63" width="18" height="15" rx="2" fill="#E5E7EB" />
        <rect x="52" y="63" width="6" height="55" rx="1" fill="#111827" />
        <path d="M52 118 L55 125 L58 118" fill="#111827" />
        
        {/* Broad shoulders */}
        <rect x="10" y="62" width="16" height="45" rx="7" fill="url(#bgSuit2)" />
        <rect x="84" y="62" width="16" height="45" rx="7" fill="url(#bgSuit2)" />
        
        {/* Fists */}
        {isAttacking ? (
          <motion.g animate={{ x: [-5, -20, 0] }} transition={{ duration: 0.3 }}>
            <circle cx="16" cy="110" r="8" fill="#C4A882" />
            <rect x="10" y="104" width="12" height="4" rx="2" fill="#C4A882" />
          </motion.g>
        ) : (
          <circle cx="18" cy="110" r="7" fill="#C4A882" />
        )}
        <circle cx="92" cy="110" r="7" fill="#C4A882" />
        
        {/* Thick neck */}
        <rect x="40" y="45" width="30" height="18" rx="5" fill="#C4A882" />
        
        {/* Head */}
        <circle cx="55" cy="35" r="20" fill="#C4A882" />
        <path d="M35 35 Q35 15 55 10 Q75 15 75 35" fill="#4B5563" />
        
        {/* Wrap-around sunglasses */}
        <rect x="36" y="28" width="38" height="12" rx="5" fill="#111827" />
        <rect x="38" y="30" width="14" height="8" rx="3" fill="#1F2937" />
        <rect x="58" y="30" width="14" height="8" rx="3" fill="#1F2937" />
        <rect x="40" y="31" width="5" height="2" rx="1" fill="#6B7280" opacity="0.5" />
        
        {/* Earpiece with wire */}
        <rect x="73" y="33" width="5" height="8" rx="2" fill="#374151" />
        <path d="M75 41 Q78 50 74 55" fill="none" stroke="#6B7280" strokeWidth="1" />
        <motion.circle cx="75" cy="33" r="1.5" fill="#22C55E" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Jaw */}
        <rect x="40" y="42" width="30" height="10" rx="3" fill="#B8977A" />
        <line x1="45" y1="48" x2="65" y2="48" stroke="#8B7355" strokeWidth="1.5" />

        {/* Lapel pin */}
        <circle cx="38" cy="68" r="2.5" fill="#EF4444" />
        <circle cx="38" cy="68" r="1" fill="#3B82F6" />

        {isHit && <rect x="0" y="0" width="110" height="190" fill="rgba(255,255,255,0.4)" rx="10" />}
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
