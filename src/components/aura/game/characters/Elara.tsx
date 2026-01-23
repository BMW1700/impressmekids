import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type WizardState = 'idle' | 'hit' | 'casting' | 'victory' | 'defeated' | 'pulling';
export type ElaraSkinVariant = 'default' | 'shadow' | 'starlight' | 'phoenix' | 'void' | 'nature' | 'frost';

interface ElaraProps {
  state: WizardState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  showHealthBar?: boolean;
  skinVariant?: ElaraSkinVariant;
}

const sizeConfig = {
  small: { width: 60, height: 130 },
  medium: { width: 85, height: 185 },
  large: { width: 110, height: 240 },
};

// Skin color configurations
const skinColors: Record<ElaraSkinVariant, { robe: string[]; energy: string[]; trim: string[]; glow: string }> = {
  default: {
    robe: ['#7C3AED', '#6B21A8', '#4C1D95'],
    energy: ['#67E8F9', '#06B6D4', '#0891B2'],
    trim: ['#FCD34D', '#F59E0B', '#B45309'],
    glow: '#22D3EE',
  },
  shadow: {
    robe: ['#1F2937', '#111827', '#030712'],
    energy: ['#8B5CF6', '#7C3AED', '#6D28D9'],
    trim: ['#A78BFA', '#8B5CF6', '#7C3AED'],
    glow: '#8B5CF6',
  },
  starlight: {
    robe: ['#1E3A8A', '#1E40AF', '#312E81'],
    energy: ['#FDE68A', '#FCD34D', '#FBBF24'],
    trim: ['#FFFFFF', '#F5F5DC', '#E8E8E8'],
    glow: '#FCD34D',
  },
  phoenix: {
    robe: ['#DC2626', '#B91C1C', '#7F1D1D'],
    energy: ['#FCD34D', '#F97316', '#EA580C'],
    trim: ['#FFD700', '#FFC107', '#B8860B'],
    glow: '#F97316',
  },
  void: {
    robe: ['#4C1D95', '#312E81', '#1E1B4B'],
    energy: ['#E879F9', '#D946EF', '#A855F7'],
    trim: ['#F0ABFC', '#E879F9', '#D946EF'],
    glow: '#E879F9',
  },
  nature: {
    robe: ['#166534', '#15803D', '#14532D'],
    energy: ['#86EFAC', '#4ADE80', '#22C55E'],
    trim: ['#A3E635', '#84CC16', '#65A30D'],
    glow: '#4ADE80',
  },
  frost: {
    robe: ['#0EA5E9', '#0284C7', '#0369A1'],
    energy: ['#FFFFFF', '#E0F2FE', '#BAE6FD'],
    trim: ['#A5F3FC', '#67E8F9', '#22D3EE'],
    glow: '#67E8F9',
  },
};

export const Elara = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'medium',
  flipX = false,
  showHealthBar = true,
  skinVariant = 'default',
}: ElaraProps) => {
  const [orbPositions, setOrbPositions] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
  const [crystalRotation, setCrystalRotation] = useState(0);
  const [robePhase, setRobePhase] = useState(0);
  const { width, height } = sizeConfig[size];
  const colors = skinColors[skinVariant];

  // Orb orbit animation
  useEffect(() => {
    const interval = setInterval(() => {
      setOrbPositions(prev => prev.map(p => (p + 0.1) % (Math.PI * 2)));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Crystal rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCrystalRotation(prev => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Robe sway
  useEffect(() => {
    const interval = setInterval(() => {
      setRobePhase(prev => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const getRobePath = () => {
    const paths = [
      "M25 80 Q35 100 30 130 Q45 145 50 160 Q55 145 70 130 Q65 100 75 80 L50 75 Z",
      "M25 80 Q38 98 32 130 Q47 143 50 160 Q53 143 68 130 Q62 98 75 80 L50 75 Z",
      "M25 80 Q32 102 28 130 Q43 147 50 160 Q57 147 72 130 Q68 102 75 80 L50 75 Z",
      "M25 80 Q35 100 30 130 Q45 145 50 160 Q55 145 70 130 Q65 100 75 80 L50 75 Z",
    ];
    return paths[robePhase];
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
          y: [0, -4, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'hit':
        return {
          x: [0, -6, 3, 0],
          transition: { duration: 0.3 },
        };
      case 'casting':
        return {
          y: [0, -8, 0],
          scale: [1, 1.05, 1],
          transition: { duration: 0.6 },
        };
      case 'victory':
        return {
          y: [0, -15, 0],
          transition: { duration: 0.8 },
        };
      case 'defeated':
        return {
          opacity: [1, 0],
          scale: [1, 0.5],
          y: [0, -30],
          transition: { duration: 1.2 },
        };
      case 'pulling':
        return {
          x: [0, -6, 0],
          rotate: [0, -5, 0],
          scale: [1, 1.03, 1],
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
          {/* Robe gradient - Dynamic based on skin */}
          <linearGradient id={`wizardRobe-${skinVariant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.robe[0]} />
            <stop offset="50%" stopColor={colors.robe[1]} />
            <stop offset="100%" stopColor={colors.robe[2]} />
          </linearGradient>

          {/* Robe inner */}
          <linearGradient id={`robeInner-${skinVariant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.robe[1]} />
            <stop offset="100%" stopColor={colors.robe[2]} />
          </linearGradient>

          {/* Magic energy - Dynamic */}
          <radialGradient id={`magicEnergy-${skinVariant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.energy[0]} />
            <stop offset="60%" stopColor={colors.energy[1]} />
            <stop offset="100%" stopColor={colors.energy[2]} stopOpacity="0" />
          </radialGradient>

          {/* Trim gradient - Dynamic */}
          <linearGradient id={`wizardGold-${skinVariant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.trim[0]} />
            <stop offset="50%" stopColor={colors.trim[1]} />
            <stop offset="100%" stopColor={colors.trim[2]} />
          </linearGradient>

          {/* Staff wood */}
          <linearGradient id="staffWood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="50%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Crystal gradient - Dynamic */}
          <linearGradient id={`crystalGrad-${skinVariant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.energy[0]} />
            <stop offset="50%" stopColor={colors.energy[1]} />
            <stop offset="100%" stopColor={colors.energy[2]} />
          </linearGradient>

          {/* Starfield pattern */}
          <pattern id="starfield" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="5" r="0.5" fill={colors.trim[0]} opacity="0.6"/>
            <circle cx="12" cy="3" r="0.3" fill="#FFFFFF" opacity="0.4"/>
            <circle cx="8" cy="15" r="0.4" fill={colors.trim[0]} opacity="0.5"/>
            <circle cx="17" cy="10" r="0.3" fill="#FFFFFF" opacity="0.3"/>
            <circle cx="5" cy="18" r="0.5" fill={colors.energy[0]} opacity="0.4"/>
          </pattern>

          {/* Filters */}
          <filter id="wizardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
          </filter>

          <filter id="crystalGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Drop shadow */}
        <ellipse cx="50" cy="180" rx="20" ry="5" fill="#000000" opacity="0.3"/>

        {/* Robe body with starfield */}
        <motion.path
          d={getRobePath()}
          fill={`url(#wizardRobe-${skinVariant})`}
          filter="url(#wizardShadow)"
        />
        
        {/* Starfield overlay on robe */}
        <motion.path
          d={getRobePath()}
          fill="url(#starfield)"
          opacity="0.3"
        />

        {/* Robe inner shadow */}
        <path
          d="M40 85 L50 75 L60 85 L55 130 Q50 140 45 130 Z"
          fill={`url(#robeInner-${skinVariant})`}
          opacity="0.5"
        />

        {/* Gold trim on robe */}
        <path
          d="M30 130 Q50 160 70 130"
          stroke={`url(#wizardGold-${skinVariant})`}
          strokeWidth="2"
          fill="none"
        />

        {/* Belt */}
        <rect x="35" y="82" width="30" height="5" rx="1" fill={`url(#wizardGold-${skinVariant})`}/>
        <circle cx="50" cy="84.5" r="3" fill={colors.robe[0]} stroke={`url(#wizardGold-${skinVariant})`} strokeWidth="1"/>

        {/* Head/Hood */}
        <path
          d="M35 50 Q35 35 50 35 Q65 35 65 50 L62 70 Q50 75 38 70 Z"
          fill={`url(#wizardRobe-${skinVariant})`}
          filter="url(#wizardShadow)"
        />

        {/* Hood inner shadow (face area) */}
        <ellipse cx="50" cy="55" rx="12" ry="10" fill="#1a1a1a" opacity="0.8"/>

        {/* Glowing eyes */}
        <motion.g
          filter="url(#eyeGlow)"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="44" cy="54" rx="3" ry="2" fill={colors.glow}/>
          <ellipse cx="56" cy="54" rx="3" ry="2" fill={colors.glow}/>
          <circle cx="44" cy="54" r="1" fill="#FFFFFF"/>
          <circle cx="56" cy="54" r="1" fill="#FFFFFF"/>
        </motion.g>

        {/* Hat */}
        <path
          d="M35 35 L50 -10 L65 35 Z"
          fill={`url(#wizardRobe-${skinVariant})`}
          filter="url(#wizardShadow)"
        />

        {/* Hat curl */}
        <path
          d="M50 -10 Q70 -5 60 5"
          stroke={`url(#wizardRobe-${skinVariant})`}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Hat band */}
        <path
          d="M35 35 Q50 30 65 35"
          stroke={`url(#wizardGold-${skinVariant})`}
          strokeWidth="3"
          fill="none"
        />

        {/* Star on hat */}
        <polygon
          points="50,15 52,21 58,21 53,25 55,31 50,27 45,31 47,25 42,21 48,21"
          fill={`url(#wizardGold-${skinVariant})`}
        />

        {/* Moon on hat */}
        <path
          d="M42 22 Q38 18 42 14 Q40 18 42 22"
          fill={`url(#wizardGold-${skinVariant})`}
        />

        {/* Left arm/sleeve */}
        <path
          d="M25 80 Q15 90 20 105 L30 100 Q28 90 35 82 Z"
          fill={`url(#wizardRobe-${skinVariant})`}
          filter="url(#wizardShadow)"
        />

        {/* Right arm holding staff */}
        <path
          d="M75 80 Q85 90 80 105 L70 100 Q72 90 65 82 Z"
          fill={`url(#wizardRobe-${skinVariant})`}
          filter="url(#wizardShadow)"
        />

        {/* Staff */}
        <motion.g
          animate={state === 'casting' ? { y: -10 } : {}}
          transition={{ duration: 0.3 }}
        >
          <rect
            x="82" y="20" width="5" height="140" rx="2"
            fill="url(#staffWood)"
            filter="url(#wizardShadow)"
          />

          {/* Staff ornate details */}
          <circle cx="84.5" cy="60" r="3" fill={`url(#wizardGold-${skinVariant})`}/>
          <circle cx="84.5" cy="100" r="3" fill={`url(#wizardGold-${skinVariant})`}/>

          {/* Staff crystal holder */}
          <path
            d="M77 20 L84.5 10 L92 20 L84.5 25 Z"
            fill={`url(#wizardGold-${skinVariant})`}
          />

          {/* Floating crystal */}
          <motion.g
            style={{ transformOrigin: '84.5px 5px' }}
            animate={{ rotate: crystalRotation }}
          >
            <polygon
              points="84.5,-5 90,5 84.5,15 79,5"
              fill={`url(#crystalGrad-${skinVariant})`}
              filter="url(#crystalGlow)"
            />
          </motion.g>

          {/* Crystal glow aura */}
          <motion.circle
            cx="84.5"
            cy="5"
            r="12"
            fill={`url(#magicEnergy-${skinVariant})`}
            opacity="0.6"
            animate={{ r: [12, 15, 12], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Orbiting magic particles */}
        {orbPositions.map((pos, i) => {
          const orbitRadius = 18 + (i % 3) * 4;
          const x = 84.5 + Math.cos(pos + (i * Math.PI * 2) / 8) * orbitRadius;
          const y = 5 + Math.sin(pos + (i * Math.PI * 2) / 8) * orbitRadius * 0.6;
          const size = 2 + (i % 3);
          const particleColors = [colors.glow, colors.energy[0], colors.trim[0], colors.energy[1]];
          
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={size}
              fill={particleColors[i % particleColors.length]}
              opacity={0.8}
              filter="url(#crystalGlow)"
            />
          );
        })}

        {/* Floating runes around character */}
        <motion.g
          opacity={0.6}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <text x="15" y="60" fontSize="8" fill={colors.glow} fontFamily="serif">✧</text>
          <text x="20" y="100" fontSize="6" fill={colors.energy[0]} fontFamily="serif">◇</text>
          <text x="75" y="50" fontSize="7" fill={colors.trim[0]} fontFamily="serif">✦</text>
        </motion.g>

        {/* Book at belt */}
        <rect x="58" y="85" width="8" height="10" rx="1" fill={colors.robe[2]} stroke={`url(#wizardGold-${skinVariant})`} strokeWidth="0.5"/>
        <line x1="60" y1="87" x2="60" y2="93" stroke={`url(#wizardGold-${skinVariant})`} strokeWidth="0.5"/>

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="100" height="185" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}

        {/* Casting energy spiral */}
        {state === 'casting' && (
          <motion.path
            d="M84.5 5 Q70 -10 50 -5 Q30 0 20 -20"
            stroke="#22D3EE"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
          />
        )}
      </svg>

      {/* Health bar - conditionally rendered */}
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
                  ? 'linear-gradient(90deg, #7C3AED, #A78BFA)'
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

      {/* Defeat constellation effect */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${30 + Math.random() * 40}%`,
                top: `${20 + Math.random() * 60}%`,
                width: 2 + Math.random() * 4,
                height: 2 + Math.random() * 4,
                background: i % 3 === 0 ? '#FCD34D' : '#22D3EE',
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -50 }}
              transition={{ duration: 1.5, delay: i * 0.08 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
