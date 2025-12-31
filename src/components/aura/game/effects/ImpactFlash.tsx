import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ImpactFlashProps {
  trigger: number;
  type?: 'hit' | 'critical' | 'heal' | 'miss';
  position?: { x: number; y: number };
}

const flashColors = {
  hit: 'rgba(255, 255, 255, 0.6)',
  critical: 'rgba(255, 215, 0, 0.7)',
  heal: 'rgba(52, 211, 153, 0.5)',
  miss: 'rgba(100, 100, 100, 0.3)',
};

export const ImpactFlash = ({
  trigger,
  type = 'hit',
  position = { x: 50, y: 50 },
}: ImpactFlashProps) => {
  const [isActive, setIsActive] = useState(false);
  const [showStarburst, setShowStarburst] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setIsActive(true);
      if (type === 'critical') {
        setShowStarburst(true);
        setTimeout(() => setShowStarburst(false), 400);
      }
      const timer = setTimeout(() => setIsActive(false), 100);
      return () => clearTimeout(timer);
    }
  }, [trigger, type]);

  return (
    <>
      {/* Full screen flash for critical */}
      <AnimatePresence>
        {isActive && type === 'critical' && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Localized impact flash */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: type === 'critical' ? 80 : 50,
              height: type === 'critical' ? 80 : 50,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${flashColors[type]} 0%, transparent 70%)`,
            }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Starburst for critical hits */}
      <AnimatePresence>
        {showStarburst && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 1, rotate: 0 }}
            animate={{ scale: 1.5, opacity: 0, rotate: 45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <polygon
                points="50,0 61,35 100,35 68,57 79,100 50,75 21,100 32,57 0,35 39,35"
                fill="url(#starGradient)"
              />
              <defs>
                <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
