import { motion } from 'framer-motion';

interface MiniGoblinProps {
  size?: number;
  flipX?: boolean;
}

export const MiniGoblin = ({ size = 48, flipX = false }: MiniGoblinProps) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 0.3, repeat: Infinity }}
    >
      <defs>
        <linearGradient id="goblinSkin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="goblinCloth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
      
      {/* Body */}
      <ellipse cx="24" cy="32" rx="10" ry="12" fill="url(#goblinCloth)" />
      
      {/* Head */}
      <circle cx="24" cy="16" r="10" fill="url(#goblinSkin)" />
      
      {/* Pointy ears */}
      <path d="M12 14 L8 6 L16 12 Z" fill="url(#goblinSkin)" />
      <path d="M36 14 L40 6 L32 12 Z" fill="url(#goblinSkin)" />
      
      {/* Eyes */}
      <circle cx="20" cy="15" r="3" fill="#fef3c7" />
      <circle cx="28" cy="15" r="3" fill="#fef3c7" />
      <circle cx="20" cy="16" r="1.5" fill="#dc2626" />
      <circle cx="28" cy="16" r="1.5" fill="#dc2626" />
      
      {/* Nose */}
      <ellipse cx="24" cy="18" rx="2" ry="1.5" fill="#15803d" />
      
      {/* Mouth */}
      <path 
        d="M20 22 Q24 25 28 22" 
        stroke="#15803d" 
        strokeWidth="1.5" 
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Legs (running animation) */}
      <motion.ellipse
        cx="20"
        cy="42"
        rx="4"
        ry="3"
        fill="url(#goblinSkin)"
        animate={{ cx: [18, 22, 18] }}
        transition={{ duration: 0.2, repeat: Infinity }}
      />
      <motion.ellipse
        cx="28"
        cy="42"
        rx="4"
        ry="3"
        fill="url(#goblinSkin)"
        animate={{ cx: [30, 26, 30] }}
        transition={{ duration: 0.2, repeat: Infinity }}
      />
      
      {/* Arms */}
      <motion.ellipse
        cx="13"
        cy="30"
        rx="3"
        ry="5"
        fill="url(#goblinSkin)"
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '13px 28px' }}
      />
      <motion.ellipse
        cx="35"
        cy="30"
        rx="3"
        ry="5"
        fill="url(#goblinSkin)"
        animate={{ rotate: [10, -10, 10] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '35px 28px' }}
      />
    </motion.svg>
  );
};
