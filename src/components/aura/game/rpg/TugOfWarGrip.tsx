import { motion } from 'framer-motion';

interface TugOfWarGripProps {
  xPercent: number; // Position along the rope (0-100)
  side: 'hero' | 'enemy';
  isPulling: boolean;
  skinColor?: string;
}

export const TugOfWarGrip = ({ 
  xPercent, 
  side, 
  isPulling, 
  skinColor = '#f5d6c6' 
}: TugOfWarGripProps) => {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${xPercent}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 15,
      }}
      animate={isPulling ? { 
        scale: [1, 1.1, 1],
        rotate: side === 'hero' ? [-5, 5, -5] : [5, -5, 5]
      } : {}}
      transition={{ duration: 0.3 }}
    >
      <svg width="40" height="36" viewBox="0 0 40 36">
        {/* Left hand */}
        <g transform={side === 'hero' ? 'translate(0, 0)' : 'translate(40, 0) scale(-1, 1)'}>
          {/* Hand base */}
          <ellipse cx="10" cy="18" rx="8" ry="10" fill={skinColor} />
          
          {/* Fingers wrapped around rope */}
          <motion.g
            animate={isPulling ? { y: [-1, 1, -1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          >
            {/* Top fingers (over rope) */}
            <path 
              d="M4 12 Q2 16 4 20" 
              stroke={skinColor} 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round"
            />
            <path 
              d="M10 10 Q8 16 10 22" 
              stroke={skinColor} 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round"
            />
            <path 
              d="M16 12 Q14 16 16 20" 
              stroke={skinColor} 
              strokeWidth="5" 
              fill="none" 
              strokeLinecap="round"
            />
            
            {/* Knuckle highlights */}
            <circle cx="4" cy="11" r="2" fill={skinColor} opacity="0.8" />
            <circle cx="10" cy="9" r="2" fill={skinColor} opacity="0.8" />
            <circle cx="15" cy="11" r="2" fill={skinColor} opacity="0.8" />
          </motion.g>
          
          {/* Thumb */}
          <ellipse cx="18" cy="18" rx="4" ry="5" fill={skinColor} />
        </g>
        
        {/* Right hand */}
        <g transform={side === 'hero' ? 'translate(20, 0)' : 'translate(20, 0) scale(-1, 1)'}>
          {/* Hand base */}
          <ellipse cx="10" cy="18" rx="8" ry="10" fill={skinColor} />
          
          {/* Fingers wrapped around rope */}
          <motion.g
            animate={isPulling ? { y: [1, -1, 1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity, delay: 0.1 }}
          >
            {/* Top fingers (over rope) */}
            <path 
              d="M4 12 Q2 16 4 20" 
              stroke={skinColor} 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round"
            />
            <path 
              d="M10 10 Q8 16 10 22" 
              stroke={skinColor} 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round"
            />
            <path 
              d="M16 12 Q14 16 16 20" 
              stroke={skinColor} 
              strokeWidth="5" 
              fill="none" 
              strokeLinecap="round"
            />
            
            {/* Knuckle highlights */}
            <circle cx="4" cy="11" r="2" fill={skinColor} opacity="0.8" />
            <circle cx="10" cy="9" r="2" fill={skinColor} opacity="0.8" />
            <circle cx="15" cy="11" r="2" fill={skinColor} opacity="0.8" />
          </motion.g>
          
          {/* Thumb */}
          <ellipse cx="18" cy="18" rx="4" ry="5" fill={skinColor} />
        </g>
      </svg>
    </motion.div>
  );
};
