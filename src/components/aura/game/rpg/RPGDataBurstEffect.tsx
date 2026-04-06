import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface RPGDataBurstEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface PlasmaNumber {
  id: number;
  value: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  delay: number;
  size: number;
  color: string;
}

const PLASMA_CHARS = ['0', '1', '0', '1', '4', '7', '0', '1', '3', '9', '8', '2', '5', '6', '0', '1'];
const PLASMA_COLORS = [
  '#00FFFF', '#00E5FF', '#18FFFF', '#40C4FF',
  '#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA',
  '#00FF9F', '#1DE9B6', '#64FFDA', '#A7FFEB',
];

export const RPGDataBurstEffect = ({ isActive, onComplete }: RPGDataBurstEffectProps) => {
  const [numbers, setNumbers] = useState<PlasmaNumber[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate plasma numbers that shoot from left (hero) to right (enemy)
      const newNumbers: PlasmaNumber[] = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        value: PLASMA_CHARS[i % PLASMA_CHARS.length],
        x: 15 + Math.random() * 15, // Start from hero side
        y: 30 + Math.random() * 40,
        targetX: 65 + Math.random() * 20, // Target enemy side
        targetY: 25 + Math.random() * 50,
        delay: i * 0.03,
        size: 14 + Math.random() * 18,
        color: PLASMA_COLORS[Math.floor(Math.random() * PLASMA_COLORS.length)],
      }));
      setNumbers(newNumbers);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Cyan screen flash */}
        <motion.div
          className="absolute inset-0 bg-cyan-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.25 }}
        />

        {/* Digital grid overlay */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Plasma number projectiles */}
        {numbers.map((num) => (
          <motion.div
            key={num.id}
            className="absolute font-mono font-black"
            style={{
              left: `${num.x}%`,
              top: `${num.y}%`,
              fontSize: `${num.size}px`,
              color: num.color,
              textShadow: `0 0 10px ${num.color}, 0 0 20px ${num.color}, 0 0 40px ${num.color}80`,
              filter: 'brightness(1.5)',
            }}
            initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0.8, 0],
              scale: [0.3, 1.2, 1, 0.8, 0.3],
              x: `${(num.targetX - num.x) * 4}px`,
              y: `${(num.targetY - num.y) * 2}px`,
            }}
            transition={{
              duration: 0.6,
              delay: num.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {num.value}
          </motion.div>
        ))}

        {/* Central beam/trail from hero to enemy */}
        <motion.div
          className="absolute top-1/2 left-[15%] h-1 origin-left"
          style={{
            background: 'linear-gradient(90deg, #00FFFF, #00BCD4, #00FF9F, transparent)',
            boxShadow: '0 0 15px #00FFFF, 0 0 30px #00BCD480',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: ['0%', '55%', '55%', '0%'],
            opacity: [0, 0.8, 0.6, 0],
          }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        {/* Impact burst at enemy position */}
        <motion.div
          className="absolute"
          style={{
            left: '72%',
            top: '45%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00FFFF80, #00BCD440, transparent)',
            boxShadow: '0 0 40px #00FFFF, 0 0 80px #00BCD480',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 2, 2.5, 0],
            opacity: [0, 0.8, 0.4, 0],
          }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />

        {/* Scattered binary fragments at impact */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={`frag-${i}`}
            className="absolute font-mono text-xs font-bold"
            style={{
              left: '72%',
              top: '45%',
              color: PLASMA_COLORS[i % PLASMA_COLORS.length],
              textShadow: `0 0 8px ${PLASMA_COLORS[i % PLASMA_COLORS.length]}`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0.5],
              x: Math.cos((i / 8) * Math.PI * 2) * 60,
              y: Math.sin((i / 8) * Math.PI * 2) * 60,
            }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {i % 2 === 0 ? '01' : '10'}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};
