import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/game/GameHeader";
import { DemoTourProvider, TourStep } from "@/components/demos/DemoTourGuide";
import { DemoHighlight } from "@/components/demos/DemoHighlight";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Swords, Star, Lock, Crown, TreePine, Mountain, Flame,
  ArrowLeft, BookOpen, Shield, Heart, Zap, Trophy,
  Sparkles, GraduationCap, Check, Anchor, Volume2,
  TrendingUp, Target, Eye, Award,
} from "lucide-react";

// ── Tour Steps ─────────────────────────────────────────────
type DemoView = "world-map" | "level-select" | "battle-mode" | "battle" | "victory";

const tourSteps: TourStep[] = [
  { id: "world-map", title: "🗺️ World Map", description: "Explore 9 unique worlds, each with different enemies and stories. Complete worlds to unlock the next!" },
  { id: "world-progress", title: "⭐ Your Reading Journey", description: "Track your reading level, words mastered, accuracy, and stories read — all powered by AURA AI." },
  { id: "level-select", title: "📖 Level Select", description: "Each world has multiple levels with unique stories and enemies. Boss levels are extra challenging!" },
  { id: "battle-mode", title: "⚔️ Battle Styles", description: "Choose Classic LexiQuest Battle, Tug of War Challenge, or Balloon Bonanza — each tests different reading skills." },
  { id: "battle-arena", title: "🏟️ Battle Arena", description: "Read words aloud to attack enemies! Build streaks for combo damage. Use the Command menu for magic and items." },
  { id: "victory", title: "🏆 Victory!", description: "Defeat enemies to rescue stolen books, earn XP, gold, and stars. Level up and unlock new worlds!" },
];

const GameRPGDemo = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<DemoView>("world-map");

  const handleStepChange = (step: TourStep) => {
    const viewMap: Record<string, DemoView> = {
      "world-map": "world-map",
      "world-progress": "world-map",
      "level-select": "level-select",
      "battle-mode": "battle-mode",
      "battle-arena": "battle",
      "victory": "victory",
    };
    setView(viewMap[step.id] || "world-map");
  };

  return (
    <DemoTourProvider steps={tourSteps} onStepChange={handleStepChange}>
      <div className="min-h-screen bg-[#1a1040]">
        <GameHeader />

        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/game/dashboard")} className="text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <span className="text-white/40 text-sm">RPG Campaign Demo</span>
          </div>

          <AnimatePresence mode="wait">
            {view === "world-map" && <WorldMapView key="wm" />}
            {view === "level-select" && <LevelSelectView key="ls" />}
            {view === "battle-mode" && <BattleModeView key="bm" />}
            {view === "battle" && <BattleArenaView key="ba" />}
            {view === "victory" && <VictoryView key="v" />}
          </AnimatePresence>
        </main>
      </div>
    </DemoTourProvider>
  );
};

// ── World Map View (matches actual RPG Mode) ───────────────
const WorldMapView = () => {
  const worlds = [
    { id: 0, name: "Tutorial", desc: "Learn how to play! Your adventure begins here!", icon: GraduationCap, gradient: "from-emerald-600 to-green-700", levels: "0/1", stars: 0, complete: false, unlocked: true },
    { id: 1, name: "The Enchanted Forest", desc: "Where Grog's goblins first scattered the stolen books", icon: TreePine, gradient: "from-green-600 to-emerald-700", levels: "8/5", stars: 16, complete: true, unlocked: true },
    { id: 2, name: "The Frozen Depths", desc: "The icy caverns where the Ice Golem guards stolen books", icon: Mountain, gradient: "from-blue-600 to-indigo-700", levels: "6/6", stars: 12, complete: true, unlocked: true },
    { id: 3, name: "The Ancient Ruins", desc: "Where the Stone Guardian protects ancient knowledge", icon: Flame, gradient: "from-orange-600 to-red-700", levels: "7/7", stars: 14, complete: true, unlocked: true },
    { id: 4, name: "The Throne Room", desc: "Grog's fortress awaits the bravest readers", icon: Crown, gradient: "from-purple-600 to-violet-800", levels: "0/8", stars: 0, complete: false, unlocked: false },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* RPG Mode Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-black text-white flex items-center justify-center gap-3">
          <Swords className="w-10 h-10 text-yellow-400" />
          <span>RPG Mode</span>
        </h1>
        <p className="text-white/60 mt-2">Your reading adventure awaits, hero!</p>
      </div>

      {/* Books Rescued Badge */}
      <div className="flex justify-end mb-4">
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg">
          <BookOpen className="w-4 h-4" />
          149 Books Rescued
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Reading Journey Sidebar */}
        <DemoHighlight stepId="world-progress" tooltip="Your reading stats powered by AURA AI">
          <div className="lg:w-64 flex-shrink-0">
            <Card className="bg-[#2d1b69] border-purple-500/30">
              <CardContent className="p-4">
                <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4" /> My Reading Journey
                </h3>

                <div className="bg-[#3a2480] rounded-lg p-3 mb-3">
                  <div className="text-xs text-white/50 mb-1">Reading Level</div>
                  <div className="text-lg font-bold text-yellow-400">Pre-K Grade</div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 2 ? "bg-green-400" : "bg-white/10"}`} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#3a2480] rounded-lg p-3 text-center">
                    <Zap className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">12</div>
                    <div className="text-[10px] text-white/50">Words/Min</div>
                  </div>
                  <div className="bg-[#3a2480] rounded-lg p-3 text-center">
                    <Target className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">90%</div>
                    <div className="text-[10px] text-white/50">Accuracy</div>
                  </div>
                  <div className="bg-[#3a2480] rounded-lg p-3 text-center">
                    <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">142</div>
                    <div className="text-[10px] text-white/50">Words Mastered</div>
                  </div>
                  <div className="bg-[#3a2480] rounded-lg p-3 text-center">
                    <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">282</div>
                    <div className="text-[10px] text-white/50">Stories Read</div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full border-purple-500/30 text-white/70 hover:text-white text-xs">
                  View Full Stats →
                </Button>
                <p className="text-[10px] text-white/40 mt-2 text-center">📚 Every story makes you stronger!</p>
              </CardContent>
            </Card>
          </div>
        </DemoHighlight>

        {/* World Cards Grid */}
        <DemoHighlight stepId="world-map" tooltip="Navigate through different worlds to rescue stolen books">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {worlds.map((world) => {
              const Icon = world.icon;
              return (
                <Card
                  key={world.id}
                  className={`bg-[#2d1b69]/80 border-purple-500/20 overflow-hidden transition-all ${
                    world.unlocked ? "cursor-pointer hover:scale-[1.02] hover:border-purple-500/40" : "opacity-50"
                  }`}
                >
                  <CardContent className="p-5 relative">
                    {/* Complete badge */}
                    {world.complete && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> COMPLETE
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${world.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right ml-auto">
                        <div className="text-white/40 text-xs">World</div>
                        <div className="text-3xl font-black text-white/30">{world.id}</div>
                      </div>
                    </div>

                    <h3 className={`font-bold text-lg mb-1 ${world.complete ? "text-green-400" : world.unlocked ? "text-white" : "text-white/40"}`}>
                      {world.name}
                    </h3>
                    <p className="text-xs text-white/40 mb-3 line-clamp-2">{world.desc}</p>

                    <div className="flex justify-between items-center text-xs text-white/50 mb-1">
                      <span>Progress</span>
                      <span>{world.levels} Levels</span>
                    </div>
                    <Progress
                      value={world.complete ? 100 : world.id === 0 ? 0 : 60}
                      className="h-2 mb-3"
                    />

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.ceil(world.stars / 6) ? "text-yellow-400 fill-yellow-400" : "text-white/20"
                          }`}
                        />
                      ))}
                      <span className="text-yellow-400 font-bold text-sm ml-1">{world.stars}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DemoHighlight>
      </div>
    </motion.div>
  );
};

// ── Level Select View (matches actual RPG) ─────────────────
const LevelSelectView = () => {
  const levels = [
    { id: 1, title: "The Friendly Dog", words: 62, grade: 0, enemies: ["👺"], stars: 2, completed: true, isBoss: false },
    { id: 2, title: "My Pet Fish", words: 60, grade: 0, enemies: ["👺"], stars: 2, completed: true, isBoss: false },
    { id: 3, title: "The Big Red Ball", words: 58, grade: 0, enemies: ["👺", "👺"], stars: 2, completed: true, isBoss: false, multi: true },
    { id: 4, title: "The Little Star", words: 55, grade: 0, enemies: ["👺", "⚔️"], stars: 2, completed: true, isBoss: false, multi: true },
    { id: 5, title: "The Magic Garden", words: 56, grade: 0, enemies: ["⚔️", "👑"], stars: 2, completed: true, isBoss: true, multi: true },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <DemoHighlight stepId="level-select" tooltip="Pick a level to battle through reading">
        <div className="text-center mb-8">
          <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            World 1
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-green-400 mb-2">The Enchanted Forest</h2>
          <p className="text-white/50 text-sm max-w-2xl mx-auto">
            The Enchanted Forest was once full of reading fairies who would help children learn. Now Grog's minions roam the trees, guarding the stolen books.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {levels.map((level) => (
            <Card
              key={level.id}
              className={`bg-[#2d1b69]/80 border-purple-500/20 cursor-pointer hover:scale-[1.02] transition-all ${
                level.isBoss ? "ring-2 ring-red-500/40 sm:col-span-1" : ""
              }`}
            >
              <CardContent className="p-4 relative">
                {/* Boss badge */}
                {level.isBoss && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" /> BOSS
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  {level.completed && (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-0.5 ml-auto">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < level.stars ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                    ))}
                  </div>
                </div>

                <h4 className="font-bold text-white mb-1">{level.title}</h4>
                <p className="text-[11px] text-white/40 flex items-center gap-2">
                  <BookOpen className="w-3 h-3" /> {level.words} words • Grade {level.grade}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] text-white/40">Enemies:</span>
                  <div className="flex items-center gap-1">
                    {level.enemies.map((e, i) => (
                      <span key={i} className="text-base">{e}</span>
                    ))}
                    {level.multi && (
                      <span className="text-[10px] font-bold text-red-400 ml-1">MULTI!</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-center gap-6 mt-6 text-white/60 text-sm">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4" /> 5/5 Complete
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" /> 10 Stars
          </div>
        </div>
      </DemoHighlight>
    </motion.div>
  );
};

// ── Battle Mode View (matches actual "Choose Your Battle Style") ──
const BattleModeView = () => {
  const modes = [
    {
      id: "classic",
      name: "Classic LexiQuest Battle",
      desc: "Traditional HP-based combat with mini-games and special attacks",
      icon: Swords,
      gradient: "from-orange-200 to-orange-100",
      textColor: "text-orange-600",
      iconBg: "bg-orange-500",
      recommended: true,
    },
    {
      id: "tug",
      name: "Tug of War Challenge",
      desc: "Pull the rope with reading accuracy - every word counts!",
      icon: Anchor,
      gradient: "from-blue-200 to-cyan-100",
      textColor: "text-blue-600",
      iconBg: "bg-blue-500",
      recommended: false,
    },
    {
      id: "balloon",
      name: "Balloon Bonanza",
      desc: "Pop enemy balloons with correct words before yours pop!",
      icon: Sparkles,
      gradient: "from-pink-200 to-purple-100",
      textColor: "text-pink-600",
      iconBg: "bg-pink-500",
      recommended: false,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <DemoHighlight stepId="battle-mode" tooltip="Choose your preferred battle style">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white">Choose Your Battle Style</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.id}
                className={`bg-gradient-to-br ${mode.gradient} border-0 cursor-pointer hover:scale-[1.03] transition-all relative overflow-hidden`}
              >
                <CardContent className="p-6 relative">
                  {mode.recommended && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      RECOMMENDED
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-full ${mode.iconBg} flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className={`font-bold text-lg ${mode.textColor} mb-2`}>{mode.name}</h3>
                  <p className="text-sm text-gray-600">{mode.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-white/40 text-sm mt-4">
          All modes use the same story words and track your reading progress
        </p>
      </DemoHighlight>
    </motion.div>
  );
};

// ── Battle Arena View (matches actual RPG battle screen) ───
const BattleArenaView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="battle-arena" tooltip="The battle arena — read words to attack!">
      <div className="rounded-2xl overflow-hidden border border-white/10">
        {/* Battle Scene - top half with gradient background */}
        <div className="bg-gradient-to-b from-[#1a3a2a] to-[#0d2818] p-6 relative min-h-[280px]">
          {/* Top bar */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Award className="w-3 h-3" /> 0
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Star className="w-3 h-3" /> 0 XP
              </div>
            </div>
            <div className="text-right">
              <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Enchanted Forest
              </div>
              <div className="text-white/60 text-xs mt-1">The Friendly Dog 🔊</div>
            </div>
          </div>

          {/* Characters */}
          <div className="flex justify-between items-end px-4">
            {/* Enemy */}
            <div className="text-center">
              <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                Goblin Scout
              </div>
              <div className="text-5xl mb-2">👺</div>
              <div className="text-white/70 text-xs font-mono">80/80</div>
              <div className="w-20 h-2 bg-white/10 rounded-full mt-1">
                <div className="h-full bg-green-500 rounded-full w-full" />
              </div>
            </div>

            {/* Crossed swords */}
            <div className="text-white/20 mb-8">
              <Swords className="w-8 h-8" />
            </div>

            {/* Heroes */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-purple-400 text-xs font-bold mb-1">Elara</div>
                <div className="text-xs text-white/40">The Wise Wizard</div>
                <div className="text-4xl my-2">🧙</div>
              </div>
              <div className="text-center">
                <div className="text-pink-400 text-xs font-bold mb-1">Princess Ella</div>
                <div className="text-xs text-white/40">The Flower Princess</div>
                <div className="text-4xl my-2">👸</div>
              </div>
            </div>
          </div>

          {/* Player HP */}
          <div className="text-center mt-2">
            <div className="text-white/70 text-xs font-mono">100/100</div>
            <div className="w-24 h-2 bg-white/10 rounded-full mt-1 mx-auto">
              <div className="h-full bg-blue-500 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Bottom UI - Command menu + Word display + Stats */}
        <div className="bg-[#0a0a1a] p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
          {/* Command Menu */}
          <div className="bg-[#1a1a3a] border border-blue-500/30 rounded-xl p-3 w-36">
            <div className="text-xs font-bold text-white/80 mb-2 tracking-wider">COMMAND</div>
            <div className="space-y-1">
              <div className="bg-green-500 text-white text-sm font-semibold px-3 py-2 rounded-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Read
              </div>
              <div className="text-white/40 text-sm px-3 py-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Magic
              </div>
              <div className="text-white/40 text-sm px-3 py-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Defend
              </div>
              <div className="text-white/40 text-sm px-3 py-2 flex items-center gap-2">
                <Award className="w-4 h-4" /> Items
              </div>
            </div>
            <div className="text-center text-green-400 text-[10px] mt-2 font-bold">✦ Your Turn ✦</div>
          </div>

          {/* Word Display */}
          <div className="text-center">
            {/* Word bar */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {["Sam", "the", "dog", "loved", "to"].map((w, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    i === 0 ? "bg-green-500 text-white" : "bg-white/5 text-white/40"
                  }`}
                >
                  {w}
                </span>
              ))}
            </div>

            {/* Current word */}
            <div className="bg-[#1a1a3a] border border-blue-500/20 rounded-xl px-8 py-6 inline-block">
              <div className="text-4xl font-black text-white tracking-wider">Sam</div>
            </div>
            <div className="text-white/40 text-xs mt-2">Word 1 of 5</div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" className="border-white/20 text-white/60 hover:text-white gap-2">
                <Volume2 className="w-4 h-4" /> Hear
              </Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white gap-2 font-semibold">
                <TrendingUp className="w-4 h-4" /> Start Reading
              </Button>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-[#1a1a3a] border border-blue-500/30 rounded-xl p-3 w-40">
            <div className="text-xs font-bold text-white/80 mb-2">Elara <span className="text-white/40 float-right font-mono">100/100</span></div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-1">
              <div className="h-full bg-green-500 rounded-full w-full" />
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-3">
              <div className="h-full bg-purple-500 rounded-full w-full" />
            </div>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Streak</span>
              <span className="font-bold text-white ml-auto">x0</span>
            </div>
            <div className="text-[10px] text-white/30 mt-1">Best: 0</div>
          </div>
        </div>
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Victory View ───────────────────────────────────────────
const VictoryView = () => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="victory" tooltip="The rewards screen after defeating an enemy">
      <Card className="bg-gradient-to-b from-yellow-500/20 via-[#2d1b69]/80 to-[#1a1040] border-yellow-500/20">
        <CardContent className="p-8 text-center">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-yellow-400 mb-2">Victory!</h2>
          <p className="text-white/50 mb-6">You defeated Goblin Scout and rescued a book!</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-8">
            <div className="bg-[#2d1b69] rounded-xl p-4 text-center border border-purple-500/20">
              <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <div className="font-bold text-yellow-400 text-lg">+150</div>
              <div className="text-[10px] text-white/40">XP Earned</div>
            </div>
            <div className="bg-[#2d1b69] rounded-xl p-4 text-center border border-purple-500/20">
              <Award className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <div className="font-bold text-amber-400 text-lg">+50</div>
              <div className="text-[10px] text-white/40">Gold</div>
            </div>
            <div className="bg-[#2d1b69] rounded-xl p-4 text-center border border-purple-500/20">
              <Swords className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <div className="font-bold text-green-400 text-lg">160</div>
              <div className="text-[10px] text-white/40">Damage Dealt</div>
            </div>
            <div className="bg-[#2d1b69] rounded-xl p-4 text-center border border-purple-500/20">
              <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="font-bold text-blue-400 text-lg">62</div>
              <div className="text-[10px] text-white/40">Words Read</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((i) => (
              <Star key={i} className={`w-10 h-10 ${i <= 2 ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
            ))}
          </div>
          <p className="text-sm text-white/40">2 out of 3 stars earned</p>

          <div className="mt-6 text-white/30 text-xs">
            📚 Book rescued! The kingdom's library grows stronger.
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </motion.div>
);

export default GameRPGDemo;
