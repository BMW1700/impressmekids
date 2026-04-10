import { motion } from 'framer-motion';

export type TunnelRatState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: TunnelRatState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 50, height: 90 }, medium: { width: 70, height: 120 }, large: { width: 90, height: 150 } };

export const TunnelRat = ({ state, healthPercent, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -6, 6, 0] } : isAttacking ? { x: [0, -20, 0] } : { y: [0, -2, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.3 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 160" width={width} height={height}>
        <defs><linearGradient id="trSuit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#A8A29E" /><stop offset="100%" stopColor="#57534E" /></linearGradient></defs>
        <circle cx="50" cy="30" r="14" fill="url(#trSuit)" />
        <motion.circle cx="44" cy="27" r="2" fill="#F97316" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="56" cy="27" r="2" fill="#F97316" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
        <rect x="32" y="44" width="36" height="48" rx="5" fill="url(#trSuit)" />
        <rect x="18" y="46" width="16" height="35" rx="3" fill="url(#trSuit)" />
        <rect x="66" y="46" width="16" height="35" rx="3" fill="url(#trSuit)" />
        <rect x="36" y="92" width="11" height="45" rx="3" fill="#78716C" />
        <rect x="53" y="92" width="11" height="45" rx="3" fill="#78716C" />
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
