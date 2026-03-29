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
  Sparkles, GraduationCap,
} from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────
const mockWorlds = [
  { id: 0, name: "Tutorial Woods", icon: GraduationCap, gradient: "from-emerald-600/40 to-green-800/40", unlocked: true, stars: 9, totalStars: 9, levelsCompleted: 3, totalLevels: 3 },
  { id: 1, name: "Enchanted Forest", icon: TreePine, gradient: "from-green-600/40 to-emerald-800/40", unlocked: true, stars: 12, totalStars: 15, levelsCompleted: 4, totalLevels: 5 },
  { id: 2, name: "Frostfang Peaks", icon: Mountain, gradient: "from-blue-600/40 to-cyan-800/40", unlocked: true, stars: 6, totalStars: 15, levelsCompleted: 2, totalLevels: 5 },
  { id: 3, name: "Dragon's Keep", icon: Flame, gradient: "from-red-600/40 to-orange-800/40", unlocked: false, stars: 0, totalStars: 15, levelsCompleted: 0, totalLevels: 5 },
  { id: 4, name: "Grog's Fortress", icon: Crown, gradient: "from-purple-600/40 to-violet-800/40", unlocked: false, stars: 0, totalStars: 15, levelsCompleted: 0, totalLevels: 5 },
];

const mockLevels = [
  { id: 1, title: "The Whispering Glade", enemy: "👺 Goblin Minion", stars: 3, completed: true, unlocked: true, isBoss: false },
  { id: 2, title: "Mushroom Hollow", enemy: "⚔️ Forest Guard", stars: 3, completed: true, unlocked: true, isBoss: false },
  { id: 3, title: "Treant's Bridge", enemy: "🛡️ Elite Sentinel", stars: 2, completed: true, unlocked: true, isBoss: false },
  { id: 4, title: "Crystal Cavern", enemy: "🧊 Ice Golem", stars: 1, completed: true, unlocked: true, isBoss: false },
  { id: 5, title: "The Dragon's Lair", enemy: "🐉 Shadow Drake", stars: 0, completed: false, unlocked: true, isBoss: true },
];

const mockBattleModes = [
  { id: "classic", name: "Classic Battle", desc: "Read words aloud to attack", icon: Swords },
  { id: "speed", name: "Speed Rush", desc: "Race against the clock", icon: Zap },
  { id: "survival", name: "Survival Mode", desc: "How long can you last?", icon: Shield },
];

// ── Demo Views ─────────────────────────────────────────────
type DemoView = "world-map" | "level-select" | "battle-mode" | "battle" | "victory";

const tourSteps: TourStep[] = [
  { id: "world-map", title: "🗺️ World Map", description: "Explore different worlds, each with unique enemies and stories. Complete worlds to unlock new ones!" },
  { id: "world-progress", title: "⭐ World Progress", description: "Earn stars by reading accurately. Each level awards up to 3 stars based on your reading performance." },
  { id: "level-select", title: "📖 Level Select", description: "Each world has multiple levels with different stories and enemies. Boss levels are extra challenging!" },
  { id: "battle-mode", title: "⚔️ Battle Modes", description: "Choose how you want to fight! Classic reading, speed challenges, or survival — each tests different skills." },
  { id: "battle-arena", title: "🏟️ Battle Arena", description: "Read words aloud to attack enemies. Build streaks for combo damage. Watch your HP — enemies fight back!" },
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
      <div className="min-h-screen bg-background">
        <GameHeader />

        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/game/dashboard")} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-bold">RPG Campaign Demo</h1>
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

// ── World Map View ─────────────────────────────────────────
const WorldMapView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="world-map" tooltip="Navigate through different worlds to rescue stolen books">
      <div className="space-y-3">
        {/* Stats bar */}
        <DemoHighlight stepId="world-progress" tooltip="Your total progress across all worlds">
          <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-yellow-400">27 / 69</span>
                  <span className="text-xs text-muted-foreground">Stars</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-blue-400">9</span>
                  <span className="text-xs text-muted-foreground">Books Rescued</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">World 3 / 5</div>
            </CardContent>
          </Card>
        </DemoHighlight>

        {/* Worlds */}
        {mockWorlds.map((world) => {
          const Icon = world.icon;
          return (
            <Card
              key={world.id}
              className={`bg-gradient-to-r ${world.gradient} border-white/10 transition-all ${
                world.unlocked ? "cursor-pointer hover:scale-[1.02]" : "opacity-50"
              }`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  {world.unlocked ? <Icon className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{world.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={(world.levelsCompleted / world.totalLevels) * 100} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{world.levelsCompleted}/{world.totalLevels}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.ceil(world.stars / 5) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{world.stars}/{world.totalStars}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Level Select View ──────────────────────────────────────
const LevelSelectView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="level-select" tooltip="Pick a level to battle through reading">
      <div className="mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-400" /> Enchanted Forest
        </h2>
        <p className="text-sm text-muted-foreground">Choose a level to begin your reading battle</p>
      </div>
      <div className="space-y-3">
        {mockLevels.map((level) => (
          <Card
            key={level.id}
            className={`bg-card/50 border-white/10 transition-all ${
              level.unlocked ? "cursor-pointer hover:scale-[1.01]" : "opacity-40"
            } ${level.isBoss ? "ring-1 ring-red-500/30" : ""}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                level.completed ? "bg-green-500/20 text-green-400" : level.isBoss ? "bg-red-500/20 text-red-400" : "bg-white/10 text-foreground"
              }`}>
                {level.isBoss ? <Crown className="w-5 h-5" /> : level.id}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{level.title}</h4>
                <p className="text-xs text-muted-foreground">{level.enemy}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < level.stars ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Battle Mode View ───────────────────────────────────────
const BattleModeView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="battle-mode" tooltip="Choose your preferred battle style">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Choose Battle Mode</h2>
        <p className="text-sm text-muted-foreground">How do you want to fight?</p>
      </div>
      <div className="grid gap-3">
        {mockBattleModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card key={mode.id} className="bg-card/50 border-white/10 cursor-pointer hover:scale-[1.02] transition-all">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">{mode.name}</h3>
                  <p className="text-sm text-muted-foreground">{mode.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Battle Arena View ──────────────────────────────────────
const BattleArenaView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="battle-arena" tooltip="The battle arena — read words to attack!">
      <Card className="bg-gradient-to-b from-red-950/40 to-background border-red-500/20 overflow-hidden">
        <CardContent className="p-0">
          {/* Enemy section */}
          <div className="p-6 text-center border-b border-white/5">
            <div className="text-4xl mb-2">🐉</div>
            <h3 className="font-bold text-red-400">Shadow Drake</h3>
            <div className="mt-2 max-w-xs mx-auto">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">HP</span>
                <span className="text-red-400">340 / 500</span>
              </div>
              <Progress value={68} className="h-3 bg-red-950" />
            </div>
          </div>

          {/* Battle info */}
          <div className="p-4 grid grid-cols-3 gap-3 text-center border-b border-white/5">
            <div>
              <div className="flex items-center justify-center gap-1 text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="font-bold">7</span>
              </div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-yellow-400">
                <Swords className="w-4 h-4" />
                <span className="font-bold">160</span>
              </div>
              <div className="text-xs text-muted-foreground">Damage</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-blue-400">
                <BookOpen className="w-4 h-4" />
                <span className="font-bold">42</span>
              </div>
              <div className="text-xs text-muted-foreground">Words</div>
            </div>
          </div>

          {/* Player HP */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold">Hero Knight</span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">HP</span>
              <span className="text-green-400">85 / 100</span>
            </div>
            <Progress value={85} className="h-3" />
          </div>

          {/* Current word prompt */}
          <div className="p-6 text-center bg-white/5">
            <p className="text-xs text-muted-foreground mb-2">Read this word aloud:</p>
            <div className="text-3xl font-bold text-primary tracking-wider">
              adventure
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Speak clearly into your microphone
            </p>
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </motion.div>
);

// ── Victory View ───────────────────────────────────────────
const VictoryView = () => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="victory" tooltip="The rewards screen after defeating an enemy">
      <Card className="bg-gradient-to-b from-yellow-500/20 to-background border-yellow-500/20">
        <CardContent className="p-8 text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">Victory!</h2>
          <p className="text-muted-foreground mb-6">You defeated Shadow Drake and rescued a book!</p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-3 text-center">
                <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <div className="font-bold text-yellow-400">+150 XP</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-3 text-center">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="font-bold text-amber-400">+50 Gold</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-3 text-center">
                <Swords className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <div className="font-bold text-green-400">160 Damage</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-3 text-center">
                <BookOpen className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="font-bold text-blue-400">42 Words</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3].map((i) => (
              <Star key={i} className={`w-8 h-8 ${i <= 2 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">2 out of 3 stars earned</p>
        </CardContent>
      </Card>
    </DemoHighlight>
  </motion.div>
);

export default GameRPGDemo;
