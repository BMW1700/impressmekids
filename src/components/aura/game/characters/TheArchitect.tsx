import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheArchitectState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface TheArchitectProps {
  state: TheArchitectState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 70, height: 120 },
  medium: { width: 100, height: 170 },
  large: { width: 130, height: 220 },
};

export const TheArchitect = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'medium', flipX = false }: TheArchitectProps) => {
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
        isDefeated ? { opacity: 0, y: 20, scale: 0.8 } :
        isHit ? { x: [0, -5, 5, -3, 0], filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'] } :
        isAttacking ? { scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] } :
        { y: [0, -3, 0] }
      }
      transition={
        isDefeated ? { duration: 1.5 } :
        isHit ? { duration: 0.3 } :
        isAttacking ? { duration: 0.5 } :
        { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 120 200" width={width} height={height}>
        <defs>
          <linearGradient id="architectBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="holoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
          </linearGradient>
          <filter id="archGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <ellipse cx="60" cy="195" rx="28" ry="5" fill="rgba(79,70,229,0.2)" />

        {/* Holographic orbit rings */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '60px 100px' }}
        >
          <ellipse cx="60" cy="100" rx="50" ry="15" fill="none" stroke="#818CF8" strokeWidth="0.8" opacity="0.4" />
          <circle cx="110" cy="100" r="3" fill="#818CF8" opacity="0.6" />
          <circle cx="10" cy="100" r="2" fill="#60A5FA" opacity="0.5" />
        </motion.g>
        <motion.g
          animate={{ rotate: [90, 450] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '60px 90px' }}
        >
          <ellipse cx="60" cy="90" rx="45" ry="12" fill="none" stroke="#60A5FA" strokeWidth="0.6" opacity="0.3" transform="rotate(30, 60, 90)" />
        </motion.g>

        {/* Legs */}
        <rect x="42" y="140" width="13" height="45" rx="4" fill="#1E1B4B" />
        <rect x="65" y="140" width="13" height="45" rx="4" fill="#1E1B4B" />
        {/* Sleek shoes */}
        <rect x="40" y="178" width="17" height="12" rx="3" fill="#111827" />
        <rect x="63" y="178" width="17" height="12" rx="3" fill="#111827" />

        {/* Long coat/robe */}
        <path d="M30 70 L30 165 L42 170 L42 140 L78 140 L78 170 L90 165 L90 70 Z" fill="url(#architectBody)" />
        {/* Coat glow edges */}
        <path d="M30 70 L30 165" fill="none" stroke="#818CF8" strokeWidth="0.5" opacity="0.5" />
        <path d="M90 70 L90 165" fill="none" stroke="#818CF8" strokeWidth="0.5" opacity="0.5" />
        
        {/* Chest plate - tech armor */}
        <rect x="40" y="72" width="40" height="35" rx="5" fill="#312E81" stroke="#6366F1" strokeWidth="0.8" />
        <line x1="60" y1="72" x2="60" y2="107" stroke="#4F46E5" strokeWidth="0.8" />
        {/* Circuit patterns */}
        <path d="M45 82 L55 82 L55 92 L50 92" fill="none" stroke="#818CF8" strokeWidth="0.5" opacity="0.6" />
        <path d="M75 82 L65 82 L65 92 L70 92" fill="none" stroke="#818CF8" strokeWidth="0.5" opacity="0.6" />
        {/* Core glow */}
        <circle cx="60" cy="90" r="4" fill="#6366F1" opacity="0.5" filter="url(#archGlow)" />
        <circle cx="60" cy="90" r="2" fill="#A5B4FC" opacity="0.8" />

        {/* Arms */}
        <rect x="18" y="72" width="14" height="40" rx="6" fill="url(#architectBody)" />
        <rect x="88" y="72" width="14" height="40" rx="6" fill="url(#architectBody)" />
        
        {/* Floating holographic displays from hands */}
        {isAttacking ? (
          <motion.g animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 0.4 }}>
            <rect x="2" y="95" width="20" height="15" rx="2" fill="url(#holoGlow)" stroke="#818CF8" strokeWidth="0.5" />
            <rect x="98" y="95" width="20" height="15" rx="2" fill="url(#holoGlow)" stroke="#818CF8" strokeWidth="0.5" />
            {/* Data lines */}
            <line x1="5" y1="100" x2="18" y2="100" stroke="#A5B4FC" strokeWidth="0.5" />
            <line x1="5" y1="103" x2="15" y2="103" stroke="#A5B4FC" strokeWidth="0.5" />
            <line x1="101" y1="100" x2="114" y2="100" stroke="#A5B4FC" strokeWidth="0.5" />
            <line x1="101" y1="103" x2="111" y2="103" stroke="#A5B4FC" strokeWidth="0.5" />
          </motion.g>
        ) : (
          <g opacity="0.5">
            <rect x="5" y="100" width="15" height="10" rx="2" fill="url(#holoGlow)" />
            <rect x="100" y="100" width="15" height="10" rx="2" fill="url(#holoGlow)" />
          </g>
        )}
        
        {/* Hands with tech gloves */}
        <circle cx="25" cy="114" r="5" fill="#312E81" />
        <circle cx="25" cy="114" r="2" fill="#818CF8" opacity="0.4" />
        <circle cx="95" cy="114" r="5" fill="#312E81" />
        <circle cx="95" cy="114" r="2" fill="#818CF8" opacity="0.4" />

        {/* Head */}
        <circle cx="60" cy="52" r="20" fill="#D4C5A9" />
        
        {/* Slicked back silver hair */}
        <path d="M40 52 Q40 30 60 24 Q80 30 80 52 L80 40 Q80 26 60 19 Q40 26 40 40 Z" fill="#9CA3AF" />
        
        {/* VR visor / data glasses */}
        <rect x="38" y="42" width="44" height="12" rx="4" fill="#1E1B4B" stroke="#6366F1" strokeWidth="0.8" />
        <rect x="40" y="44" width="16" height="8" rx="2" fill="#312E81" />
        <rect x="64" y="44" width="16" height="8" rx="2" fill="#312E81" />
        {/* Scrolling data in visor */}
        <motion.g animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
          <line x1="42" y1="46" x2="52" y2="46" stroke="#818CF8" strokeWidth="0.5" />
          <line x1="42" y1="48" x2="48" y2="48" stroke="#60A5FA" strokeWidth="0.5" />
          <line x1="42" y1="50" x2="54" y2="50" stroke="#818CF8" strokeWidth="0.5" />
          <line x1="66" y1="46" x2="76" y2="46" stroke="#818CF8" strokeWidth="0.5" />
          <line x1="66" y1="48" x2="72" y2="48" stroke="#60A5FA" strokeWidth="0.5" />
        </motion.g>
        
        {/* Thin mouth - calculating */}
        <line x1="52" y1="60" x2="68" y2="60" stroke="#8B7355" strokeWidth="1" />
        
        {/* Chin */}
        <path d="M45 62 Q60 68 75 62" fill="#D4C5A9" />

        {isHit && <rect x="0" y="0" width="120" height="200" fill="rgba(255,255,255,0.35)" rx="10" />}
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
