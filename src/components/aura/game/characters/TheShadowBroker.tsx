import { motion } from 'framer-motion';

export type TheShadowBrokerState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: TheShadowBrokerState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; showHealthBar?: boolean; flipX?: boolean; }
const sizeConfig = { small: { width: 70, height: 130 }, medium: { width: 100, height: 170 }, large: { width: 130, height: 210 } };

export const TheShadowBroker = ({ state, healthPercent, size = 'large', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 30 } : isHit ? { x: [0, -10, 10, 0] } : isAttacking ? { scale: [1, 1.05, 1] } : { y: [0, -4, 0] }}
      transition={isDefeated ? { duration: 1.5 } : isHit ? { duration: 0.4 } : isAttacking ? { duration: 0.5 } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 120 200" width={width} height={height}>
        <defs>
          <linearGradient id="sbSuit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1E293B" /><stop offset="100%" stopColor="#020617" /></linearGradient>
          <linearGradient id="sbCloak" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0F172A" /><stop offset="100%" stopColor="#000000" /></linearGradient>
        </defs>
        {/* Cloak */}
        <motion.path d="M25 45 L10 190 L110 190 L95 45" fill="url(#sbCloak)" opacity="0.8"
          animate={{ d: ['M25 45 L10 190 L110 190 L95 45', 'M25 45 L5 195 L115 195 L95 45', 'M25 45 L10 190 L110 190 L95 45'] }}
          transition={{ duration: 4, repeat: Infinity }} />
        {/* Body */}
        <rect x="32" y="50" width="56" height="70" rx="6" fill="url(#sbSuit)" />
        {/* Head - hooded */}
        <path d="M35 45 Q60 5 85 45" fill="url(#sbCloak)" />
        <rect x="40" y="28" width="40" height="10" rx="3" fill="#0F172A" />
        <motion.circle cx="52" cy="32" r="3" fill="#A855F7" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="68" cy="32" r="3" fill="#A855F7" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        {/* Arms */}
        <rect x="12" y="55" width="22" height="50" rx="5" fill="url(#sbSuit)" />
        <rect x="86" y="55" width="22" height="50" rx="5" fill="url(#sbSuit)" />
        {/* Data tablet */}
        <motion.rect x="90" y="80" width="20" height="14" rx="2" fill="#334155" stroke="#A855F7" strokeWidth="1"
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Legs */}
        <rect x="38" y="120" width="18" height="50" rx="5" fill="#1E293B" />
        <rect x="64" y="120" width="18" height="50" rx="5" fill="#1E293B" />
      </svg>
    </motion.div>
  );
};
