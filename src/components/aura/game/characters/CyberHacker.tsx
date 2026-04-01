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
      style={{ width, height, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -5, 5, -3, 0] } : isAttacking ? { scale: [1, 1.05, 1] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <ellipse cx="50" cy="175" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs - slim dark pants */}
        <rect x="36" y="118" width="11" height="45" rx="4" fill="#0F172A" />
        <rect x="53" y="118" width="11" height="45" rx="4" fill="#0F172A" />
        {/* Sleek shoes */}
        <rect x="34" y="158" width="15" height="12" rx="4" fill="#1E293B" />
        <rect x="51" y="158" width="15" height="12" rx="4" fill="#1E293B" />
        
        {/* Body - tech jacket */}
        <rect x="28" y="60" width="44" height="62" rx="6" fill="#0E7490" />
        {/* Circuit pattern lines */}
        <line x1="35" y1="70" x2="35" y2="100" stroke="#22D3EE" strokeWidth="0.5" opacity="0.6" />
        <line x1="65" y1="70" x2="65" y2="100" stroke="#22D3EE" strokeWidth="0.5" opacity="0.6" />
        <line x1="35" y1="85" x2="65" y2="85" stroke="#22D3EE" strokeWidth="0.5" opacity="0.6" />
        {/* Glowing chest piece */}
        <rect x="42" y="72" width="16" height="16" rx="3" fill="#164E63" />
        <motion.rect
          x="44" y="74" width="12" height="12" rx="2" fill="#06B6D4"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Arms */}
        <rect x="18" y="65" width="12" height="35" rx="5" fill="#0E7490" />
        <rect x="70" y="65" width="12" height="35" rx="5" fill="#0E7490" />
        
        {/* Holographic display from left hand */}
        {isAttacking ? (
          <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.3, repeat: 3 }}>
            <rect x="2" y="75" width="20" height="25" rx="2" fill="#22D3EE" opacity="0.3" />
            <text x="5" y="85" fill="#22D3EE" fontSize="4" fontFamily="monospace">{'>>>'}</text>
            <text x="5" y="92" fill="#22D3EE" fontSize="3" fontFamily="monospace">HACK</text>
            {/* EMP burst */}
            <motion.circle cx="50" cy="90" r="30" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.5"
              animate={{ r: [20, 60], opacity: [0.8, 0] }}
              transition={{ duration: 0.5 }}
            />
          </motion.g>
        ) : (
          <g>
            <rect x="5" y="80" width="16" height="18" rx="2" fill="#22D3EE" opacity="0.2" />
            <text x="7" y="90" fill="#22D3EE" fontSize="3" fontFamily="monospace" opacity="0.5">{'{ }'}</text>
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
        {/* Visor line */}
        <line x1="50" y1="38" x2="50" y2="46" stroke="#0E7490" strokeWidth="1" />
        
        {/* Mouth - slight smirk */}
        <path d="M43 55 Q50 58 57 55" fill="none" stroke="#78716C" strokeWidth="1" />
        
        {isHit && <rect x="0" y="0" width="100" height="180" fill="rgba(255,255,255,0.4)" rx="10" />}
      </svg>

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
