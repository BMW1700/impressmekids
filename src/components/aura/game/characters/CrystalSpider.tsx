import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type CrystalSpiderState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface CrystalSpiderProps {
  state: CrystalSpiderState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 90, height: 80 },
  medium: { width: 140, height: 120 },
  large: { width: 180, height: 160 },
};

export const CrystalSpider = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: CrystalSpiderProps) => {
  const [shimmer, setShimmer] = useState(0);
  const { width, height } = sizeConfig[size];

  // Shimmer animation for crystal effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer(prev => (prev + 1) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -2, 0],
          transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -6, 4, 0],
          filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
          transition: { duration: 0.25 },
        };
      case 'attacking':
        return {
          x: [0, 20, -5, 0],
          scale: [1, 1.1, 1],
          transition: { duration: 0.35 },
        };
      case 'defeated':
        return {
          rotate: [0, 5, -5, 8],
          scale: [1, 0.9, 0.8],
          opacity: [1, 0.7, 0.4],
          transition: { duration: 0.8 },
        };
      default:
        return {};
    }
  };

  // Leg animation - simplified
  const legAnimation = {
    rotate: [0, 5, -5, 0],
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' as const },
  };

  return (
    <motion.div
      className="relative"
      style={{ width, height }}
      animate={getStateAnimation()}
    >
      <svg
        viewBox="0 0 140 120"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Prismatic crystal gradient - animated */}
          <linearGradient id="crystalBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${shimmer}, 80%, 70%)`} />
            <stop offset="33%" stopColor={`hsl(${(shimmer + 120) % 360}, 80%, 60%)`} />
            <stop offset="66%" stopColor={`hsl(${(shimmer + 240) % 360}, 80%, 70%)`} />
            <stop offset="100%" stopColor={`hsl(${shimmer}, 80%, 60%)`} />
          </linearGradient>
          
          {/* Crystal leg gradient */}
          <linearGradient id="crystalLeg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          
          {/* Highlight gradient */}
          <linearGradient id="crystalHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Crystal glow filter */}
          <filter id="crystalGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="spiderShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#8B5CF6" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="70" cy="115" rx="35" ry="8" fill="#8B5CF6" opacity="0.3"/>

        {/* Legs - 4 on each side */}
        {/* Left legs */}
        <motion.path
          d="M55 55 Q30 40 15 25"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />
        <motion.path
          d="M52 62 Q25 55 5 50"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />
        <motion.path
          d="M52 70 Q25 75 5 85"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />
        <motion.path
          d="M55 78 Q35 95 20 110"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />
        
        {/* Right legs */}
        <motion.path
          d="M85 55 Q110 40 125 25"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />
        <motion.path
          d="M88 62 Q115 55 135 50"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />
        <motion.path
          d="M88 70 Q115 75 135 85"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />
        <motion.path
          d="M85 78 Q105 95 120 110"
          stroke="url(#crystalLeg)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={legAnimation}
        />

        {/* Crystal tips on legs */}
        <polygon points="15,25 10,18 20,20" fill="#E9D5FF"/>
        <polygon points="5,50 -2,45 8,43" fill="#E9D5FF"/>
        <polygon points="5,85 -2,88 8,92" fill="#E9D5FF"/>
        <polygon points="20,110 15,118 25,115" fill="#E9D5FF"/>
        <polygon points="125,25 130,18 120,20" fill="#E9D5FF"/>
        <polygon points="135,50 142,45 132,43" fill="#E9D5FF"/>
        <polygon points="135,85 142,88 132,92" fill="#E9D5FF"/>
        <polygon points="120,110 125,118 115,115" fill="#E9D5FF"/>

        {/* Body - crystalline abdomen */}
        <motion.g filter="url(#spiderShadow)">
          {/* Main body polygon (faceted crystal look) */}
          <polygon
            points="70,45 95,55 100,75 85,95 55,95 40,75 45,55"
            fill="url(#crystalBody)"
          />
          
          {/* Crystal facet highlights */}
          <polygon
            points="70,45 85,52 78,65 60,65 55,52"
            fill="url(#crystalHighlight)"
          />
          
          {/* Head segment */}
          <ellipse cx="70" cy="42" rx="18" ry="14" fill="url(#crystalBody)"/>
          
          {/* Head highlight */}
          <ellipse cx="65" cy="38" rx="8" ry="5" fill="url(#crystalHighlight)"/>
        </motion.g>

        {/* Multiple glowing eyes */}
        <g filter="url(#crystalGlow)">
          {/* Top row */}
          <circle cx="60" cy="38" r="4" fill="#FBBF24"/>
          <circle cx="70" cy="36" r="3" fill="#F472B6"/>
          <circle cx="80" cy="38" r="4" fill="#34D399"/>
          
          {/* Bottom row */}
          <circle cx="63" cy="45" r="3" fill="#60A5FA"/>
          <circle cx="70" cy="46" r="2" fill="#FFFFFF"/>
          <circle cx="77" cy="45" r="3" fill="#C084FC"/>
          
          {/* Eye reflections */}
          <circle cx="61" cy="37" r="1.5" fill="#FFFFFF"/>
          <circle cx="81" cy="37" r="1.5" fill="#FFFFFF"/>
        </g>

        {/* Mandibles/fangs */}
        <path d="M62 50 Q58 58 60 62" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M78 50 Q82 58 80 62" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" fill="none"/>
        
        {/* Venom drops */}
        <motion.circle
          cx="60"
          cy="64"
          r="2"
          fill="#22C55E"
          animate={{ opacity: [1, 0.5, 1], y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
          cx="80"
          cy="64"
          r="2"
          fill="#22C55E"
          animate={{ opacity: [0.5, 1, 0.5], y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />

        {/* Web spinnerets at back */}
        <path d="M55 95 Q70 102 85 95" stroke="#DDD6FE" strokeWidth="2" strokeDasharray="2,2"/>

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="140" height="120" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[100px]">
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
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
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

      {/* Shatter particles on defeat */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: 8,
                height: 12,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                background: `hsl(${(shimmer + i * 30) % 360}, 80%, 70%)`,
              }}
              initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 80,
                y: Math.sin((i / 12) * Math.PI * 2) * 80,
                rotate: Math.random() * 360,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.8, delay: i * 0.03 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
