import { motion } from 'framer-motion';

export type LavaHoundState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface LavaHoundProps {
  state: LavaHoundState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const LavaHound = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: LavaHoundProps) => {
  const { width, height } = sizeConfig[size];
  const isDefeated = state === 'defeated';

  return (
    <motion.div className="relative" animate={isDefeated ? { opacity: 0, y: 20 } : state === 'hit' ? { x: [0, -4, 4, 0] } : state === 'attacking' ? { x: [0, 15, 0] } : {}} transition={{ duration: 0.3 }}>
      <svg width={width} height={height} viewBox="0 0 120 150">
        <defs>
          <linearGradient id="lavaHoundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C2D12" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        {/* Body */}
        <ellipse cx="60" cy="95" rx="35" ry="25" fill="url(#lavaHoundGrad)" />
        {/* Head */}
        <circle cx="85" cy="75" r="18" fill="url(#lavaHoundGrad)" />
        {/* Ears */}
        <polygon points="78,60 75,45 82,55" fill="#991B1B" />
        <polygon points="92,60 95,45 88,55" fill="#991B1B" />
        {/* Eyes */}
        <motion.circle cx="81" cy="72" r="3" fill="#FCD34D" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="91" cy="72" r="3" fill="#FCD34D" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        {/* Snout */}
        <ellipse cx="90" cy="80" rx="6" ry="4" fill="#B91C1C" />
        {/* Legs */}
        <rect x="35" y="110" width="8" height="20" rx="3" fill="url(#lavaHoundGrad)" />
        <rect x="50" y="112" width="8" height="18" rx="3" fill="url(#lavaHoundGrad)" />
        <rect x="65" y="112" width="8" height="18" rx="3" fill="url(#lavaHoundGrad)" />
        <rect x="78" y="110" width="8" height="20" rx="3" fill="url(#lavaHoundGrad)" />
        {/* Tail - flame */}
        <motion.path d="M25 90 Q15 85 20 75 Q25 80 22 88" fill="#F97316"
          animate={{ d: ['M25 90 Q15 85 20 75 Q25 80 22 88', 'M25 90 Q12 82 18 72 Q23 78 22 88'] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }} />
        {/* Lava cracks */}
        <motion.line x1="45" y1="90" x2="55" y2="85" stroke="#F97316" strokeWidth="1.5" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.line x1="60" y1="100" x2="75" y2="95" stroke="#F97316" strokeWidth="1.5" opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
