import { motion } from 'framer-motion';

interface TugOfWarKidProps {
  index: number;
  isPulling: boolean;
  isStraining: boolean;
  side: 'hero' | 'enemy';
  size?: 'small' | 'medium';
}

const KID_COLORS = [
  { shirt: '#ef4444', hair: '#78350f', skin: '#fcd5b8' },
  { shirt: '#3b82f6', hair: '#1a1a1a', skin: '#e8c4a0' },
  { shirt: '#22c55e', hair: '#92400e', skin: '#f5d6c0' },
  { shirt: '#eab308', hair: '#431407', skin: '#d4a574' },
  { shirt: '#a855f7', hair: '#fbbf24', skin: '#fcd5b8' },
];

export const TugOfWarKid = ({ index, isPulling, isStraining, side, size = 'small' }: TugOfWarKidProps) => {
  const colors = KID_COLORS[index % KID_COLORS.length];
  const scale = size === 'small' ? 0.6 : 0.8;
  const flipX = side === 'hero' ? -1 : 1;

  return (
    <motion.div
      className="relative"
      style={{ 
        width: 60 * scale, 
        height: 90 * scale,
        transform: `scaleX(${flipX})`,
      }}
      animate={
        isPulling 
          ? { x: side === 'hero' ? [0, -8, 0] : [0, 8, 0], rotate: side === 'hero' ? [0, -10, 0] : [0, 10, 0] }
          : isStraining
          ? { x: side === 'hero' ? [0, 4, 0] : [0, -4, 0] }
          : { y: [0, -2, 0] }
      }
      transition={
        isPulling || isStraining
          ? { duration: 0.3 }
          : { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }
      }
    >
      <svg viewBox="0 0 60 90" width={60 * scale} height={90 * scale}>
        <defs>
          <linearGradient id={`kidShirt-${index}-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.shirt} />
            <stop offset="100%" stopColor={colors.shirt} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="30" cy="87" rx="15" ry="4" fill="#000" opacity="0.2" />

        {/* Legs */}
        <rect x="20" y="55" width="8" height="25" rx="3" fill="#1e40af" />
        <rect x="32" y="55" width="8" height="25" rx="3" fill="#1e40af" />
        
        {/* Feet */}
        <ellipse cx="24" cy="82" rx="6" ry="4" fill="#1a1a1a" />
        <ellipse cx="36" cy="82" rx="6" ry="4" fill="#1a1a1a" />

        {/* Body/Shirt */}
        <rect x="15" y="35" width="30" height="25" rx="5" fill={`url(#kidShirt-${index}-${side})`} />
        
        {/* Arms holding rope */}
        <motion.g
          animate={isPulling ? { rotate: -15 } : isStraining ? { rotate: 5 } : {}}
          style={{ transformOrigin: '15px 42px' }}
        >
          {/* Left arm */}
          <rect x="5" y="38" width="12" height="8" rx="3" fill={colors.skin} />
          {/* Hand */}
          <circle cx="5" cy="42" r="5" fill={colors.skin} />
        </motion.g>
        
        <motion.g
          animate={isPulling ? { rotate: 15 } : isStraining ? { rotate: -5 } : {}}
          style={{ transformOrigin: '45px 42px' }}
        >
          {/* Right arm */}
          <rect x="43" y="38" width="12" height="8" rx="3" fill={colors.skin} />
          {/* Hand */}
          <circle cx="55" cy="42" r="5" fill={colors.skin} />
        </motion.g>

        {/* Head */}
        <circle cx="30" cy="22" r="14" fill={colors.skin} />
        
        {/* Hair */}
        <ellipse cx="30" cy="14" rx="12" ry="8" fill={colors.hair} />
        
        {/* Eyes */}
        <motion.g
          animate={isPulling ? { scaleY: 0.7 } : isStraining ? { scaleY: 0.8 } : {}}
        >
          <circle cx="25" cy="22" r="2.5" fill="#1a1a1a" />
          <circle cx="35" cy="22" r="2.5" fill="#1a1a1a" />
          <circle cx="26" cy="21" r="1" fill="white" />
          <circle cx="36" cy="21" r="1" fill="white" />
        </motion.g>
        
        {/* Mouth */}
        <motion.path
          d={isPulling ? "M25 28 Q30 32 35 28" : isStraining ? "M25 29 Q30 27 35 29" : "M25 28 Q30 30 35 28"}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* Cheeks when straining */}
        {(isPulling || isStraining) && (
          <>
            <circle cx="22" cy="26" r="3" fill="#fca5a5" opacity="0.5" />
            <circle cx="38" cy="26" r="3" fill="#fca5a5" opacity="0.5" />
          </>
        )}
      </svg>
    </motion.div>
  );
};
