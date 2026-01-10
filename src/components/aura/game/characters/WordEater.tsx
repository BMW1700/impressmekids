import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type WordEaterState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface WordEaterProps {
  state: WordEaterState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  size?: 'small' | 'medium' | 'large';
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 140, height: 160 },
  medium: { width: 210, height: 240 },
  large: { width: 280, height: 320 },
};

export const WordEater = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: WordEaterProps) => {
  const [pulse, setPulse] = useState(0);
  const [floatingLetters, setFloatingLetters] = useState(['A', 'B', 'C', 'D', 'E', 'F']);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const letterInterval = setInterval(() => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      setFloatingLetters(prev => 
        prev.map(() => letters[Math.floor(Math.random() * letters.length)])
      );
    }, 800);
    return () => clearInterval(letterInterval);
  }, []);

  const mouthOpen = 20 + Math.sin(pulse * 0.15) * 15;

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          scale: [1, 1.03, 1],
          y: [0, -5, 0],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -20, 15, 0],
          filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
          transition: { duration: 0.4 },
        };
      case 'attacking':
        return {
          scale: [1, 1.2, 0.9, 1.1, 1],
          y: [0, -20, 10, 0],
          transition: { duration: 0.6 },
        };
      case 'defeated':
        return {
          scale: [1, 1.3, 0],
          rotate: [0, -20, 20, 0],
          opacity: [1, 0.5, 0],
          transition: { duration: 2 },
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
        viewBox="0 0 210 240"
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="wordEaterBody" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#1E1B4B"/>
            <stop offset="50%" stopColor="#0F0A2A"/>
            <stop offset="100%" stopColor="#030014"/>
          </radialGradient>
          
          <linearGradient id="wordEaterGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7"/>
            <stop offset="50%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#581C87"/>
          </linearGradient>

          <radialGradient id="vortexCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0F0A2A"/>
            <stop offset="70%" stopColor="#1E1B4B"/>
            <stop offset="100%" stopColor="#A855F7"/>
          </radialGradient>

          <filter id="wordEaterGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer cosmic aura */}
        <motion.ellipse
          cx="105"
          cy="120"
          rx="95"
          ry="105"
          fill="url(#wordEaterGlow)"
          opacity={0.3}
          filter="url(#wordEaterGlowFilter)"
          animate={{
            rx: [95, 100, 95],
            ry: [105, 110, 105],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main body - massive cosmic horror */}
        <ellipse cx="105" cy="120" rx="80" ry="90" fill="url(#wordEaterBody)"/>
        
        {/* Cosmic texture - stars */}
        {[...Array(20)].map((_, i) => (
          <motion.circle
            key={i}
            cx={40 + Math.random() * 130}
            cy={50 + Math.random() * 140}
            r={1 + Math.random() * 2}
            fill="white"
            opacity={0.3 + Math.random() * 0.5}
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: Math.random() }}
          />
        ))}

        {/* The Mouth/Vortex - the word-eating maw */}
        <motion.g>
          {/* Vortex rings */}
          {[...Array(4)].map((_, i) => (
            <motion.ellipse
              key={i}
              cx="105"
              cy="130"
              rx={15 + i * 12}
              ry={mouthOpen * 0.3 + i * 8}
              fill="none"
              stroke="url(#wordEaterGlow)"
              strokeWidth="3"
              opacity={0.8 - i * 0.15}
              animate={{
                rotate: (i % 2 === 0 ? 1 : -1) * pulse * 2,
              }}
              style={{ transformOrigin: '105px 130px' }}
              transition={{ duration: 0 }}
            />
          ))}
          
          {/* Dark center */}
          <ellipse cx="105" cy="130" rx="20" ry={mouthOpen * 0.4} fill="url(#vortexCenter)"/>
        </motion.g>

        {/* Multiple eyes surrounding the maw */}
        {[
          { cx: 55, cy: 80, r: 18 },
          { cx: 155, cy: 80, r: 18 },
          { cx: 45, cy: 140, r: 12 },
          { cx: 165, cy: 140, r: 12 },
          { cx: 80, cy: 55, r: 10 },
          { cx: 130, cy: 55, r: 10 },
        ].map((eye, i) => (
          <g key={i} filter="url(#wordEaterGlowFilter)">
            <circle cx={eye.cx} cy={eye.cy} r={eye.r} fill="#1E1B4B" stroke="#A855F7" strokeWidth="2"/>
            <motion.circle
              cx={eye.cx}
              cy={eye.cy}
              r={eye.r * 0.6}
              fill="#DC2626"
              animate={{
                cx: [eye.cx, eye.cx + 3, eye.cx - 3, eye.cx],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
            />
            <motion.circle
              cx={eye.cx}
              cy={eye.cy}
              r={eye.r * 0.3}
              fill="#0F0A2A"
              animate={{
                cx: [eye.cx, eye.cx + 3, eye.cx - 3, eye.cx],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
            />
            <circle cx={eye.cx - eye.r * 0.2} cy={eye.cy - eye.r * 0.2} r={eye.r * 0.15} fill="white" opacity="0.7"/>
          </g>
        ))}

        {/* Tentacles/appendages */}
        {[...Array(6)].map((_, i) => {
          const angle = (i - 2.5) * 30;
          const wave = Math.sin((pulse + i * 20) * 0.1) * 15;
          return (
            <motion.path
              key={i}
              d={`M${105 + Math.sin(angle * Math.PI / 180) * 60} ${180} 
                  Q${105 + Math.sin(angle * Math.PI / 180) * 70 + wave} ${210} 
                  ${105 + Math.sin(angle * Math.PI / 180) * 50 + wave * 0.5} ${235}`}
              stroke="url(#wordEaterGlow)"
              strokeWidth={8 - Math.abs(i - 2.5)}
              fill="none"
              strokeLinecap="round"
              opacity={0.8}
            />
          );
        })}

        {/* Floating letters being consumed */}
        {floatingLetters.map((letter, i) => {
          const angle = (i / 6) * Math.PI * 2 + pulse * 0.05;
          const radius = 50 + Math.sin(pulse * 0.1 + i) * 10;
          return (
            <motion.text
              key={i}
              x={105 + Math.cos(angle) * radius}
              y={130 + Math.sin(angle) * radius * 0.6}
              fill="#A855F7"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={0.8}
              animate={{
                opacity: [0.8, 0.4, 0.8],
                scale: [1, 0.8, 1],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            >
              {letter}
            </motion.text>
          );
        })}

        {/* Attack - words flying into maw */}
        {state === 'attacking' && (
          <g>
            {['READ', 'BOOK', 'WORD', 'TEXT'].map((word, i) => (
              <motion.text
                key={i}
                fill="#F0ABFC"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
                initial={{ x: 105 + (i % 2 === 0 ? -100 : 100), y: 80 + i * 25, opacity: 1 }}
                animate={{ x: 105, y: 130, opacity: 0, scale: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {word}
              </motion.text>
            ))}
          </g>
        )}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="210" height="240" fill="white" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0" dur="0.2s" fill="freeze"/>
          </rect>
        )}
      </svg>

      {/* Health bar */}
      {showHealthBar && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[150px]">
          {currentHp !== undefined && maxHp !== undefined && (
            <div className="text-center text-sm font-bold text-white mb-0.5" 
                 style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
              {currentHp}/{maxHp}
            </div>
          )}
          <div className="h-3 bg-black/60 rounded-full overflow-hidden border-2 border-purple-500/50">
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

      {/* Defeat - cosmic explosion with letters */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-xl font-bold"
              style={{
                left: '50%',
                top: '50%',
                color: ['#A855F7', '#DC2626', '#F0ABFC', '#7C3AED'][i % 4],
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                scale: 0,
                opacity: 0,
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 1.5, delay: i * 0.05 }}
            >
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
