import { motion } from 'framer-motion';

interface MiniOperativeProps {
  size?: number;
  flipX?: boolean;
  variant?: 'soldier' | 'heavy' | 'sniper';
}

export const MiniOperative = ({ size = 48, flipX = false, variant = 'soldier' }: MiniOperativeProps) => {
  const bodyColor = variant === 'heavy' ? '#1e293b' : variant === 'sniper' ? '#0f172a' : '#334155';
  const accentColor = variant === 'heavy' ? '#ef4444' : variant === 'sniper' ? '#06b6d4' : '#f59e0b';
  const visorColor = variant === 'sniper' ? '#22d3ee' : '#ef4444';

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 0.4, repeat: Infinity }}
    >
      {/* Helmet */}
      <path d="M16 8 Q24 2 32 8 L34 16 Q34 22 24 22 Q14 22 14 16 Z" fill={bodyColor} />
      {/* Visor */}
      <rect x="16" y="12" width="16" height="4" rx="2" fill={visorColor} opacity="0.9" />
      <motion.rect
        x="16" y="12" width="16" height="4" rx="2"
        fill="white" opacity={0.3}
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Body armor */}
      <rect x="16" y="22" width="16" height="14" rx="2" fill={bodyColor} />
      {/* Chest plate */}
      <rect x="18" y="24" width="12" height="8" rx="1" fill={accentColor} opacity="0.3" />
      {/* Belt */}
      <rect x="16" y="34" width="16" height="2" fill={accentColor} />

      {/* Legs */}
      <motion.rect
        x="17" y="36" width="5" height="8" rx="1" fill={bodyColor}
        animate={{ x: [16, 19, 16] }}
        transition={{ duration: 0.25, repeat: Infinity }}
      />
      <motion.rect
        x="26" y="36" width="5" height="8" rx="1" fill={bodyColor}
        animate={{ x: [27, 24, 27] }}
        transition={{ duration: 0.25, repeat: Infinity }}
      />

      {/* Boots */}
      <rect x="16" y="42" width="6" height="3" rx="1" fill="#0f172a" />
      <rect x="26" y="42" width="6" height="3" rx="1" fill="#0f172a" />

      {/* Weapon (rifle) */}
      <motion.g
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '36px 28px' }}
      >
        <rect x="34" y="24" width="3" height="12" rx="1" fill="#475569" />
        <rect x="33" y="22" width="5" height="3" rx="1" fill="#64748b" />
      </motion.g>

      {/* Shoulder pads */}
      <rect x="13" y="22" width="4" height="4" rx="1" fill={accentColor} opacity="0.5" />
      <rect x="31" y="22" width="4" height="4" rx="1" fill={accentColor} opacity="0.5" />
    </motion.svg>
  );
};
