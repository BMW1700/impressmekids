import { motion } from 'framer-motion';

interface TugOfWarRopeProps {
  ropePosition: number; // -10 to +10
  maxPosition: number;
  isPulling: 'hero' | 'enemy' | null;
}

export const TugOfWarRope = ({ ropePosition, maxPosition, isPulling }: TugOfWarRopeProps) => {
  // Calculate rope wave based on tension
  const getTension = () => {
    if (isPulling === 'hero') return 8;
    if (isPulling === 'enemy') return -8;
    return 0;
  };

  return (
    <div className="w-full h-full">
      {/* Rope SVG - wider viewBox for longer rope that extends to both teams */}
      <svg 
        viewBox="0 0 1000 80" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
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
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
          </filter>
          
          {/* Rope end knot gradient */}
          <radialGradient id="knotGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#D4A574" />
            <stop offset="100%" stopColor="#8B6914" />
          </radialGradient>
        </defs>

        {/* Main rope body with wave effect - LONGER to reach both teams */}
        <motion.path
          d={`M-50 40 Q250 ${40 + getTension()} 500 40 Q750 ${40 - getTension()} 1050 40`}
          stroke="url(#ropeMainGradient)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
          filter="url(#ropeShadow)"
          animate={
            isPulling
              ? { 
                  d: isPulling === 'hero' 
                    ? [
                        `M-50 40 Q250 52 500 40 Q750 28 1050 40`,
                        `M-50 40 Q250 44 500 40 Q750 36 1050 40`
                      ]
                    : [
                        `M-50 40 Q250 28 500 40 Q750 52 1050 40`,
                        `M-50 40 Q250 36 500 40 Q750 44 1050 40`
                      ]
                }
              : {}
          }
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
        
        {/* Rope fiber texture overlay */}
        <motion.path
          d={`M-50 40 Q250 ${40 + getTension()} 500 40 Q750 ${40 - getTension()} 1050 40`}
          stroke="url(#ropeFibers)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Rope highlight (top edge) */}
        <motion.path
          d={`M-50 34 Q250 ${34 + getTension()} 500 34 Q750 ${34 - getTension()} 1050 34`}
          stroke="#E8D5B7"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Center flag/marker */}
        <g transform="translate(500, 0)">
          {/* Flag pole */}
          <rect x="-4" y="-10" width="8" height="60" fill="#5D4037" rx="2" />
          <rect x="-5" y="45" width="10" height="10" fill="#4E342E" rx="1" />
          
          {/* Triangular flag */}
          <motion.g
            animate={isPulling ? { rotate: isPulling === 'hero' ? [0, 12, 0] : [0, -12, 0] } : { rotate: [-2, 2, -2] }}
            transition={isPulling ? { duration: 0.3 } : { duration: 2, repeat: Infinity }}
            style={{ transformOrigin: '0 0px' }}
          >
            <path
              d="M0 -5 L50 10 L0 25 Z"
              fill="#EF4444"
              stroke="#DC2626"
              strokeWidth="1.5"
            />
            {/* Flag highlight */}
            <path
              d="M5 5 L30 12"
              stroke="#FCA5A5"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />
            {/* Flag detail */}
            <path
              d="M8 12 L22 16"
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
              cy="10"
              r="30"
              fill="#22c55e"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.5 }}
            />
          )}
          {isPulling === 'enemy' && (
            <motion.circle
              cx="20"
              cy="10"
              r="30"
              fill="#ef4444"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.5 }}
            />
          )}
        </g>
        
        {/* Rope end knots - at extended positions */}
        <g transform="translate(-35, 40)">
          <ellipse cx="0" cy="0" rx="16" ry="14" fill="url(#knotGradient)" />
          <ellipse cx="-3" cy="-3" rx="5" ry="4" fill="#E8D5B7" opacity="0.4" />
          <path d="M-10 0 Q0 -6 10 0 Q0 6 -10 0" stroke="#6D4C41" strokeWidth="1" fill="none" opacity="0.5" />
        </g>
        
        <g transform="translate(1035, 40)">
          <ellipse cx="0" cy="0" rx="16" ry="14" fill="url(#knotGradient)" />
          <ellipse cx="-3" cy="-3" rx="5" ry="4" fill="#E8D5B7" opacity="0.4" />
          <path d="M-10 0 Q0 -6 10 0 Q0 6 -10 0" stroke="#6D4C41" strokeWidth="1" fill="none" opacity="0.5" />
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
    </div>
  );
};
