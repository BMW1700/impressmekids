import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Crown, Star, Flame, Zap, ArrowRight, RotateCcw, Home } from "lucide-react";

interface BookRescueCelebrationProps {
  open: boolean;
  onClose: () => void;
  victory: boolean;
  storyTitle: string;
  stats: {
    xpEarned: number;
    damageDealt: number;
    longestStreak: number;
    wordsRead: number;
    correctWords: number;
    accuracy: number;
    defeatedBeforeFinish: boolean;
  };
  worldNumber: number;
  booksRescued: number;
  onPlayAgain: () => void;
  onNextStory: () => void;
  onBackToMap: () => void;
}

export const BookRescueCelebration = ({
  open,
  onClose,
  victory,
  storyTitle,
  stats,
  worldNumber,
  booksRescued,
  onPlayAgain,
  onNextStory,
  onBackToMap,
}: BookRescueCelebrationProps) => {
  // Generate stars based on performance
  const getStars = () => {
    let stars = 0;
    if (stats.accuracy >= 70) stars++;
    if (stats.accuracy >= 85) stars++;
    if (stats.accuracy >= 95) stars++;
    return stars;
  };

  const stars = getStars();

  // Get title based on performance
  const getTitle = () => {
    if (!victory) return "Book Escaped!";
    if (stats.defeatedBeforeFinish && stats.accuracy >= 95) return "🏆 LEGENDARY!";
    if (stats.defeatedBeforeFinish) return "⚔️ CRUSHING VICTORY!";
    if (stats.accuracy >= 95) return "🌟 PERFECT READER!";
    if (stats.accuracy >= 85) return "📖 BOOK RESCUED!";
    return "✨ VICTORY!";
  };

  const getSubtitle = () => {
    if (!victory) return "Grog got away... but you can try again!";
    if (stats.defeatedBeforeFinish) return "You defeated the enemy before finishing!";
    if (stats.accuracy >= 95) return "Incredible accuracy! Princess Ella is so happy!";
    return "Another book saved from Grog's clutches!";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        {/* Background */}
        <div
          className={`absolute inset-0 ${
            victory
              ? 'bg-gradient-to-br from-emerald-500/20 via-yellow-500/20 to-amber-500/20'
              : 'bg-gradient-to-br from-slate-500/20 to-slate-700/20'
          }`}
        />

        {/* Confetti for victory */}
        {victory && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${
                  ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][i % 5]
                }`}
                initial={{
                  x: Math.random() * 400 - 200,
                  y: -20,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: 500,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: 0,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  repeat: Infinity,
                }}
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        )}

        <div className="relative p-6 space-y-6">
          {/* Title Section */}
          <motion.div
            className="text-center space-y-2"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <motion.div
              animate={victory ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {victory ? (
                <Crown className="w-16 h-16 mx-auto text-yellow-500" />
              ) : (
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
              )}
            </motion.div>
            <h2 className="text-2xl font-black text-foreground">{getTitle()}</h2>
            <p className="text-muted-foreground">{getSubtitle()}</p>
          </motion.div>

          {/* Stars */}
          {victory && (
            <motion.div
              className="flex justify-center gap-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[1, 2, 3].map((star) => (
                <motion.div
                  key={star}
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + star * 0.1 }}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= stars
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted'
                    }`}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Zap className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
              <div className="text-xl font-black text-foreground">{stats.xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
              <div className="text-xl font-black text-foreground">{stats.longestStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-foreground">{stats.accuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-foreground">{stats.damageDealt}</div>
              <div className="text-xs text-muted-foreground">Damage Dealt</div>
            </div>
          </motion.div>

          {/* Book Rescued Count */}
          {victory && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Badge variant="secondary" className="text-base px-4 py-1">
                📚 Total Books Rescued: {booksRescued}
              </Badge>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {!victory ? (
              <>
                <Button onClick={onPlayAgain} className="w-full gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={onBackToMap} className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  Back to Map
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onNextStory} className="w-full gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Next Story
                </Button>
                <Button variant="outline" onClick={onBackToMap} className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  Back to Map
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
