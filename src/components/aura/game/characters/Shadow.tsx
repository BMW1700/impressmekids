import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type ShadowState = 'idle' | 'hit' | 'attacking' | 'victory' | 'defeated' | 'pulling' | 'casting';

interface ShadowProps {
  state: ShadowState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 60, height: 120 },
  medium: { width: 85, height: 165 },
  large: { width: 110, height: 215 },
};

export const Shadow = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'large',
  flipX = false,
  showHealthBar = true,
}: ShadowProps) => {
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
  const isAttacking = state === 'attacking' || state === 'casting';
  const isDefeated = state === 'defeated';

  return (
    <motion.div
      className="relative"
      style={{ width, height, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={
        isHit ? { x: [0, -8, 8, -4, 0], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } :
        isAttacking ? { x: [0, 15, 0], opacity: [1, 0.5, 1] } :
        isDefeated ? { opacity: 0.3, y: 20 } :
        { y: [0, -4, 0] }
      }
      transition={isDefeated ? { duration: 0.5 } : { duration: 1.8, repeat: isDefeated ? 0 : Infinity, ease: 'easeInOut' }}
    >
      {showDamageNum && showDamage && (
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-red-400 font-black text-lg z-20"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
        >
          -{showDamage}
        </motion.div>
      )}

      <svg width={width} height={height} viewBox="0 0 110 215" fill="none">
        {/* Shadow on ground */}
        <ellipse cx="55" cy="205" rx="28" ry="7" fill="rgba(0,0,0,0.3)" />

        {/* Legs */}
        <rect x="36" y="155" width="14" height="45" rx="4" fill="#1E1B2E" />
        <rect x="60" y="155" width="14" height="45" rx="4" fill="#1E1B2E" />
        {/* Boots */}
        <rect x="33" y="193" width="20" height="10" rx="4" fill="#0F0B1E" />
        <rect x="57" y="193" width="20" height="10" rx="4" fill="#0F0B1E" />

        {/* Body - Stealth suit */}
        <rect x="30" y="78" width="50" height="82" rx="6" fill="#2D1B69" />
        {/* Tactical vest */}
        <rect x="33" y="82" width="44" height="40" rx="4" fill="#1E1B2E" />
        {/* Vest pouches */}
        <rect x="35" y="85" width="12" height="8" rx="2" fill="#312E81" />
        <rect x="63" y="85" width="12" height="8" rx="2" fill="#312E81" />
        <rect x="35" y="100" width="12" height="8" rx="2" fill="#312E81" />
        <rect x="63" y="100" width="12" height="8" rx="2" fill="#312E81" />
        {/* Belt */}
        <rect x="30" y="150" width="50" height="5" rx="2" fill="#1E1B2E" />
        {/* Utility pouches on belt */}
        <rect x="32" y="146" width="8" height="10" rx="2" fill="#312E81" />
        <rect x="70" y="146" width="8" height="10" rx="2" fill="#312E81" />

        {/* Arms */}
        <rect x="16" y="82" width="16" height="55" rx="5" fill="#2D1B69" />
        <rect x="78" y="82" width="16" height="55" rx="5" fill="#2D1B69" />
        {/* Gloves */}
        <rect x="18" y="135" width="12" height="12" rx="3" fill="#0F0B1E" />
        <rect x="80" y="135" width="12" height="12" rx="3" fill="#0F0B1E" />

        {/* Knife in hand when attacking */}
        {isAttacking && (
          <motion.g
            animate={{ rotate: [0, -30, 0] }}
            transition={{ duration: 0.3, repeat: 2 }}
            style={{ transformOrigin: '86px 140px' }}
          >
            <rect x="84" y="125" width="3" height="20" rx="1" fill="#94A3B8" />
            <rect x="82" y="143" width="7" height="6" rx="1" fill="#1E1B2E" />
          </motion.g>
        )}

        {/* Hood/Head */}
        <path d="M30 55 Q35 20 55 15 Q75 20 80 55 Q80 65 55 70 Q30 65 30 55" fill="#2D1B69" />
        {/* Face opening */}
        <path d="M38 45 Q55 38 72 45 Q72 62 55 65 Q38 62 38 45" fill="#C68B59" />
        {/* Eyes - glowing */}
        <motion.circle cx="47" cy="50" r="3" fill="#A78BFA"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle cx="63" cy="50" r="3" fill="#A78BFA"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <circle cx="47" cy="50" r="1.5" fill="white" />
        <circle cx="63" cy="50" r="1.5" fill="white" />
        {/* Mask over lower face */}
        <path d="M40 55 Q55 60 70 55 Q70 65 55 68 Q40 65 40 55" fill="#1E1B2E" />

        {/* Stealth shimmer effect */}
        <motion.rect x="28" y="75" width="54" height="90" rx="6" fill="none" stroke="#A78BFA" strokeWidth="0.5" opacity={0.3}
          animate={{ opacity: [0.1, 0.3, 0.1], strokeDashoffset: [0, 20] }}
          transition={{ duration: 3, repeat: Infinity }}
          strokeDasharray="4 4"
        />
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%]" style={{ transform: flipX ? 'scaleX(-1)' : undefined }}>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-purple-800">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: healthPercent > 50 ? 'linear-gradient(90deg, #7C3AED, #A78BFA)' :
                  healthPercent > 25 ? 'linear-gradient(90deg, #EAB308, #FACC15)' :
                  'linear-gradient(90deg, #EF4444, #F87171)',
              }}
              animate={{ width: `${Math.max(0, healthPercent)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {currentHp !== undefined && maxHp !== undefined && (
            <p className="text-[9px] text-center text-purple-400 mt-0.5">{currentHp}/{maxHp}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};
