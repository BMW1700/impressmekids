import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, TrendingUp, BookOpen, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuraCharacter } from "./AuraCharacter";
import { useEffect, useState } from "react";

interface PassageCompleteCelebrationProps {
  open: boolean;
  onClose: () => void;
  stats: {
    wpm: number;
    accuracy: number;
    wordsRead: number;
    xpEarned: number;
  };
  achievements?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  onReadAnother?: () => void;
}

export const PassageCompleteCelebration = ({
  open,
  onClose,
  stats,
  achievements = [],
  onReadAnother
}: PassageCompleteCelebrationProps) => {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (open) {
      // Delay showing stats for animation effect
      setTimeout(() => setShowStats(true), 500);
    } else {
      setShowStats(false);
    }
  }, [open]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        {/* Gradient Background */}
        <div className="relative bg-gradient-to-br from-primary via-secondary to-accent p-8 text-white">
          {/* Confetti Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{
                  top: "50%",
                  left: "50%",
                  opacity: 1,
                  scale: 0
                }}
                animate={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0,
                  scale: 1.5
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              >
                {['🎉', '⭐', '✨', '🎊', '🌟'][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-6 text-center">
            {/* Trophy Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="flex justify-center"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                <Trophy className="h-16 w-16 text-yellow-300" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-heading text-4xl font-bold mb-2">You Did It!</h2>
              <p className="text-xl opacity-90">Amazing reading! 🎉</p>
            </motion.div>

            {/* AURA Character Speaking */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center"
            >
              <AuraCharacter
                state="celebrating"
                message="You did it! That was wonderful reading!"
              />
            </motion.div>

            {/* Animated Stats */}
            <AnimatePresence>
              {showStats && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 gap-4 mt-6"
                >
                  {/* WPM */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  >
                    <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{stats.wpm}</div>
                    <div className="text-sm opacity-80">Words Per Minute</div>
                  </motion.div>

                  {/* Accuracy */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  >
                    <Star className="h-6 w-6 mx-auto mb-2 fill-current" />
                    <div className="text-3xl font-bold">{stats.accuracy}%</div>
                    <div className="text-sm opacity-80">Accuracy</div>
                  </motion.div>

                  {/* Words Read */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  >
                    <BookOpen className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{stats.wordsRead}</div>
                    <div className="text-sm opacity-80">Words Read</div>
                  </motion.div>

                  {/* XP Earned */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  >
                    <Sparkles className="h-6 w-6 mx-auto mb-2 fill-current" />
                    <div className="text-3xl font-bold">+{stats.xpEarned}</div>
                    <div className="text-sm opacity-80">XP Earned</div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Achievements */}
            {achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="space-y-2"
              >
                <p className="text-sm font-semibold">New Achievements Unlocked!</p>
                <div className="flex justify-center gap-3">
                  {achievements.map((achievement, i) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 1.3 + i * 0.1, type: "spring" }}
                      className="bg-white/20 backdrop-blur-sm rounded-lg p-3"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="text-xs mt-1">{achievement.name}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="flex gap-3 justify-center pt-4"
            >
              <Button
                onClick={onReadAnother}
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Read Another Story
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
