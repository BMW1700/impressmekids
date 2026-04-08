import { motion } from 'framer-motion';

export type NovaTitanState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface NovaTitanProps {
  state: NovaTitanState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const NovaTitan = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: NovaTitanProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={state === 'defeated' ? { opacity: 0, scale: 0 } : state === 'hit' ? { x: [0, -8, 8, 0] } : state === 'attacking' ? { scale: [1, 1.2, 1], y: [0, -8, 0] } : {}} transition={{ duration: 0.5 }}>
      <svg width={width} height={height} viewBox="0 0 160 200">
        <defs>
          <linearGradient id="novaTitanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="50%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <radialGradient id="novaGlow" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Body */}
        <path d="M55 60 L40 155 L120 155 L105 60" fill="url(#novaTitanGrad)" />
        {/* Head */}
        <circle cx="80" cy="40" r="25" fill="url(#novaTitanGrad)" />
        {/* Nova crown */}
        <motion.polygon points="55,25 60,5 65,20 70,0 75,18 80,-2 85,18 90,0 95,20 100,5 105,25"
          fill="#FDE68A"
          animate={{ filter: ['drop-shadow(0 0 4px #FCD34D)', 'drop-shadow(0 0 12px #FCD34D)', 'drop-shadow(0 0 4px #FCD34D)'] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
        {/* Eyes */}
        <motion.circle cx="70" cy="38" r="5" fill="#FDE68A" animate={{ r: [5, 4, 5] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="90" cy="38" r="5" fill="#FDE68A" animate={{ r: [5, 4, 5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
        <circle cx="70" cy="38" r="2.5" fill="#1E293B" />
        <circle cx="90" cy="38" r="2.5" fill="#1E293B" />
        {/* Mouth */}
        <path d="M72 52 Q80 58 88 52" stroke="#FDE68A" strokeWidth="2" fill="none" />
        {/* Arms */}
        <rect x="25" y="65" width="18" height="45" rx="6" fill="url(#novaTitanGrad)" />
        <rect x="117" y="65" width="18" height="45" rx="6" fill="url(#novaTitanGrad)" />
        {/* Fists with nova energy */}
        <motion.circle cx="34" cy="115" r="10" fill="#312E81" stroke="#FDE68A" strokeWidth="2"
          animate={{ filter: ['drop-shadow(0 0 2px #FCD34D)', 'drop-shadow(0 0 8px #FCD34D)', 'drop-shadow(0 0 2px #FCD34D)'] }}
          transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="126" cy="115" r="10" fill="#312E81" stroke="#FDE68A" strokeWidth="2"
          animate={{ filter: ['drop-shadow(0 0 2px #FCD34D)', 'drop-shadow(0 0 8px #FCD34D)', 'drop-shadow(0 0 2px #FCD34D)'] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }} />
        {/* Chest nova core */}
        <motion.circle cx="80" cy="95" r="12" fill="url(#novaGlow)"
          animate={{ r: [12, 15, 12], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }} />
        <circle cx="80" cy="95" r="5" fill="#FDE68A" />
        {/* Star markings */}
        <motion.circle cx="65" cy="120" r="2" fill="#A78BFA" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="95" cy="125" r="2" fill="#A78BFA" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
        {/* Legs */}
        <rect x="50" y="150" width="16" height="30" rx="5" fill="url(#novaTitanGrad)" />
        <rect x="94" y="150" width="16" height="30" rx="5" fill="url(#novaTitanGrad)" />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-yellow-400 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
