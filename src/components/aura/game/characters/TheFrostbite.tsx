import { motion } from 'framer-motion';

export type TheFrostbiteState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: TheFrostbiteState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; showHealthBar?: boolean; flipX?: boolean; }
const sizeConfig = { small: { width: 70, height: 130 }, medium: { width: 100, height: 170 }, large: { width: 130, height: 210 } };

export const TheFrostbite = ({ state, healthPercent, size = 'large', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 30 } : isHit ? { x: [0, -10, 10, 0] } : isAttacking ? { scale: [1, 1.1, 1] } : { y: [0, -4, 0] }}
      transition={isDefeated ? { duration: 1.5 } : isHit ? { duration: 0.4 } : isAttacking ? { duration: 0.5 } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 120 200" width={width} height={height}>
        <defs>
          <linearGradient id="fbArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#E0F2FE" /><stop offset="100%" stopColor="#0284C7" /></linearGradient>
          <linearGradient id="fbCloak" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#BAE6FD" /><stop offset="100%" stopColor="#075985" /></linearGradient>
        </defs>
        <motion.path d="M25 50 L15 185 L105 185 L95 50" fill="url(#fbCloak)" opacity="0.6"
          animate={{ d: ['M25 50 L15 185 L105 185 L95 50', 'M25 50 L10 190 L110 190 L95 50', 'M25 50 L15 185 L105 185 L95 50'] }}
          transition={{ duration: 3, repeat: Infinity }} />
        <rect x="32" y="55" width="56" height="70" rx="8" fill="url(#fbArmor)" />
        <rect x="35" y="10" width="50" height="45" rx="8" fill="url(#fbArmor)" />
        <rect x="40" y="28" width="40" height="12" rx="3" fill="#0C4A6E" />
        <motion.circle cx="52" cy="33" r="3" fill="#38BDF8" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="68" cy="33" r="3" fill="#38BDF8" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
        <path d="M40 8 L48 -4 L56 5 L60 -5 L64 5 L72 -4 L80 8" fill="#7DD3FC" />
        <rect x="12" y="58" width="22" height="50" rx="5" fill="url(#fbArmor)" />
        <rect x="86" y="58" width="22" height="50" rx="5" fill="url(#fbArmor)" />
        <rect x="38" y="125" width="18" height="50" rx="5" fill="#0369A1" />
        <rect x="64" y="125" width="18" height="50" rx="5" fill="#0369A1" />
      </svg>
    </motion.div>
  );
};
