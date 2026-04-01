import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type AgentXState = 'idle' | 'hit' | 'attacking' | 'victory' | 'defeated' | 'blocking' | 'pulling';

interface AgentXProps {
  state: AgentXState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  currentStreak?: number;
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 70, height: 120 },
  medium: { width: 100, height: 170 },
  large: { width: 130, height: 220 },
};

export const AgentX = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'large',
  flipX = false,
  currentStreak = 0,
  showHealthBar = true,
}: AgentXProps) => {
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
      animate={
        isHit ? { x: [0, -8, 8, -4, 0], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } :
        isAttacking ? { x: [0, 20, 0], scale: [1, 1.1, 1] } :
        isDefeated ? { opacity: 0.3, y: 20, rotate: -15 } :
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

      <svg width={width} height={height} viewBox="0 0 130 220" fill="none">
        {/* Shadow */}
        <ellipse cx="65" cy="210" rx="35" ry="8" fill="rgba(0,0,0,0.3)" />

        {/* Legs */}
        <rect x="45" y="160" width="16" height="45" rx="4" fill="#1E293B" />
        <rect x="69" y="160" width="16" height="45" rx="4" fill="#1E293B" />
        {/* Shoes */}
        <rect x="42" y="198" width="22" height="10" rx="5" fill="#0F172A" />
        <rect x="66" y="198" width="22" height="10" rx="5" fill="#0F172A" />

        {/* Body - Dark suit */}
        <rect x="38" y="80" width="54" height="85" rx="8" fill="#334155" />
        {/* Suit lapels */}
        <path d="M65 80 L55 110 L45 85" fill="#1E293B" />
        <path d="M65 80 L75 110 L85 85" fill="#1E293B" />
        {/* Tie */}
        <path d="M63 90 L65 130 L67 90" fill="#DC2626" />
        {/* Belt */}
        <rect x="38" y="155" width="54" height="6" rx="2" fill="#0F172A" />
        <rect x="61" y="154" width="8" height="8" rx="1" fill="#94A3B8" />

        {/* Arms */}
        <rect x="22" y="85" width="18" height="60" rx="6" fill="#334155" />
        <rect x="90" y="85" width="18" height="60" rx="6" fill="#334155" />
        {/* Hands */}
        <circle cx="31" cy="148" r="7" fill="#D4A574" />
        <circle cx="99" cy="148" r="7" fill="#D4A574" />

        {/* Gun in right hand */}
        {isAttacking && (
          <motion.g
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 0.3, repeat: 2 }}
          >
            <rect x="96" y="135" width="25" height="8" rx="2" fill="#475569" />
            <rect x="118" y="133" width="8" height="12" rx="1" fill="#64748B" />
            {/* Muzzle flash */}
            <motion.circle cx="128" cy="139" r="8" fill="#FCD34D" opacity={0.8}
              animate={{ r: [4, 12, 4], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 0.2, repeat: 3 }}
            />
          </motion.g>
        )}

        {/* Head */}
        <circle cx="65" cy="55" r="28" fill="#D4A574" />
        {/* Hair - slicked back */}
        <path d="M37 50 Q65 20 93 50 Q93 35 65 30 Q37 35 37 50" fill="#1C1917" />
        {/* Sunglasses */}
        <rect x="44" y="48" width="18" height="10" rx="3" fill="#0F172A" />
        <rect x="68" y="48" width="18" height="10" rx="3" fill="#0F172A" />
        <rect x="62" y="50" width="6" height="3" rx="1" fill="#374151" />
        {/* Sunglasses glint */}
        <motion.rect x="48" y="49" width="6" height="2" rx="1" fill="rgba(255,255,255,0.4)"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Mouth */}
        <path d="M57 68 Q65 72 73 68" stroke="#92400E" strokeWidth="1.5" fill="none" />
        {/* Earpiece */}
        <circle cx="37" cy="55" r="4" fill="#374151" />
        <motion.circle cx="37" cy="55" r="2" fill="#22D3EE"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Streak indicator */}
        {currentStreak > 0 && (
          <motion.text
            x="65" y="18"
            textAnchor="middle"
            fill="#FCD34D"
            fontSize="14"
            fontWeight="bold"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            🔥{currentStreak}
          </motion.text>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%]" style={{ transform: flipX ? 'scaleX(-1)' : undefined }}>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: healthPercent > 50 ? 'linear-gradient(90deg, #22C55E, #4ADE80)' :
                  healthPercent > 25 ? 'linear-gradient(90deg, #EAB308, #FACC15)' :
                  'linear-gradient(90deg, #EF4444, #F87171)',
              }}
              animate={{ width: `${Math.max(0, healthPercent)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {currentHp !== undefined && maxHp !== undefined && (
            <p className="text-[9px] text-center text-slate-400 mt-0.5">{currentHp}/{maxHp}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};
