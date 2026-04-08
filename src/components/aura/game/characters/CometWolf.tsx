import { motion } from 'framer-motion';

export type CometWolfState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface CometWolfProps {
  state: CometWolfState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const CometWolf = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: CometWolfProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, y: 30 } : state === 'hit' ? { x: [0, -6, 6, 0] } : state === 'attacking' ? { x: [0, 20, 0] } : {}} transition={{ duration: 0.4 }}>
      <svg width={width} height={height} viewBox="0 0 130 150">
        <defs>
          <linearGradient id="cometWolfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="50%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        {/* Body */}
        <ellipse cx="65" cy="90" rx="38" ry="22" fill="url(#cometWolfGrad)" />
        {/* Head */}
        <ellipse cx="95" cy="65" rx="20" ry="18" fill="url(#cometWolfGrad)" />
        {/* Ears */}
        <polygon points="85,50 80,30 90,45" fill="#4338CA" />
        <polygon points="100,48 105,28 108,45" fill="#4338CA" />
        {/* Eyes */}
        <motion.circle cx="90" cy="62" r="3" fill="#FDE68A" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="102" cy="62" r="3" fill="#FDE68A" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        <circle cx="90" cy="62" r="1.5" fill="#1E293B" />
        <circle cx="102" cy="62" r="1.5" fill="#1E293B" />
        {/* Snout */}
        <ellipse cx="108" cy="72" rx="7" ry="5" fill="#4338CA" />
        <circle cx="108" cy="70" r="2" fill="#1E293B" />
        {/* Legs */}
        <rect x="38" y="105" width="8" height="22" rx="3" fill="url(#cometWolfGrad)" />
        <rect x="52" y="107" width="8" height="20" rx="3" fill="url(#cometWolfGrad)" />
        <rect x="72" y="107" width="8" height="20" rx="3" fill="url(#cometWolfGrad)" />
        <rect x="86" y="105" width="8" height="22" rx="3" fill="url(#cometWolfGrad)" />
        {/* Comet tail */}
        <motion.path d="M27 90 Q10 85 5 75 Q8 80 15 78 Q12 88 27 90" fill="#A78BFA" opacity="0.7"
          animate={{ opacity: [0.4, 0.8, 0.4], d: ['M27 90 Q10 85 5 75 Q8 80 15 78 Q12 88 27 90', 'M27 90 Q8 82 2 72 Q5 78 12 76 Q10 86 27 90'] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }} />
        <motion.circle cx="8" cy="75" r="2" fill="#DDD6FE" animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 0.8, repeat: Infinity }} />
        {/* Star markings */}
        <motion.circle cx="55" cy="85" r="2" fill="#FDE68A" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="75" cy="82" r="1.5" fill="#FDE68A" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
