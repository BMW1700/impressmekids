import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type EchoWraithState = 'idle' | 'hit' | 'attacking' | 'defeated';

interface EchoWraithProps {
  state: EchoWraithState;
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

export const EchoWraith = ({
  state,
  healthPercent,
  currentHp,
  maxHp,
  size = 'medium',
  showHealthBar = true,
}: EchoWraithProps) => {
  const [wave, setWave] = useState(0);
  const { width, height } = sizeConfig[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setWave(prev => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const getStateAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -10, 0],
          opacity: [0.7, 0.9, 0.7],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'hit':
        return {
          x: [0, -15, 15, 0],
          opacity: [1, 0.3, 1],
          filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
          transition: { duration: 0.3 },
        };
      case 'attacking':
        return {
          x: [0, 40, 0],
          scale: [1, 1.2, 1],
          transition: { duration: 0.4 },
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
          <linearGradient id="echoBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8"/>
            <stop offset="50%" stopColor="#0891B2" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#164E63" stopOpacity="0.2"/>
          </linearGradient>
          
          <linearGradient id="soundWave" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0"/>
            <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0"/>
          </linearGradient>

          <filter id="echoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Sound wave rings emanating */}
        {[...Array(4)].map((_, i) => (
          <motion.ellipse
            key={i}
            cx="75"
            cy="90"
            rx={30 + i * 15}
            ry={20 + i * 10}
            fill="none"
            stroke="url(#soundWave)"
            strokeWidth="2"
            opacity={0.6 - i * 0.12}
            animate={{
              rx: [30 + i * 15, 40 + i * 15, 30 + i * 15],
              ry: [20 + i * 10, 30 + i * 10, 20 + i * 10],
              opacity: [0.6 - i * 0.12, 0.3, 0.6 - i * 0.12],
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        {/* Echo copies - trailing ghosts */}
        {[1, 2, 3].map((offset) => (
          <motion.g
            key={offset}
            opacity={0.3 - offset * 0.08}
            transform={`translate(${-offset * 8}, ${offset * 3})`}
          >
            <path
              d="M50 50 Q40 80 45 120 Q50 160 60 180 Q75 190 90 180 Q100 160 105 120 Q110 80 100 50 Q90 30 75 25 Q60 30 50 50"
              fill="url(#echoBody)"
            />
          </motion.g>
        ))}

        {/* Main wraith body */}
        <motion.g filter="url(#echoGlow)">
          <path
            d="M50 50 Q40 80 45 120 Q50 160 60 180 Q75 190 90 180 Q100 160 105 120 Q110 80 100 50 Q90 30 75 25 Q60 30 50 50"
            fill="url(#echoBody)"
          />
        </motion.g>

        {/* Hood/head */}
        <motion.path
          d="M45 45 Q45 15 75 10 Q105 15 105 45 Q105 60 75 65 Q45 60 45 45"
          fill="url(#echoBody)"
          filter="url(#echoGlow)"
        />

        {/* Sound wave pattern on body */}
        {[...Array(5)].map((_, i) => {
          const yPos = 70 + i * 20;
          const amplitude = Math.sin((wave + i * 20) * 0.15) * 8;
          return (
            <motion.path
              key={i}
              d={`M45 ${yPos} Q${60 + amplitude} ${yPos - 5} 75 ${yPos} Q${90 - amplitude} ${yPos + 5} 105 ${yPos}`}
              stroke="#67E8F9"
              strokeWidth="2"
              fill="none"
              opacity={0.6}
            />
          );
        })}

        {/* Glowing eyes */}
        <g filter="url(#echoGlow)">
          <ellipse cx="60" cy="40" rx="10" ry="8" fill="#CFFAFE"/>
          <ellipse cx="90" cy="40" rx="10" ry="8" fill="#CFFAFE"/>
          
          {/* Pupils that follow sound pattern */}
          <motion.circle
            cx="60"
            cy="40"
            r="4"
            fill="#0E7490"
            animate={{
              cx: [60, 62, 58, 60],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="90"
            cy="40"
            r="4"
            fill="#0E7490"
            animate={{
              cx: [90, 92, 88, 90],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
        </g>

        {/* Mouth - emitting sound */}
        <motion.ellipse
          cx="75"
          cy="55"
          rx="8"
          ry="5"
          fill="#164E63"
          animate={{
            ry: [5, 8, 5],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />

        {/* Arms - wispy sound tendrils */}
        <motion.path
          d="M45 80 Q25 75 15 90 Q10 110 20 120"
          stroke="url(#echoBody)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          animate={state === 'attacking' ? {
            d: [
              "M45 80 Q25 75 15 90 Q10 110 20 120",
              "M45 80 Q5 65 -10 80 Q-20 100 0 115",
              "M45 80 Q25 75 15 90 Q10 110 20 120",
            ]
          } : {}}
          transition={{ duration: 0.3 }}
        />
        
        <motion.path
          d="M105 80 Q125 75 135 90 Q140 110 130 120"
          stroke="url(#echoBody)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          animate={state === 'attacking' ? {
            d: [
              "M105 80 Q125 75 135 90 Q140 110 130 120",
              "M105 80 Q145 65 160 80 Q170 100 150 115",
              "M105 80 Q125 75 135 90 Q140 110 130 120",
            ]
          } : {}}
          transition={{ duration: 0.3 }}
        />

        {/* Lower wisps */}
        {[...Array(4)].map((_, i) => (
          <motion.path
            key={i}
            d={`M${55 + i * 15} 175 Q${50 + i * 15 + Math.sin((wave + i * 25) * 0.12) * 8} 190 ${55 + i * 15} 200`}
            stroke="url(#echoBody)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Attack sound blast */}
        {state === 'attacking' && (
          <g filter="url(#echoGlow)">
            {[...Array(5)].map((_, i) => (
              <motion.ellipse
                key={i}
                cx="75"
                cy="55"
                fill="none"
                stroke="#67E8F9"
                strokeWidth="3"
                initial={{ rx: 10, ry: 6, opacity: 1 }}
                animate={{ 
                  rx: [10, 80 + i * 10], 
                  ry: [6, 40 + i * 5], 
                  opacity: [1, 0],
                  cx: [75, 130]
                }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              />
            ))}
          </g>
        )}

        {/* Hit flash */}
        {state === 'hit' && (
          <rect x="0" y="0" width="150" height="195" fill="white" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0" dur="0.15s" fill="freeze"/>
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

      {/* Defeat - echo fades to nothing */}
      {state === 'defeated' && (
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-cyan-400"
              style={{
                left: '50%',
                top: '40%',
                width: 20,
                height: 12,
              }}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{
                scale: [1, 3 + i],
                opacity: [0.8, 0],
              }}
              transition={{ duration: 1, delay: i * 0.1 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
