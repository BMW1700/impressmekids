import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type WraithState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface ShadowWraithProps {
  state: WraithState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 70, height: 120 },
  medium: { width: 105, height: 180 },
  large: { width: 140, height: 240 },
};

export const ShadowWraith = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'medium',
  flipX = false,
}: ShadowWraithProps) => {
  const [floatPhase, setFloatPhase] = useState(0);
  const [shadowParticles, setShadowParticles] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
  const [flickerOpacity, setFlickerOpacity] = useState(1);
  const { width, height } = sizeConfig[size];

  // Ethereal float
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatPhase(prev => (prev + 0.05) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Shadow particles rising
  useEffect(() => {
    const interval = setInterval(() => {
      setShadowParticles(prev => prev.map(p => (p + 0.03) % 1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Random flicker
  useEffect(() => {
    const interval = setInterval(() => {
      setFlickerOpacity(Math.random() > 0.9 ? 0.7 : 1);
    }, 100);
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
          y: [0, -8, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'hit':
        return {
          x: [0, 10, -10, 5, -5, 0],
          opacity: [1, 0.5, 1, 0.5, 1],
          transition: { duration: 0.4 },
        };
      case 'attacking':
        return {
          x: [0, 30, 0],
          scale: [1, 1.2, 1],
          transition: { duration: 0.5 },
        };
      case 'defeated':
        return {
          opacity: [1, 0],
          scale: [1, 1.5],
          y: [0, -50],
          transition: { duration: 1.5 },
        };
      default:
        return {};
    }
  };

  const wispOffset = Math.sin(floatPhase) * 5;

  return (
    <motion.div
      className="relative"
      style={{
        width,
        height,
        transform: flipX ? 'scaleX(-1)' : undefined,
        opacity: flickerOpacity,
      }}
      animate={getStateAnimation()}
    >
      <svg
        viewBox="0 0 80 160"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Shadow body gradient */}
          <linearGradient id="wraithBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6B21A8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#3B0764" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.3" />
          </linearGradient>

          {/* Deep shadow */}
          <linearGradient id="deepShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#0F0A1F" stopOpacity="0" />
          </linearGradient>

          {/* Purple glow */}
          <radialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6B21A8" stopOpacity="0" />
          </radialGradient>

          {/* Eye glow */}
          <radialGradient id="wraithEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E879F9" />
            <stop offset="60%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>

          {/* Filters */}
          <filter id="wraithShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="etherealGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Rising shadow particles */}
        {shadowParticles.map((p, i) => {
          const x = 25 + (i % 4) * 10 + Math.sin(p * Math.PI * 2 + i) * 5;
          const y = 140 - p * 120;
          const size = 3 + (1 - p) * 4;
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={size}
              fill="#6B21A8"
              opacity={(1 - p) * 0.6}
              filter="url(#wraithShadow)"
            />
          );
        })}

        {/* Wispy tail/body bottom - fades out */}
        <motion.path
          d={`M25 100 Q30 ${120 + wispOffset} 20 145 Q40 ${140 - wispOffset} 60 145 Q50 ${120 + wispOffset} 55 100 Z`}
          fill="url(#deepShadow)"
          filter="url(#wraithShadow)"
        />

        {/* Multiple wispy tendrils */}
        <motion.path
          d={`M30 110 Q25 ${130 + wispOffset * 0.5} 15 155`}
          stroke="url(#deepShadow)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <motion.path
          d={`M50 110 Q55 ${130 - wispOffset * 0.5} 65 155`}
          stroke="url(#deepShadow)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <motion.path
          d={`M40 115 Q40 ${135 + wispOffset * 0.3} 40 160`}
          stroke="url(#deepShadow)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />

        {/* Main body - ethereal shape */}
        <path
          d="M20 45 Q40 20 60 45 Q65 70 55 100 Q40 110 25 100 Q15 70 20 45 Z"
          fill="url(#wraithBody)"
          filter="url(#wraithShadow)"
        />

        {/* Inner glow/core */}
        <motion.ellipse
          cx="40"
          cy="65"
          rx="12"
          ry="15"
          fill="url(#purpleGlow)"
          filter="url(#etherealGlow)"
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            rx: [12, 14, 12],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Hood/head */}
        <path
          d="M20 45 Q25 25 40 20 Q55 25 60 45 Q55 55 40 50 Q25 55 20 45 Z"
          fill="#1E1B4B"
          filter="url(#wraithShadow)"
        />

        {/* Hood inner darkness */}
        <ellipse cx="40" cy="42" rx="12" ry="10" fill="#0F0A1F"/>

        {/* Glowing eyes */}
        <motion.g
          filter="url(#etherealGlow)"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ellipse cx="34" cy="40" rx="4" ry="3" fill="url(#wraithEye)"/>
          <ellipse cx="46" cy="40" rx="4" ry="3" fill="url(#wraithEye)"/>
          <circle cx="34" cy="40" r="1.5" fill="#FFFFFF"/>
          <circle cx="46" cy="40" r="1.5" fill="#FFFFFF"/>
        </motion.g>

        {/* Spectral arms - left */}
        <motion.path
          d="M15 60 Q5 70 0 85 Q8 80 10 75"
          fill="url(#wraithBody)"
          filter="url(#wraithShadow)"
          animate={{ 
            d: [
              "M15 60 Q5 70 0 85 Q8 80 10 75",
              "M15 60 Q3 72 -2 88 Q6 82 8 77",
              "M15 60 Q5 70 0 85 Q8 80 10 75",
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Spectral arms - right */}
        <motion.path
          d="M65 60 Q75 70 80 85 Q72 80 70 75"
          fill="url(#wraithBody)"
          filter="url(#wraithShadow)"
          animate={state === 'attacking' ? { 
            d: [
              "M65 60 Q75 70 80 85 Q72 80 70 75",
              "M65 60 Q90 55 110 50 Q95 60 85 65",
              "M65 60 Q75 70 80 85 Q72 80 70 75",
            ]
          } : { 
            d: [
              "M65 60 Q75 70 80 85 Q72 80 70 75",
              "M65 60 Q77 72 82 88 Q74 82 72 77",
              "M65 60 Q75 70 80 85 Q72 80 70 75",
            ]
          }}
          transition={{ duration: state === 'attacking' ? 0.5 : 3, repeat: state === 'attacking' ? 0 : Infinity, ease: 'easeInOut' }}
        />

        {/* Spectral claws */}
        <motion.g opacity={0.7}>
          <path d="M0 85 L-5 90 L2 87" fill="#A855F7"/>
          <path d="M2 88 L-2 95 L5 90" fill="#A855F7"/>
          <path d="M80 85 L85 90 L78 87" fill="#A855F7"/>
          <path d="M78 88 L82 95 L75 90" fill="#A855F7"/>
        </motion.g>

        {/* Dark energy swirl when attacking */}
        {state === 'attacking' && (
          <motion.g filter="url(#etherealGlow)">
            <motion.circle
              cx="90"
              cy="55"
              r="10"
              fill="url(#purpleGlow)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 2], opacity: [0, 1, 0] }}
              transition={{ duration: 0.5 }}
            />
            {[...Array(6)].map((_, i) => (
              <motion.circle
                key={i}
                r={4}
                fill="#A855F7"
                initial={{ cx: 65, cy: 60, opacity: 1 }}
                animate={{ 
                  cx: 100 + i * 8,
                  cy: 55 + (i - 3) * 5,
                  opacity: 0,
                }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              />
            ))}
          </motion.g>
        )}

        {/* Ethereal aura */}
        <motion.ellipse
          cx="40"
          cy="70"
          rx="35"
          ry="45"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="1"
          opacity="0.3"
          filter="url(#etherealGlow)"
          animate={{ 
            rx: [35, 38, 35],
            ry: [45, 48, 45],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Hit flicker effect */}
        {state === 'hit' && (
          <rect x="0" y="0" width="80" height="160" fill="#A855F7" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0;0.3;0" dur="0.3s" fill="freeze"/>
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
                ? 'linear-gradient(90deg, #7C3AED, #A855F7)' 
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

      {/* Fade to nothing on defeat */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                width: 4 + Math.random() * 6,
                height: 4 + Math.random() * 6,
                background: '#7C3AED',
              }}
              initial={{ opacity: 0.8, y: 0 }}
              animate={{ opacity: 0, y: -80 }}
              transition={{ duration: 1.5, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
