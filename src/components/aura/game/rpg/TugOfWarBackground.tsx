import { motion } from 'framer-motion';

export const TugOfWarBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient - soft blue to white horizon */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 40%, #E0F4FF 70%, #F0F9FF 100%)'
        }}
      />
      
      {/* Sun with glow */}
      <motion.div
        className="absolute top-12 right-20"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div 
          className="w-24 h-24 rounded-full"
          style={{
            background: 'radial-gradient(circle, #FFF9C4 0%, #FFEB3B 40%, #FFC107 100%)',
            boxShadow: '0 0 80px 40px rgba(255, 235, 59, 0.4), 0 0 120px 60px rgba(255, 193, 7, 0.2)',
          }}
        />
      </motion.div>
      
      {/* Fluffy clouds - multiple layers */}
      {[
        { top: '5%', left: '-5%', size: 1.2, speed: 25 },
        { top: '8%', left: '20%', size: 0.8, speed: 30 },
        { top: '3%', left: '45%', size: 1, speed: 35 },
        { top: '12%', left: '60%', size: 0.7, speed: 28 },
        { top: '6%', left: '80%', size: 1.1, speed: 32 },
      ].map((cloud, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute"
          style={{ top: cloud.top, left: cloud.left }}
          animate={{ x: [0, 40, 0] }}
          transition={{ duration: cloud.speed, repeat: Infinity, ease: 'linear' }}
        >
          <svg 
            width={150 * cloud.size} 
            height={80 * cloud.size} 
            viewBox="0 0 150 80"
          >
            <defs>
              <linearGradient id={`cloudGrad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="#f0f0f0" />
              </linearGradient>
            </defs>
            {/* Main cloud body */}
            <ellipse cx="75" cy="50" rx="60" ry="25" fill={`url(#cloudGrad-${i})`} />
            <ellipse cx="50" cy="40" rx="35" ry="22" fill="white" />
            <ellipse cx="100" cy="42" rx="30" ry="20" fill="white" />
            <ellipse cx="70" cy="30" rx="28" ry="18" fill="white" />
            <ellipse cx="40" cy="48" rx="20" ry="15" fill="white" />
          </svg>
        </motion.div>
      ))}
      
      {/* Distant hills - multiple layers for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5">
        <svg viewBox="0 0 1200 400" className="w-full h-full" preserveAspectRatio="none">
          {/* Furthest hills - very light */}
          <path 
            d="M0 400 L0 280 Q100 220 200 260 Q350 180 500 230 Q650 160 800 220 Q950 180 1100 240 L1200 220 L1200 400 Z" 
            fill="#90EE90" 
            opacity="0.3"
          />
          {/* Middle hills */}
          <path 
            d="M0 400 L0 300 Q150 240 300 280 Q450 200 600 260 Q750 200 900 270 Q1050 220 1200 280 L1200 400 Z" 
            fill="#7CCD7C" 
            opacity="0.5"
          />
          {/* Closer hills */}
          <path 
            d="M0 400 L0 320 Q200 270 400 310 Q600 250 800 300 Q1000 260 1200 320 L1200 400 Z" 
            fill="#66BB6A" 
            opacity="0.7"
          />
        </svg>
      </div>
      
      {/* Main ground - rich grass gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/4"
        style={{
          background: 'linear-gradient(to bottom, #4CAF50 0%, #388E3C 40%, #2E7D32 100%)'
        }}
      />
      
      {/* Large decorative trees - left side */}
      <div className="absolute bottom-16 left-8">
        <svg width="120" height="180" viewBox="0 0 120 180">
          {/* Tree trunk */}
          <rect x="50" y="120" width="20" height="60" fill="#5D4037" rx="3" />
          <rect x="48" y="130" width="4" height="30" fill="#4E342E" rx="1" />
          
          {/* Foliage layers */}
          <ellipse cx="60" cy="100" rx="50" ry="40" fill="#2E7D32" />
          <ellipse cx="55" cy="80" rx="40" ry="35" fill="#388E3C" />
          <ellipse cx="65" cy="60" rx="32" ry="28" fill="#43A047" />
          <ellipse cx="58" cy="45" rx="22" ry="20" fill="#4CAF50" />
          
          {/* Highlights */}
          <ellipse cx="45" cy="70" rx="12" ry="10" fill="#66BB6A" opacity="0.6" />
          <ellipse cx="70" cy="55" rx="10" ry="8" fill="#81C784" opacity="0.5" />
        </svg>
      </div>
      
      {/* Large decorative trees - right side */}
      <div className="absolute bottom-16 right-8">
        <svg width="120" height="180" viewBox="0 0 120 180">
          <rect x="50" y="120" width="20" height="60" fill="#5D4037" rx="3" />
          <rect x="68" y="125" width="4" height="35" fill="#4E342E" rx="1" />
          
          <ellipse cx="60" cy="100" rx="50" ry="40" fill="#2E7D32" />
          <ellipse cx="65" cy="78" rx="42" ry="36" fill="#388E3C" />
          <ellipse cx="55" cy="58" rx="34" ry="30" fill="#43A047" />
          <ellipse cx="62" cy="42" rx="24" ry="22" fill="#4CAF50" />
          
          <ellipse cx="75" cy="68" rx="12" ry="10" fill="#66BB6A" opacity="0.6" />
          <ellipse cx="50" cy="52" rx="10" ry="8" fill="#81C784" opacity="0.5" />
        </svg>
      </div>
      
      {/* Smaller background trees */}
      <div className="absolute bottom-20 left-32">
        <svg width="60" height="100" viewBox="0 0 60 100">
          <rect x="25" y="70" width="10" height="30" fill="#6D4C41" rx="2" />
          <ellipse cx="30" cy="55" rx="25" ry="25" fill="#388E3C" />
          <ellipse cx="30" cy="40" rx="18" ry="18" fill="#43A047" />
        </svg>
      </div>
      
      <div className="absolute bottom-20 right-32">
        <svg width="60" height="100" viewBox="0 0 60 100">
          <rect x="25" y="70" width="10" height="30" fill="#6D4C41" rx="2" />
          <ellipse cx="30" cy="55" rx="25" ry="25" fill="#388E3C" />
          <ellipse cx="30" cy="40" rx="18" ry="18" fill="#43A047" />
        </svg>
      </div>
      
      {/* Grass blades in foreground */}
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`grass-${i}`}
            className="absolute bottom-0"
            style={{
              left: `${i * 2}%`,
              width: 3 + Math.random() * 2,
              height: 15 + Math.random() * 20,
              background: `linear-gradient(to top, #1B5E20, #43A047)`,
              borderRadius: '50% 50% 0 0',
              transformOrigin: 'bottom center',
            }}
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ 
              duration: 1.5 + Math.random() * 0.5, 
              repeat: Infinity, 
              delay: Math.random() * 1.5,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      
      {/* Dirt patch for tug of war arena - more natural */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: '70%',
          height: '80px',
          background: 'linear-gradient(to top, #6D4C41 0%, #8D6E63 50%, #A1887F 80%, transparent 100%)',
          borderRadius: '100% 100% 0 0 / 60% 60% 0 0',
        }}
      />
      
      {/* Center line marker */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-12"
        style={{
          background: 'linear-gradient(to top, white, rgba(255,255,255,0.5))',
          borderRadius: '2px',
        }}
      />
      
      {/* Small decorative flowers/plants */}
      {[15, 25, 75, 85].map((left, i) => (
        <motion.div
          key={`flower-${i}`}
          className="absolute bottom-14"
          style={{ left: `${left}%` }}
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        >
          <svg width="20" height="25" viewBox="0 0 20 25">
            <path d="M10 25 L10 10" stroke="#2E7D32" strokeWidth="2" />
            <circle cx="10" cy="6" r="5" fill={i % 2 === 0 ? '#FFEB3B' : '#E91E63'} />
            <circle cx="10" cy="6" r="2" fill={i % 2 === 0 ? '#FF9800' : '#F48FB1'} />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};
