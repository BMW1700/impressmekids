import { motion } from 'framer-motion';

interface TugOfWarKidProps {
  index: number;
  isPulling: boolean;
  isStraining: boolean;
  side: 'hero' | 'enemy';
  size?: 'small' | 'medium' | 'large';
}

// Diverse kid appearances - school uniforms style
const KID_VARIANTS = [
  { 
    hair: '#2c1810', hairStyle: 'short', 
    skin: '#f5d6c6', 
    shirt: '#ffffff', shorts: '#2d5a27',
    socks: '#ffffff', sockStripe: '#dc2626', shoes: '#1a1a1a',
    accessory: 'suspenders'
  },
  { 
    hair: '#4a3728', hairStyle: 'ponytail', 
    skin: '#e8c4a0', 
    shirt: '#ffffff', shorts: '#8b4513',
    socks: '#ffffff', sockStripe: '#2563eb', shoes: '#8b4513',
    accessory: 'headband'
  },
  { 
    hair: '#1a1a1a', hairStyle: 'curly', 
    skin: '#d4a574', 
    shirt: '#ffffff', shorts: '#1e3a5f',
    socks: '#ffffff', sockStripe: '#16a34a', shoes: '#2c2c2c',
    accessory: 'none'
  },
  { 
    hair: '#8b4513', hairStyle: 'braids', 
    skin: '#c68642', 
    shirt: '#ffffff', shorts: '#6b21a8',
    socks: '#ffffff', sockStripe: '#eab308', shoes: '#4a3728',
    accessory: 'ribbons'
  },
  { 
    hair: '#fbbf24', hairStyle: 'spiky', 
    skin: '#fcd5b8', 
    shirt: '#ffffff', shorts: '#dc2626',
    socks: '#ffffff', sockStripe: '#1d4ed8', shoes: '#374151',
    accessory: 'none'
  },
  { 
    hair: '#1a1a1a', hairStyle: 'twintails', 
    skin: '#8d5524', 
    shirt: '#ffffff', shorts: '#059669',
    socks: '#ffffff', sockStripe: '#f97316', shoes: '#1f2937',
    accessory: 'bows'
  },
];

export const TugOfWarKid = ({ index, isPulling, isStraining, side, size = 'medium' }: TugOfWarKidProps) => {
  const variant = KID_VARIANTS[index % KID_VARIANTS.length];
  
  const sizeConfig = {
    small: { width: 70, height: 100 },
    medium: { width: 90, height: 125 },
    large: { width: 110, height: 150 }
  };
  
  const { width, height } = sizeConfig[size];
  // Hero side: facing left (toward rope), Enemy side: facing right
  const flipX = side === 'hero' ? 1 : -1;

  // Hair rendering
  const renderHair = () => {
    const hairColor = variant.hair;
    switch (variant.hairStyle) {
      case 'short':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="14" ry="11" fill={hairColor} />
            <path d="M36 22 Q43 12 50 15 Q57 12 64 22" fill={hairColor} />
          </g>
        );
      case 'ponytail':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="12" ry="10" fill={hairColor} />
            <ellipse cx="65" cy="28" rx="6" ry="10" fill={hairColor} />
            <circle cx="62" cy="16" r="3" fill="#ef4444" />
          </g>
        );
      case 'curly':
        return (
          <g>
            {[42, 46, 50, 54, 58].map((x, i) => (
              <circle key={i} cx={x} cy={12 + (i % 2) * 3} r={5} fill={hairColor} />
            ))}
            <ellipse cx="50" cy="16" rx="11" ry="8" fill={hairColor} />
          </g>
        );
      case 'braids':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="12" ry="10" fill={hairColor} />
            <rect x="35" y="20" width="5" height="20" rx="2" fill={hairColor} />
            <rect x="60" y="20" width="5" height="20" rx="2" fill={hairColor} />
            <circle cx="37" cy="40" r="3" fill="#ec4899" />
            <circle cx="63" cy="40" r="3" fill="#ec4899" />
          </g>
        );
      case 'spiky':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="11" ry="8" fill={hairColor} />
            {[42, 46, 50, 54, 58].map((x, i) => (
              <path key={i} d={`M${x} 14 L${x + 2} 4 L${x + 4} 14`} fill={hairColor} />
            ))}
          </g>
        );
      case 'twintails':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="12" ry="9" fill={hairColor} />
            <ellipse cx="36" cy="26" rx="5" ry="12" fill={hairColor} />
            <ellipse cx="64" cy="26" rx="5" ry="12" fill={hairColor} />
            <circle cx="39" cy="14" r="3" fill="#f472b6" />
            <circle cx="61" cy="14" r="3" fill="#f472b6" />
          </g>
        );
      default:
        return <ellipse cx="50" cy="16" rx="13" ry="10" fill={hairColor} />;
    }
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
          ? { x: [-4, -8, -5], rotate: [-8, -12, -9] }
          : isStraining
          ? { x: [2, 5, 3], rotate: [4, 7, 5] }
          : { y: [0, -1, 0], rotate: -5 }
      }
      transition={
        isPulling || isStraining
          ? { duration: 0.3, ease: 'easeOut' }
          : { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }
      }
    >
      {/* Simplified viewBox - character body only, no extended arms */}
      <svg viewBox="0 0 100 115" width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`kidShirt-${index}-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={variant.shirt} />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          <linearGradient id={`skinGrad-${index}-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={variant.skin} />
            <stop offset="100%" stopColor={variant.skin} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={`shortsGrad-${index}-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={variant.shorts} />
            <stop offset="100%" stopColor={variant.shorts} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Shadow on ground */}
        <ellipse cx="50" cy="112" rx="22" ry="5" fill="#000" opacity="0.25" />

        {/* === LEGS - Braced pulling stance === */}
        {/* Back leg */}
        <g>
          <path 
            d={isPulling ? "M45 74 L38 90" : isStraining ? "M45 74 L52 90" : "M45 74 L42 90"}
            stroke={`url(#shortsGrad-${index}-${side})`}
            strokeWidth="11" 
            strokeLinecap="round"
            fill="none"
          />
          <path 
            d={isPulling ? "M38 90 L34 105" : isStraining ? "M52 90 L55 105" : "M42 90 L40 105"}
            stroke={variant.skin}
            strokeWidth="9" 
            strokeLinecap="round"
            fill="none"
          />
          <rect x={isPulling ? 28 : isStraining ? 49 : 34} y="98" width="11" height="11" rx="2" fill={variant.socks} />
          <rect x={isPulling ? 28 : isStraining ? 49 : 34} y="101" width="11" height="2.5" fill={variant.sockStripe} />
          <ellipse cx={isPulling ? 33 : isStraining ? 55 : 40} cy="110" rx="10" ry="5" fill={variant.shoes} />
        </g>

        {/* Front leg */}
        <g>
          <path 
            d={isPulling ? "M55 74 L60 90" : isStraining ? "M55 74 L50 90" : "M55 74 L57 90"}
            stroke={`url(#shortsGrad-${index}-${side})`}
            strokeWidth="11" 
            strokeLinecap="round"
            fill="none"
          />
          <path 
            d={isPulling ? "M60 90 L64 105" : isStraining ? "M50 90 L48 105" : "M57 90 L58 105"}
            stroke={variant.skin}
            strokeWidth="9" 
            strokeLinecap="round"
            fill="none"
          />
          <rect x={isPulling ? 58 : isStraining ? 42 : 52} y="98" width="11" height="11" rx="2" fill={variant.socks} />
          <rect x={isPulling ? 58 : isStraining ? 42 : 52} y="101" width="11" height="2.5" fill={variant.sockStripe} />
          <ellipse cx={isPulling ? 64 : isStraining ? 48 : 58} cy="110" rx="10" ry="5" fill={variant.shoes} />
        </g>

        {/* === BODY/TORSO === */}
        <g transform={isPulling ? 'rotate(-10, 50, 74)' : isStraining ? 'rotate(6, 50, 74)' : 'rotate(-4, 50, 74)'}>
          {/* Shirt body */}
          <path 
            d="M38 44 L38 76 Q50 79 62 76 L62 44 Q50 39 38 44" 
            fill={`url(#kidShirt-${index}-${side})`}
            stroke="#d4d4d4"
            strokeWidth="1"
          />
          {/* Collar */}
          <path d="M43 44 L50 50 L57 44" fill="none" stroke="#c4c4c4" strokeWidth="1.5" />
          {/* Buttons */}
          <circle cx="50" cy="54" r="1.2" fill="#d4d4d4" />
          <circle cx="50" cy="62" r="1.2" fill="#d4d4d4" />

          {/* Suspenders if applicable */}
          {variant.accessory === 'suspenders' && (
            <g>
              <path d="M43 46 L45 70" stroke="#374151" strokeWidth="2" fill="none" />
              <path d="M57 46 L55 70" stroke="#374151" strokeWidth="2" fill="none" />
              <rect x="41" y="44" width="4" height="2.5" fill="#f59e0b" rx="0.5" />
              <rect x="55" y="44" width="4" height="2.5" fill="#f59e0b" rx="0.5" />
            </g>
          )}
          {variant.accessory === 'headband' && (
            <path d="M38 22 Q50 17 62 22" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
          )}

          {/* === ARMS - Simple pulling pose, bent at sides === */}
          {/* Back arm */}
          <motion.path
            d={isPulling 
              ? "M38 48 L30 52 L25 48" 
              : isStraining 
              ? "M38 48 L34 55 L30 52" 
              : "M38 48 L32 52 L28 50"}
            stroke={variant.skin}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Back hand */}
          <circle cx={isPulling ? 24 : isStraining ? 29 : 27} cy={isPulling ? 47 : isStraining ? 51 : 49} r="5" fill={variant.skin} />

          {/* Front arm */}
          <motion.path
            d={isPulling 
              ? "M38 54 L28 58 L22 55" 
              : isStraining 
              ? "M38 54 L32 60 L28 58" 
              : "M38 54 L30 58 L26 56"}
            stroke={variant.skin}
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Front hand */}
          <circle cx={isPulling ? 21 : isStraining ? 27 : 25} cy={isPulling ? 54 : isStraining ? 57 : 55} r="6" fill={variant.skin} />
        </g>

        {/* === HEAD === */}
        <g transform={isPulling ? 'translate(-2, -2) rotate(-4, 50, 28)' : isStraining ? 'translate(1, 0) rotate(3, 50, 28)' : 'translate(-0.5, 0) rotate(-1.5, 50, 28)'}>
          {/* Face */}
          <ellipse cx="50" cy="28" rx="16" ry="17" fill={`url(#skinGrad-${index}-${side})`} />
          
          {/* Hair */}
          {renderHair()}
          
          {/* Ears */}
          <ellipse cx="34" cy="28" rx="3" ry="4" fill={variant.skin} />
          <ellipse cx="66" cy="28" rx="3" ry="4" fill={variant.skin} />
          
          {/* Eyes */}
          <motion.g
            animate={isPulling ? { scaleY: 0.6 } : isStraining ? { scaleY: 0.7 } : {}}
            style={{ transformOrigin: '50px 28px' }}
          >
            <ellipse cx="44" cy="28" rx="4.5" ry="3.5" fill="white" />
            <ellipse cx="56" cy="28" rx="4.5" ry="3.5" fill="white" />
            <circle cx="45" cy="28" r="2.2" fill="#1a1a1a" />
            <circle cx="57" cy="28" r="2.2" fill="#1a1a1a" />
            <circle cx="45.5" cy="27" r="0.9" fill="white" />
            <circle cx="57.5" cy="27" r="0.9" fill="white" />
          </motion.g>
          
          {/* Eyebrows */}
          <motion.g animate={isPulling || isStraining ? { y: -1.5 } : {}}>
            <path d="M39 23 L48 25" stroke={variant.hair} strokeWidth="2" strokeLinecap="round" />
            <path d="M52 25 L61 23" stroke={variant.hair} strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          
          {/* Nose */}
          <ellipse cx="50" cy="33" rx="2" ry="1.5" fill={variant.skin} opacity="0.6" />
          
          {/* Mouth */}
          {isPulling ? (
            <g>
              <rect x="45" y="37" width="10" height="5" fill="#1a1a1a" rx="1.5" />
              <path d="M46 39 L54 39" stroke="white" strokeWidth="1" />
            </g>
          ) : isStraining ? (
            <g>
              <ellipse cx="50" cy="39" rx="5" ry="3.5" fill="#5c1a1a" />
              <ellipse cx="50" cy="37.5" rx="3.5" ry="1.5" fill="white" />
            </g>
          ) : (
            <path d="M46 37 Q50 41 54 37" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
          )}
          
          {/* Rosy cheeks when straining */}
          {(isPulling || isStraining) && (
            <>
              <ellipse cx="38" cy="33" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />
              <ellipse cx="62" cy="33" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />
            </>
          )}
          
          {/* Sweat */}
          {isStraining && (
            <motion.g
              animate={{ y: [0, 10], opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <path d="M33 22 Q31 27 33 30 Q35 27 33 22" fill="#60a5fa" />
            </motion.g>
          )}
        </g>
      </svg>
    </motion.div>
  );
};
