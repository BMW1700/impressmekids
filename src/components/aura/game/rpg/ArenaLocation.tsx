import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Users, Trophy, Flame } from "lucide-react";

interface ArenaLocationProps {
  pendingChallenges: number;
  isUnlocked: boolean;
  onOpenArena: () => void;
}

export const ArenaLocation = ({
  pendingChallenges,
  isUnlocked,
  onOpenArena,
}: ArenaLocationProps) => {
  if (!isUnlocked) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-6"
    >
      <Card
        className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30 border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900/40"
        onClick={onOpenArena}
      >
        {/* Animated background glow */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-pink-500/10"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-400/50"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: '100%',
                opacity: 0 
              }}
              animate={{
                y: '-20%',
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: i * 0.5,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
        
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Arena Icon */}
              <motion.div 
                className="p-4 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                animate={{ 
                  boxShadow: [
                    '0 10px 15px -3px rgba(168, 85, 247, 0.3)',
                    '0 10px 25px -3px rgba(168, 85, 247, 0.5)',
                    '0 10px 15px -3px rgba(168, 85, 247, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Swords className="h-10 w-10" />
              </motion.div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400">
                    ⚔️ READING ARENA ⚔️
                  </h3>
                  {pendingChallenges > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Badge className="bg-red-500 text-white border-0 font-bold">
                        {pendingChallenges} {pendingChallenges === 1 ? 'Challenge' : 'Challenges'}!
                      </Badge>
                    </motion.div>
                  )}
                </div>
                <p className="text-purple-300">Challenge classmates to reading duels!</p>
              </div>
            </div>
            
            {/* Stats icons */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-purple-300">
                <Users className="h-5 w-5" />
                <span className="text-sm">PvP</span>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Trophy className="h-8 w-8 text-amber-400" />
              </motion.div>
            </div>
          </div>
          
          {/* Features row */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-purple-400">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Earn bonus XP & Gold</span>
            </div>
            <div className="text-purple-500">•</div>
            <div className="text-purple-400">Build win streaks</div>
            <div className="text-purple-500">•</div>
            <div className="text-purple-400">Compete with friends</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
