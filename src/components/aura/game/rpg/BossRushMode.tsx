import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Swords, 
  Trophy, 
  Clock, 
  Skull, 
  Star, 
  ArrowLeft,
  Zap,
  Heart,
  Target,
  Crown,
  Flame
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Boss data for the gauntlet
const BOSS_GAUNTLET = [
  { id: 1, name: "Drake the Dragon", type: "dragon", hp: 80, world: 1 },
  { id: 2, name: "Frostfang the Ice Golem", type: "ice_golem", hp: 100, world: 2 },
  { id: 3, name: "Ignatius the Stone Guardian", type: "stone_guardian", hp: 120, world: 3 },
  { id: 4, name: "Grog the Goblin King", type: "goblin_king", hp: 150, world: 4 },
  { id: 5, name: "Galair the Shadow Wraith", type: "shadow_wraith", hp: 180, world: 5 },
  { id: 6, name: "Leviathan of the Deep", type: "leviathan", hp: 200, world: 6 },
  { id: 7, name: "The Reality Shifter", type: "reality_shifter", hp: 220, world: 7 },
  { id: 8, name: "The Word Eater", type: "word_eater", hp: 250, world: 8 },
  { id: 9, name: "Omega Grog", type: "omega_grog", hp: 300, world: 9 },
];

interface BossRushModeProps {
  studentId: string;
  onBack: () => void;
  onStartBattle: (bossIndex: number, boss: typeof BOSS_GAUNTLET[0]) => void;
}

interface BossRushAttempt {
  id: string;
  status: string;
  current_boss_index: number;
  bosses_defeated: number;
  total_damage_dealt: number;
  total_words_read: number;
  total_xp_earned: number;
  total_gold_earned: number;
  longest_streak: number;
  time_taken_seconds: number | null;
  started_at: string;
  ended_at: string | null;
}

export const BossRushMode = ({ studentId, onBack, onStartBattle }: BossRushModeProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentAttempt, setCurrentAttempt] = useState<BossRushAttempt | null>(null);
  const [bestAttempt, setBestAttempt] = useState<BossRushAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch current and best attempts
  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    
    // Get in-progress attempt
    const { data: inProgress } = await supabase
      .from("boss_rush_attempts")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    setCurrentAttempt(inProgress as BossRushAttempt | null);
    
    // Get best completed attempt
    const { data: completed } = await supabase
      .from("boss_rush_attempts")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("time_taken_seconds", { ascending: true })
      .limit(1)
      .maybeSingle();
    
    setBestAttempt(completed as BossRushAttempt | null);
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  // Timer for current attempt
  useEffect(() => {
    if (!currentAttempt) return;
    
    const startTime = new Date(currentAttempt.started_at).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentAttempt]);

  const startNewAttempt = async () => {
    const { data, error } = await supabase
      .from("boss_rush_attempts")
      .insert({
        student_id: studentId,
        status: "in_progress",
        current_boss_index: 0,
        bosses_defeated: 0,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start Boss Rush. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setCurrentAttempt(data as BossRushAttempt);
    setElapsedTime(0);
    
    toast({
      title: "⚔️ Boss Rush Started!",
      description: "Defeat all 9 bosses to prove your mastery!",
    });
  };

  const abandonAttempt = async () => {
    if (!currentAttempt) return;

    await supabase
      .from("boss_rush_attempts")
      .update({
        status: "failed",
        ended_at: new Date().toISOString(),
        time_taken_seconds: elapsedTime,
      })
      .eq("id", currentAttempt.id);

    setCurrentAttempt(null);
    setElapsedTime(0);
    
    toast({
      title: "Boss Rush Abandoned",
      description: "Better luck next time, hero!",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBattleBoss = () => {
    if (!currentAttempt) return;
    const boss = BOSS_GAUNTLET[currentAttempt.current_boss_index];
    if (boss) {
      onStartBattle(currentAttempt.current_boss_index, boss);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Swords className="h-12 w-12 text-red-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background flames */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-500/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: typeof window !== 'undefined' ? window.innerHeight : 800,
            }}
            animate={{
              y: [-100],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Button>
        
        {currentAttempt && (
          <motion.div 
            className="bg-slate-800/80 px-4 py-2 rounded-lg border border-red-500/50 flex items-center gap-3"
            animate={{ boxShadow: ['0 0 10px rgba(239, 68, 68, 0.3)', '0 0 20px rgba(239, 68, 68, 0.5)', '0 0 10px rgba(239, 68, 68, 0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock className="h-5 w-5 text-red-400" />
            <span className="text-2xl font-mono font-bold text-white">{formatTime(elapsedTime)}</span>
          </motion.div>
        )}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-10"
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 mb-2"
          animate={{ textShadow: ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 40px rgba(239, 68, 68, 0.5)', '0 0 20px rgba(239, 68, 68, 0.3)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🔥 BOSS RUSH 🔥
        </motion.h1>
        <p className="text-orange-300 text-lg">Defeat all 9 bosses in succession!</p>
      </motion.div>

      {/* Best Time Display */}
      {bestAttempt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto mb-6"
        >
          <Card className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border-yellow-500/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <span className="text-yellow-300 font-semibold">Best Time</span>
              </div>
              <span className="text-2xl font-mono font-bold text-yellow-400">
                {formatTime(bestAttempt.time_taken_seconds || 0)}
              </span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        {!currentAttempt ? (
          /* Start Screen */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="bg-slate-800/80 border-red-500/50 p-8 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <Skull className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">9</div>
                  <div className="text-sm text-slate-400">Bosses</div>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">1,600+</div>
                  <div className="text-sm text-slate-400">Total HP</div>
                </div>
                <div className="text-center">
                  <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">Epic</div>
                  <div className="text-sm text-slate-400">Rewards</div>
                </div>
              </div>

              <p className="text-slate-300 mb-6">
                Face every boss from the campaign in an epic gauntlet. 
                Your HP carries over between battles - strategize wisely!
              </p>

              <Button
                onClick={startNewAttempt}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 text-lg"
              >
                <Flame className="h-5 w-5 mr-2" />
                Begin Boss Rush
              </Button>
            </Card>

            {/* Boss Preview Grid */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {BOSS_GAUNTLET.map((boss, index) => (
                <motion.div
                  key={boss.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/60 rounded-lg p-3 border border-slate-700"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {index === 8 ? "👑" : index === 7 ? "🌀" : index === 6 ? "✨" : 
                       index === 5 ? "🌊" : index === 4 ? "👻" : index === 3 ? "👹" :
                       index === 2 ? "🗿" : index === 1 ? "❄️" : "🐉"}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{boss.name.split(" ")[0]}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Heart className="h-3 w-3 text-red-400" />
                      <span className="text-xs text-red-400">{boss.hp}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Active Rush Screen */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Progress Bar */}
            <Card className="bg-slate-800/80 border-red-500/50 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Gauntlet Progress</span>
                <span className="text-white font-bold">
                  {currentAttempt.bosses_defeated} / {BOSS_GAUNTLET.length} Defeated
                </span>
              </div>
              <Progress 
                value={(currentAttempt.bosses_defeated / BOSS_GAUNTLET.length) * 100} 
                className="h-3 bg-slate-700"
              />
            </Card>

            {/* Current Boss */}
            {currentAttempt.current_boss_index < BOSS_GAUNTLET.length && (
              <Card className="bg-gradient-to-br from-red-900/40 to-orange-900/40 border-red-500/50 p-6 mb-6">
                <div className="text-center">
                  <Badge className="bg-red-600 text-white mb-4">
                    Boss {currentAttempt.current_boss_index + 1} of {BOSS_GAUNTLET.length}
                  </Badge>
                  
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentAttempt.current_boss_index === 8 ? "👑" : 
                     currentAttempt.current_boss_index === 7 ? "🌀" : 
                     currentAttempt.current_boss_index === 6 ? "✨" : 
                     currentAttempt.current_boss_index === 5 ? "🌊" : 
                     currentAttempt.current_boss_index === 4 ? "👻" : 
                     currentAttempt.current_boss_index === 3 ? "👹" :
                     currentAttempt.current_boss_index === 2 ? "🗿" : 
                     currentAttempt.current_boss_index === 1 ? "❄️" : "🐉"}
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {BOSS_GAUNTLET[currentAttempt.current_boss_index].name}
                  </h2>
                  
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Heart className="h-5 w-5 text-red-400" />
                    <span className="text-red-400 font-bold text-lg">
                      {BOSS_GAUNTLET[currentAttempt.current_boss_index].hp} HP
                    </span>
                  </div>

                  <Button
                    onClick={handleBattleBoss}
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg"
                  >
                    <Swords className="h-5 w-5 mr-2" />
                    Fight {BOSS_GAUNTLET[currentAttempt.current_boss_index].name.split(" ")[0]}!
                  </Button>
                </div>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="bg-slate-800/60 border-slate-700 p-3 text-center">
                <Target className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{currentAttempt.total_damage_dealt}</div>
                <div className="text-xs text-slate-400">Damage</div>
              </Card>
              <Card className="bg-slate-800/60 border-slate-700 p-3 text-center">
                <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{currentAttempt.longest_streak}</div>
                <div className="text-xs text-slate-400">Best Streak</div>
              </Card>
              <Card className="bg-slate-800/60 border-slate-700 p-3 text-center">
                <Star className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{currentAttempt.total_xp_earned}</div>
                <div className="text-xs text-slate-400">XP Earned</div>
              </Card>
              <Card className="bg-slate-800/60 border-slate-700 p-3 text-center">
                <Crown className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{currentAttempt.total_gold_earned}</div>
                <div className="text-xs text-slate-400">Gold</div>
              </Card>
            </div>

            {/* Abandon Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={abandonAttempt}
                className="text-red-400 border-red-500/50 hover:bg-red-900/20"
              >
                Abandon Rush
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BossRushMode;
