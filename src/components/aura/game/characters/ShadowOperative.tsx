import { motion } from 'framer-motion';

export type ShadowOperativeState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface Props { state: ShadowOperativeState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 60, height: 110 }, medium: { width: 85, height: 150 }, large: { width: 110, height: 190 } };

export const ShadowOperative = ({ state, healthPercent, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, y: 20 } : isHit ? { x: [0, -8, 8, -4, 0] } : isAttacking ? { x: [0, -25, 0] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.4 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 180" width={width} height={height}>
        <defs><linearGradient id="shadowOpSuit" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1E293B" /><stop offset="100%" stopColor="#0F172A" /></linearGradient></defs>
        {/* Head with night vision */}
        <circle cx="50" cy="25" r="18" fill="url(#shadowOpSuit)" />
        <motion.circle cx="43" cy="22" r="5" fill="#22C55E" opacity="0.8" animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="57" cy="22" r="5" fill="#22C55E" opacity="0.8" animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
        {/* Body */}
        <rect x="28" y="43" width="44" height="60" rx="5" fill="url(#shadowOpSuit)" />
        {/* Arms */}
        <rect x="12" y="46" width="18" height="42" rx="4" fill="url(#shadowOpSuit)" />
        <rect x="70" y="46" width="18" height="42" rx="4" fill="url(#shadowOpSuit)" />
        {/* Suppressed pistol */}
        <motion.rect x="82" y="72" width="16" height="6" rx="2" fill="#475569"
          animate={isAttacking ? { x: [82, 90, 82] } : {}} transition={{ duration: 0.3 }} />
        {/* Legs */}
        <rect x="32" y="103" width="14" height="50" rx="4" fill="#1E293B" />
        <rect x="54" y="103" width="14" height="50" rx="4" fill="#1E293B" />
        <rect x="30" y="148" width="18" height="10" rx="3" fill="#0F172A" />
        <rect x="52" y="148" width="18" height="10" rx="3" fill="#0F172A" />
      </svg>
    </motion.div>
  );
};
