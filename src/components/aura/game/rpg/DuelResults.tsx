import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Trophy, 
  Swords, 
  Sparkles, 
  Coins, 
  TrendingUp,
  ArrowRight,
  Target,
  Clock,
  Flame
} from "lucide-react";
import type { ReadingDuel } from "@/hooks/useReadingDuels";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface DuelResultsProps {
  duel: ReadingDuel;
  studentId: string;
  onContinue: () => void;
}

export const DuelResults = ({
  duel,
  studentId,
  onContinue,
}: DuelResultsProps) => {
  const isChallenger = duel.challenger_id === studentId;
  const isWinner = duel.winner_id === studentId;
  const isDraw = !duel.winner_id;
  const isLoser = duel.winner_id && duel.winner_id !== studentId;

  const myStats = isChallenger
    ? {
        score: duel.challenger_score,
        accuracy: duel.challenger_accuracy,
        time: duel.challenger_time_seconds,
        streak: duel.challenger_best_streak,
        words: duel.challenger_words_read,
      }
    : {
        score: duel.opponent_score,
        accuracy: duel.opponent_accuracy,
        time: duel.opponent_time_seconds,
        streak: duel.opponent_best_streak,
        words: duel.opponent_words_read,
      };

  const opponentStats = !isChallenger
    ? {
        score: duel.challenger_score,
        accuracy: duel.challenger_accuracy,
        time: duel.challenger_time_seconds,
        streak: duel.challenger_best_streak,
        words: duel.challenger_words_read,
      }
    : {
        score: duel.opponent_score,
        accuracy: duel.opponent_accuracy,
        time: duel.opponent_time_seconds,
        streak: duel.opponent_best_streak,
        words: duel.opponent_words_read,
      };

  // Calculate rewards
  const xpEarned = isWinner ? 50 : isDraw ? 35 : 20;
  const goldEarned = isWinner ? 25 : isDraw ? 15 : 10;

  // Trigger confetti on win
  useEffect(() => {
    if (isWinner) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FFD700', '#9333EA', '#22C55E'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#FFD700', '#9333EA', '#22C55E'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isWinner]);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Result Banner */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isDraw 
                ? 'bg-gradient-to-br from-slate-500 to-slate-600' 
                : isWinner 
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                  : 'bg-gradient-to-br from-red-500 to-red-700'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            {isDraw ? (
              <Swords className="h-12 w-12 text-white" />
            ) : isWinner ? (
              <Trophy className="h-12 w-12 text-white" />
            ) : (
              <Swords className="h-12 w-12 text-white" />
            )}
          </motion.div>

          <motion.h1
            className={`text-4xl font-black mb-2 ${
              isDraw 
                ? 'text-slate-300' 
                : isWinner 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200' 
                  : 'text-red-400'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {isDraw ? "IT'S A DRAW!" : isWinner ? "VICTORY!" : "DEFEAT"}
          </motion.h1>

          <motion.p
            className="text-purple-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {isDraw 
              ? "You matched perfectly with your opponent!" 
              : isWinner 
                ? "You outread your opponent!" 
                : "Keep practicing for next time!"}
          </motion.p>
        </motion.div>

        {/* Score Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-slate-800/50 border-purple-500/30 p-6 mb-6">
            <h3 className="text-center text-white font-bold mb-6">Score Breakdown</h3>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Your Stats */}
              <div className={`p-4 rounded-lg ${isWinner || isDraw ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <div className="text-xs text-slate-400 mb-1">YOU</div>
                <div className="text-3xl font-black text-white mb-3">{myStats.score}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-1 text-slate-300">
                    <Target className="h-3 w-3" />
                    {myStats.accuracy}%
                  </div>
                  <div className="flex items-center justify-center gap-1 text-slate-300">
                    <Clock className="h-3 w-3" />
                    {formatTime(myStats.time)}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-slate-300">
                    <Flame className="h-3 w-3" />
                    {myStats.streak} streak
                  </div>
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Swords className="h-8 w-8 text-purple-400" />
                </motion.div>
              </div>

              {/* Opponent Stats */}
              <div className={`p-4 rounded-lg ${isLoser || isDraw ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <div className="text-xs text-slate-400 mb-1">OPPONENT</div>
                <div className="text-3xl font-black text-white mb-3">{opponentStats.score}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-1 text-slate-300">
                    <Target className="h-3 w-3" />
                    {opponentStats.accuracy}%
                  </div>
                  <div className="flex items-center justify-center gap-1 text-slate-300">
                    <Clock className="h-3 w-3" />
                    {formatTime(opponentStats.time)}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-slate-300">
                    <Flame className="h-3 w-3" />
                    {opponentStats.streak} streak
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex justify-center gap-6 mb-8"
        >
          <motion.div
            className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-6 py-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <span className="text-2xl font-bold text-white">+{xpEarned}</span>
              <span className="text-purple-300">XP</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-6 py-3"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-400" />
              <span className="text-2xl font-bold text-white">+{goldEarned}</span>
              <span className="text-amber-300">Gold</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center"
        >
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3"
          >
            Back to Arena
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
