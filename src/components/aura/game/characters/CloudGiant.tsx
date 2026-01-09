import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type CloudGiantState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface CloudGiantProps {
  state: CloudGiantState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 120, height: 160 },
  medium: { width: 180, height: 240 },
  large: { width: 240, height: 320 },
};

export const CloudGiant = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: CloudGiantProps) => {
  const [cloudPulse, setCloudPulse] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setCloudPulse(prev => (prev + 1) % 100);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const pulseScale = 1 + Math.sin(cloudPulse * 0.08) * 0.03;

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -5, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -8, 5, 0],
          filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
          transition: { duration: 0.4 },
        };
      case 'attacking':
        return {
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          opacity: [1, 0.5, 0.2],
          scale: [1, 1.1, 0.7],
          y: [0, -20, 40],
          transition: { duration: 1.5 },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className="relative"
      style={{ width, height }}
      animate={getStateAnimation()}
    >
      <svg
        viewBox="0 0 180 240"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="cloudBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="40%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          
          <linearGradient id="stormCloud" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <filter id="cloudGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="innerShadow">
            <feOffset dx="0" dy="3"/>
            <feGaussianBlur stdDeviation="3"/>
            <feComposite operator="out" in="SourceGraphic"/>
            <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.3 0"/>
            <feBlend in="SourceGraphic"/>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="90" cy="235" rx="60" ry="12" fill="#000000" opacity="0.25"/>

        {/* Main cloud body */}
        <motion.g style={{ scale: pulseScale, transformOrigin: '90px 130px' }}>
          {/* Cloud puffs making up the body */}
          <ellipse cx="90" cy="160" rx="65" ry="55" fill="url(#cloudBody)" filter="url(#innerShadow)"/>
          <ellipse cx="50" cy="145" rx="35" ry="30" fill="url(#cloudBody)"/>
          <ellipse cx="130" cy="145" rx="35" ry="30" fill="url(#cloudBody)"/>
          <ellipse cx="70" cy="120" rx="30" ry="25" fill="url(#cloudBody)"/>
          <ellipse cx="110" cy="120" rx="30" ry="25" fill="url(#cloudBody)"/>
          
          {/* Head */}
          <ellipse cx="90" cy="80" rx="40" ry="35" fill="url(#cloudBody)" filter="url(#innerShadow)"/>
          <ellipse cx="70" cy="60" rx="20" ry="18" fill="url(#cloudBody)"/>
          <ellipse cx="110" cy="60" rx="20" ry="18" fill="url(#cloudBody)"/>
          
          {/* Face - darker storm clouds for features */}
          {/* Eyes - glowing */}
          <g filter="url(#cloudGlow)">
            <ellipse cx="75" cy="75" rx="10" ry="8" fill="#0F172A"/>
            <ellipse cx="105" cy="75" rx="10" ry="8" fill="#0F172A"/>
            <circle cx="75" cy="75" r="4" fill="#FEF08A"/>
            <circle cx="105" cy="75" r="4" fill="#FEF08A"/>
            {/* Lightning flashes in eyes */}
            <circle cx="77" cy="73" r="2" fill="white"/>
            <circle cx="107" cy="73" r="2" fill="white"/>
          </g>
          
          {/* Mouth - storm opening */}
          <ellipse cx="90" cy="95" rx="15" ry="8" fill="#1E293B"/>
          
          {/* Arms - massive cloud fists */}
          <motion.g
            animate={state === 'attacking' ? { rotate: [0, -30, 0] } : {}}
            style={{ transformOrigin: '30px 140px' }}
          >
            <ellipse cx="20" cy="140" rx="25" ry="35" fill="url(#cloudBody)"/>
            <ellipse cx="15" cy="175" rx="20" ry="20" fill="url(#stormCloud)"/>
          </motion.g>
          
          <motion.g
            animate={state === 'attacking' ? { rotate: [0, 30, 0] } : {}}
            style={{ transformOrigin: '150px 140px' }}
          >
            <ellipse cx="160" cy="140" rx="25" ry="35" fill="url(#cloudBody)"/>
            <ellipse cx="165" cy="175" rx="20" ry="20" fill="url(#stormCloud)"/>
          </motion.g>
          
          {/* Storm effects at bottom */}
          <ellipse cx="60" cy="205" rx="25" ry="20" fill="url(#stormCloud)" opacity="0.7"/>
          <ellipse cx="90" cy="215" rx="30" ry="20" fill="url(#stormCloud)" opacity="0.8"/>
          <ellipse cx="120" cy="205" rx="25" ry="20" fill="url(#stormCloud)" opacity="0.7"/>
        </motion.g>

        {/* Lightning bolts */}
        {state === 'attacking' && (
          <g filter="url(#cloudGlow)">
            <path d="M70 200 L65 230 L75 225 L68 260" stroke="#FEF08A" strokeWidth="4" fill="none"/>
            <path d="M110 200 L115 230 L105 225 L112 260" stroke="#FEF08A" strokeWidth="4" fill="none"/>
            <path d="M90 210 L88 240 L95 235 L90 270" stroke="#FBBF24" strokeWidth="3" fill="none"/>
          </g>
        )}

        {/* Floating cloud particles */}
        {state === 'idle' && (
          <g opacity="0.6">
            {[...Array(5)].map((_, i) => (
              <motion.ellipse
                key={i}
                cx={30 + i * 30}
                cy={50}
                rx={8}
                ry={6}
                fill="#E2E8F0"
                animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </g>
        )}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="180" height="240" fill="white" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[120px]">
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

      {/* Defeat - dissipating effect */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: 15 + Math.random() * 20,
                height: 15 + Math.random() * 20,
                background: 'radial-gradient(circle, #CBD5E1 0%, #64748B 50%, transparent 100%)',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 0.8 }}
              animate={{
                x: (Math.random() - 0.5) * 150,
                y: (Math.random() - 0.5) * 150 - 50,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 1.5, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
