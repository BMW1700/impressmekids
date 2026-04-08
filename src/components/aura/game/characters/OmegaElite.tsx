import { motion } from 'framer-motion';

export type OmegaEliteState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: OmegaEliteState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 65, height: 120 }, medium: { width: 90, height: 160 }, large: { width: 115, height: 200 } };

export const OmegaElite = ({ state, healthPercent, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -10, 10, -5, 0] } : isAttacking ? { x: [0, -25, 0], scale: [1, 1.05, 1] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs><linearGradient id="oeSuit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#F97316" /><stop offset="100%" stopColor="#9A3412" /></linearGradient></defs>
        <rect x="28" y="8" width="44" height="38" rx="6" fill="url(#oeSuit)" />
        <rect x="33" y="23" width="34" height="10" rx="3" fill="#431407" opacity="0.8" />
        <motion.circle cx="43" cy="27" r="3" fill="#FCD34D" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <motion.circle cx="57" cy="27" r="3" fill="#FCD34D" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
        <rect x="23" y="46" width="54" height="60" rx="6" fill="url(#oeSuit)" />
        <rect x="8" y="48" width="18" height="48" rx="4" fill="url(#oeSuit)" />
        <rect x="74" y="48" width="18" height="48" rx="4" fill="url(#oeSuit)" />
        <rect x="28" y="106" width="18" height="50" rx="4" fill="#9A3412" />
        <rect x="54" y="106" width="18" height="50" rx="4" fill="#9A3412" />
      </svg>
    </motion.div>
  );
};
