import { motion } from 'framer-motion';

interface TugOfWarRopeProps {
  ropePosition: number; // -10 to +10
  maxPosition: number;
  isPulling: 'hero' | 'enemy' | null;
}

export const TugOfWarRope = ({ ropePosition, maxPosition, isPulling }: TugOfWarRopeProps) => {
  // Calculate rope wave based on tension
  const getTension = () => {
    if (isPulling === 'hero') return 6;
    if (isPulling === 'enemy') return -6;
    return 0;
  };

  return (
    <div className="w-full h-full relative">
      {/* Rope SVG - uses viewBox that fills container */}
      <svg 
        viewBox="0 0 400 60" 
        className="w-full h-full"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Rich rope texture gradient - more saturated browns */}
          <linearGradient id="ropeMainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8C896" />
            <stop offset="20%" stopColor="#D4A574" />
            <stop offset="40%" stopColor="#C49A6C" />
            <stop offset="60%" stopColor="#A67C52" />
            <stop offset="80%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#6D4C41" />
          </linearGradient>
          
          {/* Dark outline gradient for contrast */}
          <linearGradient id="ropeOutlineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5D4037" />
            <stop offset="50%" stopColor="#3E2723" />
            <stop offset="100%" stopColor="#2C1810" />
          </linearGradient>
          
          {/* Braided rope pattern - diagonal lines to simulate twisted fibers */}
          <pattern id="ropeBraid" x="0" y="0" width="16" height="24" patternUnits="userSpaceOnUse">
            {/* Diagonal braiding lines */}
            <path d="M0 0 L8 12 L0 24" stroke="#8B6914" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M8 0 L16 12 L8 24" stroke="#6D4C41" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M4 0 L12 12 L4 24" stroke="#5D4037" strokeWidth="1.5" fill="none" opacity="0.4" />
            {/* Horizontal fiber wraps */}
            <path d="M0 6 L16 6" stroke="#A67C52" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M0 18 L16 18" stroke="#A67C52" strokeWidth="0.8" fill="none" opacity="0.3" />
          </pattern>
          
          {/* Strong drop shadow for depth and visibility */}
          <filter id="ropeShadow" x="-15%" y="-100%" width="130%" height="300%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#3E2723" floodOpacity="0.4" />
          </filter>
          
          {/* Rope end knot gradient */}
          <radialGradient id="knotGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#E8C896" />
            <stop offset="50%" stopColor="#C49A6C" />
            <stop offset="100%" stopColor="#6D4C41" />
          </radialGradient>
        </defs>

        {/* Dark outline/shadow stroke behind rope for contrast */}
        <motion.path
          d={`M0 30 Q100 ${30 + getTension()} 200 30 Q300 ${30 - getTension()} 400 30`}
          stroke="url(#ropeOutlineGradient)"
          strokeWidth="28"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Main rope body - thicker and more visible */}
        <motion.path
          d={`M0 30 Q100 ${30 + getTension()} 200 30 Q300 ${30 - getTension()} 400 30`}
          stroke="url(#ropeMainGradient)"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
          filter="url(#ropeShadow)"
          animate={
            isPulling
              ? { 
                  d: isPulling === 'hero' 
                    ? [
                        `M0 30 Q100 40 200 30 Q300 20 400 30`,
                        `M0 30 Q100 34 200 30 Q300 26 400 30`
                      ]
                    : [
                        `M0 30 Q100 20 200 30 Q300 40 400 30`,
                        `M0 30 Q100 26 200 30 Q300 34 400 30`
                      ]
                }
              : {}
          }
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        
        {/* Braided texture overlay */}
        <motion.path
          d={`M0 30 Q100 ${30 + getTension()} 200 30 Q300 ${30 - getTension()} 400 30`}
          stroke="url(#ropeBraid)"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Top highlight for 3D effect */}
        <motion.path
          d={`M0 24 Q100 ${24 + getTension()} 200 24 Q300 ${24 - getTension()} 400 24`}
          stroke="#F5E6D3"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        {/* Secondary highlight strand */}
        <motion.path
          d={`M0 27 Q100 ${27 + getTension()} 200 27 Q300 ${27 - getTension()} 400 27`}
          stroke="#E8D5B7"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Center flag/marker */}
        <g transform="translate(200, 0)">
          {/* Flag pole */}
          <rect x="-3" y="-5" width="6" height="45" fill="#5D4037" rx="2" />
          <rect x="-4" y="36" width="8" height="8" fill="#4E342E" rx="1" />
          
          {/* Triangular flag */}
          <motion.g
            animate={isPulling ? { rotate: isPulling === 'hero' ? [0, 10, 0] : [0, -10, 0] } : { rotate: [-2, 2, -2] }}
            transition={isPulling ? { duration: 0.25 } : { duration: 2, repeat: Infinity }}
            style={{ transformOrigin: '0 0px' }}
          >
            <path
              d="M0 0 L35 10 L0 20 Z"
              fill="#EF4444"
              stroke="#DC2626"
              strokeWidth="1"
            />
            {/* Flag highlight */}
            <path
              d="M4 5 L20 9"
              stroke="#FCA5A5"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
          </motion.g>
          
          {/* Glow effect on pull */}
          {isPulling === 'hero' && (
            <motion.circle
              cx="15"
              cy="10"
              r="20"
              fill="#22c55e"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.4 }}
            />
          )}
          {isPulling === 'enemy' && (
            <motion.circle
              cx="15"
              cy="10"
              r="20"
              fill="#ef4444"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.4 }}
            />
          )}
        </g>
        
        {/* Rope end knots - larger and more detailed */}
        <g transform="translate(0, 30)">
          <ellipse cx="0" cy="0" rx="16" ry="14" fill="url(#knotGradient)" />
          <ellipse cx="-3" cy="-3" rx="6" ry="5" fill="#F5E6D3" opacity="0.4" />
          <ellipse cx="2" cy="2" rx="4" ry="3" fill="#5D4037" opacity="0.3" />
        </g>
        
        <g transform="translate(400, 30)">
          <ellipse cx="0" cy="0" rx="16" ry="14" fill="url(#knotGradient)" />
          <ellipse cx="-3" cy="-3" rx="6" ry="5" fill="#F5E6D3" opacity="0.4" />
          <ellipse cx="2" cy="2" rx="4" ry="3" fill="#5D4037" opacity="0.3" />
        </g>
      </svg>
      
      {/* Dust particles when pulling */}
      {isPulling && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`dust-${i}`}
              className="absolute rounded-full"
              style={{ 
                left: `${20 + Math.random() * 60}%`,
                bottom: '0px',
                width: 4 + Math.random() * 4,
                height: 4 + Math.random() * 4,
                backgroundColor: `rgba(210, 180, 140, ${0.5 + Math.random() * 0.3})`,
              }}
              initial={{ y: 0, opacity: 1, scale: 0 }}
              animate={{ 
                y: -20 - Math.random() * 15, 
                opacity: 0, 
                scale: 1,
                x: (Math.random() - 0.5) * 30,
              }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
