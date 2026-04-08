import { motion } from 'framer-motion';

export type BioDroneState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: BioDroneState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 60, height: 60 }, medium: { width: 85, height: 85 }, large: { width: 110, height: 110 } };

export const BioDrone = ({ state, healthPercent, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, rotate: 120 } : isHit ? { x: [0, -5, 5, 0] } : isAttacking ? { y: [0, -15, 0] } : { y: [0, -6, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.3 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 100" width={width} height={height}>
        <defs><radialGradient id="bdBody"><stop offset="0%" stopColor="#6EE7B7" /><stop offset="100%" stopColor="#047857" /></radialGradient></defs>
        <ellipse cx="50" cy="50" rx="28" ry="18" fill="url(#bdBody)" />
        <motion.circle cx="50" cy="48" r="8" fill="#064E3B" stroke="#34D399" strokeWidth="2" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="50" cy="48" r="3" fill="#10B981" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }} />
        <motion.rect x="18" y="35" width="15" height="3" rx="1" fill="#34D399" animate={{ rotate: [0, 360] }} transition={{ duration: 0.35, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '25px 36px' }} />
        <motion.rect x="67" y="35" width="15" height="3" rx="1" fill="#34D399" animate={{ rotate: [0, -360] }} transition={{ duration: 0.35, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '74px 36px' }} />
      </svg>
    </motion.div>
  );
};
