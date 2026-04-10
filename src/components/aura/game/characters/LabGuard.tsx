import { motion } from 'framer-motion';

export type LabGuardState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: LabGuardState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 60, height: 110 }, medium: { width: 85, height: 150 }, large: { width: 110, height: 190 } };

export const LabGuard = ({ state, healthPercent, currentHp, maxHp, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -8, 8, -4, 0] } : isAttacking ? { x: [0, -25, 0] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs><linearGradient id="lgSuit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#D1FAE5" /><stop offset="100%" stopColor="#065F46" /></linearGradient></defs>
        {/* Hazmat helmet */}
        <circle cx="50" cy="25" r="18" fill="url(#lgSuit)" />
        <circle cx="50" cy="22" r="12" fill="#064E3B" opacity="0.6" />
        <motion.circle cx="50" cy="22" r="6" fill="#10B981" opacity="0.5" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Body */}
        <rect x="28" y="43" width="44" height="60" rx="5" fill="url(#lgSuit)" />
        <rect x="12" y="46" width="18" height="42" rx="4" fill="url(#lgSuit)" />
        <rect x="70" y="46" width="18" height="42" rx="4" fill="url(#lgSuit)" />
        {/* Stun baton */}
        <motion.rect x="80" y="60" width="18" height="5" rx="2" fill="#34D399"
          animate={isAttacking ? { opacity: [1, 0, 1] } : {}} transition={{ duration: 0.2, repeat: 2 }} />
        <rect x="32" y="103" width="14" height="50" rx="4" fill="#047857" />
        <rect x="54" y="103" width="14" height="50" rx="4" fill="#047857" />
        <rect x="30" y="148" width="18" height="10" rx="3" fill="#065F46" />
        <rect x="52" y="148" width="18" height="10" rx="3" fill="#065F46" />
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
