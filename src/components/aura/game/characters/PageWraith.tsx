import { motion } from 'framer-motion';

export type PageWraithState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface PageWraithProps {
  state: PageWraithState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const PageWraith = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: PageWraithProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, scale: 0 } : state === 'hit' ? { x: [0, -5, 5, 0] } : state === 'attacking' ? { scale: [1, 1.1, 1] } : { y: [0, -4, 0] }} transition={state === 'idle' ? { duration: 2, repeat: Infinity } : { duration: 0.3 }}>
      <svg width={width} height={height} viewBox="0 0 120 150">
        <defs>
          <linearGradient id="pageWraithGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D6D3D1" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Ghostly page body */}
        <motion.path d="M40 30 Q35 80 30 120 Q45 130 60 125 Q75 130 90 120 Q85 80 80 30 Q60 20 40 30"
          fill="url(#pageWraithGrad)"
          animate={{ d: ['M40 30 Q35 80 30 120 Q45 130 60 125 Q75 130 90 120 Q85 80 80 30 Q60 20 40 30', 'M42 28 Q33 78 28 118 Q43 128 60 123 Q77 128 92 118 Q87 78 82 28 Q60 18 42 28'] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }} />
        {/* Text lines on body */}
        <line x1="48" y1="60" x2="72" y2="60" stroke="#A8A29E" strokeWidth="1" opacity="0.5" />
        <line x1="45" y1="70" x2="75" y2="70" stroke="#A8A29E" strokeWidth="1" opacity="0.4" />
        <line x1="48" y1="80" x2="72" y2="80" stroke="#A8A29E" strokeWidth="1" opacity="0.3" />
        <line x1="50" y1="90" x2="70" y2="90" stroke="#A8A29E" strokeWidth="1" opacity="0.2" />
        {/* Eyes - hollow */}
        <motion.ellipse cx="50" cy="45" rx="5" ry="6" fill="#1E293B"
          animate={{ ry: [6, 4, 6] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.ellipse cx="70" cy="45" rx="5" ry="6" fill="#1E293B"
          animate={{ ry: [6, 4, 6] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
        {/* Mouth - wailing */}
        <motion.ellipse cx="60" cy="58" rx="4" ry="5" fill="#1E293B"
          animate={{ ry: [5, 7, 5] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Floating page fragments */}
        <motion.rect x="20" y="50" width="8" height="10" rx="1" fill="#F5F5F4" opacity="0.5"
          animate={{ y: [50, 40], opacity: [0.5, 0], rotate: [0, 20] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.rect x="90" y="60" width="7" height="9" rx="1" fill="#F5F5F4" opacity="0.5"
          animate={{ y: [60, 48], opacity: [0.5, 0], rotate: [0, -15] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-stone-400 to-stone-300 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
