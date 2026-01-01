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
    small: { width: 100, height: 140 },
    medium: { width: 120, height: 165 },
    large: { width: 140, height: 190 }
  };
  
  const { width, height } = sizeConfig[size];
  // Hero side: character body on right, arms extend LEFT toward rope
  // Enemy side: mirror it
  const flipX = side === 'hero' ? 1 : -1;

  // Hair rendering
  const renderHair = () => {
    const hairColor = variant.hair;
    switch (variant.hairStyle) {
      case 'short':
        return (
          <g>
            <ellipse cx="75" cy="18" rx="18" ry="14" fill={hairColor} />
            <path d="M57 24 Q65 12 75 16 Q85 12 93 24" fill={hairColor} />
          </g>
        );
      case 'ponytail':
        return (
          <g>
            <ellipse cx="75" cy="18" rx="16" ry="12" fill={hairColor} />
            <ellipse cx="95" cy="32" rx="8" ry="14" fill={hairColor} />
            <circle cx="92" cy="18" r="4" fill="#ef4444" />
          </g>
        );
      case 'curly':
        return (
          <g>
            {[63, 69, 75, 81, 87].map((x, i) => (
              <circle key={i} cx={x} cy={14 + (i % 2) * 4} r={7} fill={hairColor} />
            ))}
            <ellipse cx="75" cy="18" rx="14" ry="10" fill={hairColor} />
          </g>
        );
      case 'braids':
        return (
          <g>
            <ellipse cx="75" cy="18" rx="15" ry="12" fill={hairColor} />
            <rect x="56" y="22" width="6" height="26" rx="3" fill={hairColor} />
            <rect x="88" y="22" width="6" height="26" rx="3" fill={hairColor} />
            <circle cx="59" cy="48" r="4" fill="#ec4899" />
            <circle cx="91" cy="48" r="4" fill="#ec4899" />
          </g>
        );
      case 'spiky':
        return (
          <g>
            <ellipse cx="75" cy="18" rx="14" ry="10" fill={hairColor} />
            {[63, 69, 75, 81, 87].map((x, i) => (
              <path key={i} d={`M${x} 16 L${x + 3} 4 L${x + 6} 16`} fill={hairColor} />
            ))}
          </g>
        );
      case 'twintails':
        return (
          <g>
            <ellipse cx="75" cy="18" rx="15" ry="11" fill={hairColor} />
            <ellipse cx="56" cy="30" rx="7" ry="16" fill={hairColor} />
            <ellipse cx="94" cy="30" rx="7" ry="16" fill={hairColor} />
            <circle cx="60" cy="16" r="3.5" fill="#f472b6" />
            <circle cx="90" cy="16" r="3.5" fill="#f472b6" />
          </g>
        );
      default:
        return <ellipse cx="75" cy="18" rx="16" ry="12" fill={hairColor} />;
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
          ? { x: [-8, -16, -10], rotate: [-12, -18, -14] }
          : isStraining
          ? { x: [4, 10, 6], rotate: [5, 10, 7] }
          : { y: [0, -2, 0], rotate: -8 }
      }
      transition={
        isPulling || isStraining
          ? { duration: 0.35, ease: 'easeOut' }
          : { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }
      }
    >
      {/* Wide viewBox: arms extend to left (x=0-30), body on right (x=50-100) */}
      <svg viewBox="0 0 120 145" width={width} height={height} className="overflow-visible">
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
        <ellipse cx="75" cy="140" rx="28" ry="6" fill="#000" opacity="0.25" />

        {/* === LEGS - Braced pulling stance === */}
        {/* Back leg */}
        <g>
          <path 
            d={isPulling ? "M68 94 L58 114" : isStraining ? "M68 94 L78 114" : "M68 94 L62 114"}
            stroke={`url(#shortsGrad-${index}-${side})`}
            strokeWidth="14" 
            strokeLinecap="round"
            fill="none"
          />
          <path 
            d={isPulling ? "M58 114 L52 132" : isStraining ? "M78 114 L82 132" : "M62 114 L58 132"}
            stroke={variant.skin}
            strokeWidth="11" 
            strokeLinecap="round"
            fill="none"
          />
          <rect x={isPulling ? 44 : isStraining ? 74 : 50} y="122" width="14" height="14" rx="3" fill={variant.socks} />
          <rect x={isPulling ? 44 : isStraining ? 74 : 50} y="126" width="14" height="3" fill={variant.sockStripe} />
          <ellipse cx={isPulling ? 50 : isStraining ? 82 : 56} cy="137" rx="12" ry="6" fill={variant.shoes} />
        </g>

        {/* Front leg */}
        <g>
          <path 
            d={isPulling ? "M82 94 L90 114" : isStraining ? "M82 94 L74 114" : "M82 94 L86 114"}
            stroke={`url(#shortsGrad-${index}-${side})`}
            strokeWidth="14" 
            strokeLinecap="round"
            fill="none"
          />
          <path 
            d={isPulling ? "M90 114 L95 132" : isStraining ? "M74 114 L70 132" : "M86 114 L88 132"}
            stroke={variant.skin}
            strokeWidth="11" 
            strokeLinecap="round"
            fill="none"
          />
          <rect x={isPulling ? 87 : isStraining ? 62 : 80} y="122" width="14" height="14" rx="3" fill={variant.socks} />
          <rect x={isPulling ? 87 : isStraining ? 62 : 80} y="126" width="14" height="3" fill={variant.sockStripe} />
          <ellipse cx={isPulling ? 95 : isStraining ? 70 : 88} cy="137" rx="12" ry="6" fill={variant.shoes} />
        </g>

        {/* === BODY/TORSO - Positioned on right side === */}
        <g transform={isPulling ? 'rotate(-16, 75, 94)' : isStraining ? 'rotate(8, 75, 94)' : 'rotate(-6, 75, 94)'}>
          {/* Shirt body */}
          <path 
            d="M58 54 L58 96 Q75 100 92 96 L92 54 Q75 48 58 54" 
            fill={`url(#kidShirt-${index}-${side})`}
            stroke="#d4d4d4"
            strokeWidth="1"
          />
          {/* Collar */}
          <path d="M65 54 L75 62 L85 54" fill="none" stroke="#c4c4c4" strokeWidth="2" />
          {/* Buttons */}
          <circle cx="75" cy="68" r="1.5" fill="#d4d4d4" />
          <circle cx="75" cy="78" r="1.5" fill="#d4d4d4" />

          {/* Suspenders if applicable */}
          {variant.accessory === 'suspenders' && (
            <g>
              <path d="M65 56 L67 88" stroke="#374151" strokeWidth="2.5" fill="none" />
              <path d="M85 56 L83 88" stroke="#374151" strokeWidth="2.5" fill="none" />
              <rect x="63" y="54" width="5" height="3" fill="#f59e0b" rx="1" />
              <rect x="82" y="54" width="5" height="3" fill="#f59e0b" rx="1" />
            </g>
          )}
          {variant.accessory === 'headband' && (
            <path d="M58 24 Q75 18 92 24" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}

          {/* === ARMS EXTENDING LEFT TOWARD ROPE === */}
          {/* These arms go from the body (x~58) all the way left to the rope (x~5-15) */}
          
          {/* Back arm (behind, slightly higher) */}
          <motion.g
            animate={isPulling ? { rotate: -8 } : isStraining ? { rotate: 6 } : { rotate: 0 }}
            style={{ transformOrigin: '58px 60px' }}
          >
            {/* Upper arm */}
            <path 
              d="M58 58 L38 56 L20 54" 
              stroke={variant.skin} 
              strokeWidth="12" 
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Forearm to hand position */}
            <path 
              d="M20 54 L8 52" 
              stroke={variant.skin} 
              strokeWidth="11" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand gripping rope - at x~5 */}
            <g transform="translate(4, 48)">
              <ellipse cx="0" cy="4" rx="8" ry="10" fill={variant.skin} />
              {/* Fingers wrapped around rope */}
              <motion.g
                animate={isPulling ? { scaleY: [1, 0.85, 1] } : {}}
                transition={{ duration: 0.2, repeat: isPulling ? Infinity : 0 }}
              >
                <path d="M-5 -2 Q-8 4 -5 10" stroke={variant.skin} strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M0 -3 Q-3 4 0 11" stroke={variant.skin} strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M5 -2 Q2 4 5 10" stroke={variant.skin} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              </motion.g>
              {/* Thumb on back */}
              <ellipse cx="-6" cy="-4" rx="4" ry="5" fill={variant.skin} />
              {/* Knuckle highlights */}
              <circle cx="-3" cy="0" r="2" fill={variant.skin} opacity="0.6" />
              <circle cx="2" cy="0" r="2" fill={variant.skin} opacity="0.6" />
            </g>
          </motion.g>

          {/* Front arm (over body, slightly lower) */}
          <motion.g
            animate={isPulling ? { rotate: -5 } : isStraining ? { rotate: 4 } : { rotate: 0 }}
            style={{ transformOrigin: '58px 68px' }}
          >
            {/* Upper arm */}
            <path 
              d="M58 66 L36 65 L18 64" 
              stroke={variant.skin} 
              strokeWidth="13" 
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Forearm */}
            <path 
              d="M18 64 L6 63" 
              stroke={variant.skin} 
              strokeWidth="12" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Front hand - bigger, more prominent */}
            <g transform="translate(2, 58)">
              <ellipse cx="0" cy="5" rx="9" ry="11" fill={variant.skin} />
              {/* Fingers wrapped around rope */}
              <motion.g
                animate={isPulling ? { scaleY: [1, 0.8, 1] } : {}}
                transition={{ duration: 0.2, repeat: isPulling ? Infinity : 0, delay: 0.05 }}
              >
                <path d="M-6 -2 Q-9 5 -6 12" stroke={variant.skin} strokeWidth="5.5" fill="none" strokeLinecap="round" />
                <path d="M0 -3 Q-3 5 0 13" stroke={variant.skin} strokeWidth="5.5" fill="none" strokeLinecap="round" />
                <path d="M5 -2 Q2 5 5 12" stroke={variant.skin} strokeWidth="5" fill="none" strokeLinecap="round" />
              </motion.g>
              {/* Thumb */}
              <ellipse cx="-7" cy="-3" rx="4.5" ry="5.5" fill={variant.skin} />
              {/* Knuckle highlights */}
              <circle cx="-4" cy="1" r="2.5" fill={variant.skin} opacity="0.5" />
              <circle cx="2" cy="1" r="2.5" fill={variant.skin} opacity="0.5" />
            </g>
          </motion.g>
        </g>

        {/* === HEAD === */}
        <g transform={isPulling ? 'translate(-3, -3) rotate(-6, 75, 35)' : isStraining ? 'translate(2, 1) rotate(4, 75, 35)' : 'translate(-1, 0) rotate(-2, 75, 35)'}>
          {/* Face */}
          <ellipse cx="75" cy="35" rx="20" ry="22" fill={`url(#skinGrad-${index}-${side})`} />
          
          {/* Hair */}
          {renderHair()}
          
          {/* Ears */}
          <ellipse cx="55" cy="35" rx="4" ry="5" fill={variant.skin} />
          <ellipse cx="95" cy="35" rx="4" ry="5" fill={variant.skin} />
          
          {/* Eyes */}
          <motion.g
            animate={isPulling ? { scaleY: 0.6 } : isStraining ? { scaleY: 0.7 } : {}}
            style={{ transformOrigin: '75px 35px' }}
          >
            <ellipse cx="67" cy="35" rx="6" ry="4.5" fill="white" />
            <ellipse cx="83" cy="35" rx="6" ry="4.5" fill="white" />
            <circle cx="68" cy="35" r="3" fill="#1a1a1a" />
            <circle cx="84" cy="35" r="3" fill="#1a1a1a" />
            <circle cx="69" cy="34" r="1.2" fill="white" />
            <circle cx="85" cy="34" r="1.2" fill="white" />
          </motion.g>
          
          {/* Eyebrows */}
          <motion.g animate={isPulling || isStraining ? { y: -2 } : {}}>
            <path d="M60 28 L72 31" stroke={variant.hair} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M78 31 L90 28" stroke={variant.hair} strokeWidth="2.5" strokeLinecap="round" />
          </motion.g>
          
          {/* Nose */}
          <ellipse cx="75" cy="42" rx="2.5" ry="2" fill={variant.skin} opacity="0.6" />
          
          {/* Mouth */}
          {isPulling ? (
            <g>
              <rect x="68" y="48" width="14" height="7" fill="#1a1a1a" rx="2" />
              <path d="M69 51 L81 51" stroke="white" strokeWidth="1.5" />
            </g>
          ) : isStraining ? (
            <g>
              <ellipse cx="75" cy="50" rx="7" ry="5" fill="#5c1a1a" />
              <ellipse cx="75" cy="48" rx="5" ry="2" fill="white" />
            </g>
          ) : (
            <path d="M69 48 Q75 53 81 48" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          )}
          
          {/* Rosy cheeks */}
          {(isPulling || isStraining) && (
            <>
              <ellipse cx="58" cy="42" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
              <ellipse cx="92" cy="42" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
            </>
          )}
          
          {/* Sweat */}
          {isStraining && (
            <motion.g
              animate={{ y: [0, 12], opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <path d="M52 28 Q50 34 52 38 Q54 34 52 28" fill="#60a5fa" />
            </motion.g>
          )}
        </g>
      </svg>
    </motion.div>
  );
};
