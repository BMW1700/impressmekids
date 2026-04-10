import { motion } from 'framer-motion';

export type MazeRunnerState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: MazeRunnerState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 60, height: 110 }, medium: { width: 85, height: 150 }, large: { width: 110, height: 190 } };

export const MazeRunner = ({ state, healthPercent, currentHp, maxHp, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -8, 8, -4, 0] } : isAttacking ? { x: [0, -30, 0] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs><linearGradient id="mrSuit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#78716C" /><stop offset="100%" stopColor="#44403C" /></linearGradient></defs>
        <circle cx="50" cy="25" r="16" fill="url(#mrSuit)" />
        <rect x="38" y="20" width="24" height="8" rx="2" fill="#292524" opacity="0.8" />
        <motion.circle cx="45" cy="23" r="2" fill="#FBBF24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="55" cy="23" r="2" fill="#FBBF24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
        <rect x="30" y="41" width="40" height="55" rx="5" fill="url(#mrSuit)" />
        <rect x="14" y="44" width="18" height="40" rx="4" fill="url(#mrSuit)" />
        <rect x="68" y="44" width="18" height="40" rx="4" fill="url(#mrSuit)" />
        <rect x="34" y="96" width="12" height="55" rx="4" fill="#57534E" />
        <rect x="54" y="96" width="12" height="55" rx="4" fill="#57534E" />
        <rect x="32" y="146" width="16" height="10" rx="3" fill="#44403C" />
        <rect x="52" y="146" width="16" height="10" rx="3" fill="#44403C" />
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
