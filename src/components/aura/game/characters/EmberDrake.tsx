import { motion } from 'framer-motion';

export type EmberDrakeState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface EmberDrakeProps {
  state: EmberDrakeState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = { small: { width: 80, height: 100 }, medium: { width: 120, height: 150 }, large: { width: 160, height: 200 } };

export const EmberDrake = ({ state, healthPercent, currentHp, maxHp, size = 'medium' }: EmberDrakeProps) => {
  const { width, height } = sizeConfig[size];
  const isDefeated = state === 'defeated';

  return (
    <motion.div className="relative" animate={isDefeated ? { opacity: 0, scale: 0, rotate: 180 } : state === 'hit' ? { x: [0, -8, 8, 0] } : state === 'attacking' ? { scale: [1, 1.15, 1], y: [0, -10, 0] } : {}} transition={{ duration: 0.5 }}>
      <svg width={width} height={height} viewBox="0 0 160 200">
        <defs>
          <linearGradient id="emberDrakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
        {/* Wings */}
        <motion.path d="M30 60 L5 30 L15 55 L10 40 L25 65" fill="#B91C1C" opacity="0.8"
          animate={{ rotate: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ transformOrigin: '30px 60px' }} />
        <motion.path d="M130 60 L155 30 L145 55 L150 40 L135 65" fill="#B91C1C" opacity="0.8"
          animate={{ rotate: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ transformOrigin: '130px 60px' }} />
        {/* Body */}
        <ellipse cx="80" cy="100" rx="40" ry="35" fill="url(#emberDrakeGrad)" />
        {/* Head */}
        <circle cx="80" cy="55" r="25" fill="url(#emberDrakeGrad)" />
        {/* Horns */}
        <polygon points="65,38 55,15 70,35" fill="#7C2D12" />
        <polygon points="95,38 105,15 90,35" fill="#7C2D12" />
        {/* Eyes */}
        <motion.circle cx="72" cy="50" r="4" fill="#FCD34D" animate={{ r: [4, 3, 4] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.circle cx="88" cy="50" r="4" fill="#FCD34D" animate={{ r: [4, 3, 4] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
        <circle cx="72" cy="50" r="2" fill="#1E293B" />
        <circle cx="88" cy="50" r="2" fill="#1E293B" />
        {/* Snout */}
        <ellipse cx="80" cy="65" rx="10" ry="6" fill="#991B1B" />
        <circle cx="76" cy="63" r="1.5" fill="#1E293B" />
        <circle cx="84" cy="63" r="1.5" fill="#1E293B" />
        {/* Belly */}
        <ellipse cx="80" cy="105" rx="22" ry="20" fill="#FCD34D" opacity="0.3" />
        {/* Tail */}
        <motion.path d="M40 110 Q20 130 25 155 Q30 160 35 150 Q28 135 45 115" fill="url(#emberDrakeGrad)"
          animate={{ d: ['M40 110 Q20 130 25 155 Q30 160 35 150 Q28 135 45 115', 'M40 110 Q15 125 20 150 Q25 155 30 145 Q23 130 45 115'] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }} />
        {/* Fire breath when attacking */}
        {state === 'attacking' && (
          <motion.ellipse cx="80" cy="75" rx="15" ry="8" fill="#F97316" opacity="0.7"
            animate={{ rx: [15, 30, 15], opacity: [0.7, 0.3, 0.7] }} transition={{ duration: 0.3, repeat: 3 }} />
        )}
        {/* Legs */}
        <rect x="55" y="125" width="10" height="22" rx="4" fill="url(#emberDrakeGrad)" />
        <rect x="95" y="125" width="10" height="22" rx="4" fill="url(#emberDrakeGrad)" />
      </svg>
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[9px] text-center text-white/70 mt-0.5">{currentHp}/{maxHp}</p>
        </div>
      )}
    </motion.div>
  );
};
