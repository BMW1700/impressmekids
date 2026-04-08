import { motion } from 'framer-motion';

export type StarSpriteState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface StarSpriteProps {
  state: StarSpriteState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const StarSprite = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: StarSpriteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, scale: 0 } : state === 'hit' ? { rotate: [0, 15, -15, 0] } : state === 'attacking' ? { y: [0, -15, 0] } : { y: [0, -5, 0] }} transition={state === 'idle' ? { duration: 2, repeat: Infinity } : { duration: 0.3 }}>
      <svg width={width} height={height} viewBox="0 0 120 150">
        <defs>
          <radialGradient id="starGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
        {/* Star body */}
        <motion.polygon points="60,20 68,50 100,55 75,75 82,105 60,88 38,105 45,75 20,55 52,50"
          fill="url(#starGrad)"
          animate={{ filter: ['drop-shadow(0 0 4px #FCD34D)', 'drop-shadow(0 0 10px #FCD34D)', 'drop-shadow(0 0 4px #FCD34D)'] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
        {/* Face */}
        <circle cx="52" cy="60" r="3" fill="#1E293B" />
        <circle cx="68" cy="60" r="3" fill="#1E293B" />
        <path d="M55 70 Q60 75 65 70" stroke="#1E293B" strokeWidth="1.5" fill="none" />
        {/* Sparkle trail */}
        <motion.circle cx="30" cy="110" r="2" fill="#FDE68A" animate={{ opacity: [0, 1, 0], y: [0, -10] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="45" cy="120" r="1.5" fill="#FDE68A" animate={{ opacity: [0, 1, 0], y: [0, -8] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
        <motion.circle cx="75" cy="115" r="2" fill="#FDE68A" animate={{ opacity: [0, 1, 0], y: [0, -12] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
        <motion.circle cx="90" cy="108" r="1.5" fill="#FDE68A" animate={{ opacity: [0, 1, 0], y: [0, -8] }} transition={{ duration: 1, repeat: Infinity, delay: 0.9 }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
