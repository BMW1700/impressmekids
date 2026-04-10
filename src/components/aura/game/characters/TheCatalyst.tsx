import { motion } from 'framer-motion';

export type TheCatalystState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: TheCatalystState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; showHealthBar?: boolean; flipX?: boolean; }
const sizeConfig = { small: { width: 70, height: 130 }, medium: { width: 100, height: 170 }, large: { width: 130, height: 210 } };

export const TheCatalyst = ({ state, healthPercent, size = 'large', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 30 } : isHit ? { x: [0, -10, 10, 0] } : isAttacking ? { scale: [1, 1.1, 1] } : { y: [0, -4, 0] }}
      transition={isDefeated ? { duration: 1.5 } : isHit ? { duration: 0.4 } : isAttacking ? { duration: 0.5 } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 120 200" width={width} height={height}>
        <defs>
          <linearGradient id="catSuit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#064E3B" /></linearGradient>
          <linearGradient id="catCoat" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#F0FDF4" /><stop offset="100%" stopColor="#6EE7B7" /></linearGradient>
        </defs>
        {/* Lab coat */}
        <motion.path d="M28 50 L20 185 L100 185 L92 50" fill="url(#catCoat)" opacity="0.8"
          animate={{ d: ['M28 50 L20 185 L100 185 L92 50', 'M28 50 L15 188 L105 188 L92 50', 'M28 50 L20 185 L100 185 L92 50'] }}
          transition={{ duration: 3, repeat: Infinity }} />
        <rect x="32" y="55" width="56" height="70" rx="6" fill="url(#catSuit)" />
        {/* Head with gas mask */}
        <circle cx="60" cy="30" r="22" fill="#D1FAE5" />
        <circle cx="60" cy="28" r="16" fill="#064E3B" opacity="0.7" />
        <motion.circle cx="53" cy="26" r="5" fill="#10B981" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="67" cy="26" r="5" fill="#10B981" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        {/* Arms */}
        <rect x="10" y="55" width="24" height="50" rx="5" fill="url(#catCoat)" />
        <rect x="86" y="55" width="24" height="50" rx="5" fill="url(#catCoat)" />
        {/* Syringe */}
        <motion.g animate={isAttacking ? { rotate: [0, -30, 0] } : {}} transition={{ duration: 0.4 }} style={{ transformOrigin: '100px 80px' }}>
          <rect x="100" y="72" width="4" height="30" rx="1" fill="#A7F3D0" />
          <rect x="97" y="72" width="10" height="6" rx="1" fill="#10B981" />
        </motion.g>
        <rect x="38" y="125" width="18" height="50" rx="5" fill="#047857" />
        <rect x="64" y="125" width="18" height="50" rx="5" fill="#047857" />
      </svg>

      {/* Health bar */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[85%]">
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-600">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthPercent > 50 ? 'linear-gradient(90deg, #22c55e, #4ade80)' :
                healthPercent > 25 ? 'linear-gradient(90deg, #eab308, #facc15)' :
                'linear-gradient(90deg, #dc2626, #ef4444)',
            }}
            animate={{ width: `${Math.max(0, healthPercent)}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        {currentHp !== undefined && maxHp !== undefined && (
          <p className="text-[8px] text-center text-gray-400 mt-0.5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{currentHp}/{maxHp}</p>
        )}
      </div>
    </motion.div>
  );
};
