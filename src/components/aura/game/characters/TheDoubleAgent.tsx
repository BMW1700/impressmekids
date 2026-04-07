import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheDoubleAgentState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface TheDoubleAgentProps {
  state: TheDoubleAgentState;
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

export const TheDoubleAgent = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: TheDoubleAgentProps) => {
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
        isDefeated ? { opacity: 0, y: 20, rotate: -8 } :
        isHit ? { x: [0, -5, 5, -3, 0] } :
        isAttacking ? { x: [0, -20, 5, 0], scale: [1, 1.05, 1] } :
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
          <linearGradient id="daSuit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <linearGradient id="daShirt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F4" />
            <stop offset="100%" stopColor="#D6D3D1" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="175" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />

        {/* Legs - suit pants */}
        <rect x="35" y="120" width="12" height="45" rx="4" fill="#1F2937" />
        <rect x="53" y="120" width="12" height="45" rx="4" fill="#1F2937" />
        {/* Dress shoes */}
        <rect x="33" y="158" width="16" height="12" rx="3" fill="#111827" />
        <rect x="51" y="158" width="16" height="12" rx="3" fill="#111827" />
        <rect x="33" y="160" width="16" height="3" rx="1" fill="#1F2937" />
        <rect x="51" y="160" width="16" height="3" rx="1" fill="#1F2937" />

        {/* Body - tailored suit */}
        <rect x="28" y="62" width="44" height="62" rx="6" fill="url(#daSuit)" />
        {/* White shirt collar */}
        <path d="M40 62 L50 72 L60 62" fill="url(#daShirt)" />
        {/* Tie - split color (represents duality) */}
        <rect x="48" y="68" width="4" height="30" rx="1" fill="#0F172A" />
        <rect x="48" y="68" width="2" height="30" rx="1" fill="#DC2626" />
        {/* Suit lapels */}
        <path d="M28 62 L40 62 L36 85 L28 80 Z" fill="#334155" />
        <path d="M72 62 L60 62 L64 85 L72 80 Z" fill="#334155" />
        {/* Pocket square */}
        <rect x="60" y="72" width="6" height="8" rx="1" fill="#F5F5F4" />
        {/* Belt */}
        <rect x="28" y="118" width="44" height="4" rx="1" fill="#374151" />
        <rect x="47" y="116" width="6" height="8" rx="2" fill="#9CA3AF" />

        {/* Arms */}
        <rect x="16" y="65" width="14" height="40" rx="5" fill="url(#daSuit)" />
        <rect x="70" y="65" width="14" height="40" rx="5" fill="url(#daSuit)" />

        {/* Hidden blade / silenced pistol */}
        {isAttacking ? (
          <motion.g animate={{ rotate: [0, -20, 0] }} transition={{ duration: 0.2 }}>
            <rect x="5" y="98" width="18" height="4" rx="2" fill="#6B7280" />
            <rect x="2" y="96" width="5" height="8" rx="1" fill="#4B5563" />
            <circle cx="1" cy="100" r="3" fill="#FDE047" opacity="0.6" />
          </motion.g>
        ) : (
          <rect x="10" y="104" width="14" height="3" rx="1" fill="#6B7280" opacity="0.5" transform="rotate(-15, 17, 106)" />
        )}

        {/* Gloved hands */}
        <circle cx="22" cy="108" r="5" fill="#1F2937" />
        <circle cx="78" cy="108" r="5" fill="#1F2937" />

        {/* Head */}
        <circle cx="50" cy="45" r="18" fill="#C4A882" />
        {/* Slicked back hair */}
        <path d="M32 42 Q32 22 50 16 Q68 22 68 42 L68 35 Q68 20 50 12 Q32 20 32 35 Z" fill="#292524" />
        {/* Scar across eye */}
        <line x1="36" y1="36" x2="48" y2="44" stroke="#B8917A" strokeWidth="1.5" />

        {/* Eyes - one normal, one cold */}
        <ellipse cx="42" cy="42" rx="3.5" ry="2.5" fill="white" />
        <ellipse cx="58" cy="42" rx="3.5" ry="2.5" fill="white" />
        <circle cx="42" cy="42" r="1.5" fill="#1F2937" />
        <circle cx="58" cy="42" r="1.5" fill="#3B82F6" />

        {/* Smirk */}
        <path d="M43 54 Q50 58 58 53" fill="none" stroke="#78716C" strokeWidth="1.2" />

        {/* Earpiece */}
        <rect x="67" y="40" width="4" height="7" rx="2" fill="#374151" />
        <motion.circle cx="69" cy="40" r="1.5" fill="#EF4444" opacity="0.6"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Shadow aura for boss feel */}
        <motion.ellipse cx="50" cy="90" rx="45" ry="80" fill="none"
          stroke="#EF4444" strokeWidth="0.5" opacity="0.2"
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

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