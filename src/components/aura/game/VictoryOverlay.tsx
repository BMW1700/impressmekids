import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Flame, Zap, ArrowRight, RotateCcw, Home, BookOpen } from "lucide-react";
import confetti from "canvas-confetti";

interface VictoryOverlayProps {
  show: boolean;
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

export const VictoryOverlay = ({
  show,
  victory,
  storyTitle,
  stats,
  worldNumber,
  booksRescued,
  onPlayAgain,
  onNextStory,
  onBackToMap,
}: VictoryOverlayProps) => {
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

  // Fire confetti on victory
  useEffect(() => {
    if (show && victory) {
      console.log('[VictoryOverlay] 🎉 Triggering confetti!');
      
      // Center burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32']
      });
      
      // Left side
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FF69B4', '#00CED1']
        });
      }, 250);
      
      // Right side
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FF69B4', '#00CED1']
        });
      }, 400);
    }
  }, [show, victory]);

  // Debug log when visibility changes
  useEffect(() => {
    console.log('[VictoryOverlay] show =', show, '| victory =', victory);
  }, [show, victory]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        >
          {/* Main Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
            className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${
              victory
                ? 'bg-gradient-to-br from-amber-800 via-yellow-900 to-amber-900'
                : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'
            }`}
          >
            <div className="p-6 space-y-5">
              {/* Icon */}
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                {victory ? (
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Crown className="w-20 h-20 text-yellow-400 drop-shadow-lg" />
                  </motion.div>
                ) : (
                  <BookOpen className="w-20 h-20 text-slate-400" />
                )}
              </motion.div>

              {/* Title */}
              <motion.div
                className="text-center space-y-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-black text-white drop-shadow-lg">
                  {getTitle()}
                </h2>
                <p className="text-amber-200/80 text-sm">{getSubtitle()}</p>
              </motion.div>

              {/* Stars */}
              {victory && (
                <motion.div
                  className="flex justify-center gap-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  {[1, 2, 3].map((star) => (
                    <motion.div
                      key={star}
                      initial={{ rotate: -180, opacity: 0, scale: 0 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + star * 0.15, type: "spring" }}
                    >
                      <Star
                        className={`w-12 h-12 ${
                          star <= stars
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                            : 'text-amber-900/50 fill-amber-900/30'
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
                <div className="bg-black/30 rounded-xl p-3 text-center border border-amber-500/20">
                  <Zap className="w-6 h-6 mx-auto text-yellow-400 mb-1" />
                  <div className="text-2xl font-black text-white">{stats.xpEarned}</div>
                  <div className="text-xs text-amber-200/60 uppercase tracking-wide">XP Earned</div>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-amber-500/20">
                  <Flame className="w-6 h-6 mx-auto text-orange-400 mb-1" />
                  <div className="text-2xl font-black text-white">{stats.longestStreak}</div>
                  <div className="text-xs text-amber-200/60 uppercase tracking-wide">Best Streak</div>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-amber-500/20">
                  <div className="text-2xl font-black text-white">{stats.accuracy}%</div>
                  <div className="text-xs text-amber-200/60 uppercase tracking-wide">Accuracy</div>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-amber-500/20">
                  <div className="text-2xl font-black text-white">{stats.damageDealt}</div>
                  <div className="text-xs text-amber-200/60 uppercase tracking-wide">Damage Dealt</div>
                </div>
              </motion.div>

              {/* Books Rescued Badge */}
              {victory && (
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                >
                  <Badge className="text-base px-5 py-2 bg-amber-600/50 hover:bg-amber-600/50 text-amber-100 border-amber-400/30">
                    📚 Total Books Rescued: {booksRescued}
                  </Badge>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                className="flex flex-col gap-2 pt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {!victory ? (
                  <>
                    <Button 
                      onClick={onPlayAgain} 
                      className="w-full gap-2 h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Try Again
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={onBackToMap} 
                      className="w-full gap-2 h-11 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Home className="w-4 h-4" />
                      Back to Map
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={onNextStory} 
                      className="w-full gap-2 h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Next Story
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={onBackToMap} 
                      className="w-full gap-2 h-11 border-amber-700 text-amber-200 hover:bg-amber-900/50"
                    >
                      <Home className="w-4 h-4" />
                      Back to Map
                    </Button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
