import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GameHeader } from "@/components/game/GameHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords, BookOpen, Gamepad2, BarChart3, Flame, Star, LogIn, Shield, Search, ArrowLeft, GraduationCap, Zap, Target, Gauge, Castle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { RPGPlayerHUD } from "@/components/aura/game/rpg/RPGPlayerHUD";
import { getStoredTheme, setStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { RPGShowcase } from "@/components/landing/RPGShowcase";
import { useGameReadingSummary } from "@/hooks/useGameReadingSummary";

const GameDashboard = () => {
  const navigate = useNavigate();
  const { user, session, profile } = useAuth();
  const [showModeSelect, setShowModeSelect] = useState(false);

  const currentGradeMode = getGradeMode(getStoredTheme());
  const { progress } = useCampaignProgress(user?.id, currentGradeMode);

  const { data: readingStats, isError: readingStatsError } = useQuery({
    queryKey: ['game-reading-stats', user?.id, currentGradeMode],
    queryFn: async () => {
      if (!user?.id) return null;
      let query = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', user.id);
      if (currentGradeMode) query = query.eq('grade_mode', currentGradeMode);
      const { data, error } = await query.maybeSingle();
      if (error) {
        console.error('[GameDashboard] student_reading_stats error', error);
        throw error;
      }
      return data;
    },
    enabled: !!user?.id,
    retry: 1,
  });

  const gold = progress?.total_gold ?? 0;
  const xp = progress?.total_xp_earned ?? 0;
  const isSignedIn = !!session;
  const { data: readingSummary, isError: readingSummaryError } = useGameReadingSummary(user?.id);

  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata as any)?.full_name ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'Adventurer';

  const statsErrored = readingStatsError || readingSummaryError;

  const handleModeSelect = (mode: 'classic' | 'agent' | 'prek') => {
    setStoredTheme(mode);
    if (isSignedIn) {
      navigate('/game/play?tab=rpg');
    } else {
      navigate('/game/auth');
    }
  };

  const modeCards = [
    {
      title: "RPG Campaign",
      description: "Battle enemies and rescue books through epic reading adventures",
      icon: Swords,
      color: "from-red-500/20 to-orange-500/20",
      borderColor: "border-red-500/30",
      iconColor: "text-red-400",
      primary: true,
      requiresAuth: true,
      onClick: () => setShowModeSelect(true),
    },
    {
      title: "Castle Swarm Defense",
      description: "NEW! Defend the castle by reading words and stories aloud. Endless horde mode.",
      icon: Castle,
      color: "from-amber-500/20 to-rose-500/20",
      borderColor: "border-amber-500/40",
      iconColor: "text-amber-400",
      requiresAuth: true,
      onClick: () => isSignedIn ? navigate('/game/castle-swarm') : navigate('/game/auth'),
    },
    {
      title: "Phonics Foundations",
      description: "World 0 — master CVC, blends, Silent-E, digraphs, and vowel teams before LexiQuest",
      icon: GraduationCap,
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      requiresAuth: false,
      onClick: () => navigate('/game/phonics-foundations'),
    },
    {
      title: "Story Library",
      description: "Explore curated stories across genres and difficulty levels",
      icon: BookOpen,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      requiresAuth: true,
      onClick: () => isSignedIn ? navigate('/game/play?tab=stories') : navigate('/game/auth'),
    },
    {
      title: "Game Demo",
      description: "Try a quick interactive demo of the RPG reading adventure",
      icon: Gamepad2,
      color: "from-purple-500/20 to-violet-500/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      requiresAuth: false,
      onClick: () => navigate('/game/demo'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>LexiQuest Game — YubiLearn</title>
        <meta name="description" content="LexiQuest: an adaptive RPG that builds reading fluency, vocabulary, and phonemic awareness through story-driven battles and minigames." />
        <link rel="canonical" href="https://yubilearn.com/game" />
        <meta property="og:title" content="LexiQuest Game — YubiLearn" />
        <meta property="og:description" content="Adaptive literacy RPG with story-driven battles and phonics minigames." />
        <meta property="og:url" content="https://yubilearn.com/game" />
        <meta property="og:type" content="website" />
      </Helmet>
      <GameHeader studentId={user?.id}>
        {isSignedIn && user?.id && (
          <RPGPlayerHUD
            studentId={user.id}
            gold={gold}
            xp={xp}
            gradeMode={currentGradeMode}
            className="hidden sm:flex"
          />
        )}
      </GameHeader>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <AnimatePresence mode="wait">
          {showModeSelect ? (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModeSelect(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Choose Your Adventure</h2>
                <p className="text-muted-foreground">Select a reading mode that matches your level</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Pre-K Mode */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="h-full"
                >
                  <Card
                    className="cursor-pointer transition-all duration-300 hover:scale-[1.03] bg-gradient-to-br from-pink-500/30 via-rose-500/20 to-orange-400/30 border-pink-500/40 hover:border-pink-400/60 hover:shadow-lg hover:shadow-pink-500/10 h-full"
                    onClick={() => handleModeSelect('prek')}
                  >
                    <CardContent className="p-6 text-center space-y-4 flex flex-col h-full justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 flex items-center justify-center mx-auto border border-pink-500/30">
                        <Star className="w-8 h-8 text-pink-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Pre-K</h3>
                        <span className="inline-block mt-1 text-xs font-semibold bg-pink-500/20 text-pink-200 border border-pink-500/30 px-3 py-1 rounded-full">
                          Ages 3–5
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Big friendly words with Sir Bookears, Maddy, and Yubi Village. Made for our youngest readers.
                      </p>
                      <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold">
                        ✨ Start Pre-K
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Classic Adventure Mode */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="h-full"
                >
                  <Card
                    className="cursor-pointer transition-all duration-300 hover:scale-[1.03] bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-red-500/30 border-amber-500/40 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/10 h-full"
                    onClick={() => handleModeSelect('classic')}
                  >
                    <CardContent className="p-6 text-center space-y-4 flex flex-col h-full justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-red-500/20 flex items-center justify-center mx-auto border border-amber-500/30">
                        <Shield className="w-8 h-8 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Classic Adventure</h3>
                        <span className="inline-block mt-1 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full">
                          Grades K–5
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Epic fantasy quests with knights, dragons, and magic. Perfect for younger readers building foundational skills.
                      </p>
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-semibold">
                        ⚔️ Start Classic
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Agent Mode */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="h-full"
                >
                  <Card
                    className="cursor-pointer transition-all duration-300 hover:scale-[1.03] bg-gradient-to-br from-cyan-500/30 via-indigo-500/20 to-purple-500/30 border-cyan-500/40 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 h-full"
                    onClick={() => handleModeSelect('agent')}
                  >
                    <CardContent className="p-6 text-center space-y-4 flex flex-col h-full justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/20 flex items-center justify-center mx-auto border border-cyan-500/30">
                        <Search className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Agent Mode</h3>
                        <span className="inline-block mt-1 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full">
                          Grades 6–12
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Cyber spy missions with hacking, espionage, and strategy. Designed for advanced readers tackling complex texts.
                      </p>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold">
                        🕵️ Start Agent
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* RPG Battle Showcase */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="mb-8 rounded-3xl border border-white/10 bg-[hsl(270_45%_8%)] overflow-hidden shadow-[0_20px_80px_-20px_hsl(270_80%_30%/0.6)]"
              >
                <RPGShowcase variant="hero" />
              </motion.div>

              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {isSignedIn ? (
                    <>Welcome back, <span className="text-yellow-400">{displayName.split(' ')[0]}</span>! 🎮</>
                  ) : (
                    <>Welcome to <span className="text-yellow-400">YubiLearn</span>! 🎮</>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isSignedIn ? 'Choose your reading adventure' : 'Sign in to track your progress and play'}
                </p>
                {isSignedIn && statsErrored && (
                  <p className="text-xs text-destructive mt-2">
                    Couldn't load your latest stats. Refresh to retry — your progress is safe.
                  </p>
                )}
              </motion.div>

              {/* Sign In CTA for unauthenticated users */}
              {!isSignedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-semibold">Sign in to start your adventure</h3>
                        <p className="text-sm text-muted-foreground">Track your progress, earn XP, and battle enemies!</p>
                      </div>
                      <Button
                        onClick={() => navigate('/game/auth')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      >
                        <LogIn className="w-4 h-4 mr-1" />
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Quick Stats — only for signed-in users */}
              {isSignedIn && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
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
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="p-3 text-center">
                      <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-blue-400">{readingSummary?.avgWpm ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Avg WPM</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
                    <CardContent className="p-3 text-center">
                      <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-emerald-400">{readingSummary?.avgAccuracy ?? 0}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
                    <CardContent className="p-3 text-center">
                      <Gauge className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-pink-400">{readingSummary?.avgWcpm ?? 0}</div>
                      <div className="text-xs text-muted-foreground">WCPM · {readingSummary?.fluencyLabel ?? '—'}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

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
                            {card.requiresAuth && !isSignedIn && <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Sign in required</span>}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{card.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* View Progress CTA — only for signed-in users */}
              {isSignedIn && (
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default GameDashboard;
