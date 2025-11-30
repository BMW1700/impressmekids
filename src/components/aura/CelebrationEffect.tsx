import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Confetti {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
}

interface CelebrationEffectProps {
  trigger: number;
  message?: string;
}

export const CelebrationEffect = ({ trigger, message = "Amazing!" }: CelebrationEffectProps) => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;

    // Generate confetti
    const newConfetti: Confetti[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: -10,
      color: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
      size: Math.random() * 10 + 5,
    }));

    setConfetti(newConfetti);
    setShowMessage(true);

    // Clear confetti after animation
    const timer = setTimeout(() => {
      setConfetti([]);
      setShowMessage(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          initial={{ 
            x: `${particle.x}vw`, 
            y: '-10vh',
            rotate: 0,
            opacity: 1 
          }}
          animate={{ 
            y: '110vh',
            rotate: particle.rotation + 720,
            opacity: 0,
          }}
          transition={{ 
            duration: 1.5 + Math.random(),
            ease: 'linear' 
          }}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
        />
      ))}

      {/* Celebration message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ scale: 0, y: '50vh', opacity: 0 }}
            animate={{ scale: 1, y: '40vh', opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="absolute left-1/2 -translate-x-1/2 text-4xl font-bold text-center"
            style={{
              textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
              background: 'linear-gradient(135deg, #FFD700, #FF69B4, #00CED1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
