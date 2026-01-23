import { motion } from "framer-motion";

type PowerEffect = 'fire' | 'ice' | 'lightning' | 'holy' | 'poison' | 'default';

interface PowerIconProps {
  effect?: PowerEffect;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

export const PowerIcon = ({ effect = 'default', size = 'md', className = '' }: PowerIconProps) => {
  const s = sizeMap[size];
  
  switch (effect) {
    case 'fire':
      return (
        <motion.svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          className={className}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <defs>
            <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            <filter id="fireGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Main flame */}
          <motion.path
            d="M32 8 C20 20 16 32 20 44 C22 50 26 54 32 56 C38 54 42 50 44 44 C48 32 44 20 32 8 Z"
            fill="url(#fireGrad)"
            filter="url(#fireGlow)"
            animate={{ 
              d: [
                "M32 8 C20 20 16 32 20 44 C22 50 26 54 32 56 C38 54 42 50 44 44 C48 32 44 20 32 8 Z",
                "M32 6 C18 18 14 30 18 44 C20 52 26 56 32 58 C38 56 44 52 46 44 C50 30 46 18 32 6 Z",
                "M32 8 C20 20 16 32 20 44 C22 50 26 54 32 56 C38 54 42 50 44 44 C48 32 44 20 32 8 Z"
              ]
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          
          {/* Inner flame */}
          <motion.path
            d="M32 20 C26 28 24 36 28 44 C30 48 32 50 32 50 C32 50 34 48 36 44 C40 36 38 28 32 20 Z"
            fill="#FDE047"
            animate={{ 
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.1, 1]
            }}
            style={{ transformOrigin: '32px 35px' }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          
          {/* Ember particles */}
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={28 + i * 4}
              cy={48}
              r={2}
              fill="#FBBF24"
              animate={{
                y: [-10, -30],
                opacity: [1, 0],
                x: [0, (i - 1) * 8]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </motion.svg>
      );
      
    case 'ice':
      return (
        <motion.svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          className={className}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <defs>
            <linearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="50%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
            <filter id="iceGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Snowflake arms */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.g key={i} transform={`rotate(${angle} 32 32)`}>
              <line x1="32" y1="32" x2="32" y2="8" stroke="url(#iceGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#iceGlow)" />
              <line x1="32" y1="14" x2="26" y2="20" stroke="url(#iceGrad)" strokeWidth="2" strokeLinecap="round" />
              <line x1="32" y1="14" x2="38" y2="20" stroke="url(#iceGrad)" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
          ))}
          
          {/* Center crystal */}
          <motion.circle
            cx="32"
            cy="32"
            r="6"
            fill="url(#iceGrad)"
            filter="url(#iceGlow)"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Sparkles */}
          {[0, 1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              cx={20 + i * 8}
              cy={20 + (i % 2) * 24}
              r={1.5}
              fill="#FFFFFF"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </motion.svg>
      );
      
    case 'lightning':
      return (
        <motion.svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          className={className}
        >
          <defs>
            <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
            <filter id="lightningGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Lightning bolt */}
          <motion.path
            d="M38 4 L24 28 L32 28 L22 60 L42 32 L34 32 L42 4 Z"
            fill="url(#lightningGrad)"
            filter="url(#lightningGlow)"
            animate={{ 
              opacity: [1, 0.7, 1],
              scale: [1, 1.05, 1]
            }}
            style={{ transformOrigin: '32px 32px' }}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 2 }}
          />
          
          {/* Flash effect */}
          <motion.rect
            x="0"
            y="0"
            width="64"
            height="64"
            fill="#FFFFFF"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 2.5 }}
          />
        </motion.svg>
      );
      
    case 'holy':
      return (
        <motion.svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          className={className}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <defs>
            <radialGradient id="holyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
            </radialGradient>
            <filter id="holyGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Star burst rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <motion.line
              key={i}
              x1="32"
              y1="32"
              x2={32 + Math.cos((angle * Math.PI) / 180) * (i % 2 === 0 ? 26 : 18)}
              y2={32 + Math.sin((angle * Math.PI) / 180) * (i % 2 === 0 ? 26 : 18)}
              stroke="url(#holyGrad)"
              strokeWidth={i % 2 === 0 ? 4 : 2}
              strokeLinecap="round"
              filter="url(#holyGlow)"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
          
          {/* Center glow */}
          <motion.circle
            cx="32"
            cy="32"
            r="8"
            fill="url(#holyGrad)"
            filter="url(#holyGlow)"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.svg>
      );
      
    case 'poison':
      return (
        <motion.svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          className={className}
        >
          <defs>
            <linearGradient id="poisonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="50%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <filter id="poisonGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Potion bottle */}
          <path
            d="M26 20 L26 8 L38 8 L38 20 L44 32 L44 52 C44 56 40 58 32 58 C24 58 20 56 20 52 L20 32 Z"
            fill="url(#poisonGrad)"
            filter="url(#poisonGlow)"
          />
          
          {/* Bottle neck */}
          <rect x="28" y="4" width="8" height="6" rx="1" fill="#A78BFA" />
          
          {/* Bubbles */}
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={28 + i * 4}
              cy={48}
              r={2 + i}
              fill="#86EFAC"
              animate={{
                y: [-5, -20],
                opacity: [0.8, 0],
                scale: [1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
          
          {/* Skull symbol */}
          <circle cx="32" cy="40" r="6" fill="#15803D" />
          <circle cx="30" cy="39" r="1.5" fill="#86EFAC" />
          <circle cx="34" cy="39" r="1.5" fill="#86EFAC" />
          <path d="M30 43 L32 45 L34 43" stroke="#86EFAC" strokeWidth="1" fill="none" />
        </motion.svg>
      );
      
    default:
      return (
        <motion.svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          className={className}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <defs>
            <radialGradient id="defaultGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#7C3AED" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="24" fill="url(#defaultGrad)" />
          <text x="32" y="38" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">✦</text>
        </motion.svg>
      );
  }
};
