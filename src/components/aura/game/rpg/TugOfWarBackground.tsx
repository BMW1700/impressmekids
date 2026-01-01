import { motion } from 'framer-motion';

export const TugOfWarBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200" />
      
      {/* Sun */}
      <motion.div
        className="absolute top-8 right-16 w-20 h-20 rounded-full bg-yellow-300"
        style={{
          boxShadow: '0 0 60px 20px rgba(253, 224, 71, 0.5)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Clouds */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            top: `${5 + (i % 3) * 8}%`,
            left: `${-10 + i * 20}%`,
          }}
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'linear' }}
        >
          <div 
            className="relative"
            style={{
              width: 100 + (i % 3) * 40,
              height: 40 + (i % 2) * 20,
            }}
          >
            <div className="absolute bg-white/80 rounded-full w-full h-full" />
            <div className="absolute bg-white/80 rounded-full w-1/2 h-3/4 -top-4 left-1/4" />
            <div className="absolute bg-white/80 rounded-full w-1/3 h-1/2 -top-2 left-1/6" />
          </div>
        </motion.div>
      ))}
      
      {/* Distant hills */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3">
        <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
          <path 
            d="M0 300 L0 150 Q150 100 300 150 Q450 80 600 120 Q750 60 900 130 Q1050 90 1200 150 L1200 300 Z" 
            fill="#86efac" 
            opacity="0.4"
          />
          <path 
            d="M0 300 L0 180 Q200 130 400 170 Q600 120 800 160 Q1000 130 1200 180 L1200 300 Z" 
            fill="#4ade80" 
            opacity="0.5"
          />
        </svg>
      </div>
      
      {/* Ground/grass */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-green-600 via-green-500 to-green-400" />
      
      {/* Grass blades */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`grass-${i}`}
            className="absolute bottom-0"
            style={{
              left: `${i * 2.5}%`,
              width: 4,
              height: 20 + Math.random() * 15,
              background: `linear-gradient(to top, #166534, #22c55e)`,
              borderRadius: '50% 50% 0 0',
              transformOrigin: 'bottom center',
            }}
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ 
              duration: 2 + Math.random(), 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      
      {/* Trees on sides */}
      <div className="absolute bottom-20 left-4">
        <svg width="80" height="120" viewBox="0 0 80 120">
          {/* Tree trunk */}
          <rect x="32" y="80" width="16" height="40" fill="#78350f" rx="2" />
          {/* Tree foliage layers */}
          <ellipse cx="40" cy="60" rx="35" ry="30" fill="#166534" />
          <ellipse cx="40" cy="45" rx="28" ry="25" fill="#15803d" />
          <ellipse cx="40" cy="35" rx="20" ry="18" fill="#22c55e" />
        </svg>
      </div>
      
      <div className="absolute bottom-20 right-4">
        <svg width="80" height="120" viewBox="0 0 80 120">
          <rect x="32" y="80" width="16" height="40" fill="#78350f" rx="2" />
          <ellipse cx="40" cy="60" rx="35" ry="30" fill="#166534" />
          <ellipse cx="40" cy="45" rx="28" ry="25" fill="#15803d" />
          <ellipse cx="40" cy="35" rx="20" ry="18" fill="#22c55e" />
        </svg>
      </div>
      
      {/* Dirt patch for tug of war area */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-16"
        style={{
          background: 'linear-gradient(to top, #78350f, #92400e, #a16207)',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
        }}
      />
      
      {/* Center line marker */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-8 bg-white/60" />
    </div>
  );
};
