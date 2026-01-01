import { motion } from 'framer-motion';

interface TugOfWarRopeProps {
  ropePosition: number; // -10 to +10
  maxPosition: number;
  isPulling: 'hero' | 'enemy' | null;
}

export const TugOfWarRope = ({ ropePosition, maxPosition, isPulling }: TugOfWarRopeProps) => {
  const ropeOffset = (ropePosition / maxPosition) * 25; // -25% to +25%
  
  // Calculate rope wave based on tension
  const getTension = () => {
    if (isPulling === 'hero') return 10;
    if (isPulling === 'enemy') return -10;
    return 0;
  };

  return (
    <div className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
         style={{ bottom: '140px', height: '60px' }}>
      <motion.div
        className="relative w-full max-w-4xl h-full"
        animate={{ x: `${ropeOffset}%` }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        {/* Rope SVG */}
        <svg 
          viewBox="0 0 800 60" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Rich rope texture gradient */}
            <linearGradient id="ropeMainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4A574" />
              <stop offset="25%" stopColor="#C49A6C" />
              <stop offset="50%" stopColor="#B8860B" />
              <stop offset="75%" stopColor="#A67C52" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
            
            {/* Rope fiber pattern */}
            <pattern id="ropeFibers" x="0" y="0" width="20" height="14" patternUnits="userSpaceOnUse">
              <path 
                d="M0 7 Q5 3 10 7 Q15 11 20 7" 
                stroke="#6D4C41" 
                strokeWidth="0.8" 
                fill="none"
                opacity="0.5"
              />
              <path 
                d="M0 4 Q5 0 10 4 Q15 8 20 4" 
                stroke="#5D4037" 
                strokeWidth="0.5" 
                fill="none"
                opacity="0.3"
              />
            </pattern>
            
            {/* Drop shadow for depth */}
            <filter id="ropeShadow" x="-10%" y="-50%" width="120%" height="200%">
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
            </filter>
            
            {/* Rope end knot gradient */}
            <radialGradient id="knotGradient" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#D4A574" />
              <stop offset="100%" stopColor="#8B6914" />
            </radialGradient>
          </defs>

          {/* Main rope body with wave effect */}
          <motion.path
            d={`M0 30 Q200 ${30 + getTension()} 400 30 Q600 ${30 - getTension()} 800 30`}
            stroke="url(#ropeMainGradient)"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            filter="url(#ropeShadow)"
            animate={
              isPulling
                ? { 
                    d: isPulling === 'hero' 
                      ? [
                          `M0 30 Q200 42 400 30 Q600 18 800 30`,
                          `M0 30 Q200 32 400 30 Q600 28 800 30`
                        ]
                      : [
                          `M0 30 Q200 18 400 30 Q600 42 800 30`,
                          `M0 30 Q200 28 400 30 Q600 32 800 30`
                        ]
                  }
                : {}
            }
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
          
          {/* Rope fiber texture overlay */}
          <motion.path
            d={`M0 30 Q200 ${30 + getTension()} 400 30 Q600 ${30 - getTension()} 800 30`}
            stroke="url(#ropeFibers)"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Rope highlight (top edge) */}
          <motion.path
            d={`M0 24 Q200 ${24 + getTension()} 400 24 Q600 ${24 - getTension()} 800 24`}
            stroke="#E8D5B7"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Center flag/marker */}
          <g transform="translate(400, 0)">
            {/* Flag pole */}
            <rect x="-4" y="-5" width="8" height="45" fill="#5D4037" rx="2" />
            <rect x="-5" y="35" width="10" height="8" fill="#4E342E" rx="1" />
            
            {/* Triangular flag */}
            <motion.g
              animate={isPulling ? { rotate: isPulling === 'hero' ? [0, 12, 0] : [0, -12, 0] } : { rotate: [-2, 2, -2] }}
              transition={isPulling ? { duration: 0.3 } : { duration: 2, repeat: Infinity }}
              style={{ transformOrigin: '0 5px' }}
            >
              <path
                d="M0 0 L45 12 L0 25 Z"
                fill="#EF4444"
                stroke="#DC2626"
                strokeWidth="1.5"
              />
              {/* Flag highlight */}
              <path
                d="M5 8 L28 14"
                stroke="#FCA5A5"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.5"
              />
              {/* Flag detail */}
              <path
                d="M8 14 L20 17"
                stroke="#B91C1C"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </motion.g>
            
            {/* Glow effect on pull */}
            {isPulling === 'hero' && (
              <motion.circle
                cx="20"
                cy="12"
                r="25"
                fill="#22c55e"
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 0.5 }}
              />
            )}
            {isPulling === 'enemy' && (
              <motion.circle
                cx="20"
                cy="12"
                r="25"
                fill="#ef4444"
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 0.5 }}
              />
            )}
          </g>
          
          {/* Rope end knots - larger and more detailed */}
          <g transform="translate(15, 30)">
            <ellipse cx="0" cy="0" rx="14" ry="12" fill="url(#knotGradient)" />
            <ellipse cx="-3" cy="-3" rx="4" ry="3" fill="#E8D5B7" opacity="0.4" />
            <path d="M-8 0 Q0 -5 8 0 Q0 5 -8 0" stroke="#6D4C41" strokeWidth="1" fill="none" opacity="0.5" />
          </g>
          
          <g transform="translate(785, 30)">
            <ellipse cx="0" cy="0" rx="14" ry="12" fill="url(#knotGradient)" />
            <ellipse cx="-3" cy="-3" rx="4" ry="3" fill="#E8D5B7" opacity="0.4" />
            <path d="M-8 0 Q0 -5 8 0 Q0 5 -8 0" stroke="#6D4C41" strokeWidth="1" fill="none" opacity="0.5" />
          </g>
        </svg>
        
        {/* Dust particles when pulling */}
        {isPulling && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`dust-${i}`}
                className="absolute rounded-full"
                style={{ 
                  left: `${15 + Math.random() * 70}%`,
                  bottom: '-10px',
                  width: 6 + Math.random() * 6,
                  height: 6 + Math.random() * 6,
                  backgroundColor: `rgba(210, 180, 140, ${0.5 + Math.random() * 0.3})`,
                }}
                initial={{ y: 0, opacity: 1, scale: 0 }}
                animate={{ 
                  y: -30 - Math.random() * 25, 
                  opacity: 0, 
                  scale: 1.2,
                  x: (Math.random() - 0.5) * 40,
                }}
                transition={{ duration: 0.6, delay: i * 0.04 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
