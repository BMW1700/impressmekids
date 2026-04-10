import { motion } from 'framer-motion';

export type ShadowDroneState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: ShadowDroneState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 60, height: 60 }, medium: { width: 85, height: 85 }, large: { width: 110, height: 110 } };

export const ShadowDrone = ({ state, healthPercent, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, rotate: 90, y: 30 } : isHit ? { x: [0, -5, 5, 0] } : isAttacking ? { y: [0, -15, 0] } : { y: [0, -6, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.3 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 100" width={width} height={height}>
        <defs><radialGradient id="sdBody"><stop offset="0%" stopColor="#334155" /><stop offset="100%" stopColor="#0F172A" /></radialGradient></defs>
        <polygon points="50,20 80,50 50,80 20,50" fill="url(#sdBody)" />
        <motion.circle cx="50" cy="50" r="8" fill="#1E293B" stroke="#EF4444" strokeWidth="2" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="50" cy="50" r="3" fill="#EF4444" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity }} />
        <motion.line x1="20" y1="35" x2="5" y2="25" stroke="#475569" strokeWidth="2" animate={{ rotate: [0, 15, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ transformOrigin: '20px 35px' }} />
        <motion.line x1="80" y1="35" x2="95" y2="25" stroke="#475569" strokeWidth="2" animate={{ rotate: [0, -15, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ transformOrigin: '80px 35px' }} />
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
