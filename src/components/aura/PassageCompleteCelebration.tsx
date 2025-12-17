import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, TrendingUp, BookOpen, Sparkles, RefreshCw, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuraCharacter } from "./AuraCharacter";
import { useEffect, useState } from "react";
interface PassageCompleteCelebrationProps {
  open: boolean;
  onClose: () => void;
  stats: {
    wpm: number;
    wcpm?: number; // Words Correct Per Minute
    accuracy: number;
    wordsRead: number;
    xpEarned?: number;
    durationSeconds?: number;
    fluencyLevel?: 'frustration' | 'instructional' | 'independent';
    prosodyScore?: number;
  };
  achievements?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  onReadAnother?: () => void;
  onTryAgain?: () => void;
}
export const PassageCompleteCelebration = ({
  open,
  onClose,
  stats,
  achievements = [],
  onReadAnother,
  onTryAgain
}: PassageCompleteCelebrationProps) => {
  const [showStats, setShowStats] = useState(false);

  // Determine pass/fail status - use fluency level if available
  const passed = stats.fluencyLevel ? stats.fluencyLevel !== 'frustration' : stats.accuracy >= 50;
  const excellent = stats.fluencyLevel === 'independent' || stats.accuracy >= 80;
  useEffect(() => {
    if (open) {
      setTimeout(() => setShowStats(true), 500);
    } else {
      setShowStats(false);
    }
  }, [open]);

  // Get appropriate message based on performance
  const getMessage = () => {
    if (excellent) {
      return {
        title: "Amazing! 🎉",
        subtitle: "You're a reading superstar!",
        auraMessage: "Wow! That was incredible! You read so well!",
        auraState: "celebrating" as const
      };
    } else if (passed) {
      return {
        title: "Good Job! 📚",
        subtitle: "Keep practicing to improve!",
        auraMessage: "Nice work! You're getting better every time!",
        auraState: "encouraging" as const
      };
    } else {
      return {
        title: "Let's Try Again! 💪",
        subtitle: "Practice makes perfect!",
        auraMessage: "Don't worry! Every reader needs practice. Want to try again?",
        auraState: "encouraging" as const
      };
    }
  };
  const message = getMessage();

  // Calculate XP (default to wordsRead if not provided)
  const xpEarned = stats.xpEarned ?? stats.wordsRead;
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        {/* Gradient Background - Changes based on performance */}
        <div className={`relative p-8 text-white ${excellent ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500' : passed ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500' : 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500'}`}>
          {/* Confetti Effect - Only for passing */}
          {passed && <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => <motion.div key={i} className="absolute text-2xl" initial={{
            top: "50%",
            left: "50%",
            opacity: 1,
            scale: 0
          }} animate={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0,
            scale: 1.5
          }} transition={{
            duration: 2,
            delay: i * 0.1,
            ease: "easeOut"
          }}>
                  {['🎉', '⭐', '✨', '🎊', '🌟'][Math.floor(Math.random() * 5)]}
                </motion.div>)}
            </div>}

          {/* Content */}
          <div className="relative z-10 space-y-6 text-center">
            {/* Icon */}
            <motion.div initial={{
            scale: 0,
            rotate: -180
          }} animate={{
            scale: 1,
            rotate: 0
          }} transition={{
            type: "spring",
            duration: 0.8
          }} className="flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                {excellent ? <Trophy className="h-16 w-16 text-yellow-300" /> : passed ? <Star className="h-16 w-16 text-yellow-300 fill-current" /> : <RefreshCw className="h-16 w-16 text-white" />}
              </div>
            </motion.div>

            {/* Title */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.3
          }}>
              <h2 className="font-heading text-4xl font-bold mb-2">{message.title}</h2>
              <p className="text-xl opacity-90">{message.subtitle}</p>
            </motion.div>

            {/* AURA Character Speaking */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.5
          }} className="flex justify-center">
              <AuraCharacter state={message.auraState} message={message.auraMessage} />
            </motion.div>

            {/* Animated Stats */}
            <AnimatePresence>
              {showStats && <motion.div initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="grid grid-cols-2 gap-4 mt-6">
                  {/* WCPM - Primary Metric (if available) */}
                  {stats.wcpm !== undefined ? <motion.div initial={{
                x: -50,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.7
              }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-3xl font-bold">{stats.wcpm}</div>
                      <div className="text-sm opacity-80">WCPM</div>
                      <div className="text-xs opacity-60">Words Correct/Min</div>
                    </motion.div> : <motion.div initial={{
                x: -50,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.7
              }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-3xl font-bold">{stats.wpm || 0}</div>
                      <div className="text-sm opacity-80">Words Per Minute</div>
                    </motion.div>}

                  {/* Fluency/Prosody Score (if available) or Accuracy */}
                  <motion.div initial={{
                x: 50,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.8
              }} className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 ${!passed ? 'ring-2 ring-white/50' : ''}`}>
                    <Star className={`h-6 w-6 mx-auto mb-2 ${passed ? 'fill-current' : ''}`} />
                    <div className="text-3xl font-bold">
                      {stats.prosodyScore ?? stats.accuracy}%
                    </div>
                    <div className="text-sm opacity-80">
                      {stats.prosodyScore !== undefined ? 'Fluency Score' : 'Accuracy'}
                    </div>
                    {stats.fluencyLevel && <div className="text-xs mt-1 opacity-70 capitalize">
                        {stats.fluencyLevel} Level
                      </div>}
                  </motion.div>

                  {/* Words Read */}
                  <motion.div initial={{
                x: -50,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.9
              }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <BookOpen className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{stats.wordsRead || 0}</div>
                    <div className="text-sm opacity-80">Words Read</div>
                  </motion.div>

                  {/* XP Earned */}
                  <motion.div initial={{
                x: 50,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 1.0
              }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Sparkles className="h-6 w-6 mx-auto mb-2 fill-current" />
                    <div className="text-3xl font-bold">+{xpEarned}</div>
                    <div className="text-sm opacity-80">XP Earned</div>
                  </motion.div>
                </motion.div>}
            </AnimatePresence>

            {/* Achievements */}
            {achievements.length > 0 && <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 1.2
          }} className="space-y-2">
                <p className="text-sm font-semibold">New Achievements Unlocked!</p>
                <div className="flex justify-center gap-3">
                  {achievements.map((achievement, i) => <motion.div key={achievement.id} initial={{
                scale: 0,
                rotate: -180
              }} animate={{
                scale: 1,
                rotate: 0
              }} transition={{
                delay: 1.3 + i * 0.1,
                type: "spring"
              }} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="text-xs mt-1">{achievement.name}</div>
                    </motion.div>)}
                </div>
              </motion.div>}

            {/* Action Buttons */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 1.5
          }} className="flex gap-3 justify-center pt-4">
              {!passed && onTryAgain && <Button onClick={onTryAgain} className="bg-white text-primary hover:bg-white/90">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>}
              {passed && onReadAnother && <Button onClick={onReadAnother} variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Read Another Story
                </Button>}
              <Button onClick={onClose} variant="outline" className="border-white text-white bg-primary">
                Back to Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};