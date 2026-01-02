import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type IceGolemState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface IceGolemProps {
  state: IceGolemState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 80, height: 110 },
  medium: { width: 120, height: 165 },
  large: { width: 160, height: 220 },
};

export const IceGolem = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'medium',
  flipX = false,
}: IceGolemProps) => {
  const [crystalPhase, setCrystalPhase] = useState(0);
  const [shardPositions, setShardPositions] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const { width, height } = sizeConfig[size];

  // Crystal shimmer
  useEffect(() => {
    const interval = setInterval(() => {
      setCrystalPhase(prev => (prev + 1) % 3);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Floating shards
  useEffect(() => {
    const interval = setInterval(() => {
      setShardPositions(prev => prev.map(p => (p + 0.05) % (Math.PI * 2)));
    }, 50);
    return () => clearInterval(interval);
  }, []);

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
          x: [0, -8, 4, 0],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          y: [0, -15, 5, 0],
          scale: [1, 1.1, 0.95, 1],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          scale: [1, 1.1, 0.8],
          rotate: [0, 5, -5, 10],
          opacity: [1, 1, 0.5],
          transition: { duration: 0.8 },
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
        viewBox="0 0 100 140"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Ice body gradient */}
          <linearGradient id="iceBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>

          {/* Crystal gradient */}
          <linearGradient id="iceCrystal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Deep ice */}
          <linearGradient id="deepIce" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0E7490" />
            <stop offset="100%" stopColor="#164E63" />
          </linearGradient>

          {/* Core glow */}
          <radialGradient id="iceCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#A5F3FC" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </radialGradient>

          {/* Filters */}
          <filter id="iceShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#0E7490" floodOpacity="0.5"/>
          </filter>

          <filter id="iceGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="crystalShimmer" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Cold mist at base */}
        <motion.ellipse
          cx="50" cy="135"
          rx="35"
          ry="8"
          fill="#A5F3FC"
          opacity={0.4}
          animate={{ rx: [35, 40, 35], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Drop shadow */}
        <ellipse cx="50" cy="135" rx="30" ry="6" fill="#0E7490" opacity="0.4"/>

        {/* Floating ice shards around body */}
        {shardPositions.map((pos, i) => {
          const orbitRadius = 45 + (i % 2) * 10;
          const x = 50 + Math.cos(pos + (i * Math.PI * 2) / 6) * orbitRadius;
          const y = 70 + Math.sin(pos + (i * Math.PI * 2) / 6) * 30;
          return (
            <motion.polygon
              key={i}
              points={`${x},${y - 8} ${x + 4},${y} ${x},${y + 8} ${x - 4},${y}`}
              fill="url(#iceCrystal)"
              opacity={0.7}
              filter="url(#crystalShimmer)"
            />
          );
        })}

        {/* Left leg */}
        <path
          d="M30 100 L25 130 L40 130 L38 100 Z"
          fill="url(#iceBody)"
          filter="url(#iceShadow)"
        />
        
        {/* Right leg */}
        <path
          d="M62 100 L60 130 L75 130 L70 100 Z"
          fill="url(#iceBody)"
          filter="url(#iceShadow)"
        />

        {/* Ice cracks on legs */}
        <path d="M32 105 L28 118" stroke="#0E7490" strokeWidth="1" opacity="0.6"/>
        <path d="M35 110 L33 122" stroke="#0E7490" strokeWidth="1" opacity="0.6"/>
        <path d="M68 105 L72 118" stroke="#0E7490" strokeWidth="1" opacity="0.6"/>
        <path d="M65 110 L67 122" stroke="#0E7490" strokeWidth="1" opacity="0.6"/>

        {/* Main body - crystalline shape */}
        <path
          d="M25 55 L50 30 L75 55 L80 90 Q50 110 20 90 Z"
          fill="url(#iceBody)"
          filter="url(#iceShadow)"
        />

        {/* Body facets */}
        <path d="M50 30 L40 60 L50 95" stroke="#A5F3FC" strokeWidth="1" fill="none" opacity="0.5"/>
        <path d="M50 30 L60 60 L50 95" stroke="#A5F3FC" strokeWidth="1" fill="none" opacity="0.5"/>
        <path d="M25 55 L40 75" stroke="#22D3EE" strokeWidth="1" fill="none" opacity="0.4"/>
        <path d="M75 55 L60 75" stroke="#22D3EE" strokeWidth="1" fill="none" opacity="0.4"/>

        {/* Inner core glow */}
        <motion.circle
          cx="50"
          cy="70"
          r="15"
          fill="url(#iceCore)"
          filter="url(#iceGlow)"
          animate={{ 
            opacity: [0.6, 0.9, 0.6],
            r: [15, 17, 15],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Crystal protrusions from body */}
        <polygon
          points="20,50 15,35 25,40"
          fill="url(#iceCrystal)"
          filter="url(#crystalShimmer)"
        />
        <polygon
          points="80,50 85,35 75,40"
          fill="url(#iceCrystal)"
          filter="url(#crystalShimmer)"
        />
        <polygon
          points="50,30 45,15 55,15"
          fill="url(#iceCrystal)"
          filter="url(#crystalShimmer)"
        />

        {/* Left arm */}
        <path
          d="M20 60 L5 75 L8 85 L25 72 Z"
          fill="url(#iceBody)"
          filter="url(#iceShadow)"
        />
        
        {/* Right arm */}
        <motion.path
          d="M80 60 L95 75 L92 85 L75 72 Z"
          fill="url(#iceBody)"
          filter="url(#iceShadow)"
          animate={state === 'attacking' ? { rotate: [-10, 30, -10] } : {}}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: '80px 65px' }}
        />

        {/* Ice claws */}
        <polygon points="5,75 0,70 3,78" fill="url(#deepIce)"/>
        <polygon points="8,78 2,82 6,85" fill="url(#deepIce)"/>
        <polygon points="95,75 100,70 97,78" fill="url(#deepIce)"/>
        <polygon points="92,78 98,82 94,85" fill="url(#deepIce)"/>

        {/* Head - angular crystal */}
        <polygon
          points="50,5 35,25 40,40 60,40 65,25"
          fill="url(#iceBody)"
          filter="url(#iceShadow)"
        />

        {/* Eyes - white glow */}
        <motion.g
          filter="url(#iceGlow)"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ellipse cx="42" cy="28" rx="4" ry="3" fill="#FFFFFF"/>
          <ellipse cx="58" cy="28" rx="4" ry="3" fill="#FFFFFF"/>
          <circle cx="42" cy="28" r="1.5" fill="#06B6D4"/>
          <circle cx="58" cy="28" r="1.5" fill="#06B6D4"/>
        </motion.g>

        {/* Ice blast when attacking */}
        {state === 'attacking' && (
          <motion.g filter="url(#iceGlow)">
            {[...Array(8)].map((_, i) => (
              <motion.polygon
                key={i}
                points="0,0 -3,8 3,8"
                fill="#A5F3FC"
                initial={{ 
                  x: 92, 
                  y: 80, 
                  rotate: 0,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{ 
                  x: 92 + 30 + i * 5,
                  y: 80 + (i - 4) * 8,
                  rotate: 180,
                  opacity: 0,
                  scale: 0.5,
                }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
            ))}
          </motion.g>
        )}

        {/* Shimmer effect based on phase */}
        <motion.rect
          x={20 + crystalPhase * 20}
          y={30}
          width="2"
          height="40"
          fill="#FFFFFF"
          opacity={0.3}
          rx="1"
        />

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="100" height="140" fill="white" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
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
                ? 'linear-gradient(90deg, #06B6D4, #22D3EE)' 
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

      {/* Shatter particles on defeat */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: `8px solid ${i % 2 === 0 ? '#A5F3FC' : '#22D3EE'}`,
              }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i / 16) * Math.PI * 2) * 80,
                y: Math.sin((i / 16) * Math.PI * 2) * 60,
                rotate: Math.random() * 360,
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
