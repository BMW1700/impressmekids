import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

interface ParticleBurstProps {
  trigger: number;
  x?: number;
  y?: number;
  count?: number;
  colors?: string[];
  size?: 'small' | 'medium' | 'large';
  type?: 'burst' | 'sparkle' | 'smoke';
}

const sizeConfig = {
  small: { min: 3, max: 6, distance: 30 },
  medium: { min: 5, max: 10, distance: 50 },
  large: { min: 8, max: 15, distance: 70 },
};

export const ParticleBurst = ({
  trigger,
  x = 50,
  y = 50,
  count = 10,
  colors = ['#FFD700', '#FF6B6B', '#FFFFFF', '#7FD13B'],
  size = 'medium',
  type = 'burst',
}: ParticleBurstProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const config = sizeConfig[size];

  useEffect(() => {
    if (trigger > 0) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        newParticles.push({
          id: Date.now() + i,
          x,
          y,
          angle,
          distance: config.distance + Math.random() * 20,
          size: config.min + Math.random() * (config.max - config.min),
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.1,
        });
      }
      setParticles(newParticles);

      // Clean up after animation
      const timer = setTimeout(() => setParticles([]), 800);
      return () => clearTimeout(timer);
    }
  }, [trigger, x, y, count, colors, config]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => {
          const endX = Math.cos(particle.angle) * particle.distance;
          const endY = Math.sin(particle.angle) * particle.distance;

          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              initial={{ 
                scale: 1, 
                opacity: 1,
                x: 0,
                y: 0,
              }}
              animate={{
                scale: type === 'smoke' ? 2 : 0,
                opacity: 0,
                x: endX,
                y: endY,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                delay: particle.delay,
                ease: type === 'smoke' ? 'easeOut' : [0.25, 0.46, 0.45, 0.94],
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};
