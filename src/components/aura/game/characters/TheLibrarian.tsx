import { motion } from 'framer-motion';

export type TheLibrarianState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface TheLibrarianProps {
  state: TheLibrarianState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const TheLibrarian = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: TheLibrarianProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, scale: 0 } : state === 'hit' ? { x: [0, -8, 8, 0] } : state === 'attacking' ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.5 }}>
      <svg width={width} height={height} viewBox="0 0 160 200">
        <defs>
          <linearGradient id="librarianGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C1917" />
            <stop offset="50%" stopColor="#292524" />
            <stop offset="100%" stopColor="#44403C" />
          </linearGradient>
        </defs>
        {/* Robe */}
        <path d="M55 65 L30 175 L130 175 L105 65" fill="url(#librarianGrad)" />
        {/* Hood */}
        <path d="M50 70 Q80 20 110 70 Q100 45 80 40 Q60 45 50 70" fill="#1C1917" />
        {/* Face - shadowed */}
        <circle cx="80" cy="55" r="18" fill="#292524" />
        {/* Glowing eyes */}
        <motion.circle cx="73" cy="52" r="4" fill="#22C55E"
          animate={{ opacity: [0.6, 1, 0.6], filter: ['drop-shadow(0 0 2px #22C55E)', 'drop-shadow(0 0 8px #22C55E)', 'drop-shadow(0 0 2px #22C55E)'] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="87" cy="52" r="4" fill="#22C55E"
          animate={{ opacity: [0.6, 1, 0.6], filter: ['drop-shadow(0 0 2px #22C55E)', 'drop-shadow(0 0 8px #22C55E)', 'drop-shadow(0 0 2px #22C55E)'] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        <circle cx="73" cy="52" r="2" fill="#1E293B" />
        <circle cx="87" cy="52" r="2" fill="#1E293B" />
        {/* Arms */}
        <rect x="20" y="70" width="16" height="50" rx="6" fill="url(#librarianGrad)" />
        <rect x="124" y="70" width="16" height="50" rx="6" fill="url(#librarianGrad)" />
        {/* Floating book in left hand */}
        <motion.g animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <rect x="10" y="115" width="20" height="15" rx="2" fill="#92400E" />
          <line x1="20" y1="115" x2="20" y2="130" stroke="#78350F" strokeWidth="1" />
          <rect x="12" y="118" width="6" height="1" rx="0.5" fill="#FDE68A" opacity="0.5" />
          <rect x="12" y="121" width="5" height="1" rx="0.5" fill="#FDE68A" opacity="0.4" />
          <rect x="22" y="118" width="6" height="1" rx="0.5" fill="#FDE68A" opacity="0.5" />
        </motion.g>
        {/* Giant book staff in right hand */}
        <rect x="135" y="55" width="5" height="90" rx="2" fill="#78350F" />
        <motion.rect x="128" y="45" width="18" height="22" rx="3" fill="#B45309"
          animate={{ filter: ['drop-shadow(0 0 3px #22C55E)', 'drop-shadow(0 0 10px #22C55E)', 'drop-shadow(0 0 3px #22C55E)'] }}
          transition={{ duration: 2, repeat: Infinity }} />
        <rect x="130" y="48" width="14" height="1" rx="0.5" fill="#FDE68A" opacity="0.6" />
        <rect x="130" y="51" width="12" height="1" rx="0.5" fill="#FDE68A" opacity="0.5" />
        <rect x="130" y="54" width="14" height="1" rx="0.5" fill="#FDE68A" opacity="0.6" />
        {/* Floating orbiting books */}
        <motion.rect x="45" y="100" width="12" height="8" rx="1" fill="#A16207" opacity="0.7"
          animate={{ x: [45, 50, 45], y: [100, 92, 100] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.rect x="100" y="95" width="10" height="7" rx="1" fill="#92400E" opacity="0.6"
          animate={{ x: [100, 95, 100], y: [95, 88, 95] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1 }} />
        {/* Robe runes */}
        <motion.circle cx="70" cy="120" r="3" fill="#22C55E" opacity="0.3"
          animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="90" cy="140" r="3" fill="#22C55E" opacity="0.3"
          animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
        <motion.circle cx="80" cy="155" r="2" fill="#22C55E" opacity="0.3"
          animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 1.3 }} />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
