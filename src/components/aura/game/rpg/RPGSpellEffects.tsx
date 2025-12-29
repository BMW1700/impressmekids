import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface RPGSpellEffectsProps {
  spellType: 'fire' | 'ice' | 'lightning' | 'slash' | null;
  isActive: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export const RPGSpellEffects = ({ spellType, isActive, onComplete }: RPGSpellEffectsProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive && spellType) {
      // Generate particles for the spell
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 4 + Math.random() * 12,
        delay: Math.random() * 0.3,
        duration: 0.3 + Math.random() * 0.4,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isActive, spellType, onComplete]);

  if (!isActive || !spellType) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Screen Flash */}
        <motion.div
          className={`absolute inset-0 ${
            spellType === 'fire' ? 'bg-orange-500' :
            spellType === 'ice' ? 'bg-cyan-400' :
            spellType === 'lightning' ? 'bg-yellow-300' :
            'bg-white'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.3 }}
        />

        {/* FIREBALL Effect */}
        {spellType === 'fire' && (
          <>
            {/* Main Fireball */}
            <motion.div
              className="absolute top-1/2 left-1/2"
              initial={{ x: '200%', y: '-50%', scale: 0.5 }}
              animate={{ x: '-200%', y: '-50%', scale: [0.5, 1.5, 1] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="relative w-24 h-24">
                {/* Core */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-radial from-yellow-200 via-orange-500 to-red-600"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                  style={{
                    boxShadow: '0 0 60px 30px rgba(255, 150, 0, 0.8), 0 0 100px 60px rgba(255, 100, 0, 0.4)',
                  }}
                />
                
                {/* Outer Flames */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-8 h-12 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300"
                    style={{
                      left: '50%',
                      top: '50%',
                      transformOrigin: 'center bottom',
                      borderRadius: '50% 50% 20% 20%',
                      rotate: `${i * 45}deg`,
                      marginLeft: '-16px',
                      marginTop: '-24px',
                    }}
                    animate={{
                      scaleY: [1, 1.3, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.2,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Trail Particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-gradient-radial from-yellow-300 to-orange-600"
                style={{
                  width: p.size,
                  height: p.size,
                  left: `${50 + (p.x - 50) * 0.5}%`,
                  top: `${45 + (p.y - 50) * 0.2}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: [-100, -300],
                }}
                transition={{ 
                  duration: p.duration + 0.3,
                  delay: p.delay,
                }}
              />
            ))}

            {/* Impact Explosion */}
            <motion.div
              className="absolute left-1/4 top-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 3, 4], opacity: [0, 1, 0] }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div 
                className="w-32 h-32 rounded-full bg-gradient-radial from-yellow-200 via-orange-500 to-transparent"
                style={{
                  boxShadow: '0 0 80px 40px rgba(255, 150, 0, 0.6)',
                }}
              />
            </motion.div>
          </>
        )}

        {/* ICE SHARD Effect */}
        {spellType === 'ice' && (
          <>
            {/* Main Ice Shard */}
            <motion.div
              className="absolute top-1/2 left-1/2"
              initial={{ x: '200%', y: '-50%', rotate: 0 }}
              animate={{ x: '-250%', y: '-50%', rotate: [0, -20, 20, -10, 0] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="relative">
                {/* Crystal Core */}
                <motion.div
                  className="w-8 h-24 bg-gradient-to-b from-cyan-200 via-blue-400 to-blue-600"
                  style={{
                    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                    boxShadow: '0 0 40px 20px rgba(100, 200, 255, 0.6)',
                    filter: 'brightness(1.3)',
                  }}
                  animate={{ 
                    filter: ['brightness(1.3)', 'brightness(1.6)', 'brightness(1.3)'],
                  }}
                  transition={{ repeat: Infinity, duration: 0.2 }}
                />
                
                {/* Trailing Shards */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-10 bg-gradient-to-b from-cyan-300 to-blue-500"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                      left: `${-20 + i * 15}px`,
                      top: `${10 + i * 5}px`,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Freeze Particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${50 + (p.x - 50) * 0.5}%`,
                  top: `${45 + (p.y - 50) * 0.3}%`,
                }}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: [0, 180, 360],
                  y: [0, -30, -60],
                }}
                transition={{ 
                  duration: p.duration + 0.5,
                  delay: p.delay,
                }}
              >
                <div 
                  className="w-4 h-4 bg-cyan-300"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  }}
                />
              </motion.div>
            ))}

            {/* Freeze Burst */}
            <motion.div
              className="absolute left-1/4 top-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2.5, 3], opacity: [0, 0.8, 0] }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <div 
                className="w-40 h-40 rounded-full border-4 border-cyan-300"
                style={{
                  boxShadow: '0 0 60px 30px rgba(100, 200, 255, 0.5), inset 0 0 40px rgba(200, 255, 255, 0.3)',
                  background: 'radial-gradient(circle, rgba(200,255,255,0.3) 0%, transparent 70%)',
                }}
              />
            </motion.div>
          </>
        )}

        {/* LIGHTNING Effect */}
        {spellType === 'lightning' && (
          <>
            {/* Screen Shake handled by parent */}
            
            {/* Lightning Bolts */}
            {[...Array(3)].map((_, i) => (
              <motion.svg
                key={i}
                className="absolute"
                style={{
                  top: 0,
                  left: `${20 + i * 20}%`,
                  width: '200px',
                  height: '100%',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.15, delay: i * 0.08 }}
              >
                <motion.path
                  d={`M100,0 L${80 + Math.random() * 40},${100 + Math.random() * 50} 
                     L${90 + Math.random() * 20},${200 + Math.random() * 50} 
                     L${70 + Math.random() * 60},${350 + Math.random() * 50}
                     L${85 + Math.random() * 30},${500}`}
                  stroke="url(#lightning-gradient)"
                  strokeWidth="8"
                  fill="none"
                  style={{
                    filter: 'drop-shadow(0 0 20px #fff) drop-shadow(0 0 40px #60a5fa)',
                  }}
                />
                <defs>
                  <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </motion.svg>
            ))}

            {/* Electric Sparks */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-white"
                style={{
                  width: p.size / 2,
                  height: p.size / 2,
                  left: `${25 + p.x * 0.5}%`,
                  top: `${30 + p.y * 0.4}%`,
                  boxShadow: '0 0 10px 5px rgba(96, 165, 250, 0.8)',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 2, 0],
                }}
                transition={{ 
                  duration: 0.2,
                  delay: p.delay,
                }}
              />
            ))}

            {/* Multi Flash */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.05, delay: i * 0.1 }}
              />
            ))}
          </>
        )}

        {/* SLASH Effect */}
        {spellType === 'slash' && (
          <>
            {/* Slash Lines */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/4 top-1/2"
                style={{
                  width: '300px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, white, rgba(200,200,255,0.8), transparent)',
                  transformOrigin: 'left center',
                  rotate: `${-30 + i * 30}deg`,
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
                transition={{ 
                  duration: 0.2,
                  delay: i * 0.08,
                }}
              />
            ))}

            {/* Spark Particles */}
            {particles.slice(0, 10).map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-white"
                style={{
                  width: p.size / 2,
                  height: p.size / 2,
                  left: `${25 + p.x * 0.3}%`,
                  top: `${40 + p.y * 0.2}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: (p.x - 50) * 3,
                  y: (p.y - 50) * 2,
                }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.1 + p.delay * 0.5,
                }}
              />
            ))}
          </>
        )}
      </div>
    </AnimatePresence>
  );
};
