import { motion } from 'framer-motion';

export type IceDroneState = 'idle' | 'hit' | 'attacking' | 'defeated';
interface Props { state: IceDroneState; healthPercent: number; currentHp?: number; maxHp?: number; size?: 'small' | 'medium' | 'large'; flipX?: boolean; }
const sizeConfig = { small: { width: 60, height: 60 }, medium: { width: 85, height: 85 }, large: { width: 110, height: 110 } };

export const IceDrone = ({ state, healthPercent, size = 'medium', flipX = false }: Props) => {
  const { width, height } = sizeConfig[size];
  const isHit = state === 'hit'; const isAttacking = state === 'attacking'; const isDefeated = state === 'defeated';
  return (
    <motion.div className="relative" style={{ width, height: height + 20, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, rotate: 90 } : isHit ? { x: [0, -5, 5, 0] } : isAttacking ? { y: [0, -15, 0] } : { y: [0, -8, 0] }}
      transition={isDefeated ? { duration: 1 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.3 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 100" width={width} height={height}>
        <defs><radialGradient id="idBody"><stop offset="0%" stopColor="#BAE6FD" /><stop offset="100%" stopColor="#0284C7" /></radialGradient></defs>
        <ellipse cx="50" cy="50" rx="30" ry="20" fill="url(#idBody)" />
        <motion.circle cx="50" cy="48" r="6" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="2" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.rect x="15" y="35" width="18" height="3" rx="1" fill="#7DD3FC" animate={{ rotate: [0, 360] }} transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '24px 36px' }} />
        <motion.rect x="67" y="35" width="18" height="3" rx="1" fill="#7DD3FC" animate={{ rotate: [0, -360] }} transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '76px 36px' }} />
        <motion.path d="M45 70 L50 85 L55 70" fill="#38BDF8" animate={isAttacking ? { opacity: [0, 1, 0] } : { opacity: 0 }} transition={{ duration: 0.3 }} />
      </svg>
    </motion.div>
  );
};
