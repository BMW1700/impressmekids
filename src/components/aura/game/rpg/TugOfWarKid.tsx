import { motion } from 'framer-motion';

interface TugOfWarKidProps {
  index: number;
  isPulling: boolean;
  isStraining: boolean;
  side: 'hero' | 'enemy';
  size?: 'small' | 'medium' | 'large';
}

// Diverse kid appearances - school uniforms style like the reference image
const KID_VARIANTS = [
  { 
    hair: '#2c1810', hairStyle: 'short', 
    skin: '#f5d6c6', 
    shirt: '#ffffff', shorts: '#2d5a27', // green shorts
    socks: '#ffffff', sockStripe: '#dc2626', shoes: '#1a1a1a',
    gender: 'boy', accessory: 'suspenders'
  },
  { 
    hair: '#4a3728', hairStyle: 'ponytail', 
    skin: '#e8c4a0', 
    shirt: '#ffffff', shorts: '#8b4513', // brown shorts
    socks: '#ffffff', sockStripe: '#2563eb', shoes: '#8b4513',
    gender: 'girl', accessory: 'headband'
  },
  { 
    hair: '#1a1a1a', hairStyle: 'curly', 
    skin: '#d4a574', 
    shirt: '#ffffff', shorts: '#1e3a5f', // blue shorts
    socks: '#ffffff', sockStripe: '#16a34a', shoes: '#2c2c2c',
    gender: 'boy', accessory: 'none'
  },
  { 
    hair: '#8b4513', hairStyle: 'braids', 
    skin: '#c68642', 
    shirt: '#ffffff', shorts: '#6b21a8', // purple plaid
    socks: '#ffffff', sockStripe: '#eab308', shoes: '#4a3728',
    gender: 'girl', accessory: 'ribbons'
  },
  { 
    hair: '#fbbf24', hairStyle: 'spiky', 
    skin: '#fcd5b8', 
    shirt: '#ffffff', shorts: '#dc2626', // red shorts
    socks: '#ffffff', sockStripe: '#1d4ed8', shoes: '#374151',
    gender: 'boy', accessory: 'none'
  },
  { 
    hair: '#1a1a1a', hairStyle: 'twintails', 
    skin: '#8d5524', 
    shirt: '#ffffff', shorts: '#059669', // teal shorts
    socks: '#ffffff', sockStripe: '#f97316', shoes: '#1f2937',
    gender: 'girl', accessory: 'bows'
  },
];

export const TugOfWarKid = ({ index, isPulling, isStraining, side, size = 'medium' }: TugOfWarKidProps) => {
  const variant = KID_VARIANTS[index % KID_VARIANTS.length];
  
  // Much larger sizes to match reference
  const sizeConfig = {
    small: { width: 90, height: 130 },
    medium: { width: 110, height: 160 },
    large: { width: 130, height: 190 }
  };
  
  const { width, height } = sizeConfig[size];
  const flipX = side === 'hero' ? -1 : 1; // Hero faces left (toward rope), enemy faces right

  // Hair rendering based on style
  const renderHair = () => {
    const hairColor = variant.hair;
    switch (variant.hairStyle) {
      case 'short':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="20" ry="14" fill={hairColor} />
            <path d="M30 22 Q35 12 50 16 Q65 12 70 22" fill={hairColor} />
          </g>
        );
      case 'ponytail':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="18" ry="12" fill={hairColor} />
            <ellipse cx="72" cy="30" rx="10" ry="16" fill={hairColor} />
            <circle cx="70" cy="16" r="5" fill="#ef4444" /> {/* Hair tie */}
          </g>
        );
      case 'curly':
        return (
          <g>
            {[38, 44, 50, 56, 62].map((x, i) => (
              <circle key={i} cx={x} cy={14 + (i % 2) * 4} r={8} fill={hairColor} />
            ))}
            <ellipse cx="50" cy="18" rx="16" ry="10" fill={hairColor} />
          </g>
        );
      case 'braids':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="17" ry="12" fill={hairColor} />
            <rect x="28" y="20" width="7" height="30" rx="3.5" fill={hairColor} />
            <rect x="65" y="20" width="7" height="30" rx="3.5" fill={hairColor} />
            <circle cx="31" cy="50" r="5" fill="#ec4899" />
            <circle cx="69" cy="50" r="5" fill="#ec4899" />
          </g>
        );
      case 'spiky':
        return (
          <g>
            <ellipse cx="50" cy="18" rx="16" ry="10" fill={hairColor} />
            {[36, 43, 50, 57, 64].map((x, i) => (
              <path key={i} d={`M${x} 16 L${x + 4} 2 L${x + 8} 16`} fill={hairColor} />
            ))}
          </g>
        );
      case 'twintails':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="17" ry="11" fill={hairColor} />
            <ellipse cx="28" cy="28" rx="8" ry="18" fill={hairColor} />
            <ellipse cx="72" cy="28" rx="8" ry="18" fill={hairColor} />
            <circle cx="32" cy="14" r="4" fill="#f472b6" />
            <circle cx="68" cy="14" r="4" fill="#f472b6" />
          </g>
        );
      default:
        return <ellipse cx="50" cy="16" rx="18" ry="12" fill={hairColor} />;
    }
  };

  // Render accessory
  const renderAccessory = () => {
    if (variant.accessory === 'suspenders') {
      return (
        <g>
          <path d="M40 55 L42 85" stroke="#374151" strokeWidth="3" fill="none" />
          <path d="M60 55 L58 85" stroke="#374151" strokeWidth="3" fill="none" />
          <rect x="38" y="52" width="6" height="4" fill="#f59e0b" rx="1" />
          <rect x="56" y="52" width="6" height="4" fill="#f59e0b" rx="1" />
        </g>
      );
    }
    if (variant.accessory === 'headband') {
      return <path d="M32 22 Q50 16 68 22" stroke="#ef4444" strokeWidth="5" fill="none" strokeLinecap="round" />;
    }
    return null;
  };

  return (
    <motion.div
      className="relative"
      style={{ 
        width, 
        height,
        transform: `scaleX(${flipX})`,
      }}
      animate={
        isPulling 
          ? { 
              x: side === 'hero' ? [0, -12, -6] : [0, 12, 6], 
              rotate: side === 'hero' ? [-20, -25, -20] : [20, 25, 20] 
            }
          : isStraining
          ? { 
              x: side === 'hero' ? [0, 8, 4] : [0, -8, -4],
              rotate: side === 'hero' ? [-5, 5, 0] : [5, -5, 0]
            }
          : { y: [0, -3, 0], rotate: side === 'hero' ? -12 : 12 }
      }
      transition={
        isPulling || isStraining
          ? { duration: 0.35, ease: 'easeOut' }
          : { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }
      }
    >
      <svg viewBox="0 0 100 140" width={width} height={height}>
        <defs>
          {/* Shirt gradient */}
          <linearGradient id={`kidShirt-${index}-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={variant.shirt} />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          {/* Skin gradient */}
          <linearGradient id={`skinGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={variant.skin} />
            <stop offset="100%" stopColor={variant.skin} stopOpacity="0.85" />
          </linearGradient>
          {/* Shorts gradient */}
          <linearGradient id={`shortsGrad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={variant.shorts} />
            <stop offset="100%" stopColor={variant.shorts} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Shadow on ground */}
        <ellipse cx="50" cy="136" rx="30" ry="7" fill="#000" opacity="0.3" />

        {/* LEGS - Bent at knee in pulling stance */}
        {/* Back leg */}
        <g>
          {/* Thigh */}
          <path 
            d={isPulling ? "M42 90 L35 108" : isStraining ? "M42 90 L48 108" : "M42 90 L38 108"}
            stroke={`url(#shortsGrad-${index})`}
            strokeWidth="16" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Shin */}
          <path 
            d={isPulling ? "M35 108 L30 126" : isStraining ? "M48 108 L52 126" : "M38 108 L36 126"}
            stroke={variant.skin}
            strokeWidth="12" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Sock */}
          <rect x={isPulling ? 22 : isStraining ? 44 : 28} y="115" width="16" height="16" rx="4" fill={variant.socks} />
          <rect x={isPulling ? 22 : isStraining ? 44 : 28} y="120" width="16" height="3" fill={variant.sockStripe} />
          {/* Shoe */}
          <ellipse cx={isPulling ? 28 : isStraining ? 52 : 34} cy="132" rx="14" ry="7" fill={variant.shoes} />
          <ellipse cx={isPulling ? 22 : isStraining ? 58 : 28} cy="132" rx="5" ry="4" fill="#0f0f0f" />
        </g>

        {/* Front leg */}
        <g>
          {/* Thigh */}
          <path 
            d={isPulling ? "M58 90 L65 108" : isStraining ? "M58 90 L52 108" : "M58 90 L62 108"}
            stroke={`url(#shortsGrad-${index})`}
            strokeWidth="16" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Shin */}
          <path 
            d={isPulling ? "M65 108 L70 126" : isStraining ? "M52 108 L48 126" : "M62 108 L64 126"}
            stroke={variant.skin}
            strokeWidth="12" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Sock */}
          <rect x={isPulling ? 62 : isStraining ? 40 : 56} y="115" width="16" height="16" rx="4" fill={variant.socks} />
          <rect x={isPulling ? 62 : isStraining ? 40 : 56} y="120" width="16" height="3" fill={variant.sockStripe} />
          {/* Shoe */}
          <ellipse cx={isPulling ? 72 : isStraining ? 48 : 66} cy="132" rx="14" ry="7" fill={variant.shoes} />
          <ellipse cx={isPulling ? 78 : isStraining ? 42 : 72} cy="132" rx="5" ry="4" fill="#0f0f0f" />
        </g>

        {/* BODY/TORSO - Leaning back when pulling */}
        <g transform={isPulling ? 'rotate(-18, 50, 90)' : isStraining ? 'rotate(10, 50, 90)' : 'rotate(-8, 50, 90)'}>
          {/* Shirt body */}
          <path 
            d="M32 52 L32 92 Q50 96 68 92 L68 52 Q50 46 32 52" 
            fill={`url(#kidShirt-${index}-${side})`}
            stroke="#d4d4d4"
            strokeWidth="1.5"
          />
          {/* Collar */}
          <path d="M40 52 L50 60 L60 52" fill="none" stroke="#c4c4c4" strokeWidth="2.5" />
          {/* Shirt buttons */}
          <circle cx="50" cy="66" r="2" fill="#d4d4d4" />
          <circle cx="50" cy="76" r="2" fill="#d4d4d4" />
          
          {/* Suspenders or other accessory */}
          {renderAccessory()}
          
          {/* ARMS EXTENDED FORWARD - Gripping the rope! */}
          {/* Left arm */}
          <motion.g
            animate={isPulling ? { rotate: -25 } : isStraining ? { rotate: 15 } : { rotate: -10 }}
            style={{ transformOrigin: '32px 58px' }}
          >
            {/* Upper arm */}
            <path 
              d="M32 58 L18 62 L4 58" 
              stroke={variant.skin} 
              strokeWidth="14" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand gripping rope */}
            <g transform="translate(-2, 52)">
              <ellipse cx="0" cy="6" rx="10" ry="8" fill={variant.skin} />
              {/* Fingers wrapped around rope */}
              <path d="M-6 1 Q-9 6 -6 11" stroke={variant.skin} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M-1 0 Q-4 6 -1 12" stroke={variant.skin} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M4 1 Q1 6 4 11" stroke={variant.skin} strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Knuckle details */}
              <ellipse cx="-4" cy="3" rx="2" ry="1.5" fill={variant.skin} opacity="0.7" />
              <ellipse cx="2" cy="3" rx="2" ry="1.5" fill={variant.skin} opacity="0.7" />
            </g>
          </motion.g>

          {/* Right arm */}
          <motion.g
            animate={isPulling ? { rotate: -20 } : isStraining ? { rotate: 12 } : { rotate: -8 }}
            style={{ transformOrigin: '68px 58px' }}
          >
            {/* Upper arm */}
            <path 
              d="M68 58 L82 55 L94 50" 
              stroke={variant.skin} 
              strokeWidth="14" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand gripping */}
            <g transform="translate(98, 44)">
              <ellipse cx="0" cy="6" rx="10" ry="8" fill={variant.skin} />
              <path d="M-6 1 Q-9 6 -6 11" stroke={variant.skin} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M-1 0 Q-4 6 -1 12" stroke={variant.skin} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M4 1 Q1 6 4 11" stroke={variant.skin} strokeWidth="4" fill="none" strokeLinecap="round" />
              <ellipse cx="-4" cy="3" rx="2" ry="1.5" fill={variant.skin} opacity="0.7" />
              <ellipse cx="2" cy="3" rx="2" ry="1.5" fill={variant.skin} opacity="0.7" />
            </g>
          </motion.g>
        </g>

        {/* HEAD */}
        <g transform={isPulling ? 'translate(-4, -4) rotate(-8, 50, 35)' : isStraining ? 'translate(3, 2) rotate(5, 50, 35)' : 'translate(-2, 0) rotate(-3, 50, 35)'}>
          {/* Face */}
          <ellipse cx="50" cy="35" rx="22" ry="24" fill={`url(#skinGrad-${index})`} />
          
          {/* Hair */}
          {renderHair()}
          
          {/* Ears */}
          <ellipse cx="28" cy="35" rx="5" ry="6" fill={variant.skin} />
          <ellipse cx="72" cy="35" rx="5" ry="6" fill={variant.skin} />
          
          {/* Eyes */}
          <motion.g
            animate={isPulling ? { scaleY: 0.6 } : isStraining ? { scaleY: 0.75 } : {}}
            style={{ transformOrigin: '50px 35px' }}
          >
            {/* Eye whites */}
            <ellipse cx="40" cy="35" rx="7" ry="5" fill="white" />
            <ellipse cx="60" cy="35" rx="7" ry="5" fill="white" />
            {/* Pupils */}
            <circle cx="41" cy="35" r="3.5" fill="#1a1a1a" />
            <circle cx="61" cy="35" r="3.5" fill="#1a1a1a" />
            {/* Eye highlights */}
            <circle cx="42.5" cy="33.5" r="1.5" fill="white" />
            <circle cx="62.5" cy="33.5" r="1.5" fill="white" />
          </motion.g>
          
          {/* Eyebrows - intense concentration */}
          <motion.g
            animate={isPulling || isStraining ? { y: -3 } : {}}
          >
            <path d="M33 26 L47 30" stroke={variant.hair} strokeWidth="3" strokeLinecap="round" />
            <path d="M53 30 L67 26" stroke={variant.hair} strokeWidth="3" strokeLinecap="round" />
          </motion.g>
          
          {/* Nose */}
          <ellipse cx="50" cy="42" rx="3" ry="2" fill={variant.skin} opacity="0.7" />
          
          {/* Mouth - effort expression */}
          <motion.g>
            {isPulling ? (
              // Gritting teeth - clenched jaw effort!
              <g>
                <rect x="41" y="48" width="18" height="8" fill="#1a1a1a" rx="2" />
                <path d="M42 52 L58 52" stroke="white" strokeWidth="2" />
                <rect x="42" y="49" width="3" height="5" fill="white" />
                <rect x="46" y="49" width="3" height="5" fill="white" />
                <rect x="50" y="49" width="3" height="5" fill="white" />
                <rect x="54" y="49" width="3" height="5" fill="white" />
              </g>
            ) : isStraining ? (
              // Wide open mouth strain - yelling!
              <g>
                <ellipse cx="50" cy="50" rx="8" ry="6" fill="#5c1a1a" />
                <ellipse cx="50" cy="48" rx="6" ry="2" fill="white" /> {/* Top teeth */}
                <ellipse cx="50" cy="54" rx="5" ry="3" fill="#ef4444" /> {/* Tongue */}
              </g>
            ) : (
              // Determined smile
              <path d="M42 48 Q50 54 58 48" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </motion.g>
          
          {/* Rosy cheeks when straining */}
          {(isPulling || isStraining) && (
            <>
              <ellipse cx="32" cy="44" rx="7" ry="4" fill="#fca5a5" opacity="0.6" />
              <ellipse cx="68" cy="44" rx="7" ry="4" fill="#fca5a5" opacity="0.6" />
            </>
          )}
          
          {/* Sweat drops when straining hard */}
          {isStraining && (
            <motion.g
              animate={{ y: [0, 15], opacity: [1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            >
              <path d="M24 28 Q22 34 24 38 Q26 34 24 28" fill="#60a5fa" />
              <path d="M76 30 Q78 36 76 40 Q74 36 76 30" fill="#60a5fa" />
            </motion.g>
          )}
          
          {/* Extra sweat when pulling hard */}
          {isPulling && (
            <motion.g
              animate={{ y: [0, 12], opacity: [0.8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            >
              <path d="M26 32 Q24 38 26 42 Q28 38 26 32" fill="#60a5fa" />
            </motion.g>
          )}
        </g>
      </svg>
    </motion.div>
  );
};
