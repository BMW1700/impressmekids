import { motion } from 'framer-motion';

interface TugOfWarKidProps {
  index: number;
  isPulling: boolean;
  isStraining: boolean;
  side: 'hero' | 'enemy';
  size?: 'small' | 'medium' | 'large';
}

// Diverse kid appearances - school uniforms style (including Black girl character!)
const KID_VARIANTS = [
  { 
    hair: '#2c1810', hairStyle: 'short', 
    skin: '#f5d6c6', 
    shirt: '#ffffff', shorts: '#2d5a27',
    socks: '#ffffff', sockStripe: '#dc2626', shoes: '#1a1a1a',
  },
  { 
    hair: '#4a3728', hairStyle: 'ponytail', 
    skin: '#e8c4a0', 
    shirt: '#ffffff', shorts: '#8b4513',
    socks: '#ffffff', sockStripe: '#2563eb', shoes: '#8b4513',
  },
  { 
    // Black girl with puffs hairstyle
    hair: '#1a1a1a', hairStyle: 'puffs', 
    skin: '#8d5524', 
    shirt: '#ffffff', shorts: '#be185d',
    socks: '#ffffff', sockStripe: '#ec4899', shoes: '#1f2937',
  },
  { 
    hair: '#8b4513', hairStyle: 'braids', 
    skin: '#c68642', 
    shirt: '#ffffff', shorts: '#6b21a8',
    socks: '#ffffff', sockStripe: '#eab308', shoes: '#4a3728',
  },
  { 
    hair: '#fbbf24', hairStyle: 'spiky', 
    skin: '#fcd5b8', 
    shirt: '#ffffff', shorts: '#dc2626',
    socks: '#ffffff', sockStripe: '#1d4ed8', shoes: '#374151',
  },
  { 
    // Another Black girl with curly hair
    hair: '#1a1a1a', hairStyle: 'curly', 
    skin: '#5c3c21', 
    shirt: '#ffffff', shorts: '#059669',
    socks: '#ffffff', sockStripe: '#f97316', shoes: '#1f2937',
  },
];

export const TugOfWarKid = ({ index, isPulling, isStraining, side, size = 'medium' }: TugOfWarKidProps) => {
  const variant = KID_VARIANTS[index % KID_VARIANTS.length];
  
  // Larger sizes to match pic 2
  const sizeConfig = {
    small: { width: 120, height: 150 },
    medium: { width: 150, height: 180 },
    large: { width: 180, height: 210 }
  };
  
  const { width, height } = sizeConfig[size];
  // Hero side: facing left (toward rope), Enemy side: facing right
  const flipX = side === 'hero' ? 1 : -1;

  // Hair rendering - like pic 2
  const renderHair = () => {
    const hairColor = variant.hair;
    switch (variant.hairStyle) {
      case 'short':
        return (
          <g>
            <ellipse cx="50" cy="14" rx="16" ry="12" fill={hairColor} />
            <path d="M34 20 Q42 10 50 13 Q58 10 66 20" fill={hairColor} />
          </g>
        );
      case 'ponytail':
        return (
          <g>
            <ellipse cx="50" cy="14" rx="14" ry="11" fill={hairColor} />
            <ellipse cx="68" cy="26" rx="7" ry="12" fill={hairColor} />
            <circle cx="64" cy="14" r="4" fill="#ef4444" />
          </g>
        );
      case 'curly':
        return (
          <g>
            {[40, 45, 50, 55, 60].map((x, i) => (
              <circle key={i} cx={x} cy={10 + (i % 2) * 4} r={6} fill={hairColor} />
            ))}
            <ellipse cx="50" cy="15" rx="13" ry="9" fill={hairColor} />
          </g>
        );
      case 'braids':
        return (
          <g>
            <ellipse cx="50" cy="14" rx="14" ry="11" fill={hairColor} />
            <rect x="33" y="18" width="6" height="24" rx="3" fill={hairColor} />
            <rect x="61" y="18" width="6" height="24" rx="3" fill={hairColor} />
            <circle cx="36" cy="43" r="4" fill="#ec4899" />
            <circle cx="64" cy="43" r="4" fill="#ec4899" />
          </g>
        );
      case 'spiky':
        return (
          <g>
            <ellipse cx="50" cy="14" rx="13" ry="9" fill={hairColor} />
            {[40, 45, 50, 55, 60].map((x, i) => (
              <path key={i} d={`M${x} 12 L${x + 2} 0 L${x + 4} 12`} fill={hairColor} />
            ))}
          </g>
        );
      case 'puffs':
        return (
          <g>
            <ellipse cx="50" cy="16" rx="12" ry="8" fill={hairColor} />
            {/* Two big puff buns like pic 2 */}
            <circle cx="32" cy="14" r="12" fill={hairColor} />
            <circle cx="68" cy="14" r="12" fill={hairColor} />
            {/* Cute pink bows */}
            <g transform="translate(32, 4)">
              <ellipse cx="-4" cy="0" rx="4" ry="2.5" fill="#ec4899" />
              <ellipse cx="4" cy="0" rx="4" ry="2.5" fill="#ec4899" />
              <circle cx="0" cy="0" r="2.5" fill="#f472b6" />
            </g>
            <g transform="translate(68, 4)">
              <ellipse cx="-4" cy="0" rx="4" ry="2.5" fill="#ec4899" />
              <ellipse cx="4" cy="0" rx="4" ry="2.5" fill="#ec4899" />
              <circle cx="0" cy="0" r="2.5" fill="#f472b6" />
            </g>
          </g>
        );
      default:
        return <ellipse cx="50" cy="14" rx="15" ry="11" fill={hairColor} />;
    }
  };

  // Arm positions for extended arms holding rope - LIKE PIC 2!
  const armEndX = isPulling ? -25 : isStraining ? -10 : -18;
  const armEndY = isPulling ? 52 : isStraining ? 56 : 54;

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
          ? { x: [-6, -12, -8], rotate: [-6, -10, -7] }
          : isStraining
          ? { x: [3, 8, 5], rotate: [3, 6, 4] }
          : { y: [0, -2, 0], rotate: -3 }
      }
      transition={
        isPulling || isStraining
          ? { duration: 0.35, ease: 'easeOut' }
          : { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }
      }
    >
      {/* Wide viewBox for extended arms reaching toward rope */}
      <svg viewBox="-40 0 140 120" width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`kidShirt-${index}-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={variant.shirt} />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          <linearGradient id={`skinGrad-${index}-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={variant.skin} />
            <stop offset="100%" stopColor={variant.skin} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="117" rx="25" ry="5" fill="#000" opacity="0.2" />

        {/* === LEGS - Braced stance === */}
        {/* Back leg */}
        <path 
          d={isPulling ? "M44 78 L36 95 L32 112" : isStraining ? "M44 78 L50 95 L54 112" : "M44 78 L40 95 L38 112"}
          stroke={variant.shorts}
          strokeWidth="14" 
          strokeLinecap="round"
          fill="none"
        />
        <path 
          d={isPulling ? "M36 92 L32 112" : isStraining ? "M50 92 L54 112" : "M40 92 L38 112"}
          stroke={variant.skin}
          strokeWidth="11" 
          strokeLinecap="round"
          fill="none"
        />
        <rect x={isPulling ? 24 : isStraining ? 46 : 30} y="104" width="14" height="12" rx="3" fill={variant.socks} />
        <rect x={isPulling ? 24 : isStraining ? 46 : 30} y="108" width="14" height="3" fill={variant.sockStripe} />
        <ellipse cx={isPulling ? 31 : isStraining ? 53 : 37} cy="117" rx="12" ry="5" fill={variant.shoes} />

        {/* Front leg */}
        <path 
          d={isPulling ? "M56 78 L62 95 L66 112" : isStraining ? "M56 78 L52 95 L50 112" : "M56 78 L58 95 L59 112"}
          stroke={variant.shorts}
          strokeWidth="14" 
          strokeLinecap="round"
          fill="none"
        />
        <path 
          d={isPulling ? "M62 92 L66 112" : isStraining ? "M52 92 L50 112" : "M58 92 L59 112"}
          stroke={variant.skin}
          strokeWidth="11" 
          strokeLinecap="round"
          fill="none"
        />
        <rect x={isPulling ? 58 : isStraining ? 42 : 51} y="104" width="14" height="12" rx="3" fill={variant.socks} />
        <rect x={isPulling ? 58 : isStraining ? 42 : 51} y="108" width="14" height="3" fill={variant.sockStripe} />
        <ellipse cx={isPulling ? 65 : isStraining ? 49 : 58} cy="117" rx="12" ry="5" fill={variant.shoes} />

        {/* === BODY/TORSO - Leaning back like pulling === */}
        <g transform={isPulling ? 'rotate(-12, 50, 78)' : isStraining ? 'rotate(8, 50, 78)' : 'rotate(-5, 50, 78)'}>
          {/* Shirt body */}
          <path 
            d="M36 48 L36 80 Q50 84 64 80 L64 48 Q50 42 36 48" 
            fill={`url(#kidShirt-${index}-${side})`}
            stroke="#d4d4d4"
            strokeWidth="1.5"
          />
          {/* Collar */}
          <path d="M42 48 L50 55 L58 48" fill="none" stroke="#c4c4c4" strokeWidth="2" />
          
          {/* === ARMS - EXTENDED HORIZONTALLY toward rope like pic 2! === */}
          {/* These arms reach WAY out to the left where the rope would be */}
          
          {/* Back arm - reaching out */}
          <motion.path
            d={`M36 54 L10 ${armEndY - 2} L${armEndX} ${armEndY - 3}`}
            stroke={variant.skin}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Back hand gripping */}
          <g>
            <ellipse cx={armEndX - 2} cy={armEndY - 4} rx="9" ry="7" fill={variant.skin} />
            {/* Horizontal finger definition lines */}
            <line x1={armEndX - 9} y1={armEndY - 6} x2={armEndX + 5} y2={armEndY - 6} stroke="black" strokeWidth="1" opacity="0.5" />
            <line x1={armEndX - 9} y1={armEndY - 3} x2={armEndX + 5} y2={armEndY - 3} stroke="black" strokeWidth="1" opacity="0.5" />
            <line x1={armEndX - 8} y1={armEndY} x2={armEndX + 4} y2={armEndY} stroke="black" strokeWidth="1" opacity="0.5" />
          </g>
          
          {/* Front arm - reaching out */}
          <motion.path
            d={`M36 60 L5 ${armEndY + 4} L${armEndX - 5} ${armEndY + 2}`}
            stroke={variant.skin}
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Front hand gripping */}
          <g>
            <ellipse cx={armEndX - 7} cy={armEndY + 1} rx="10" ry="8" fill={variant.skin} />
            {/* Horizontal finger definition lines */}
            <line x1={armEndX - 15} y1={armEndY - 2} x2={armEndX + 1} y2={armEndY - 2} stroke="black" strokeWidth="1.2" opacity="0.5" />
            <line x1={armEndX - 15} y1={armEndY + 2} x2={armEndX + 1} y2={armEndY + 2} stroke="black" strokeWidth="1.2" opacity="0.5" />
            <line x1={armEndX - 14} y1={armEndY + 6} x2={armEndX} y2={armEndY + 6} stroke="black" strokeWidth="1.2" opacity="0.5" />
          </g>
        </g>

        {/* === HEAD === */}
        <g transform={isPulling ? 'translate(-3, -3) rotate(-5, 50, 28)' : isStraining ? 'translate(2, 0) rotate(4, 50, 28)' : 'translate(-1, 0) rotate(-2, 50, 28)'}>
          {/* Face - larger */}
          <ellipse cx="50" cy="30" rx="18" ry="19" fill={`url(#skinGrad-${index}-${side})`} />
          
          {/* Hair */}
          {renderHair()}
          
          {/* Ears */}
          <ellipse cx="32" cy="30" rx="4" ry="5" fill={variant.skin} />
          <ellipse cx="68" cy="30" rx="4" ry="5" fill={variant.skin} />
          
          {/* Eyes - expressive */}
          <motion.g
            animate={isPulling ? { scaleY: 0.6 } : isStraining ? { scaleY: 0.7 } : {}}
            style={{ transformOrigin: '50px 30px' }}
          >
            <ellipse cx="43" cy="30" rx="5" ry="4" fill="white" />
            <ellipse cx="57" cy="30" rx="5" ry="4" fill="white" />
            <circle cx="44" cy="30" r="2.5" fill="#1a1a1a" />
            <circle cx="58" cy="30" r="2.5" fill="#1a1a1a" />
            <circle cx="44.5" cy="29" r="1" fill="white" />
            <circle cx="58.5" cy="29" r="1" fill="white" />
          </motion.g>
          
          {/* Eyebrows - determined */}
          <motion.g animate={isPulling || isStraining ? { y: -2 } : {}}>
            <path d="M38 25 L48 27" stroke={variant.hair} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M52 27 L62 25" stroke={variant.hair} strokeWidth="2.5" strokeLinecap="round" />
          </motion.g>
          
          {/* Nose */}
          <ellipse cx="50" cy="35" rx="2.5" ry="2" fill={variant.skin} opacity="0.6" />
          
          {/* Mouth - effort expressions */}
          {isPulling ? (
            <g>
              <rect x="44" y="40" width="12" height="6" fill="#1a1a1a" rx="2" />
              <path d="M45 42 L55 42" stroke="white" strokeWidth="1.5" />
            </g>
          ) : isStraining ? (
            <g>
              <ellipse cx="50" cy="42" rx="6" ry="4" fill="#5c1a1a" />
              <ellipse cx="50" cy="40" rx="4" ry="2" fill="white" />
            </g>
          ) : (
            <path d="M45 40 Q50 44 55 40" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          )}
          
          {/* Rosy cheeks when straining */}
          {(isPulling || isStraining) && (
            <>
              <ellipse cx="36" cy="36" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
              <ellipse cx="64" cy="36" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
            </>
          )}
          
          {/* Sweat drops */}
          {isStraining && (
            <motion.g
              animate={{ y: [0, 12], opacity: [1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            >
              <path d="M30 22 Q28 28 30 32 Q32 28 30 22" fill="#60a5fa" />
            </motion.g>
          )}
        </g>
      </svg>
    </motion.div>
  );
};
