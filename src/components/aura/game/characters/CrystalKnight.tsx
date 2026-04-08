import { motion } from 'framer-motion';

export type CrystalKnightState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface CrystalKnightProps {
  state: CrystalKnightState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const CrystalKnight = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: CrystalKnightProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, y: 20 } : state === 'hit' ? { x: [0, -5, 5, 0] } : state === 'attacking' ? { x: [0, 10, 0] } : {}} transition={{ duration: 0.4 }}>
      <svg width={width} height={height} viewBox="0 0 120 150">
        <defs>
          <linearGradient id="crystalKnightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#E879F9" />
          </linearGradient>
        </defs>
        {/* Body armor */}
        <path d="M40 50 L35 110 L85 110 L80 50" fill="url(#crystalKnightGrad)" opacity="0.9" />
        {/* Helmet */}
        <path d="M45 55 L60 25 L75 55" fill="url(#crystalKnightGrad)" />
        <rect x="42" y="45" width="36" height="15" rx="3" fill="url(#crystalKnightGrad)" />
        {/* Visor */}
        <rect x="48" y="48" width="24" height="6" rx="2" fill="#1E293B" opacity="0.8" />
        <motion.rect x="48" y="48" width="24" height="6" rx="2" fill="#A78BFA" opacity="0.3"
          animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Crystal shoulder pads */}
        <motion.polygon points="35,55 20,50 30,65" fill="#C4B5FD" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.polygon points="85,55 100,50 90,65" fill="#C4B5FD" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        {/* Arms */}
        <rect x="20" y="55" width="12" height="35" rx="4" fill="url(#crystalKnightGrad)" />
        <rect x="88" y="55" width="12" height="35" rx="4" fill="url(#crystalKnightGrad)" />
        {/* Crystal sword */}
        <motion.rect x="98" y="40" width="4" height="50" rx="1" fill="#E879F9"
          animate={{ filter: ['drop-shadow(0 0 2px #E879F9)', 'drop-shadow(0 0 6px #E879F9)', 'drop-shadow(0 0 2px #E879F9)'] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
        <polygon points="98,40 100,30 104,40" fill="#F0ABFC" />
        {/* Legs */}
        <rect x="42" y="110" width="14" height="25" rx="4" fill="url(#crystalKnightGrad)" />
        <rect x="64" y="110" width="14" height="25" rx="4" fill="url(#crystalKnightGrad)" />
        {/* Crystal gems on armor */}
        <motion.circle cx="60" cy="75" r="4" fill="#F0ABFC" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
