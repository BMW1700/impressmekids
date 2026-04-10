import { motion } from 'framer-motion';

export type TheOmegaState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: TheOmegaState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; showHealthBar?: boolean; flipX?: boolean; }
const sizeConfig = { small: { width: 70, height: 130 }, medium: { width: 100, height: 170 }, large: { width: 130, height: 210 } };

export const TheOmega = ({ state, healthPercent, currentHp, maxHp, size = 'large', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 30, scale: 0.8 } : isHit ? { x: [0, -12, 12, 0] } : isAttacking ? { scale: [1, 1.15, 1], x: [0, -20, 0] } : { y: [0, -5, 0] }}
      transition={isDefeated ? { duration: 2 } : isHit ? { duration: 0.4 } : isAttacking ? { duration: 0.6 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 130 210" width={width} height={height}>
        <defs>
          <linearGradient id="omegaArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#7F1D1D" /></linearGradient>
          <linearGradient id="omegaCape" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#DC2626" /><stop offset="100%" stopColor="#450A0A" /></linearGradient>
        </defs>
        {/* Cape */}
        <motion.path d="M30 50 L15 195 L115 195 L100 50" fill="url(#omegaCape)" opacity="0.8"
          animate={{ d: ['M30 50 L15 195 L115 195 L100 50', 'M30 50 L8 200 L122 200 L100 50', 'M30 50 L15 195 L115 195 L100 50'] }}
          transition={{ duration: 3, repeat: Infinity }} />
        {/* Body */}
        <rect x="35" y="55" width="60" height="80" rx="8" fill="url(#omegaArmor)" />
        {/* Omega symbol on chest */}
        <text x="65" y="100" textAnchor="middle" fill="#FCD34D" fontSize="24" fontWeight="bold" opacity="0.8">Ω</text>
        {/* Helmet */}
        <rect x="38" y="10" width="54" height="48" rx="10" fill="url(#omegaArmor)" />
        <rect x="44" y="28" width="42" height="14" rx="4" fill="#1C1917" opacity="0.9" />
        <motion.circle cx="55" cy="34" r="4" fill="#EF4444" animate={{ opacity: [0.3, 1, 0.3], filter: ['drop-shadow(0 0 2px #EF4444)', 'drop-shadow(0 0 8px #EF4444)', 'drop-shadow(0 0 2px #EF4444)'] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="75" cy="34" r="4" fill="#EF4444" animate={{ opacity: [0.3, 1, 0.3], filter: ['drop-shadow(0 0 2px #EF4444)', 'drop-shadow(0 0 8px #EF4444)', 'drop-shadow(0 0 2px #EF4444)'] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
        {/* Crown */}
        <path d="M42 10 L48 -2 L55 6 L60 -5 L65 6 L72 -2 L78 6 L85 -2 L88 10" fill="#FCD34D" />
        {/* Arms */}
        <rect x="12" y="58" width="26" height="58" rx="6" fill="url(#omegaArmor)" />
        <rect x="92" y="58" width="26" height="58" rx="6" fill="url(#omegaArmor)" />
        {/* Energy sword */}
        <motion.g animate={isAttacking ? { rotate: [0, -50, 0] } : {}} transition={{ duration: 0.5 }} style={{ transformOrigin: '110px 90px' }}>
          <rect x="110" y="70" width="5" height="55" rx="1" fill="#FCD34D" />
          <motion.rect x="108" y="65" width="9" height="8" rx="2" fill="#F59E0B" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 0.5, repeat: Infinity }} />
        </motion.g>
        {/* Legs */}
        <rect x="40" y="135" width="22" height="52" rx="6" fill="#991B1B" />
        <rect x="68" y="135" width="22" height="52" rx="6" fill="#991B1B" />
        <rect x="37" y="182" width="28" height="14" rx="4" fill="#7F1D1D" />
        <rect x="65" y="182" width="28" height="14" rx="4" fill="#7F1D1D" />
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
