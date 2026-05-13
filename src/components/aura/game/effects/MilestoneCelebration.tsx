import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles } from "lucide-react";

interface MilestoneCelebrationProps {
  currentCount: number;
  milestones?: number[];
  onMilestoneReached?: (milestone: number) => void;
}

interface Celebration {
  id: number;
  milestone: number;
}

const defaultMilestones = [10, 25, 50, 100, 250, 500, 1000];

const getMilestoneMessage = (milestone: number): string => {
  switch (milestone) {
    case 10: return "Bookworm Beginner!";
    case 25: return "Library Explorer!";
    case 50: return "Reading Champion!";
    case 100: return "Book Master!";
    case 250: return "Legendary Reader!";
    case 500: return "Library Guardian!";
    case 1000: return "Book Kingdom Hero!";
    default: return `${milestone} Books Rescued!`;
  }
};

const getMilestoneEmoji = (milestone: number): string => {
  switch (milestone) {
    case 10: return "📖";
    case 25: return "📚";
    case 50: return "🏆";
    case 100: return "👑";
    case 250: return "⭐";
    case 500: return "🌟";
    case 1000: return "💎";
    default: return "🎉";
  }
};

export const MilestoneCelebration = ({
  currentCount,
  milestones = defaultMilestones,
  onMilestoneReached,
}: MilestoneCelebrationProps) => {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [reachedMilestones, setReachedMilestones] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check if we've hit any new milestones
    const newMilestones = milestones.filter(
      m => currentCount >= m && !reachedMilestones.has(m)
    );

    if (newMilestones.length > 0) {
      // Get the highest new milestone
      const highestNew = Math.max(...newMilestones);
      
      // Add celebration
      setCelebrations(prev => [...prev, { id: Date.now(), milestone: highestNew }]);
      
      // Mark as reached
      setReachedMilestones(prev => {
        const next = new Set(prev);
        newMilestones.forEach(m => next.add(m));
        return next;
      });

      // Callback
      onMilestoneReached?.(highestNew);

      // Auto-remove celebration after animation
      setTimeout(() => {
        setCelebrations(prev => prev.filter(c => c.milestone !== highestNew));
      }, 4000);
    }
  }, [currentCount, milestones, reachedMilestones, onMilestoneReached]);

  return (
    <AnimatePresence>
      {celebrations.map((celebration) => (
        <motion.div
          key={celebration.id}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop burst */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1 }}
          />

          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#FBBF24', '#F59E0B', '#EF4444', '#22C55E', '#3B82F6', '#A855F7'][i % 6],
                left: `${Math.random() * 100}%`,
                top: '-5%',
              }}
              initial={{ y: 0, rotate: 0, opacity: 1 }}
              animate={{
                y: window.innerHeight + 100,
                rotate: Math.random() * 720 - 360,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.5,
                ease: "easeIn",
              }}
            />
          ))}

          {/* Main celebration card */}
          <motion.div
            className="relative bg-gradient-to-br from-amber-900/95 via-yellow-900/95 to-amber-900/95 
                       px-8 py-6 rounded-2xl border-2 border-yellow-400/50 shadow-2xl"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: [10, -5, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-yellow-400/20"
              animate={{
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />

            {/* Trophy icon */}
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2"
              animate={{
                y: [0, -5, 0],
                rotate: [-5, 5, -5],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="p-3 bg-yellow-500 rounded-full shadow-lg">
                <Trophy className="h-8 w-8 text-yellow-900" />
              </div>
            </motion.div>

            <div className="text-center mt-4">
              {/* Milestone emoji */}
              <motion.div
                className="text-5xl mb-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {getMilestoneEmoji(celebration.milestone)}
              </motion.div>

              {/* Achievement title */}
              <motion.h2
                className="text-2xl font-black text-yellow-400 mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                MILESTONE!
              </motion.h2>

              {/* Milestone message */}
              <motion.p
                className="text-lg font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {getMilestoneMessage(celebration.milestone)}
              </motion.p>

              {/* Count display */}
              <motion.div
                className="flex items-center justify-center gap-2 text-amber-300"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-3xl">📚</span>
                <span className="text-3xl font-black">{celebration.milestone}</span>
              </motion.div>

              {/* Sparkle decorations */}
              <motion.div
                className="absolute -left-2 top-1/2"
                animate={{ rotate: 360, scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </motion.div>
              <motion.div
                className="absolute -right-2 top-1/2"
                animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
