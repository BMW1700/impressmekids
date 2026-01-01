import { motion } from 'framer-motion';

interface TugOfWarRopeProps {
  ropePosition: number; // -10 to +10
  maxPosition: number;
  isPulling: 'hero' | 'enemy' | null;
}

export const TugOfWarRope = ({ ropePosition, maxPosition, isPulling }: TugOfWarRopeProps) => {
  const ropeOffset = (ropePosition / maxPosition) * 30; // -30% to +30%
  
  // Calculate rope wave based on tension
  const getTension = () => {
    if (isPulling === 'hero') return 8;
    if (isPulling === 'enemy') return -8;
    return 0;
  };

  return (
    <div className="absolute bottom-24 left-0 right-0 h-20 flex items-center justify-center">
      <motion.div
        className="relative w-full max-w-3xl h-full"
        animate={{ x: `${ropeOffset}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Rope SVG */}
        <svg 
          viewBox="0 0 600 60" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Rope texture gradient */}
            <linearGradient id="ropeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d4a574" />
              <stop offset="30%" stopColor="#c4956a" />
              <stop offset="70%" stopColor="#a67c52" />
              <stop offset="100%" stopColor="#8b6914" />
            </linearGradient>
            
            {/* Rope pattern */}
            <pattern id="ropePattern" x="0" y="0" width="16" height="12" patternUnits="userSpaceOnUse">
              <path 
                d="M0 6 Q4 2 8 6 Q12 10 16 6" 
                stroke="#8b6914" 
                strokeWidth="1" 
                fill="none"
                opacity="0.4"
              />
            </pattern>
            
            {/* Drop shadow */}
            <filter id="ropeShadow" x="-10%" y="-50%" width="120%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Main rope body with wave */}
          <motion.path
            d={`M0 30 Q150 ${30 + getTension()} 300 30 Q450 ${30 - getTension()} 600 30`}
            stroke="url(#ropeGradient)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            filter="url(#ropeShadow)"
            animate={
              isPulling
                ? { d: isPulling === 'hero' 
                    ? [`M0 30 Q150 38 300 30 Q450 22 600 30`, `M0 30 Q150 30 300 30 Q450 30 600 30`]
                    : [`M0 30 Q150 22 300 30 Q450 38 600 30`, `M0 30 Q150 30 300 30 Q450 30 600 30`]
                  }
                : {}
            }
            transition={{ duration: 0.3 }}
          />
          
          {/* Rope texture overlay */}
          <motion.path
            d={`M0 30 Q150 ${30 + getTension()} 300 30 Q450 ${30 - getTension()} 600 30`}
            stroke="url(#ropePattern)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Rope highlights */}
          <motion.path
            d={`M0 27 Q150 ${27 + getTension()} 300 27 Q450 ${27 - getTension()} 600 27`}
            stroke="#e8c4a0"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Center flag/marker */}
          <g transform="translate(300, 0)">
            {/* Flag pole */}
            <rect x="-3" y="0" width="6" height="40" fill="#78350f" rx="2" />
            
            {/* Flag */}
            <motion.g
              animate={isPulling ? { rotate: isPulling === 'hero' ? [0, 10, 0] : [0, -10, 0] } : {}}
              style={{ transformOrigin: '0 8px' }}
            >
              <path
                d="M0 5 L35 12 L0 20 Z"
                fill="#fbbf24"
                stroke="#f59e0b"
                strokeWidth="1"
              />
              {/* Flag shine */}
              <path
                d="M5 10 L20 13"
                stroke="#fef08a"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </motion.g>
            
            {/* Flag glow on pull */}
            {isPulling === 'hero' && (
              <motion.circle
                cx="15"
                cy="12"
                r="20"
                fill="#22c55e"
                opacity="0.3"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 0.5 }}
              />
            )}
            {isPulling === 'enemy' && (
              <motion.circle
                cx="15"
                cy="12"
                r="20"
                fill="#ef4444"
                opacity="0.3"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 0.5 }}
              />
            )}
          </g>
          
          {/* Rope end knots */}
          <circle cx="15" cy="30" r="10" fill="#a67c52" stroke="#8b6914" strokeWidth="2" />
          <circle cx="585" cy="30" r="10" fill="#a67c52" stroke="#8b6914" strokeWidth="2" />
        </svg>
        
        {/* Dust particles when pulling */}
        {isPulling && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`dust-${i}`}
                className="absolute bottom-0 w-3 h-3 rounded-full bg-amber-200/60"
                style={{ left: `${20 + Math.random() * 60}%` }}
                initial={{ y: 0, opacity: 1, scale: 0 }}
                animate={{ 
                  y: -20 - Math.random() * 20, 
                  opacity: 0, 
                  scale: 1,
                  x: (Math.random() - 0.5) * 30,
                }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
