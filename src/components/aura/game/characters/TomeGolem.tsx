import { motion } from 'framer-motion';

export type TomeGolemState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface TomeGolemProps {
  state: TomeGolemState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const TomeGolem = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: TomeGolemProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, y: 20 } : state === 'hit' ? { x: [0, -5, 5, 0] } : state === 'attacking' ? { y: [0, -8, 0] } : {}} transition={{ duration: 0.4 }}>
      <svg width={width} height={height} viewBox="0 0 120 150">
        <defs>
          <linearGradient id="tomeGolemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="50%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>
        </defs>
        {/* Body - stack of books shape */}
        <rect x="30" y="50" width="60" height="80" rx="4" fill="url(#tomeGolemGrad)" />
        {/* Book layers */}
        <rect x="28" y="55" width="64" height="12" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="1" />
        <rect x="32" y="70" width="56" height="12" rx="2" fill="#A16207" stroke="#78350F" strokeWidth="1" />
        <rect x="28" y="85" width="64" height="12" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1" />
        <rect x="32" y="100" width="56" height="12" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="1" />
        {/* Head - open book */}
        <path d="M35 50 L30 25 L60 35 L90 25 L85 50" fill="#D4A574" />
        <line x1="60" y1="35" x2="60" y2="50" stroke="#78350F" strokeWidth="1" />
        {/* Eyes on pages */}
        <motion.circle cx="48" cy="40" r="4" fill="#22C55E" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="72" cy="40" r="4" fill="#22C55E" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        <circle cx="48" cy="40" r="2" fill="#1E293B" />
        <circle cx="72" cy="40" r="2" fill="#1E293B" />
        {/* Arms - rolled scrolls */}
        <rect x="12" y="60" width="14" height="40" rx="6" fill="#D4A574" />
        <rect x="94" y="60" width="14" height="40" rx="6" fill="#D4A574" />
        {/* Fists */}
        <circle cx="19" cy="105" r="8" fill="url(#tomeGolemGrad)" />
        <circle cx="101" cy="105" r="8" fill="url(#tomeGolemGrad)" />
        {/* Legs */}
        <rect x="38" y="128" width="14" height="18" rx="4" fill="url(#tomeGolemGrad)" />
        <rect x="68" y="128" width="14" height="18" rx="4" fill="url(#tomeGolemGrad)" />
        {/* Floating text */}
        <motion.text x="25" y="80" fill="#FDE68A" fontSize="6" opacity="0.5" animate={{ y: [80, 70], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }}>ABC</motion.text>
        <motion.text x="80" y="95" fill="#FDE68A" fontSize="5" opacity="0.5" animate={{ y: [95, 85], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>xyz</motion.text>
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-700 to-yellow-600 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
