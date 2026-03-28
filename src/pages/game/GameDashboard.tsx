import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GameHeader } from "@/components/game/GameHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords, BookOpen, Mic, BarChart3, Flame, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { RPGPlayerHUD } from "@/components/aura/game/rpg/RPGPlayerHUD";

const GameDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { progress } = useCampaignProgress(user?.id);

  const { data: readingStats } = useQuery({
    queryKey: ['game-reading-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const gold = progress?.total_gold ?? 0;
  const xp = progress?.total_xp_earned ?? 0;

  const modeCards = [
    {
      title: "RPG Campaign",
      description: "Battle enemies and rescue books through epic reading adventures",
      icon: Swords,
      color: "from-red-500/20 to-orange-500/20",
      borderColor: "border-red-500/30",
      iconColor: "text-red-400",
      primary: true,
      onClick: () => navigate('/game/play?tab=rpg'),
    },
    {
      title: "Story Library",
      description: "Explore curated stories across genres and difficulty levels",
      icon: BookOpen,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      onClick: () => navigate('/game/play?tab=stories'),
    },
    {
      title: "Free Reading",
      description: "Practice reading aloud with real-time AURA feedback",
      icon: Mic,
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      iconColor: "text-green-400",
      onClick: () => navigate('/game/play?tab=reading'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GameHeader studentId={user?.id}>
        {user?.id && (
          <RPGPlayerHUD
            studentId={user.id}
            gold={gold}
            xp={xp}
            className="hidden sm:flex"
          />
        )}
      </GameHeader>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, <span className="text-yellow-400">{profile?.full_name?.split(' ')[0] || 'Adventurer'}</span>! 🎮
          </h1>
          <p className="text-muted-foreground mt-1">Choose your reading adventure</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-yellow-400">{xp.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardContent className="p-3 text-center">
              <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-orange-400">{readingStats?.current_streak_days ?? 0}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
            <CardContent className="p-3 text-center">
              <BookOpen className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-400">{readingStats?.total_words_read?.toLocaleString() ?? 0}</div>
              <div className="text-xs text-muted-foreground">Words Read</div>
            </CardContent>
          </Card>
        </div>

        {/* Mode Cards */}
        <div className="grid gap-4">
          {modeCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r ${card.color} ${card.borderColor} ${
                  card.primary ? 'ring-2 ring-red-500/30' : ''
                }`}
                onClick={card.onClick}
              >
                <CardContent className={`flex items-center gap-4 ${card.primary ? 'p-6' : 'p-4'}`}>
                  <div className={`${card.primary ? 'w-14 h-14' : 'w-10 h-10'} rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0`}>
                    <card.icon className={`${card.primary ? 'w-7 h-7' : 'w-5 h-5'} ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold ${card.primary ? 'text-xl' : 'text-base'}`}>
                      {card.title}
                      {card.primary && <span className="ml-2 text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full">Featured</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View Progress CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Button
            onClick={() => navigate('/game/analytics')}
            variant="outline"
            className="w-full border-white/20 hover:bg-white/10"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View My Reading Progress
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default GameDashboard;
