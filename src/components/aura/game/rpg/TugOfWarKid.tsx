import { motion } from 'framer-motion';

interface TugOfWarKidProps {
  index: number;
  isPulling: boolean;
  isStraining: boolean;
  side: 'hero' | 'enemy';
  size?: 'small' | 'medium';
}

// Diverse kid appearances - school uniforms style
const KID_VARIANTS = [
  { 
    hair: '#2c1810', hairStyle: 'short', 
    skin: '#f5d6c6', 
    shirt: '#ffffff', shorts: '#1e3a5f',
    socks: '#ffffff', shoes: '#2c2c2c',
    gender: 'boy'
  },
  { 
    hair: '#4a3728', hairStyle: 'ponytail', 
    skin: '#e8c4a0', 
    shirt: '#ffffff', shorts: '#1e3a5f',
    socks: '#ffffff', shoes: '#2c2c2c',
    gender: 'girl'
  },
  { 
    hair: '#1a1a1a', hairStyle: 'curly', 
    skin: '#d4a574', 
    shirt: '#ffffff', shorts: '#1e3a5f',
    socks: '#ffffff', shoes: '#2c2c2c',
    gender: 'boy'
  },
  { 
    hair: '#8b4513', hairStyle: 'braids', 
    skin: '#c68642', 
    shirt: '#ffffff', shorts: '#1e3a5f',
    socks: '#ffffff', shoes: '#2c2c2c',
    gender: 'girl'
  },
  { 
    hair: '#fbbf24', hairStyle: 'spiky', 
    skin: '#fcd5b8', 
    shirt: '#ffffff', shorts: '#1e3a5f',
    socks: '#ffffff', shoes: '#2c2c2c',
    gender: 'boy'
  },
  { 
    hair: '#1a1a1a', hairStyle: 'headband', 
    skin: '#8d5524', 
    shirt: '#ffffff', shorts: '#1e3a5f',
    socks: '#ffffff', shoes: '#2c2c2c',
    gender: 'girl'
  },
];

export const TugOfWarKid = ({ index, isPulling, isStraining, side, size = 'small' }: TugOfWarKidProps) => {
  const variant = KID_VARIANTS[index % KID_VARIANTS.length];
  const scale = size === 'small' ? 0.8 : 1;
  const flipX = side === 'hero' ? 1 : -1;

  // Hair rendering based on style
  const renderHair = () => {
    const hairColor = variant.hair;
    switch (variant.hairStyle) {
      case 'short':
        return (
          <g>
            <ellipse cx="50" cy="18" rx="18" ry="12" fill={hairColor} />
            <path d="M32 22 Q35 15 45 18 L55 18 Q65 15 68 22" fill={hairColor} />
          </g>
        );
      case 'ponytail':
        return (
          <g>
            <ellipse cx="50" cy="18" rx="16" ry="10" fill={hairColor} />
            <ellipse cx="70" cy="28" rx="8" ry="12" fill={hairColor} />
            <circle cx="68" cy="18" r="4" fill={variant.shirt === '#ffffff' ? '#ef4444' : '#3b82f6'} />
          </g>
        );
      case 'curly':
        return (
          <g>
            {[40, 45, 50, 55, 60].map((x, i) => (
              <circle key={i} cx={x} cy={16 + (i % 2) * 3} r={6} fill={hairColor} />
            ))}
            <ellipse cx="50" cy="20" rx="14" ry="8" fill={hairColor} />
          </g>
        );
      case 'braids':
        return (
          <g>
            <ellipse cx="50" cy="18" rx="15" ry="10" fill={hairColor} />
            <rect x="30" y="20" width="6" height="25" rx="3" fill={hairColor} />
            <rect x="64" y="20" width="6" height="25" rx="3" fill={hairColor} />
            <circle cx="33" cy="45" r="4" fill="#ef4444" />
            <circle cx="67" cy="45" r="4" fill="#ef4444" />
          </g>
        );
      case 'spiky':
        return (
          <g>
            <ellipse cx="50" cy="20" rx="14" ry="8" fill={hairColor} />
            {[38, 44, 50, 56, 62].map((x, i) => (
              <path key={i} d={`M${x} 18 L${x + 3} 6 L${x + 6} 18`} fill={hairColor} />
            ))}
          </g>
        );
      case 'headband':
        return (
          <g>
            <ellipse cx="50" cy="18" rx="16" ry="10" fill={hairColor} />
            <path d="M35 24 Q50 18 65 24" stroke="#ef4444" strokeWidth="4" fill="none" />
            <ellipse cx="50" cy="26" rx="14" ry="4" fill={hairColor} />
          </g>
        );
      default:
        return <ellipse cx="50" cy="18" rx="16" ry="10" fill={hairColor} />;
    }
  };

  return (
    <motion.div
      className="relative"
      style={{ 
        width: 100 * scale, 
        height: 140 * scale,
        transform: `scaleX(${flipX})`,
      }}
      animate={
        isPulling 
          ? { 
              x: side === 'hero' ? [0, 8, 0] : [0, -8, 0], 
              rotate: side === 'hero' ? [0, -12, -8] : [0, 12, 8] 
            }
          : isStraining
          ? { 
              x: side === 'hero' ? [0, -4, 0] : [0, 4, 0],
              rotate: side === 'hero' ? [0, 5, 3] : [0, -5, -3]
            }
          : { y: [0, -2, 0] }
      }
      transition={
        isPulling || isStraining
          ? { duration: 0.4, ease: 'easeOut' }
          : { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }
      }
    >
      <svg viewBox="0 0 100 140" width={100 * scale} height={140 * scale}>
        <defs>
          {/* Shirt gradient */}
          <linearGradient id={`kidShirt-${index}-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={variant.shirt} />
            <stop offset="100%" stopColor="#e5e5e5" />
          </linearGradient>
          {/* Skin shadow */}
          <linearGradient id={`skinGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={variant.skin} />
            <stop offset="100%" stopColor={variant.skin} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Shadow on ground */}
        <ellipse cx="50" cy="136" rx="25" ry="6" fill="#000" opacity="0.25" />

        {/* Back leg (further) */}
        <g transform={isPulling ? 'translate(-3, 0)' : isStraining ? 'translate(2, 0)' : ''}>
          {/* Leg */}
          <path 
            d="M42 85 L38 108 L40 118" 
            stroke={variant.shorts} 
            strokeWidth="12" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Sock */}
          <rect x="34" y="108" width="12" height="14" rx="4" fill={variant.socks} />
          {/* Shoe */}
          <ellipse cx="38" cy="126" rx="10" ry="6" fill={variant.shoes} />
          <ellipse cx="34" cy="126" rx="4" ry="3" fill="#1a1a1a" />
        </g>

        {/* Front leg */}
        <g transform={isPulling ? 'translate(3, 0)' : isStraining ? 'translate(-2, 0)' : ''}>
          {/* Leg */}
          <path 
            d="M58 85 L62 108 L60 118" 
            stroke={variant.shorts} 
            strokeWidth="12" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Sock */}
          <rect x="54" y="108" width="12" height="14" rx="4" fill={variant.socks} />
          {/* Shoe */}
          <ellipse cx="62" cy="126" rx="10" ry="6" fill={variant.shoes} />
          <ellipse cx="66" cy="126" rx="4" ry="3" fill="#1a1a1a" />
        </g>

        {/* Body/Torso - leaning back for pulling pose */}
        <g transform={isPulling ? 'rotate(-15, 50, 85)' : isStraining ? 'rotate(8, 50, 85)' : ''}>
          {/* Shirt body */}
          <path 
            d="M35 55 L35 88 Q50 92 65 88 L65 55 Q50 50 35 55" 
            fill={`url(#kidShirt-${index}-${side})`}
            stroke="#d4d4d4"
            strokeWidth="1"
          />
          {/* Collar */}
          <path d="M42 55 L50 62 L58 55" fill="none" stroke="#d4d4d4" strokeWidth="2" />
          
          {/* Arms extended forward holding rope */}
          <motion.g
            animate={isPulling ? { rotate: -20 } : isStraining ? { rotate: 10 } : {}}
            style={{ transformOrigin: '35px 60px' }}
          >
            {/* Left arm */}
            <path 
              d="M35 58 L20 65 L8 62" 
              stroke={variant.skin} 
              strokeWidth="10" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Left hand gripping rope */}
            <g transform="translate(6, 58)">
              <ellipse cx="0" cy="4" rx="7" ry="6" fill={variant.skin} />
              {/* Fingers wrapped around rope */}
              <path d="M-4 0 Q-6 4 -4 8" stroke={variant.skin} strokeWidth="3" fill="none" />
              <path d="M0 -1 Q-2 4 0 9" stroke={variant.skin} strokeWidth="3" fill="none" />
              <path d="M4 0 Q2 4 4 8" stroke={variant.skin} strokeWidth="3" fill="none" />
            </g>
          </motion.g>

          <motion.g
            animate={isPulling ? { rotate: -15 } : isStraining ? { rotate: 8 } : {}}
            style={{ transformOrigin: '65px 60px' }}
          >
            {/* Right arm */}
            <path 
              d="M65 58 L78 62 L88 58" 
              stroke={variant.skin} 
              strokeWidth="10" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Right hand gripping */}
            <g transform="translate(90, 55)">
              <ellipse cx="0" cy="4" rx="7" ry="6" fill={variant.skin} />
              <path d="M-4 0 Q-6 4 -4 8" stroke={variant.skin} strokeWidth="3" fill="none" />
              <path d="M0 -1 Q-2 4 0 9" stroke={variant.skin} strokeWidth="3" fill="none" />
              <path d="M4 0 Q2 4 4 8" stroke={variant.skin} strokeWidth="3" fill="none" />
            </g>
          </motion.g>
        </g>

        {/* Head */}
        <g transform={isPulling ? 'translate(0, -2) rotate(-5, 50, 35)' : isStraining ? 'translate(0, 1) rotate(3, 50, 35)' : ''}>
          {/* Face */}
          <ellipse cx="50" cy="35" rx="18" ry="20" fill={`url(#skinGrad-${index})`} />
          
          {/* Hair */}
          {renderHair()}
          
          {/* Ears */}
          <ellipse cx="32" cy="35" rx="4" ry="5" fill={variant.skin} />
          <ellipse cx="68" cy="35" rx="4" ry="5" fill={variant.skin} />
          
          {/* Eyes */}
          <motion.g
            animate={isPulling ? { scaleY: 0.7 } : isStraining ? { scaleY: 0.8 } : {}}
            style={{ transformOrigin: '50px 35px' }}
          >
            {/* Eye whites */}
            <ellipse cx="43" cy="35" rx="5" ry="4" fill="white" />
            <ellipse cx="57" cy="35" rx="5" ry="4" fill="white" />
            {/* Pupils */}
            <circle cx="44" cy="35" r="2.5" fill="#1a1a1a" />
            <circle cx="58" cy="35" r="2.5" fill="#1a1a1a" />
            {/* Eye highlights */}
            <circle cx="45" cy="34" r="1" fill="white" />
            <circle cx="59" cy="34" r="1" fill="white" />
          </motion.g>
          
          {/* Eyebrows - determined expression */}
          <motion.g
            animate={isPulling || isStraining ? { y: -2 } : {}}
          >
            <path d="M38 28 L48 30" stroke={variant.hair} strokeWidth="2" strokeLinecap="round" />
            <path d="M52 30 L62 28" stroke={variant.hair} strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          
          {/* Nose */}
          <ellipse cx="50" cy="40" rx="2" ry="1.5" fill={variant.skin} opacity="0.7" />
          
          {/* Mouth - effort expression */}
          <motion.g>
            {isPulling ? (
              // Gritting teeth
              <g>
                <path d="M43 47 L57 47" stroke="#1a1a1a" strokeWidth="2" />
                <path d="M44 47 L44 50 M48 47 L48 50 M52 47 L52 50 M56 47 L56 50" stroke="white" strokeWidth="1.5" />
              </g>
            ) : isStraining ? (
              // Open mouth strain
              <ellipse cx="50" cy="48" rx="5" ry="4" fill="#8b0000" />
            ) : (
              // Slight smile
              <path d="M44 46 Q50 50 56 46" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </motion.g>
          
          {/* Rosy cheeks when straining */}
          {(isPulling || isStraining) && (
            <>
              <ellipse cx="36" cy="42" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
              <ellipse cx="64" cy="42" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
            </>
          )}
          
          {/* Sweat drops when straining */}
          {isStraining && (
            <motion.g
              animate={{ y: [0, 10], opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <path d="M28 30 Q26 35 28 38" fill="#60a5fa" />
              <path d="M72 32 Q74 37 72 40" fill="#60a5fa" />
            </motion.g>
          )}
        </g>
      </svg>
    </motion.div>
  );
};
