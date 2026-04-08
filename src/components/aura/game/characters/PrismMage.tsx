import { motion } from 'framer-motion';

export type PrismMageState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface PrismMageProps {
  state: PrismMageState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const PrismMage = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: PrismMageProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, scale: 0 } : state === 'hit' ? { x: [0, -5, 5, 0] } : state === 'attacking' ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.4 }}>
      <svg width={width} height={height} viewBox="0 0 120 150">
        <defs>
          <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#E879F9" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>
        {/* Robe */}
        <path d="M45 55 L30 135 L90 135 L75 55" fill="url(#prismGrad)" opacity="0.85" />
        {/* Head */}
        <circle cx="60" cy="40" r="18" fill="#DDD6FE" />
        {/* Hat */}
        <path d="M40 42 L60 5 L80 42" fill="url(#prismGrad)" />
        <motion.circle cx="60" cy="15" r="4" fill="#FCD34D" animate={{ opacity: [0.5, 1, 0.5], filter: ['drop-shadow(0 0 2px #FCD34D)', 'drop-shadow(0 0 8px #FCD34D)', 'drop-shadow(0 0 2px #FCD34D)'] }} transition={{ duration: 1.5, repeat: Infinity }} />
        {/* Eyes */}
        <circle cx="53" cy="38" r="3" fill="#7C3AED" />
        <circle cx="67" cy="38" r="3" fill="#7C3AED" />
        <circle cx="53" cy="38" r="1.5" fill="#1E293B" />
        <circle cx="67" cy="38" r="1.5" fill="#1E293B" />
        {/* Staff */}
        <rect x="85" y="30" width="3" height="100" rx="1" fill="#92400E" />
        <motion.polygon points="82,30 87,15 92,30" fill="#E879F9"
          animate={{ filter: ['drop-shadow(0 0 3px #E879F9)', 'drop-shadow(0 0 10px #E879F9)', 'drop-shadow(0 0 3px #E879F9)'] }}
          transition={{ duration: 2, repeat: Infinity }} />
        {/* Floating crystals */}
        <motion.polygon points="30,70 35,60 40,70 35,72" fill="#C4B5FD" animate={{ y: [0, -5, 0], rotate: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.polygon points="20,90 25,82 30,90 25,92" fill="#F0ABFC" animate={{ y: [0, -3, 0], rotate: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
        {/* Robe gems */}
        <motion.circle cx="60" cy="80" r="3" fill="#FCD34D" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-pink-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
