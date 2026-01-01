import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

interface StarCollectionEffectProps {
  targetStars: number;
  startDelay?: number;
  onComplete?: () => void;
}

interface FlyingStar {
  id: number;
  startX: number;
  startY: number;
}

export const StarCollectionEffect = ({
  targetStars,
  startDelay = 0,
  onComplete,
}: StarCollectionEffectProps) => {
  const [flyingStars, setFlyingStars] = useState<FlyingStar[]>([]);
  const [collectedCount, setCollectedCount] = useState(0);
  const [showCounter, setShowCounter] = useState(false);

  useEffect(() => {
    if (targetStars <= 0) return;

    const timeout = setTimeout(() => {
      // Create flying stars with staggered starts
      const stars: FlyingStar[] = [];
      for (let i = 0; i < Math.min(targetStars, 5); i++) {
        stars.push({
          id: i,
          startX: Math.random() * 60 + 20, // 20-80% of container width
          startY: 80 + Math.random() * 20, // Start from bottom area
        });
      }
      setFlyingStars(stars);
      setShowCounter(true);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [targetStars, startDelay]);

  const handleStarComplete = (starId: number) => {
    setCollectedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= flyingStars.length && onComplete) {
        setTimeout(onComplete, 300);
      }
      return newCount;
    });
  };

  return (
    <div className="relative w-full h-full pointer-events-none">
      <AnimatePresence>
        {flyingStars.map((star, index) => (
          <motion.div
            key={star.id}
            className="absolute"
            initial={{
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              scale: 0,
              opacity: 0,
            }}
            animate={{
              left: "50%",
              top: "10%",
              scale: [0, 1.5, 1, 0.8],
              opacity: [0, 1, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1.2,
              delay: index * 0.15,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            onAnimationComplete={() => handleStarComplete(star.id)}
          >
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            {/* Sparkle trail */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 0.6,
                delay: index * 0.15 + 0.3,
              }}
            >
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                  style={{
                    left: `${50 + Math.cos(i * Math.PI / 2) * 20}%`,
                    top: `${50 + Math.sin(i * Math.PI / 2) * 20}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.15 + 0.2 + i * 0.05,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Animated counter */}
      {showCounter && collectedCount > 0 && (
        <motion.div
          className="absolute top-[10%] left-1/2 -translate-x-1/2"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.2 }}
          key={collectedCount}
        >
          <span className="text-xl font-bold text-yellow-400 drop-shadow-lg">
            +{collectedCount}
          </span>
        </motion.div>
      )}
    </div>
  );
};

// Compact animated star counter for world cards
interface AnimatedStarCounterProps {
  count: number;
  animateFrom?: number;
  delay?: number;
}

export const AnimatedStarCounter = ({
  count,
  animateFrom = 0,
  delay = 0,
}: AnimatedStarCounterProps) => {
  const [displayCount, setDisplayCount] = useState(animateFrom);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count === displayCount) return;
    
    const timeout = setTimeout(() => {
      setIsAnimating(true);
      const step = count > displayCount ? 1 : -1;
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
      }, 50);
      
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [count, delay]);

  return (
    <motion.span
      className="inline-flex items-center gap-1"
      animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.1 }}
    >
      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      <span className="text-yellow-400 font-bold tabular-nums">{displayCount}</span>
    </motion.span>
  );
};
