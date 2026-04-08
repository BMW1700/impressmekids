import { motion } from 'framer-motion';

export type FireElementalState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface FireElementalProps {
  state: FireElementalState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = {
  small: { width: 80, height: 100 },
  medium: { width: 120, height: 150 },
  large: { width: 160, height: 200 },
};

export const FireElemental = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: FireElementalProps) => {
  const { width, height } = sizeConfig[size];
  const isDefeated = state === 'defeated';

  return (
    <motion.div className="relative" animate={isDefeated ? { opacity: 0, scale: 0 } : state === 'hit' ? { x: [0, -5, 5, 0] } : state === 'attacking' ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.4 }}>
      <svg width={width} height={height} viewBox="0 0 120 150">
        <defs>
          <linearGradient id="fireGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="50%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>
          <filter id="fireGlow"><feGaussianBlur stdDeviation="3" /><feComposite in="SourceGraphic" /></filter>
        </defs>
        {/* Body - flame shape */}
        <motion.path d="M60 20 Q80 40 75 70 Q85 60 80 90 Q90 80 85 110 Q75 130 60 135 Q45 130 35 110 Q30 80 40 90 Q35 60 45 70 Q40 40 60 20" fill="url(#fireGrad)" filter="url(#fireGlow)"
          animate={{ d: ['M60 20 Q80 40 75 70 Q85 60 80 90 Q90 80 85 110 Q75 130 60 135 Q45 130 35 110 Q30 80 40 90 Q35 60 45 70 Q40 40 60 20', 'M60 15 Q82 38 77 68 Q87 58 82 88 Q92 78 87 108 Q77 128 60 133 Q43 128 33 108 Q28 78 38 88 Q33 58 43 68 Q38 38 60 15'] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }} />
        {/* Eyes */}
        <motion.circle cx="50" cy="70" r="4" fill="#1E293B" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="70" cy="70" r="4" fill="#1E293B" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
        {/* Mouth */}
        <path d="M52 85 Q60 92 68 85" stroke="#1E293B" strokeWidth="2" fill="none" />
        {/* Inner flames */}
        <motion.ellipse cx="60" cy="100" rx="12" ry="8" fill="#FCD34D" opacity="0.6"
          animate={{ ry: [8, 12, 8], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 0.6, repeat: Infinity }} />
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
