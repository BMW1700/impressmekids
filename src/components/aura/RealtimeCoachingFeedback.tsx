import { Card } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RealtimeCoachingFeedbackProps {
  cognitiveLoad: number;
  recentAccuracy: number;
  streakCount: number;
  isVisible: boolean;
}

export const RealtimeCoachingFeedback = ({
  cognitiveLoad,
  recentAccuracy,
  streakCount,
  isVisible,
}: RealtimeCoachingFeedbackProps) => {
  if (!isVisible) return null;

  const getTip = () => {
    if (cognitiveLoad > 0.7) {
      return {
        icon: <Brain className="w-5 h-5 text-blue-400" />,
        message: "Take a deep breath. Slow down and focus on one word at a time.",
        color: "from-blue-500/20 to-purple-500/20"
      };
    } else if (recentAccuracy < 0.7) {
      return {
        icon: <Target className="w-5 h-5 text-amber-400" />,
        message: "Sound out each syllable. Break words into smaller parts.",
        color: "from-amber-500/20 to-orange-500/20"
      };
    } else if (streakCount >= 5) {
      return {
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
        message: "Amazing streak! You're reading like a pro!",
        color: "from-yellow-500/20 to-amber-500/20"
      };
    } else if (cognitiveLoad < 0.3 && recentAccuracy > 0.8) {
      return {
        icon: <TrendingUp className="w-5 h-5 text-green-400" />,
        message: "You're ready for harder words. Keep challenging yourself!",
        color: "from-green-500/20 to-emerald-500/20"
      };
    }
    return null;
  };

  const tip = getTip();
  if (!tip) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-3"
      >
        <Card className={`p-3 bg-gradient-to-r ${tip.color} border-primary/30`}>
          <div className="flex items-center gap-3">
            <div>{tip.icon}</div>
            <p className="text-sm font-medium flex-1">{tip.message}</p>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                cognitiveLoad > 0.7 ? 'bg-red-500' : 
                cognitiveLoad > 0.5 ? 'bg-amber-500' : 
                'bg-green-500'
              }`} />
              <span className="text-xs text-muted-foreground">
                {cognitiveLoad > 0.7 ? 'High' : cognitiveLoad > 0.5 ? 'Med' : 'Low'}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
