import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type CyberHackerState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface CyberHackerProps {
  state: CyberHackerState;
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

export const CyberHacker = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: CyberHackerProps) => {
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
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -5, 5, -3, 0] } : isAttacking ? { scale: [1, 1.05, 1] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs>
          <linearGradient id="cyberJacket" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#155E75" />
            <stop offset="100%" stopColor="#083344" />
          </linearGradient>
          <filter id="cyberGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <ellipse cx="50" cy="175" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs */}
        <rect x="36" y="118" width="11" height="45" rx="4" fill="#0F172A" />
        <rect x="53" y="118" width="11" height="45" rx="4" fill="#0F172A" />
        <rect x="34" y="158" width="15" height="12" rx="4" fill="#1E293B" />
        <rect x="51" y="158" width="15" height="12" rx="4" fill="#1E293B" />
        
        {/* Body */}
        <rect x="28" y="60" width="44" height="62" rx="6" fill="url(#cyberJacket)" />
        {/* Circuit lines */}
        <motion.line x1="35" y1="70" x2="35" y2="100" stroke="#22D3EE" strokeWidth="0.8" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.line x1="65" y1="70" x2="65" y2="100" stroke="#22D3EE" strokeWidth="0.8" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <line x1="35" y1="85" x2="65" y2="85" stroke="#22D3EE" strokeWidth="0.5" opacity="0.4" />
        {/* Glowing chest piece */}
        <rect x="42" y="72" width="16" height="16" rx="3" fill="#164E63" />
        <motion.rect
          x="44" y="74" width="12" height="12" rx="2" fill="#06B6D4"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          filter="url(#cyberGlow)"
        />
        
        {/* Arms */}
        <rect x="18" y="65" width="12" height="35" rx="5" fill="url(#cyberJacket)" />
        <rect x="70" y="65" width="12" height="35" rx="5" fill="url(#cyberJacket)" />
        
        {/* Holographic display */}
        {isAttacking ? (
          <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.3, repeat: 3 }}>
            <rect x="2" y="75" width="20" height="25" rx="2" fill="#22D3EE" opacity="0.3" />
            <text x="5" y="85" fill="#22D3EE" fontSize="4" fontFamily="monospace">{'>>>'}</text>
            <text x="5" y="92" fill="#22D3EE" fontSize="3" fontFamily="monospace">HACK</text>
            <motion.circle cx="50" cy="90" r="30" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.5"
              animate={{ r: [20, 60], opacity: [0.8, 0] }}
              transition={{ duration: 0.5 }}
            />
          </motion.g>
        ) : (
          <g>
            <rect x="5" y="80" width="16" height="18" rx="2" fill="#22D3EE" opacity="0.15" />
            <text x="7" y="90" fill="#22D3EE" fontSize="3" fontFamily="monospace" opacity="0.4">{'{ }'}</text>
          </g>
        )}
        
        {/* Hands */}
        <circle cx="24" cy="102" r="4" fill="#C4A882" />
        <circle cx="76" cy="102" r="4" fill="#C4A882" />
        
        {/* Head */}
        <circle cx="50" cy="45" r="20" fill="#C4A882" />
        {/* Spiky hair */}
        <path d="M32 35 L38 15 L42 30 L48 10 L52 28 L58 12 L62 30 L68 18 L68 35" fill="#0891B2" />
        
        {/* VR visor */}
        <rect x="30" y="36" width="40" height="12" rx="4" fill="#164E63" />
        <motion.rect
          x="32" y="38" width="36" height="8" rx="3" fill="#22D3EE"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <line x1="50" y1="38" x2="50" y2="46" stroke="#0E7490" strokeWidth="1" />
        
        {/* Mouth */}
        <path d="M43 55 Q50 58 57 55" fill="none" stroke="#78716C" strokeWidth="1" />
        
        {isHit && <rect x="0" y="0" width="100" height="180" fill="rgba(255,255,255,0.4)" rx="10" />}
      </svg>

      {/* Health bar */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[85%]" style={{ transform: flipX ? 'scaleX(-1)' : undefined }}>
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-cyan-800">
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
          <p className="text-[8px] text-center text-cyan-400 mt-0.5">{currentHp}/{maxHp}</p>
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
