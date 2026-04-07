import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type OperativeState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface OperativeProps {
  state: OperativeState;
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

export const Operative = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: OperativeProps) => {
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
        isDefeated ? { opacity: 0, y: 20, rotate: -5 } :
        isHit ? { x: [0, -6, 6, -3, 0] } :
        isAttacking ? { x: [0, -25, 5, 0] } :
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
          <linearGradient id="opTacVest" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="opCamo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="175" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />

        {/* Legs - tactical pants */}
        <rect x="35" y="120" width="12" height="42" rx="4" fill="#334155" />
        <rect x="53" y="120" width="12" height="42" rx="4" fill="#334155" />
        {/* Knee pads */}
        <rect x="36" y="135" width="10" height="8" rx="2" fill="#475569" />
        <rect x="54" y="135" width="10" height="8" rx="2" fill="#475569" />
        {/* Combat boots */}
        <rect x="33" y="156" width="16" height="14" rx="3" fill="#111827" />
        <rect x="51" y="156" width="16" height="14" rx="3" fill="#111827" />
        <rect x="33" y="156" width="16" height="4" rx="1" fill="#1F2937" />
        <rect x="51" y="156" width="16" height="4" rx="1" fill="#1F2937" />

        {/* Body - tactical vest */}
        <rect x="28" y="62" width="44" height="60" rx="6" fill="url(#opTacVest)" />
        {/* Vest plate */}
        <rect x="32" y="66" width="36" height="30" rx="3" fill="#475569" opacity="0.6" />
        {/* Mag pouches */}
        <rect x="30" y="100" width="8" height="12" rx="2" fill="#374151" />
        <rect x="40" y="100" width="8" height="12" rx="2" fill="#374151" />
        <rect x="52" y="100" width="8" height="12" rx="2" fill="#374151" />
        <rect x="62" y="100" width="8" height="12" rx="2" fill="#374151" />
        {/* Utility belt */}
        <rect x="28" y="116" width="44" height="5" rx="1" fill="#64748B" />
        <rect x="48" y="114" width="6" height="9" rx="2" fill="#475569" />

        {/* Arms */}
        <rect x="16" y="65" width="14" height="40" rx="5" fill="url(#opCamo)" />
        <rect x="70" y="65" width="14" height="40" rx="5" fill="url(#opCamo)" />
        {/* Shoulder radio */}
        <rect x="17" y="63" width="12" height="6" rx="2" fill="#475569" />
        <motion.rect x="28" y="63" width="3" height="8" rx="1" fill="#0EA5E9"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />

        {/* Assault rifle */}
        {isAttacking ? (
          <motion.g animate={{ rotate: [-5, 10, -5] }} transition={{ duration: 0.2 }}>
            <rect x="75" y="80" width="25" height="5" rx="2" fill="#4B5563" />
            <rect x="95" y="78" width="6" height="9" rx="1" fill="#374151" />
            <circle cx="102" cy="82" r="4" fill="#FDE047" opacity="0.8" />
          </motion.g>
        ) : (
          <g>
            <rect x="78" y="85" width="20" height="4" rx="2" fill="#4B5563" transform="rotate(5, 88, 87)" />
            <rect x="75" y="94" width="4" height="12" rx="1" fill="#374151" />
          </g>
        )}

        {/* Gloved hands */}
        <circle cx="22" cy="107" r="5" fill="#1F2937" />
        <circle cx="78" cy="107" r="5" fill="#1F2937" />

        {/* Head */}
        <circle cx="50" cy="45" r="18" fill="#C4A882" />
        {/* Balaclava */}
        <path d="M32 50 Q32 24 50 18 Q68 24 68 50 L68 42 Q68 20 50 14 Q32 20 32 42 Z" fill="#1E293B" />
        <rect x="32" y="46" width="36" height="10" rx="3" fill="#1E293B" />
        {/* NVG mount on head */}
        <rect x="42" y="15" width="16" height="6" rx="2" fill="#374151" />
        <rect x="44" y="10" width="5" height="8" rx="1" fill="#475569" />
        <rect x="51" y="10" width="5" height="8" rx="1" fill="#475569" />
        <motion.circle cx="46" cy="11" r="2" fill="#22C55E" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.circle cx="54" cy="11" r="2" fill="#22C55E" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
        />

        {/* Eyes through balaclava */}
        <ellipse cx="42" cy="42" rx="4" ry="2.5" fill="white" />
        <ellipse cx="58" cy="42" rx="4" ry="2.5" fill="white" />
        <circle cx="43" cy="42" r="1.5" fill="#1F2937" />
        <circle cx="57" cy="42" r="1.5" fill="#1F2937" />

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