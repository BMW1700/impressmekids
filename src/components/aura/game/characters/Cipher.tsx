import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type CipherState = 'idle' | 'hit' | 'attacking' | 'victory' | 'defeated' | 'casting' | 'pulling';

interface CipherProps {
  state: CipherState;
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
  medium: { width: 90, height: 165 },
  large: { width: 120, height: 215 },
};

export const Cipher = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'large',
  flipX = false,
  showHealthBar = true,
}: CipherProps) => {
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
        isAttacking ? { scale: [1, 1.05, 1] } :
        isDefeated ? { opacity: 0.3, y: 20 } :
        { y: [0, -3, 0] }
      }
      transition={isDefeated ? { duration: 0.5 } : { duration: 1.5, repeat: isDefeated ? 0 : Infinity, ease: 'easeInOut' }}
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

      <svg width={width} height={height} viewBox="0 0 120 215" fill="none">
        {/* Shadow */}
        <ellipse cx="60" cy="205" rx="30" ry="7" fill="rgba(0,0,0,0.3)" />

        {/* Legs */}
        <rect x="40" y="155" width="14" height="45" rx="4" fill="#1E293B" />
        <rect x="66" y="155" width="14" height="45" rx="4" fill="#1E293B" />
        {/* Boots */}
        <rect x="37" y="193" width="20" height="10" rx="4" fill="#0E7490" />
        <rect x="63" y="193" width="20" height="10" rx="4" fill="#0E7490" />

        {/* Body - Tech jacket */}
        <rect x="33" y="78" width="54" height="82" rx="6" fill="#164E63" />
        {/* Jacket details - circuit lines */}
        <motion.line x1="40" y1="90" x2="40" y2="130" stroke="#22D3EE" strokeWidth="1" opacity={0.5}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.line x1="80" y1="90" x2="80" y2="130" stroke="#22D3EE" strokeWidth="1" opacity={0.5}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        {/* Zipper */}
        <line x1="60" y1="80" x2="60" y2="155" stroke="#67E8F9" strokeWidth="1.5" />
        {/* Belt */}
        <rect x="33" y="150" width="54" height="5" rx="2" fill="#0E7490" />

        {/* Arms */}
        <rect x="18" y="82" width="17" height="55" rx="5" fill="#164E63" />
        <rect x="85" y="82" width="17" height="55" rx="5" fill="#164E63" />
        {/* Fingerless gloves */}
        <rect x="20" y="135" width="13" height="12" rx="3" fill="#0F172A" />
        <rect x="87" y="135" width="13" height="12" rx="3" fill="#0F172A" />

        {/* Holographic wrist display */}
        {isAttacking && (
          <motion.g>
            <rect x="85" y="120" width="20" height="15" rx="2" fill="#06B6D4" opacity={0.6} />
            <motion.rect x="87" y="122" width="16" height="11" rx="1" fill="#22D3EE" opacity={0.4}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 0.3, repeat: 5 }}
            />
            {/* Data stream */}
            <motion.circle cx="95" cy="115" r="15" fill="none" stroke="#22D3EE" strokeWidth="1"
              animate={{ r: [5, 25], opacity: [0.8, 0] }}
              transition={{ duration: 0.8, repeat: 2 }}
            />
          </motion.g>
        )}

        {/* Head */}
        <circle cx="60" cy="52" r="26" fill="#C68B59" />
        {/* Hair - asymmetric bob with cyan streak */}
        <path d="M34 48 Q40 18 60 20 Q80 18 86 48 Q88 35 75 25 Q60 16 45 25 Q32 35 34 48" fill="#1C1917" />
        <path d="M34 48 Q36 30 45 25" stroke="#22D3EE" strokeWidth="3" fill="none" />
        {/* Tech visor */}
        <rect x="40" y="44" width="40" height="12" rx="6" fill="#0E7490" opacity={0.9} />
        <motion.rect x="42" y="46" width="36" height="8" rx="4" fill="#22D3EE" opacity={0.3}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Eyes behind visor */}
        <circle cx="50" cy="50" r="3" fill="#67E8F9" />
        <circle cx="70" cy="50" r="3" fill="#67E8F9" />
        <circle cx="50" cy="50" r="1.5" fill="white" />
        <circle cx="70" cy="50" r="1.5" fill="white" />
        {/* Mouth */}
        <path d="M52 64 Q60 68 68 64" stroke="#92400E" strokeWidth="1.5" fill="none" />
        {/* Earpiece */}
        <circle cx="86" cy="50" r="3" fill="#0E7490" />
        <motion.circle cx="86" cy="50" r="1.5" fill="#22D3EE"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%]" style={{ transform: flipX ? 'scaleX(-1)' : undefined }}>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-800">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: healthPercent > 50 ? 'linear-gradient(90deg, #06B6D4, #22D3EE)' :
                  healthPercent > 25 ? 'linear-gradient(90deg, #EAB308, #FACC15)' :
                  'linear-gradient(90deg, #EF4444, #F87171)',
              }}
              animate={{ width: `${Math.max(0, healthPercent)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {currentHp !== undefined && maxHp !== undefined && (
            <p className="text-[9px] text-center text-cyan-400 mt-0.5">{currentHp}/{maxHp}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};
