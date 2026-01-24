import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles, BookOpen, Flame, Coins, Crown, RotateCcw, ArrowRight } from "lucide-react";

interface CampaignCompleteProps {
  open: boolean;
  onClose: () => void;
  onContinuePlaying: () => void;
  onStartNewGame: () => void;
  stats: {
    booksRescued: number;
    totalXp: number;
    totalGold: number;
    longestStreak: number;
    totalDamage: number;
    battlesWon: number;
  };
}

export const CampaignComplete = ({
  open,
  onClose,
  onContinuePlaying,
  onStartNewGame,
  stats,
}: CampaignCompleteProps) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleStartNewGame = () => {
    if (!showConfirmReset) {
      setShowConfirmReset(true);
      return;
    }
    onStartNewGame();
    setShowConfirmReset(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-b from-amber-950 via-yellow-950 to-amber-950 border-4 border-yellow-500 overflow-hidden p-0">
        <DialogTitle className="sr-only">Campaign Complete - Champion of Literacy</DialogTitle>
        
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating sparkles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-300"
              initial={{ 
                opacity: 0, 
                x: Math.random() * 100 + '%', 
                y: '100%',
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                y: '-10%',
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3
              }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          ))}
          
          {/* Golden glow */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        <div className="relative z-10 p-6 space-y-6">
          {/* Trophy with crown animation */}
          <div className="flex justify-center">
            <motion.div
              className="relative"
              animate={{ 
                y: [0, -10, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <motion.div
                className="absolute -top-4 left-1/2 -translate-x-1/2"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
              </motion.div>
              <Trophy className="h-24 w-24 text-yellow-400 drop-shadow-2xl" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-32 h-32 rounded-full bg-yellow-400/20 blur-xl" />
              </motion.div>
            </motion.div>
          </div>

          {/* Title */}
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300">
              🏆 CHAMPION OF LITERACY! 🏆
            </h2>
            <p className="text-amber-200/80 text-lg">
              You defeated Grog the Goblin King and rescued all the books!
            </p>
            <p className="text-amber-300 text-sm italic">
              Princess Ella and the entire kingdom thank you, brave hero!
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div 
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-amber-900/50 rounded-xl p-3 text-center border border-amber-700/50">
              <BookOpen className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.booksRescued}</p>
              <p className="text-xs text-amber-300">Books Rescued</p>
            </div>
            <div className="bg-amber-900/50 rounded-xl p-3 text-center border border-amber-700/50">
              <Star className="h-6 w-6 text-purple-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.totalXp.toLocaleString()}</p>
              <p className="text-xs text-amber-300">Total XP</p>
            </div>
            <div className="bg-amber-900/50 rounded-xl p-3 text-center border border-amber-700/50">
              <Coins className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.totalGold.toLocaleString()}</p>
              <p className="text-xs text-amber-300">Gold Earned</p>
            </div>
            <div className="bg-amber-900/50 rounded-xl p-3 text-center border border-amber-700/50">
              <Flame className="h-6 w-6 text-orange-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.longestStreak}</p>
              <p className="text-xs text-amber-300">Best Streak</p>
            </div>
            <div className="bg-amber-900/50 rounded-xl p-3 text-center border border-amber-700/50">
              <Sparkles className="h-6 w-6 text-red-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.totalDamage.toLocaleString()}</p>
              <p className="text-xs text-amber-300">Total Damage</p>
            </div>
            <div className="bg-amber-900/50 rounded-xl p-3 text-center border border-amber-700/50">
              <Trophy className="h-6 w-6 text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.battlesWon}</p>
              <p className="text-xs text-amber-300">Battles Won</p>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={onContinuePlaying}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 
                text-white font-bold text-lg shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              Continue Playing
              <span className="text-xs opacity-80">(Replay any world)</span>
            </Button>
            
            <AnimatePresence mode="wait">
              {showConfirmReset ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <p className="text-center text-amber-200 text-sm">
                    Are you sure? This will reset ALL progress!
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowConfirmReset(false)}
                      variant="outline"
                      className="flex-1 border-amber-600 text-amber-200 hover:bg-amber-900/50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartNewGame}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold"
                    >
                      Yes, Reset!
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="new-game">
                  <Button
                    onClick={handleStartNewGame}
                    variant="outline"
                    className="w-full h-12 border-2 border-amber-500/50 text-amber-300 hover:bg-amber-900/50 
                      font-bold flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Start New Game
                    <span className="text-xs opacity-70">(Reset progress)</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
