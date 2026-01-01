import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type GoblinState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'taunting' | 'pulling';

interface GoblinGuardProps {
  state: GoblinState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
}

const sizeConfig = {
  small: { width: 80, height: 100 },
  medium: { width: 120, height: 150 },
  large: { width: 160, height: 200 },
};

export const GoblinGuard = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  showDamage,
  size = 'medium',
  flipX = false,
}: GoblinGuardProps) => {
  const [eyeBlink, setEyeBlink] = useState(false);
  const [leftEarTwitch, setLeftEarTwitch] = useState(0);
  const [rightEarTwitch, setRightEarTwitch] = useState(0);
  const { width, height } = sizeConfig[size];

  // Eye blink every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Random ear twitches
  useEffect(() => {
    const leftInterval = setInterval(() => {
      setLeftEarTwitch(Math.random() * 10 - 5);
      setTimeout(() => setLeftEarTwitch(0), 200);
    }, 2000 + Math.random() * 1000);
    
    const rightInterval = setInterval(() => {
      setRightEarTwitch(Math.random() * 10 - 5);
      setTimeout(() => setRightEarTwitch(0), 200);
    }, 2500 + Math.random() * 1000);

    return () => {
      clearInterval(leftInterval);
      clearInterval(rightInterval);
    };
  }, []);

  const getStateAnimation = (): { 
    y?: number[]; 
    x?: number[]; 
    scale?: number[]; 
    rotate?: number[]; 
    opacity?: number[]; 
    filter?: string[];
    transition?: { duration: number; repeat?: number; ease?: [number, number, number, number] | 'easeInOut' | 'easeOut' };
  } => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -3, 0],
          scale: [1, 1.02, 1],
          transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'hit':
        return {
          x: [0, -8, 4, 0],
          filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1.5)', 'brightness(1)'],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          x: [0, 15, -5, 0],
          rotate: [0, -10, 5, 0],
          transition: { duration: 0.4 },
        };
      case 'defeated':
        return {
          rotate: [0, 15],
          y: [0, 20],
          scale: [1, 0.9],
          opacity: [1, 0.6],
          transition: { duration: 0.8 },
        };
      case 'taunting':
        return {
          y: [0, -5, 0],
          rotate: [0, -3, 3, 0],
          transition: { duration: 0.5 },
        };
      case 'pulling':
        return {
          x: [0, 8, 0],
          rotate: [0, 5, 0],
          scale: [1, 1.05, 1],
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
        viewBox="0 0 120 150"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Body gradient */}
          <linearGradient id="goblinBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3D7A4F" />
            <stop offset="50%" stopColor="#2D5F3F" />
            <stop offset="100%" stopColor="#1E4A2E" />
          </linearGradient>
          
          {/* Highlight gradient */}
          <linearGradient id="goblinHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7FD13B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7FD13B" stopOpacity="0" />
          </linearGradient>
          
          {/* Leather gradient */}
          <linearGradient id="leatherArmor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A0522D" />
            <stop offset="50%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#654321" />
          </linearGradient>
          
          {/* Club gradient */}
          <linearGradient id="woodClub" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B7355" />
            <stop offset="50%" stopColor="#6B4423" />
            <stop offset="100%" stopColor="#4A3728" />
          </linearGradient>

          {/* Shadow filter */}
          <filter id="goblinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
          </filter>

          {/* Glow filter */}
          <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Drop shadow ellipse */}
        <ellipse cx="60" cy="145" rx="35" ry="8" fill="#000000" opacity="0.3"/>

        {/* Left Ear */}
        <motion.path
          d="M25 45 Q15 30 25 15 Q35 25 30 45 Z"
          fill="url(#goblinBody)"
          stroke="#1E4A2E"
          strokeWidth="1"
          style={{ transformOrigin: '30px 45px' }}
          animate={{ rotate: leftEarTwitch }}
          transition={{ duration: 0.2 }}
          filter="url(#goblinShadow)"
        />
        
        {/* Right Ear */}
        <motion.path
          d="M95 45 Q105 30 95 15 Q85 25 90 45 Z"
          fill="url(#goblinBody)"
          stroke="#1E4A2E"
          strokeWidth="1"
          style={{ transformOrigin: '90px 45px' }}
          animate={{ rotate: rightEarTwitch }}
          transition={{ duration: 0.2 }}
          filter="url(#goblinShadow)"
        />

        {/* Body */}
        <ellipse 
          cx="60" cy="95" rx="32" ry="35" 
          fill="url(#goblinBody)"
          filter="url(#goblinShadow)"
        />
        
        {/* Body highlight */}
        <ellipse 
          cx="50" cy="85" rx="15" ry="20" 
          fill="url(#goblinHighlight)"
        />

        {/* Leather vest */}
        <path
          d="M35 75 Q60 65 85 75 L82 115 Q60 125 38 115 Z"
          fill="url(#leatherArmor)"
          stroke="#654321"
          strokeWidth="1.5"
        />
        
        {/* Vest straps */}
        <path d="M45 75 L48 115" stroke="#4A3728" strokeWidth="3" strokeLinecap="round"/>
        <path d="M75 75 L72 115" stroke="#4A3728" strokeWidth="3" strokeLinecap="round"/>
        
        {/* Belt buckle */}
        <rect x="52" y="100" width="16" height="10" rx="2" fill="#C0A060" stroke="#8B7355" strokeWidth="1"/>
        <circle cx="60" cy="105" r="2" fill="#8B7355"/>

        {/* Head */}
        <ellipse 
          cx="60" cy="45" rx="28" ry="25" 
          fill="url(#goblinBody)"
          filter="url(#goblinShadow)"
        />
        
        {/* Head highlight */}
        <ellipse 
          cx="50" cy="38" rx="12" ry="10" 
          fill="url(#goblinHighlight)"
        />

        {/* Brow ridge */}
        <path
          d="M35 38 Q60 32 85 38"
          fill="none"
          stroke="#1E4A2E"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Left eye white */}
        <ellipse cx="45" cy="42" rx="10" ry={eyeBlink ? 1 : 8} fill="#FFFDD0"/>
        
        {/* Left eye pupil */}
        {!eyeBlink && (
          <g filter="url(#eyeGlow)">
            <circle cx="47" cy="43" r="5" fill="#FFD700"/>
            <circle cx="48" cy="42" r="2" fill="#000000"/>
            <circle cx="49" cy="41" r="1" fill="#FFFFFF"/>
          </g>
        )}

        {/* Right eye white */}
        <ellipse cx="75" cy="42" rx="10" ry={eyeBlink ? 1 : 8} fill="#FFFDD0"/>
        
        {/* Right eye pupil */}
        {!eyeBlink && (
          <g filter="url(#eyeGlow)">
            <circle cx="77" cy="43" r="5" fill="#FFD700"/>
            <circle cx="78" cy="42" r="2" fill="#000000"/>
            <circle cx="79" cy="41" r="1" fill="#FFFFFF"/>
          </g>
        )}

        {/* Nose */}
        <ellipse cx="60" cy="52" rx="5" ry="3" fill="#1E4A2E"/>

        {/* Mouth with teeth */}
        <path
          d="M45 60 Q60 68 75 60"
          fill="none"
          stroke="#1E4A2E"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Jagged teeth */}
        <path
          d="M48 60 L50 65 L54 60 L58 66 L62 60 L66 65 L70 60"
          fill="#FFFDD0"
          stroke="#CCC"
          strokeWidth="0.5"
        />

        {/* Scars */}
        <path d="M78 50 L85 55" stroke="#1E4A2E" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M80 48 L82 54" stroke="#1E4A2E" strokeWidth="1" strokeLinecap="round"/>

        {/* Left arm */}
        <ellipse 
          cx="28" cy="90" rx="12" ry="18" 
          fill="url(#goblinBody)"
          filter="url(#goblinShadow)"
        />

        {/* Right arm (holding club) */}
        <motion.g
          animate={state === 'attacking' ? { rotate: [-20, 45, -20] } : { rotate: 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformOrigin: '92px 85px' }}
        >
          <ellipse 
            cx="92" cy="90" rx="12" ry="18" 
            fill="url(#goblinBody)"
            filter="url(#goblinShadow)"
          />
          
          {/* Club */}
          <rect
            x="95" y="60" width="12" height="50" rx="4"
            fill="url(#woodClub)"
            filter="url(#goblinShadow)"
            transform="rotate(25, 101, 85)"
          />
          
          {/* Club head */}
          <ellipse
            cx="108" cy="45" rx="14" ry="18"
            fill="url(#woodClub)"
            filter="url(#goblinShadow)"
            transform="rotate(25, 108, 45)"
          />
          
          {/* Club spikes/nails */}
          <circle cx="100" cy="38" r="2" fill="#666"/>
          <circle cx="115" cy="42" r="2" fill="#666"/>
          <circle cx="108" cy="30" r="2" fill="#666"/>
          
          {/* Battle damage on club */}
          <path d="M105 50 L110 55" stroke="#3D2817" strokeWidth="2" strokeLinecap="round"/>
        </motion.g>

        {/* Legs */}
        <ellipse cx="45" cy="130" rx="10" ry="15" fill="url(#goblinBody)" filter="url(#goblinShadow)"/>
        <ellipse cx="75" cy="130" rx="10" ry="15" fill="url(#goblinBody)" filter="url(#goblinShadow)"/>
        
        {/* Feet */}
        <ellipse cx="42" cy="142" rx="12" ry="5" fill="#1E4A2E"/>
        <ellipse cx="78" cy="142" rx="12" ry="5" fill="#1E4A2E"/>

        {/* Hit flash overlay */}
        {state === 'hit' && (
          <rect x="0" y="0" width="120" height="150" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.2s" fill="freeze"/>
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

      {/* Defeat smoke particles */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                background: 'radial-gradient(circle, #7FD13B 0%, #2D5F3F 50%, transparent 100%)',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 50,
                y: Math.sin((i / 8) * Math.PI * 2) * 50 - 30,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
