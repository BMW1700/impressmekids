import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type EnforcerState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface EnforcerProps {
  state: EnforcerState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 70, height: 120 },
  medium: { width: 95, height: 165 },
  large: { width: 120, height: 210 },
};

export const Enforcer = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: EnforcerProps) => {
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
        isDefeated ? { opacity: 0, y: 20, rotate: 5 } :
        isHit ? { x: [0, -5, 5, -3, 0] } :
        isAttacking ? { x: [0, -35, 10, 0], scale: [1, 1.08, 1] } :
        { y: [0, -2, 0] }
      }
      transition={
        isDefeated ? { duration: 1 } :
        isHit ? { duration: 0.3 } :
        isAttacking ? { duration: 0.4 } :
        { duration: 2, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 110 190" width={width} height={height}>
        <defs>
          <linearGradient id="enfArmor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="enfVisor" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <ellipse cx="55" cy="185" rx="30" ry="5" fill="rgba(0,0,0,0.3)" />

        {/* Legs - heavy armor */}
        <rect x="35" y="130" width="16" height="42" rx="5" fill="#1E293B" />
        <rect x="59" y="130" width="16" height="42" rx="5" fill="#1E293B" />
        {/* Shin guards */}
        <rect x="36" y="142" width="14" height="18" rx="3" fill="#334155" />
        <rect x="60" y="142" width="14" height="18" rx="3" fill="#334155" />
        {/* Heavy boots */}
        <rect x="32" y="165" width="22" height="16" rx="4" fill="#0F172A" />
        <rect x="56" y="165" width="22" height="16" rx="4" fill="#0F172A" />
        <rect x="32" y="165" width="22" height="5" rx="2" fill="#1E293B" />
        <rect x="56" y="165" width="22" height="5" rx="2" fill="#1E293B" />

        {/* Body - heavy body armor */}
        <rect x="25" y="65" width="60" height="68" rx="8" fill="url(#enfArmor)" />
        {/* Chest plate */}
        <rect x="30" y="70" width="50" height="35" rx="5" fill="#334155" opacity="0.7" />
        {/* Chest emblem */}
        <circle cx="55" cy="85" r="8" fill="#0F172A" stroke="#EF4444" strokeWidth="1.5" />
        <path d="M51 85 L55 78 L59 85 L55 92 Z" fill="#EF4444" opacity="0.6" />
        {/* Armor plates */}
        <rect x="28" y="108" width="54" height="8" rx="2" fill="#475569" />
        <rect x="28" y="118" width="54" height="5" rx="1" fill="#64748B" />

        {/* Arms - massive */}
        <rect x="12" y="68" width="16" height="45" rx="6" fill="url(#enfArmor)" />
        <rect x="82" y="68" width="16" height="45" rx="6" fill="url(#enfArmor)" />
        {/* Shoulder pads - large */}
        <rect x="10" y="62" width="20" height="12" rx="4" fill="#334155" />
        <rect x="80" y="62" width="20" height="12" rx="4" fill="#334155" />
        <rect x="12" y="64" width="16" height="3" rx="1" fill="#EF4444" opacity="0.4" />
        <rect x="82" y="64" width="16" height="3" rx="1" fill="#EF4444" opacity="0.4" />

        {/* Minigun */}
        {isAttacking ? (
          <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.1, repeat: 3 }}>
            <rect x="90" y="88" width="28" height="8" rx="3" fill="#4B5563" />
            <rect x="88" y="85" width="6" height="14" rx="2" fill="#374151" />
            <circle cx="120" cy="92" r="6" fill="#FDE047" opacity="0.9" />
            <circle cx="120" cy="92" r="3" fill="white" opacity="0.6" />
          </motion.g>
        ) : (
          <g>
            <rect x="92" y="95" width="22" height="6" rx="2" fill="#4B5563" transform="rotate(8, 103, 98)" />
            <rect x="88" y="92" width="6" height="12" rx="2" fill="#374151" />
          </g>
        )}

        {/* Fists */}
        <circle cx="20" cy="116" r="7" fill="#1E293B" />
        <circle cx="90" cy="116" r="7" fill="#1E293B" />

        {/* Head - helmeted */}
        <circle cx="55" cy="48" r="20" fill="#1E293B" />
        {/* Helmet details */}
        <path d="M35 48 Q35 25 55 18 Q75 25 75 48 L75 40 Q75 22 55 14 Q35 22 35 40 Z" fill="#0F172A" />
        {/* Full face visor */}
        <rect x="38" y="38" width="34" height="14" rx="4" fill="url(#enfVisor)" />
        <motion.rect x="38" y="38" width="34" height="14" rx="4"
          fill="white" opacity={0.2}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Chin guard */}
        <rect x="42" y="52" width="26" height="8" rx="3" fill="#0F172A" />
        {/* Breathing vents */}
        <rect x="47" y="54" width="3" height="4" rx="1" fill="#334155" />
        <rect x="52" y="54" width="3" height="4" rx="1" fill="#334155" />
        <rect x="57" y="54" width="3" height="4" rx="1" fill="#334155" />

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