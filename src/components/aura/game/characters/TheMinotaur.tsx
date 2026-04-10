import { motion } from 'framer-motion';

export type TheMinotaurState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: TheMinotaurState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; showHealthBar?: boolean; flipX?: boolean; }
const sizeConfig = { small: { width: 70, height: 130 }, medium: { width: 100, height: 170 }, large: { width: 130, height: 210 } };

export const TheMinotaur = ({ state, healthPercent, currentHp, maxHp, size = 'large', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 30 } : isHit ? { x: [0, -12, 12, 0] } : isAttacking ? { x: [0, -30, 0], scale: [1, 1.1, 1] } : { y: [0, -4, 0] }}
      transition={isDefeated ? { duration: 1.5 } : isHit ? { duration: 0.4 } : isAttacking ? { duration: 0.5 } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 120 200" width={width} height={height}>
        <defs>
          <linearGradient id="minoArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#A8A29E" /><stop offset="100%" stopColor="#44403C" /></linearGradient>
        </defs>
        {/* Horns */}
        <path d="M30 30 L15 5 L25 25" fill="#D6D3D1" />
        <path d="M90 30 L105 5 L95 25" fill="#D6D3D1" />
        {/* Head */}
        <rect x="35" y="20" width="50" height="40" rx="10" fill="url(#minoArmor)" />
        <rect x="42" y="35" width="36" height="10" rx="3" fill="#292524" opacity="0.8" />
        <motion.circle cx="52" cy="39" r="3" fill="#EF4444" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="68" cy="39" r="3" fill="#EF4444" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
        {/* Body */}
        <rect x="28" y="60" width="64" height="75" rx="8" fill="url(#minoArmor)" />
        {/* Arms */}
        <rect x="8" y="62" width="24" height="55" rx="6" fill="url(#minoArmor)" />
        <rect x="88" y="62" width="24" height="55" rx="6" fill="url(#minoArmor)" />
        {/* Axe */}
        <motion.g animate={isAttacking ? { rotate: [0, -60, 0] } : {}} transition={{ duration: 0.4 }} style={{ transformOrigin: '105px 80px' }}>
          <rect x="102" y="70" width="6" height="50" rx="2" fill="#78716C" />
          <path d="M96 65 L115 55 L115 75 Z" fill="#A8A29E" />
        </motion.g>
        {/* Legs */}
        <rect x="35" y="135" width="22" height="48" rx="6" fill="#57534E" />
        <rect x="63" y="135" width="22" height="48" rx="6" fill="#57534E" />
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
