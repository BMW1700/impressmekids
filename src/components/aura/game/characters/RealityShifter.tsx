import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type RealityShifterState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface RealityShifterProps {
  state: RealityShifterState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 100, height: 130 },
  medium: { width: 150, height: 195 },
  large: { width: 200, height: 260 },
};

export const RealityShifter = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: RealityShifterProps) => {
  const [morph, setMorph] = useState(0);
  const [currentShape, setCurrentShape] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setMorph(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const shapeInterval = setInterval(() => {
      setCurrentShape(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(shapeInterval);
  }, []);

  const glitchOffset = Math.sin(morph * 0.5) * 3;

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 0.95, 1],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -15, 15, -10, 10, 0],
          filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(0deg)'],
          transition: { duration: 0.4 },
        };
      case 'attacking':
        return {
          scale: [1, 0.5, 2, 1],
          rotate: [0, 180, 360],
          transition: { duration: 0.5 },
        };
      case 'defeated':
        return {
          scale: [1, 1.5, 0],
          rotate: [0, 720],
          opacity: [1, 0.5, 0],
          transition: { duration: 1.5 },
        };
      default:
        return {};
    }
  };

  const shapes = [
    // Cube
    <g key="cube">
      <polygon points="75,30 120,55 120,115 75,140 30,115 30,55" fill="url(#shifterGradient)" stroke="#00FF88" strokeWidth="2"/>
      <polygon points="75,30 120,55 75,80 30,55" fill="#00FF8840" stroke="#00FF88" strokeWidth="1"/>
      <line x1="75" y1="80" x2="75" y2="140" stroke="#00FF88" strokeWidth="1"/>
    </g>,
    // Pyramid
    <g key="pyramid">
      <polygon points="75,20 130,130 20,130" fill="url(#shifterGradient)" stroke="#FF00FF" strokeWidth="2"/>
      <polygon points="75,20 75,130 20,130" fill="#FF00FF30" stroke="#FF00FF" strokeWidth="1"/>
      <line x1="75" y1="20" x2="75" y2="130" stroke="#FF00FF" strokeWidth="1"/>
    </g>,
    // Icosahedron-like
    <g key="ico">
      <circle cx="75" cy="85" r="50" fill="none" stroke="url(#shifterGradient)" strokeWidth="2"/>
      {[...Array(6)].map((_, i) => (
        <line
          key={i}
          x1="75"
          y1="85"
          x2={75 + Math.cos(i * 60 * Math.PI / 180) * 50}
          y2={85 + Math.sin(i * 60 * Math.PI / 180) * 50}
          stroke="#00FFFF"
          strokeWidth="2"
        />
      ))}
      <circle cx="75" cy="85" r="20" fill="#00FFFF40"/>
    </g>,
    // Tesseract projection
    <g key="tesseract">
      <rect x="45" y="55" width="60" height="60" fill="none" stroke="#FFFF00" strokeWidth="2"/>
      <rect x="55" y="65" width="40" height="40" fill="url(#shifterGradient)" stroke="#FFFF00" strokeWidth="2"/>
      <line x1="45" y1="55" x2="55" y2="65" stroke="#FFFF00" strokeWidth="1"/>
      <line x1="105" y1="55" x2="95" y2="65" stroke="#FFFF00" strokeWidth="1"/>
      <line x1="45" y1="115" x2="55" y2="105" stroke="#FFFF00" strokeWidth="1"/>
      <line x1="105" y1="115" x2="95" y2="105" stroke="#FFFF00" strokeWidth="1"/>
    </g>,
  ];

  return (
    <motion.div
      className="relative"
      style={{ width, height }}
      animate={getStateAnimation()}
    >
      <svg
        viewBox="0 0 150 195"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="shifterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="0.8"/>
            <stop offset="33%" stopColor="#00FFFF" stopOpacity="0.6"/>
            <stop offset="66%" stopColor="#FF00FF" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#FFFF00" stopOpacity="0.8"/>
          </linearGradient>

          <filter id="glitch" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Glitch copies */}
        <g opacity="0.3" transform={`translate(${glitchOffset}, 0)`} style={{ filter: 'hue-rotate(120deg)' }}>
          {shapes[currentShape]}
        </g>
        <g opacity="0.3" transform={`translate(${-glitchOffset}, 0)`} style={{ filter: 'hue-rotate(240deg)' }}>
          {shapes[currentShape]}
        </g>

        {/* Main shape */}
        <motion.g
          filter="url(#glitch)"
          animate={{
            opacity: [1, 0.8, 1],
          }}
          transition={{ duration: 0.1, repeat: Infinity }}
        >
          {shapes[currentShape]}
        </motion.g>

        {/* Eye in center */}
        <g>
          <motion.circle
            cx="75"
            cy="85"
            r="15"
            fill="#0F0F0F"
            stroke="url(#shifterGradient)"
            strokeWidth="2"
            animate={{
              r: [15, 17, 15],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="75"
            cy="85"
            r="8"
            fill="white"
            animate={{
              cx: [75, 78, 72, 75],
              cy: [85, 83, 87, 85],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <circle cx="75" cy="85" r="4" fill="#0F0F0F"/>
        </g>

        {/* Digital particles */}
        {[...Array(8)].map((_, i) => (
          <motion.rect
            key={i}
            width="4"
            height="4"
            fill={['#00FF88', '#FF00FF', '#00FFFF', '#FFFF00'][i % 4]}
            animate={{
              x: [75 + Math.cos((morph * 0.1 + i * 0.785) * Math.PI) * 40, 75 + Math.cos((morph * 0.1 + i * 0.785 + 0.5) * Math.PI) * 60],
              y: [85 + Math.sin((morph * 0.1 + i * 0.785) * Math.PI) * 40, 85 + Math.sin((morph * 0.1 + i * 0.785 + 0.5) * Math.PI) * 60],
              opacity: [1, 0.5, 1],
            }}
            transition={{ duration: 0 }}
          />
        ))}

        {/* Scan lines effect */}
        {state === 'idle' && (
          <motion.rect
            x="0"
            y="0"
            width="150"
            height="4"
            fill="white"
            opacity={0.1}
            animate={{
              y: [0, 195, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Attack burst */}
        {state === 'attacking' && (
          <g>
            {[...Array(12)].map((_, i) => (
              <motion.line
                key={i}
                x1="75"
                y1="85"
                x2={75 + Math.cos(i * 30 * Math.PI / 180) * 20}
                y2={85 + Math.sin(i * 30 * Math.PI / 180) * 20}
                stroke={['#00FF88', '#FF00FF', '#00FFFF', '#FFFF00'][i % 4]}
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{
                  x2: [75 + Math.cos(i * 30 * Math.PI / 180) * 20, 75 + Math.cos(i * 30 * Math.PI / 180) * 80],
                  y2: [85 + Math.sin(i * 30 * Math.PI / 180) * 20, 85 + Math.sin(i * 30 * Math.PI / 180) * 80],
                  opacity: [1, 0],
                }}
                transition={{ duration: 0.4 }}
              />
            ))}
          </g>
        )}

        {/* Hit glitch effect */}
        {state === 'hit' && (
          <>
            <rect x="0" y="60" width="150" height="10" fill="#FF0000" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0" dur="0.15s" fill="freeze"/>
            </rect>
            <rect x="0" y="100" width="150" height="8" fill="#00FF00" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0" dur="0.15s" fill="freeze"/>
            </rect>
          </>
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

      {/* Defeat - reality collapse */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: 6,
                height: 6,
                background: ['#00FF88', '#FF00FF', '#00FFFF', '#FFFF00'][i % 4],
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 150,
                y: (Math.random() - 0.5) * 150,
                scale: 0,
                opacity: 0,
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 1, delay: i * 0.03 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
