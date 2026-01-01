import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FlyingBookAnimationProps {
  trigger: number; // Increment to trigger new animation
  targetPosition?: { x: number; y: number }; // Where the book should fly to
  onComplete?: () => void;
}

export const FlyingBookAnimation = ({
  trigger,
  targetPosition = { x: 50, y: 5 },
  onComplete,
}: FlyingBookAnimationProps) => {
  const [books, setBooks] = useState<Array<{ id: number; startX: number; startY: number }>>([]);

  useEffect(() => {
    if (trigger <= 0) return;

    // Add a new flying book
    const newBook = {
      id: Date.now(),
      startX: Math.random() * 40 + 30, // Center area
      startY: 70 + Math.random() * 10,
    };
    
    setBooks(prev => [...prev, newBook]);

    // Clean up after animation
    const cleanup = setTimeout(() => {
      setBooks(prev => prev.filter(b => b.id !== newBook.id));
      onComplete?.();
    }, 1500);

    return () => clearTimeout(cleanup);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {books.map((book) => (
          <motion.div
            key={book.id}
            className="absolute"
            initial={{
              left: `${book.startX}%`,
              top: `${book.startY}%`,
              scale: 0,
              rotate: 0,
            }}
            animate={{
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`,
              scale: [0, 1.5, 1, 0.5],
              rotate: [0, -15, 15, -10, 0],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 1.2,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            {/* Book emoji with effects */}
            <motion.div
              className="relative"
              animate={{
                y: [0, -5, 0, -3, 0],
              }}
              transition={{
                duration: 0.4,
                repeat: 2,
              }}
            >
              <span className="text-4xl filter drop-shadow-lg">📚</span>
              
              {/* Page flip effect */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  times: [0, 0.25, 0.5, 0.75, 1],
                }}
              >
                <div className="w-2 h-4 bg-amber-200 rounded-sm opacity-50" />
              </motion.div>

              {/* Golden sparkle trail */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    y: [0, -20],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Animated book counter with running total effect
interface AnimatedBookCounterProps {
  count: number;
  previousCount?: number;
}

export const AnimatedBookCounter = ({
  count,
  previousCount = 0,
}: AnimatedBookCounterProps) => {
  const [displayCount, setDisplayCount] = useState(previousCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count === displayCount) return;
    
    setIsAnimating(true);
    const step = count > displayCount ? 1 : -1;
    const totalSteps = Math.abs(count - displayCount);
    const stepDuration = Math.min(100, 500 / totalSteps);
    
    const interval = setInterval(() => {
      setDisplayCount(prev => {
        const next = prev + step;
        if ((step > 0 && next >= count) || (step < 0 && next <= count)) {
          clearInterval(interval);
          setIsAnimating(false);
          return count;
        }
        return next;
      });
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [count]);

  return (
    <motion.div
      className="flex items-center gap-2"
      animate={isAnimating ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{ duration: 0.1 }}
    >
      <motion.span
        className="text-2xl"
        animate={isAnimating ? {
          rotate: [-5, 5, -5],
        } : {}}
        transition={{ duration: 0.2, repeat: isAnimating ? Infinity : 0 }}
      >
        📚
      </motion.span>
      <span className="font-bold text-amber-300 tabular-nums text-lg">
        {displayCount}
      </span>
      <span className="text-amber-300/80">Books Rescued</span>
    </motion.div>
  );
};
