import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Swords } from "lucide-react";

export type BattleDifficulty = 'normal' | 'challenging';

interface BattleDifficultySelectorProps {
  onSelect: (difficulty: BattleDifficulty) => void;
  storyTitle: string;
}

export const BattleDifficultySelector = ({
  onSelect,
  storyTitle,
}: BattleDifficultySelectorProps) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Title */}
      <motion.div 
        className="text-center mb-8"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Swords className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Challenge</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Reading: "{storyTitle}"
        </p>
      </motion.div>

      {/* Difficulty Options */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
        {/* Normal Mode */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card 
            className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all h-full group"
            onClick={() => onSelect('normal')}
          >
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto group-hover:bg-green-500/20 transition-colors">
                <Shield className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Normal</h3>
              <p className="text-sm text-muted-foreground">
                Forgiving matching for practice. Great for building confidence!
              </p>
              <ul className="text-xs text-left space-y-1 text-muted-foreground">
                <li>✓ Accepts close pronunciations</li>
                <li>✓ Homophones count as correct</li>
                <li>✓ Best for daily practice</li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full mt-2 group-hover:bg-green-500 group-hover:text-white group-hover:border-green-500 transition-all"
              >
                Start Normal
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Challenging Mode */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card 
            className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all h-full group border-amber-500/30"
            onClick={() => onSelect('challenging')}
          >
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto group-hover:bg-amber-500/20 transition-colors">
                <Zap className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Challenging</h3>
              <p className="text-sm text-muted-foreground">
                Strict matching for a real test. Prove your reading skills!
              </p>
              <ul className="text-xs text-left space-y-1 text-muted-foreground">
                <li>⚡ 80%+ accuracy required</li>
                <li>⚡ Only true homophones count</li>
                <li>⚡ Best for self-assessment</li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full mt-2 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all"
              >
                Start Challenging
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
