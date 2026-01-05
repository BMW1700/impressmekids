import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type GrogState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'taunting' | 'ground_slam';

interface GrogTheKingProps {
  state: GrogState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 120, height: 150 },
  medium: { width: 180, height: 225 },
  large: { width: 240, height: 300 },
};

export const GrogTheKing = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: GrogTheKingProps) => {
  const [eyeGlow, setEyeGlow] = useState(1);
  const [crownGem, setCrownGem] = useState(1);
  const { width, height } = sizeConfig[size];

  // Menacing eye glow pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setEyeGlow(prev => prev === 1 ? 1.5 : 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Crown gem sparkle
  useEffect(() => {
    const interval = setInterval(() => {
      setCrownGem(prev => prev === 1 ? 1.3 : 1);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const getStateAnimation = (): Record<string, any> => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -5, 0],
          scale: [1, 1.03, 1],
          transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -12, 8, 0],
          filter: ['brightness(1)', 'brightness(2)', 'brightness(1.5)', 'brightness(1)'],
          transition: { duration: 0.35 },
        };
      case 'attacking':
        return {
          x: [0, 25, -10, 0],
          rotate: [0, -15, 8, 0],
          scale: [1, 1.1, 1],
          transition: { duration: 0.5 },
        };
      case 'ground_slam':
        return {
          y: [0, -30, 10, 0],
          scale: [1, 1.2, 0.9, 1],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          rotate: [0, 20],
          y: [0, 30],
          scale: [1, 0.85],
          opacity: [1, 0.5],
          transition: { duration: 1 },
        };
      case 'taunting':
        return {
          y: [0, -8, 0],
          rotate: [0, -5, 5, 0],
          transition: { duration: 0.6 },
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
        viewBox="0 0 180 225"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          {/* Dark menacing body gradient */}
          <linearGradient id="grogBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A4D2E" />
            <stop offset="50%" stopColor="#0D3318" />
            <stop offset="100%" stopColor="#071A0C" />
          </linearGradient>
          
          {/* Scar highlight */}
          <linearGradient id="scarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D0F0F" />
            <stop offset="100%" stopColor="#1A0505" />
          </linearGradient>
          
          {/* Crown gradient */}
          <linearGradient id="crownGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          
          {/* Spiked armor */}
          <linearGradient id="armorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A4A4A" />
            <stop offset="50%" stopColor="#2A2A2A" />
            <stop offset="100%" stopColor="#1A1A1A" />
          </linearGradient>
          
          {/* Club gradient */}
          <linearGradient id="grogClub" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C4033" />
            <stop offset="50%" stopColor="#3D2817" />
            <stop offset="100%" stopColor="#2A1A0F" />
          </linearGradient>
          
          {/* Cape gradient */}
          <linearGradient id="capeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A0E0E" />
            <stop offset="100%" stopColor="#1A0505" />
          </linearGradient>

          {/* Eye glow filter */}
          <filter id="grogEyeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Crown glow */}
          <filter id="crownGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Shadow filter */}
          <filter id="grogShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.5"/>
          </filter>
        </defs>

        {/* Drop shadow */}
        <ellipse cx="90" cy="218" rx="50" ry="12" fill="#000000" opacity="0.4"/>

        {/* Torn Cape */}
        <path
          d="M50 80 L30 200 Q40 210 90 205 Q140 210 150 200 L130 80 Z"
          fill="url(#capeGradient)"
          opacity="0.8"
          filter="url(#grogShadow)"
        />
        {/* Cape tears */}
        <path d="M45 180 L35 200" stroke="#1A0505" strokeWidth="2" fill="none"/>
        <path d="M135 185 L145 200" stroke="#1A0505" strokeWidth="2" fill="none"/>

        {/* Large muscular body */}
        <ellipse 
          cx="90" cy="140" rx="50" ry="55" 
          fill="url(#grogBody)"
          filter="url(#grogShadow)"
        />
        
        {/* Spiked shoulder armor - left */}
        <path
          d="M35 100 L20 90 L30 80 L45 95 Z"
          fill="url(#armorGradient)"
          filter="url(#grogShadow)"
        />
        <circle cx="28" cy="88" r="4" fill="#666"/>
        
        {/* Spiked shoulder armor - right */}
        <path
          d="M145 100 L160 90 L150 80 L135 95 Z"
          fill="url(#armorGradient)"
          filter="url(#grogShadow)"
        />
        <circle cx="152" cy="88" r="4" fill="#666"/>

        {/* Chest armor plate */}
        <path
          d="M55 110 Q90 100 125 110 L120 160 Q90 170 60 160 Z"
          fill="url(#armorGradient)"
          stroke="#555"
          strokeWidth="2"
        />
        {/* Armor studs */}
        <circle cx="75" cy="125" r="3" fill="#888"/>
        <circle cx="105" cy="125" r="3" fill="#888"/>
        <circle cx="90" cy="145" r="4" fill="#666"/>

        {/* Large menacing head */}
        <ellipse 
          cx="90" cy="60" rx="40" ry="35" 
          fill="url(#grogBody)"
          filter="url(#grogShadow)"
        />

        {/* Prominent brow ridge */}
        <path
          d="M50 50 Q90 38 130 50"
          fill="none"
          stroke="#071A0C"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Glowing red eyes - menacing */}
        <motion.g 
          filter="url(#grogEyeGlow)"
          animate={{ opacity: eyeGlow }}
          transition={{ duration: 0.3 }}
        >
          <ellipse cx="70" cy="55" rx="12" ry="10" fill="#1A0000"/>
          <ellipse cx="70" cy="55" rx="8" ry="6" fill="#FF0000"/>
          <ellipse cx="72" cy="54" rx="4" ry="3" fill="#FF4444"/>
          <circle cx="74" cy="52" r="2" fill="#FFAAAA"/>
          
          <ellipse cx="110" cy="55" rx="12" ry="10" fill="#1A0000"/>
          <ellipse cx="110" cy="55" rx="8" ry="6" fill="#FF0000"/>
          <ellipse cx="112" cy="54" rx="4" ry="3" fill="#FF4444"/>
          <circle cx="114" cy="52" r="2" fill="#FFAAAA"/>
        </motion.g>

        {/* Large nose */}
        <ellipse cx="90" cy="68" rx="8" ry="5" fill="#0D3318"/>
        <ellipse cx="86" cy="68" rx="2" ry="1.5" fill="#071A0C"/>
        <ellipse cx="94" cy="68" rx="2" ry="1.5" fill="#071A0C"/>

        {/* Menacing mouth with fangs */}
        <path
          d="M60 78 Q90 92 120 78"
          fill="#0D1A0D"
          stroke="#071A0C"
          strokeWidth="2"
        />
        {/* Large fangs */}
        <path d="M68 78 L65 88 L72 78" fill="#FFFDD0" stroke="#CCC" strokeWidth="0.5"/>
        <path d="M82 80 L80 92 L86 80" fill="#FFFDD0" stroke="#CCC" strokeWidth="0.5"/>
        <path d="M98 80 L100 92 L94 80" fill="#FFFDD0" stroke="#CCC" strokeWidth="0.5"/>
        <path d="M112 78 L115 88 L108 78" fill="#FFFDD0" stroke="#CCC" strokeWidth="0.5"/>

        {/* Battle scars */}
        <path d="M55 45 L45 60" stroke="url(#scarGradient)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M52 48 L48 55" stroke="url(#scarGradient)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M125 50 L135 65" stroke="url(#scarGradient)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M130 55 L138 58" stroke="url(#scarGradient)" strokeWidth="2" strokeLinecap="round"/>

        {/* CROWN - Golden with red gems */}
        <motion.g 
          filter="url(#crownGlow)"
          animate={{ scale: crownGem }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '90px 25px' }}
        >
          {/* Crown base */}
          <path
            d="M55 35 L50 20 L65 28 L75 8 L90 25 L105 8 L115 28 L130 20 L125 35 Z"
            fill="url(#crownGold)"
            stroke="#8B6914"
            strokeWidth="1"
          />
          {/* Crown band */}
          <rect x="55" y="32" width="70" height="8" rx="2" fill="url(#crownGold)" stroke="#8B6914"/>
          
          {/* Red gems */}
          <circle cx="90" cy="18" r="5" fill="#8B0000"/>
          <circle cx="90" cy="18" r="3" fill="#FF0000"/>
          <circle cx="90" cy="16" r="1.5" fill="#FF6666"/>
          
          <circle cx="75" cy="22" r="3" fill="#8B0000"/>
          <circle cx="75" cy="22" r="2" fill="#FF0000"/>
          
          <circle cx="105" cy="22" r="3" fill="#8B0000"/>
          <circle cx="105" cy="22" r="2" fill="#FF0000"/>
        </motion.g>

        {/* Pointed ears */}
        <path
          d="M45 50 Q25 30 40 10 Q55 25 50 50 Z"
          fill="url(#grogBody)"
          stroke="#071A0C"
          strokeWidth="1"
          filter="url(#grogShadow)"
        />
        <path
          d="M135 50 Q155 30 140 10 Q125 25 130 50 Z"
          fill="url(#grogBody)"
          stroke="#071A0C"
          strokeWidth="1"
          filter="url(#grogShadow)"
        />

        {/* Left arm (bare) */}
        <ellipse 
          cx="38" cy="130" rx="18" ry="28" 
          fill="url(#grogBody)"
          filter="url(#grogShadow)"
        />

        {/* Right arm holding MASSIVE spiked club */}
        <motion.g
          animate={state === 'attacking' || state === 'ground_slam' ? { rotate: [-30, 60, -30] } : { rotate: 0 }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: '142px 130px' }}
        >
          <ellipse 
            cx="142" cy="130" rx="18" ry="28" 
            fill="url(#grogBody)"
            filter="url(#grogShadow)"
          />
          
          {/* MASSIVE club handle */}
          <rect
            x="150" y="80" width="18" height="80" rx="5"
            fill="url(#grogClub)"
            filter="url(#grogShadow)"
            transform="rotate(25, 159, 120)"
          />
          
          {/* MASSIVE club head */}
          <ellipse
            cx="175" cy="55" rx="28" ry="35"
            fill="url(#grogClub)"
            filter="url(#grogShadow)"
            transform="rotate(25, 175, 55)"
          />
          
          {/* Large metal spikes */}
          <circle cx="158" cy="35" r="5" fill="#666" stroke="#444" strokeWidth="1"/>
          <circle cx="180" cy="25" r="6" fill="#666" stroke="#444" strokeWidth="1"/>
          <circle cx="195" cy="45" r="5" fill="#666" stroke="#444" strokeWidth="1"/>
          <circle cx="188" cy="70" r="5" fill="#666" stroke="#444" strokeWidth="1"/>
          <circle cx="162" cy="65" r="4" fill="#666" stroke="#444" strokeWidth="1"/>
          
          {/* Blood stains on club */}
          <path d="M170 40 L175 55 L168 50" fill="#4A0E0E" opacity="0.6"/>
          <path d="M185 55 L190 65" stroke="#4A0E0E" strokeWidth="3" opacity="0.5"/>
        </motion.g>

        {/* Thick legs */}
        <ellipse cx="70" cy="190" rx="18" ry="25" fill="url(#grogBody)" filter="url(#grogShadow)"/>
        <ellipse cx="110" cy="190" rx="18" ry="25" fill="url(#grogBody)" filter="url(#grogShadow)"/>
        
        {/* Large feet */}
        <ellipse cx="65" cy="212" rx="20" ry="8" fill="#071A0C"/>
        <ellipse cx="115" cy="212" rx="20" ry="8" fill="#071A0C"/>

        {/* Hit flash overlay */}
        {state === 'hit' && (
          <rect x="0" y="0" width="180" height="225" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.25s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[140px]">
          {currentHp !== undefined && maxHp !== undefined && (
            <div className="text-center text-sm font-black text-white mb-1" 
                 style={{ textShadow: '2px 2px 3px rgba(0,0,0,0.9)' }}>
              {currentHp}/{maxHp}
            </div>
          )}
          <div className="h-3 bg-black/70 rounded-full overflow-hidden border-2 border-red-900">
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

      {/* Defeat effect - crown falls */}
      {state === 'defeated' && (
        <>
          <motion.div
            className="absolute top-0 left-1/2"
            initial={{ x: '-50%', y: 0, rotate: 0 }}
            animate={{ x: '-50%', y: 80, rotate: 45, opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <span className="text-4xl">👑</span>
          </motion.div>
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-5 h-5 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  background: 'radial-gradient(circle, #1A4D2E 0%, #0D3318 50%, transparent 100%)',
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 12) * Math.PI * 2) * 80,
                  y: Math.sin((i / 12) * Math.PI * 2) * 80 - 40,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 1, delay: i * 0.05 }}
              />
            ))}
          </div>
        </>
      )}

      {/* Ground slam shockwave effect */}
      {state === 'ground_slam' && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-40 h-8 bg-amber-600/50 rounded-full blur-md" />
        </motion.div>
      )}
    </motion.div>
  );
};
