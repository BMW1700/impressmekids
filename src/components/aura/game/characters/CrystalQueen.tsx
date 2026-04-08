import { motion } from 'framer-motion';

export type CrystalQueenState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface CrystalQueenProps {
  state: CrystalQueenState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const CrystalQueen = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: CrystalQueenProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, scale: 0, rotate: 90 } : state === 'hit' ? { x: [0, -6, 6, 0] } : state === 'attacking' ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.5 }}>
      <svg width={width} height={height} viewBox="0 0 140 180">
        <defs>
          <linearGradient id="crystalQueenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#E879F9" />
            <stop offset="100%" stopColor="#F0ABFC" />
          </linearGradient>
        </defs>
        {/* Gown */}
        <path d="M50 65 L25 160 L115 160 L90 65" fill="url(#crystalQueenGrad)" opacity="0.9" />
        {/* Torso */}
        <rect x="48" y="55" width="44" height="25" rx="6" fill="url(#crystalQueenGrad)" />
        {/* Head */}
        <circle cx="70" cy="40" r="20" fill="#EDE9FE" />
        {/* Crown */}
        <path d="M52 30 L55 10 L62 22 L70 5 L78 22 L85 10 L88 30" fill="#FCD34D" />
        <motion.circle cx="70" cy="12" r="3" fill="#F472B6" animate={{ opacity: [0.5, 1, 0.5], filter: ['drop-shadow(0 0 2px #F472B6)', 'drop-shadow(0 0 8px #F472B6)', 'drop-shadow(0 0 2px #F472B6)'] }} transition={{ duration: 1.5, repeat: Infinity }} />
        {/* Eyes */}
        <circle cx="63" cy="38" r="3" fill="#7C3AED" />
        <circle cx="77" cy="38" r="3" fill="#7C3AED" />
        <circle cx="63" cy="38" r="1.5" fill="#1E293B" />
        <circle cx="77" cy="38" r="1.5" fill="#1E293B" />
        {/* Mouth */}
        <path d="M65 48 Q70 52 75 48" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
        {/* Arms */}
        <rect x="28" y="60" width="12" height="35" rx="5" fill="url(#crystalQueenGrad)" />
        <rect x="100" y="60" width="12" height="35" rx="5" fill="url(#crystalQueenGrad)" />
        {/* Crystal scepter */}
        <rect x="108" y="50" width="3" height="50" rx="1" fill="#D4D4D8" />
        <motion.polygon points="105,50 110,35 115,50" fill="#E879F9"
          animate={{ filter: ['drop-shadow(0 0 3px #E879F9)', 'drop-shadow(0 0 12px #E879F9)', 'drop-shadow(0 0 3px #E879F9)'] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
        {/* Floating crystal shards */}
        <motion.polygon points="25,80 30,72 35,80 30,83" fill="#C4B5FD" animate={{ y: [0, -8, 0], rotate: [0, 20, 0] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.polygon points="105,85 110,78 115,85 110,88" fill="#F0ABFC" animate={{ y: [0, -6, 0], rotate: [0, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }} />
        <motion.polygon points="40,120 44,114 48,120 44,123" fill="#DDD6FE" animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
        {/* Gown gems */}
        <motion.circle cx="70" cy="100" r="4" fill="#FCD34D" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="55" cy="130" r="3" fill="#E879F9" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
        <motion.circle cx="85" cy="125" r="3" fill="#C084FC" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
