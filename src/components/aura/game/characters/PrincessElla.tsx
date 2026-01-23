import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type PrincessState = 'idle' | 'hit' | 'attacking' | 'victory' | 'defeated' | 'pulling' | 'casting';
export type EllaSkinVariant = 'default' | 'flower_queen' | 'winter_rose' | 'sunset_bloom' | 'moonlight_garden' | 'rainbow_meadow' | 'enchanted_forest';

interface PrincessEllaProps {
  state: PrincessState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  showHealthBar?: boolean;
  skinVariant?: EllaSkinVariant;
}

const sizeConfig = {
  small: { width: 60, height: 130 },
  medium: { width: 85, height: 185 },
  large: { width: 110, height: 240 },
};

// Skin color configurations for Princess Ella
const skinColors: Record<EllaSkinVariant, { dress: string[]; hair: string[]; tiara: string; accent: string; magic: string }> = {
  default: {
    dress: ['#F9A8D4', '#EC4899', '#DB2777'],
    hair: ['#F59E0B', '#D97706', '#92400E'],
    tiara: '#EC4899',
    accent: '#86EFAC',
    magic: '#86EFAC',
  },
  flower_queen: {
    dress: ['#FDE047', '#FBBF24', '#D97706'],
    hair: ['#F9A8D4', '#EC4899', '#BE185D'],
    tiara: '#FDE047',
    accent: '#F472B6',
    magic: '#FDE047',
  },
  winter_rose: {
    dress: ['#E0F2FE', '#7DD3FC', '#0EA5E9'],
    hair: ['#E2E8F0', '#CBD5E1', '#94A3B8'],
    tiara: '#7DD3FC',
    accent: '#FFFFFF',
    magic: '#7DD3FC',
  },
  sunset_bloom: {
    dress: ['#FDBA74', '#FB923C', '#EA580C'],
    hair: ['#FCA5A5', '#F87171', '#DC2626'],
    tiara: '#FDE047',
    accent: '#FDE68A',
    magic: '#FB923C',
  },
  moonlight_garden: {
    dress: ['#C4B5FD', '#A78BFA', '#7C3AED'],
    hair: ['#E2E8F0', '#A5B4FC', '#6366F1'],
    tiara: '#A78BFA',
    accent: '#E0E7FF',
    magic: '#A78BFA',
  },
  rainbow_meadow: {
    dress: ['#F9A8D4', '#C4B5FD', '#7DD3FC'],
    hair: ['#FDE047', '#4ADE80', '#22D3EE'],
    tiara: '#FDE047',
    accent: '#4ADE80',
    magic: '#FDE047',
  },
  enchanted_forest: {
    dress: ['#86EFAC', '#22C55E', '#16A34A'],
    hair: ['#92400E', '#78350F', '#451A03'],
    tiara: '#22C55E',
    accent: '#BBF7D0',
    magic: '#4ADE80',
  },
};

export const PrincessElla = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'medium',
  flipX = false,
  showHealthBar = true,
  skinVariant = 'default',
}: PrincessEllaProps) => {
  const colors = skinColors[skinVariant] || skinColors.default;
  const [flowerPhase, setFlowerPhase] = useState(0);
  const [petalPositions, setPetalPositions] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const { width, height } = sizeConfig[size];

  // Flower petal animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPetalPositions(prev => prev.map(p => (p + 0.05) % (Math.PI * 2)));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Dress sway
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowerPhase(prev => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const getDressPath = () => {
    const paths = [
      "M25 85 Q30 120 25 155 Q45 165 50 170 Q55 165 75 155 Q70 120 75 85 L50 80 Z",
      "M25 85 Q32 118 27 155 Q47 163 50 170 Q53 163 73 155 Q68 118 75 85 L50 80 Z",
      "M25 85 Q28 122 23 155 Q43 167 50 170 Q57 167 77 155 Q72 122 75 85 L50 80 Z",
      "M25 85 Q30 120 25 155 Q45 165 50 170 Q55 165 75 155 Q70 120 75 85 L50 80 Z",
    ];
    return paths[flowerPhase];
  };

  const getStateAnimation = (): {
    y?: number[];
    x?: number[];
    scale?: number[];
    rotate?: number[];
    opacity?: number[];
    transition?: { duration: number; repeat?: number; ease?: 'easeInOut' | 'easeOut' };
  } => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -3, 0],
          transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'hit':
        return {
          x: [0, -5, 3, 0],
          transition: { duration: 0.3 },
        };
      case 'attacking':
      case 'casting':
        return {
          y: [0, -10, 0],
          scale: [1, 1.08, 1],
          transition: { duration: 0.5 },
        };
      case 'victory':
        return {
          y: [0, -12, 0],
          rotate: [0, 5, -5, 0],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          opacity: [1, 0],
          scale: [1, 0.5],
          y: [0, -20],
          transition: { duration: 1.2 },
        };
      case 'pulling':
        return {
          x: [0, -5, 0],
          rotate: [0, -3, 0],
          transition: { duration: 0.4, repeat: Infinity },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className="relative"
      style={{
        width,
        height,
        transform: flipX ? 'scaleX(-1)' : undefined,
      }}
      animate={getStateAnimation()}
    >
      <svg
        viewBox="0 0 100 185"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Dress gradient - Dynamic based on skin */}
          <linearGradient id={`princessDress-${skinVariant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.dress[0]} />
            <stop offset="50%" stopColor={colors.dress[1]} />
            <stop offset="100%" stopColor={colors.dress[2]} />
          </linearGradient>

          {/* Inner dress */}
          <linearGradient id={`dressInner-${skinVariant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.dress[0]} />
            <stop offset="100%" stopColor={colors.dress[1]} />
          </linearGradient>

          {/* Flower/nature magic - Dynamic */}
          <radialGradient id={`flowerMagic-${skinVariant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.magic} />
            <stop offset="60%" stopColor={colors.accent} />
            <stop offset="100%" stopColor={colors.magic} stopOpacity="0" />
          </radialGradient>

          {/* Gold trim */}
          <linearGradient id="princessGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Hair - Dynamic based on skin */}
          <linearGradient id={`princessHair-${skinVariant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.hair[0]} />
            <stop offset="50%" stopColor={colors.hair[1]} />
            <stop offset="100%" stopColor={colors.hair[2]} />
          </linearGradient>

          {/* Skin tone */}
          <linearGradient id="princessSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FECACA" />
            <stop offset="100%" stopColor="#FCA5A5" />
          </linearGradient>

          {/* Filters */}
          <filter id="princessShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
          </filter>

          <filter id="flowerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Drop shadow */}
        <ellipse cx="50" cy="180" rx="22" ry="5" fill="#000000" opacity="0.25"/>

        {/* Dress body */}
        <motion.path
          d={getDressPath()}
          fill={`url(#princessDress-${skinVariant})`}
          filter="url(#princessShadow)"
        />

        {/* Dress detail - white overlay petticoat peek */}
        <path
          d="M30 150 Q50 160 70 150"
          stroke="white"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />

        {/* Gold belt with flower */}
        <rect x="32" y="85" width="36" height="6" rx="2" fill="url(#princessGold)"/>
        <circle cx="50" cy="88" r="5" fill={colors.tiara} stroke="url(#princessGold)" strokeWidth="1.5"/>
        
        {/* Flower center on belt */}
        <circle cx="50" cy="88" r="2" fill={colors.accent}/>

        {/* Hair - flowing behind */}
        <path
          d="M30 45 Q20 60 25 90 Q35 95 40 85 L40 50 Z"
          fill={`url(#princessHair-${skinVariant})`}
          filter="url(#princessShadow)"
        />
        <path
          d="M70 45 Q80 60 75 90 Q65 95 60 85 L60 50 Z"
          fill={`url(#princessHair-${skinVariant})`}
          filter="url(#princessShadow)"
        />

        {/* Head */}
        <ellipse cx="50" cy="50" rx="18" ry="20" fill="url(#princessSkin)" filter="url(#princessShadow)"/>

        {/* Hair on top */}
        <path
          d="M32 45 Q35 25 50 22 Q65 25 68 45 Q60 40 50 38 Q40 40 32 45 Z"
          fill={`url(#princessHair-${skinVariant})`}
        />

        {/* Tiara */}
        <path
          d="M35 35 L40 25 L45 32 L50 20 L55 32 L60 25 L65 35"
          stroke="url(#princessGold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Tiara gems */}
        <circle cx="50" cy="23" r="3" fill={colors.tiara}/>
        <circle cx="40" cy="28" r="2" fill={colors.accent}/>
        <circle cx="60" cy="28" r="2" fill={colors.accent}/>

        {/* Eyes */}
        <ellipse cx="43" cy="50" rx="4" ry="3" fill="#1E3A8A"/>
        <ellipse cx="57" cy="50" rx="4" ry="3" fill="#1E3A8A"/>
        <circle cx="42" cy="49" r="1.5" fill="white"/>
        <circle cx="56" cy="49" r="1.5" fill="white"/>

        {/* Eyelashes */}
        <path d="M39 47 L37 45" stroke="#1E3A8A" strokeWidth="0.8"/>
        <path d="M43 46 L43 44" stroke="#1E3A8A" strokeWidth="0.8"/>
        <path d="M57 46 L57 44" stroke="#1E3A8A" strokeWidth="0.8"/>
        <path d="M61 47 L63 45" stroke="#1E3A8A" strokeWidth="0.8"/>

        {/* Rosy cheeks */}
        <circle cx="38" cy="55" r="3" fill="#FCA5A5" opacity="0.5"/>
        <circle cx="62" cy="55" r="3" fill="#FCA5A5" opacity="0.5"/>

        {/* Smile */}
        <path
          d="M44 58 Q50 63 56 58"
          stroke="#DC2626"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms/Sleeves - puffy princess sleeves */}
        <ellipse cx="22" cy="95" rx="8" ry="10" fill={`url(#princessDress-${skinVariant})`} filter="url(#princessShadow)"/>
        <ellipse cx="78" cy="95" rx="8" ry="10" fill={`url(#princessDress-${skinVariant})`} filter="url(#princessShadow)"/>
        
        {/* Hands */}
        <circle cx="18" cy="105" r="5" fill="url(#princessSkin)"/>
        <circle cx="82" cy="105" r="5" fill="url(#princessSkin)"/>

        {/* Flower wand in right hand */}
        <motion.g animate={state === 'casting' ? { y: -8 } : {}}>
          <rect x="80" y="60" width="3" height="45" rx="1" fill="#16A34A"/>
          
          {/* Flower on wand */}
          <motion.g
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: '82px 55px' }}
          >
            {/* Petals */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.ellipse
                    key={i}
                    cx={82 + Math.cos((angle * Math.PI) / 180) * 8}
                    cy={55 + Math.sin((angle * Math.PI) / 180) * 8}
                    rx="5"
                    ry="3"
                    fill={colors.dress[1]}
                    transform={`rotate(${angle} 82 55)`}
                    filter="url(#flowerGlow)"
              />
            ))}
            {/* Flower center */}
            <circle cx="82" cy="55" r="4" fill={colors.accent}/>
          </motion.g>
        </motion.g>

        {/* Orbiting flower petals when casting */}
        {(state === 'casting' || state === 'attacking') && petalPositions.map((pos, i) => {
          const orbitRadius = 30;
          const x = 50 + Math.cos(pos + (i * Math.PI * 2) / 6) * orbitRadius;
          const y = 80 + Math.sin(pos + (i * Math.PI * 2) / 6) * orbitRadius * 0.5;
          
          return (
            <motion.ellipse
              key={i}
              cx={x}
              cy={y}
              rx="4"
              ry="2"
              fill={i % 2 === 0 ? colors.dress[1] : colors.accent}
              opacity={0.8}
              filter="url(#flowerGlow)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          );
        })}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="100" height="185" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}

        {/* Casting sparkles */}
        {state === 'casting' && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
          >
            <circle cx="82" cy="45" r="3" fill={colors.magic} filter="url(#flowerGlow)"/>
            <circle cx="75" cy="50" r="2" fill={colors.dress[1]} filter="url(#flowerGlow)"/>
            <circle cx="88" cy="52" r="2" fill={colors.accent} filter="url(#flowerGlow)"/>
          </motion.g>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[90px]">
          {currentHp !== undefined && maxHp !== undefined && (
            <div className="text-center text-xs font-bold text-white mb-0.5"
                 style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
              {currentHp}/{maxHp}
            </div>
          )}
          <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-black/40">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: healthPercent > 50
                  ? 'linear-gradient(90deg, #EC4899, #F472B6)'
                  : healthPercent > 25
                    ? 'linear-gradient(90deg, #eab308, #facc15)'
                    : 'linear-gradient(90deg, #dc2626, #ef4444)',
              }}
              initial={{ width: '100%' }}
              animate={{ width: `${healthPercent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Defeat petal scatter */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${30 + Math.random() * 40}%`,
                top: `${20 + Math.random() * 60}%`,
                width: 6 + Math.random() * 4,
                height: 3 + Math.random() * 2,
                background: i % 2 === 0 ? colors.dress[1] : colors.accent,
                borderRadius: '50%',
              }}
              initial={{ opacity: 0, y: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                y: -40 - Math.random() * 30,
                rotate: Math.random() * 360
              }}
              transition={{ duration: 1.5, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}

      {/* Victory sparkles */}
      {state === 'victory' && (
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-xl"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 50}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.2, 0],
                y: -20
              }}
              transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
            >
              {i % 3 === 0 ? '🌸' : i % 3 === 1 ? '✨' : '🌺'}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
