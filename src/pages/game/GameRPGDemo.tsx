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
  TrendingUp, Target, Eye, Award, Mic, ShoppingBag,
  Wand2, CircleDot, Timer, BarChart3, Brain, Crosshair,
} from "lucide-react";

// ── Tour Steps ─────────────────────────────────────────────
type DemoView =
  | "world-map"
  | "level-select"
  | "story-intro"
  | "battle-mode"
  | "battle"
  | "mini-game"
  | "battle-victory"
  | "victory"
  | "rewards-shop"
  | "pet-companion";

const tourSteps: TourStep[] = [
  {
    id: "world-map",
    title: "🗺️ World Map",
    description: "This is your hub. You see all 9 worlds laid out — each representing a difficulty tier. Completed worlds show a green ✓ and star count. Locked worlds appear dimmed until you beat the previous boss.",
  },
  {
    id: "world-progress",
    title: "📊 Reading Journey Sidebar",
    description: "On the left you'll see your live reading stats: current reading level, words per minute, accuracy %, words mastered, and total stories read — all tracked by AURA AI in real-time.",
  },
  {
    id: "level-select",
    title: "📖 Level Select",
    description: "Tap a world to see its levels. Each level card shows the story title, word count, grade level, enemy types, and how many stars you earned. Boss levels have a red crown badge and are extra challenging!",
  },
  {
    id: "story-intro",
    title: "📜 Story Introduction",
    description: "Before each battle, you see the story passage you'll be reading. A narration button lets you hear it read aloud first. The story context helps you understand the words you'll encounter in battle.",
  },
  {
    id: "battle-mode",
    title: "⚔️ Choose Your Battle Style",
    description: "Pick from 3 battle modes: Classic LexiQuest (HP-based combat with mini-games), Tug of War (accuracy pulls the rope), or Balloon Bonanza (pop balloons with correct words). All modes track the same reading data.",
  },
  {
    id: "battle-arena",
    title: "🏟️ Battle Arena",
    description: "The main battle screen! Your heroes stand on the right, the enemy on the left. Words from the story appear one at a time in the center. Tap 'Start Reading' and read each word aloud into your microphone.",
  },
  {
    id: "battle-commands",
    title: "🎮 Command Menu",
    description: "The command panel on the left shows your options: Read (attack with words), Magic (special abilities unlocked by streaks), Defend (skip a difficult word), and Items (use potions and power-ups you've collected).",
  },
  {
    id: "battle-streaks",
    title: "🔥 Streak & Combo System",
    description: "Read words correctly in a row to build streaks. Streaks multiply your damage: x2 at 3 words, x3 at 5, x5 at 10! The streak counter glows on the right panel. Your best streak is saved for bragging rights.",
  },
  {
    id: "mini-game",
    title: "🎯 Mini-Game Interrupts",
    description: "Mid-battle, mini-games pop up to test specific skills! Word Cannon tests rapid pronunciation, Ink Splash tests phoneme recognition, and Fireball Barrage tests reading speed. Bonus damage is awarded for performance.",
  },
  {
    id: "battle-victory",
    title: "💥 Defeating the Enemy",
    description: "When the enemy's HP reaches zero, a defeat animation plays. You see exactly how much damage each word dealt, your accuracy breakdown, and which words you struggled with — AURA flags these for future practice.",
  },
  {
    id: "victory",
    title: "🏆 Victory & Rewards",
    description: "After winning, you earn XP (levels up your hero), Gold (spend in the shop), Stars (1-3 based on accuracy), and a rescued book. Your reading stats are permanently recorded and contribute to your overall level.",
  },
  {
    id: "rewards-shop",
    title: "🛒 Rewards Shop",
    description: "Spend your earned gold on cosmetic upgrades: new hero skins, battle effects, victory animations, and pet accessories. Everything is cosmetic — no pay-to-win. Motivates continued reading practice!",
  },
  {
    id: "pet-companion",
    title: "🐾 Pet Companions",
    description: "Equip a pet companion that appears alongside your heroes in battle! Pets are earned through achievements and login streaks. Each pet has a unique idle animation and victory celebration.",
  },
];

const GameRPGDemo = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<DemoView>("world-map");

  const handleStepChange = (step: TourStep) => {
    const viewMap: Record<string, DemoView> = {
      "world-map": "world-map",
      "world-progress": "world-map",
      "level-select": "level-select",
      "story-intro": "story-intro",
      "battle-mode": "battle-mode",
      "battle-arena": "battle",
      "battle-commands": "battle",
      "battle-streaks": "battle",
      "mini-game": "mini-game",
      "battle-victory": "battle-victory",
      "victory": "victory",
      "rewards-shop": "rewards-shop",
      "pet-companion": "pet-companion",
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
            {view === "story-intro" && <StoryIntroView key="si" />}
            {view === "battle-mode" && <BattleModeView key="bm" />}
            {view === "battle" && <BattleArenaView key="ba" />}
            {view === "mini-game" && <MiniGameView key="mg" />}
            {view === "battle-victory" && <BattleVictoryView key="bv" />}
            {view === "victory" && <VictoryView key="v" />}
            {view === "rewards-shop" && <RewardsShopView key="rs" />}
            {view === "pet-companion" && <PetCompanionView key="pc" />}
          </AnimatePresence>
        </main>
      </div>
    </DemoTourProvider>
  );
};

// ── World Map View ─────────────────────────────────────────
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
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-black text-white flex items-center justify-center gap-3">
          <Swords className="w-10 h-10 text-yellow-400" />
          <span>RPG Mode</span>
        </h1>
        <p className="text-white/60 mt-2">Your reading adventure awaits, hero!</p>
      </div>

      <div className="flex justify-end mb-4">
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg">
          <BookOpen className="w-4 h-4" />
          149 Books Rescued
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <DemoHighlight stepId="world-progress" tooltip="Your reading stats powered by AURA AI — updates in real-time as you play">
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
                  {[
                    { icon: Zap, color: "text-blue-400", val: "12", label: "Words/Min" },
                    { icon: Target, color: "text-green-400", val: "90%", label: "Accuracy" },
                    { icon: Star, color: "text-yellow-400", val: "142", label: "Words Mastered" },
                    { icon: Award, color: "text-purple-400", val: "282", label: "Stories Read" },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-[#3a2480] rounded-lg p-3 text-center">
                        <Icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                        <div className="text-lg font-bold text-white">{s.val}</div>
                        <div className="text-[10px] text-white/50">{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                <Button variant="outline" size="sm" className="w-full border-purple-500/30 text-white/70 hover:text-white text-xs">
                  View Full Stats →
                </Button>
                <p className="text-[10px] text-white/40 mt-2 text-center">📚 Every story makes you stronger!</p>
              </CardContent>
            </Card>
          </div>
        </DemoHighlight>

        <DemoHighlight stepId="world-map" tooltip="Tap any unlocked world to see its levels. Locked worlds require beating the previous boss.">
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
                    {world.complete && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> COMPLETE
                      </div>
                    )}
                    {!world.unlocked && (
                      <div className="absolute top-3 right-3 text-white/30">
                        <Lock className="w-5 h-5" />
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
                    <Progress value={world.complete ? 100 : world.id === 0 ? 0 : 60} className="h-2 mb-3" />

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.ceil(world.stars / 6) ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
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

// ── Level Select View ──────────────────────────────────────
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
      <DemoHighlight stepId="level-select" tooltip="Each card is a level. Stars show your best performance. Boss levels have a red badge.">
        <div className="text-center mb-8">
          <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            World 1
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-green-400 mb-2">The Enchanted Forest</h2>
          <p className="text-white/50 text-sm max-w-2xl mx-auto">
            The Enchanted Forest was once full of reading fairies who would help children learn. Now Grog's minions roam the trees, guarding the stolen books. Tap a level to begin!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {levels.map((level) => (
            <Card
              key={level.id}
              className={`bg-[#2d1b69]/80 border-purple-500/20 cursor-pointer hover:scale-[1.02] transition-all ${
                level.isBoss ? "ring-2 ring-red-500/40" : ""
              }`}
            >
              <CardContent className="p-4 relative">
                {level.isBoss && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" /> BOSS
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#3a2480] flex items-center justify-center text-white font-bold text-sm">
                    {level.id}
                  </div>
                  {level.completed && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
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

// ── Story Introduction View (NEW) ──────────────────────────
const StoryIntroView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="story-intro" tooltip="Read or listen to the story before battling — context helps comprehension">
      <Card className="bg-[#2d1b69]/80 border-purple-500/20 max-w-3xl mx-auto">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-green-400 text-xs font-bold">World 1 • Level 1</div>
              <h2 className="text-xl font-black text-white">The Friendly Dog</h2>
            </div>
            <div className="ml-auto flex items-center gap-2 text-white/40 text-xs">
              <BookOpen className="w-4 h-4" /> 62 words • Grade K
            </div>
          </div>

          <div className="bg-[#1a1040] rounded-xl p-6 mb-6 border border-purple-500/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 font-semibold text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-yellow-400" /> Story Preview
              </h3>
              <Button variant="outline" size="sm" className="border-purple-500/30 text-white/70 hover:text-white text-xs gap-1">
                <Volume2 className="w-3 h-3" /> Listen to Story
              </Button>
            </div>
            <p className="text-white/70 leading-relaxed text-sm">
              Sam was a friendly dog. He loved to run and play in the park. Every day, Sam would wag his tail when he saw his friends. 
              "Hello!" barked Sam. The cat sat on the mat. The bird flew up high. Sam liked to jump and catch the ball. 
              He was the best dog in the whole town. Everyone loved Sam because he was kind and always happy.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#3a2480] rounded-lg p-3 text-center">
              <Swords className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <div className="text-xs text-white/50">Enemy</div>
              <div className="text-sm font-bold text-white">Goblin Scout</div>
            </div>
            <div className="bg-[#3a2480] rounded-lg p-3 text-center">
              <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <div className="text-xs text-white/50">Enemy HP</div>
              <div className="text-sm font-bold text-white">80</div>
            </div>
            <div className="bg-[#3a2480] rounded-lg p-3 text-center">
              <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-xs text-white/50">Reward</div>
              <div className="text-sm font-bold text-white">150 XP</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-white/20 text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold gap-2">
              <Swords className="w-4 h-4" /> Start Battle!
            </Button>
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </motion.div>
);

// ── Battle Mode View ───────────────────────────────────────
const BattleModeView = () => {
  const modes = [
    {
      id: "classic", name: "Classic LexiQuest Battle",
      desc: "Traditional HP-based combat. Read words to deal damage. Build streaks for combo multipliers. Use magic abilities and items. The original RPG reading experience!",
      icon: Swords, gradient: "from-orange-200 to-orange-100", textColor: "text-orange-600", iconBg: "bg-orange-500", recommended: true,
    },
    {
      id: "tug", name: "Tug of War Challenge",
      desc: "A rope stretches across the screen. Read accurately to pull your side. Mistakes let the enemy pull back. First to cross the center line wins!",
      icon: Anchor, gradient: "from-blue-200 to-cyan-100", textColor: "text-blue-600", iconBg: "bg-blue-500", recommended: false,
    },
    {
      id: "balloon", name: "Balloon Bonanza",
      desc: "Enemy balloons float up — read the word on each to pop it! Miss and your balloons get popped instead. Fast-paced and great for building speed.",
      icon: Sparkles, gradient: "from-pink-200 to-purple-100", textColor: "text-pink-600", iconBg: "bg-pink-500", recommended: false,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <DemoHighlight stepId="battle-mode" tooltip="All 3 modes use the same words and track reading stats. Choose your favorite!">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Choose Your Battle Style</h2>
          <p className="text-white/40 text-sm">Each mode tests different reading skills but all track your progress equally</p>
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
      </DemoHighlight>
    </motion.div>
  );
};

// ── Battle Arena View ──────────────────────────────────────
const BattleArenaView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="battle-arena" tooltip="The main battle screen — read words aloud to deal damage to the enemy!">
      <div className="rounded-2xl overflow-hidden border border-white/10">
        {/* Battle Scene */}
        <div className="bg-gradient-to-b from-[#1a3a2a] to-[#0d2818] p-6 relative min-h-[280px]">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Award className="w-3 h-3" /> 50 Gold
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Star className="w-3 h-3" /> 320 XP
              </div>
            </div>
            <div className="text-right">
              <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Enchanted Forest
              </div>
              <div className="text-white/60 text-xs mt-1">The Friendly Dog 🔊</div>
            </div>
          </div>

          <div className="flex justify-between items-end px-4">
            <div className="text-center">
              <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                Goblin Scout
              </div>
              <div className="text-5xl mb-2">👺</div>
              <div className="text-white/70 text-xs font-mono">54/80</div>
              <div className="w-20 h-2 bg-white/10 rounded-full mt-1">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: "67%" }} />
              </div>
            </div>

            <div className="text-white/20 mb-8">
              <Swords className="w-8 h-8" />
            </div>

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

          <div className="text-center mt-2">
            <div className="text-white/70 text-xs font-mono">92/100</div>
            <div className="w-24 h-2 bg-white/10 rounded-full mt-1 mx-auto">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }} />
            </div>
          </div>
        </div>

        {/* Bottom UI */}
        <div className="bg-[#0a0a1a] p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
          <DemoHighlight stepId="battle-commands" tooltip="Read attacks with words. Magic unlocks at 5+ streaks. Defend skips hard words. Items use potions.">
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
          </DemoHighlight>

          {/* Word Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              {["Sam", "the", "dog", "loved", "to"].map((w, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    i < 2 ? "bg-green-500/20 text-green-400 line-through" : i === 2 ? "bg-green-500 text-white" : "bg-white/5 text-white/40"
                  }`}
                >
                  {w}
                </span>
              ))}
            </div>

            <div className="bg-[#1a1a3a] border border-blue-500/20 rounded-xl px-8 py-6 inline-block relative">
              <div className="text-4xl font-black text-white tracking-wider">dog</div>
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Mic className="w-3 h-3" /> Listening...
              </div>
            </div>
            <div className="text-white/40 text-xs mt-2">Word 3 of 62</div>

            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" className="border-white/20 text-white/60 hover:text-white gap-2">
                <Volume2 className="w-4 h-4" /> Hear Word
              </Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white gap-2 font-semibold">
                <Mic className="w-4 h-4" /> Reading...
              </Button>
            </div>
          </div>

          <DemoHighlight stepId="battle-streaks" tooltip="Streak counter shows consecutive correct words. Higher streaks = more damage!">
            <div className="bg-[#1a1a3a] border border-blue-500/30 rounded-xl p-3 w-40">
              <div className="text-xs font-bold text-white/80 mb-2">Elara <span className="text-white/40 float-right font-mono">92/100</span></div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mb-1">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "92%" }} />
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mb-3">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "60%" }} />
              </div>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Streak</span>
                <span className="font-bold text-orange-400 ml-auto text-lg">x3</span>
              </div>
              <div className="text-[10px] text-white/30 mt-1">Best: 8 • Damage x2</div>
              <div className="mt-2 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                <div className="text-[10px] text-orange-400 font-bold">🔥 COMBO ACTIVE</div>
                <div className="text-[9px] text-white/40">2 more for x3 multiplier</div>
              </div>
            </div>
          </DemoHighlight>
        </div>
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Mini-Game View (NEW) ───────────────────────────────────
const MiniGameView = () => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="mini-game" tooltip="Mini-games interrupt battles to test specific skills and award bonus damage">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-block bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            ⚡ MINI-GAME INTERRUPT!
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Bonus Challenge!</h2>
          <p className="text-white/50 text-sm">Complete the mini-game for massive bonus damage</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: "Word Cannon",
              desc: "Words fly across the screen — read each one before it reaches the other side! Tests rapid word recognition and pronunciation speed.",
              icon: Crosshair, color: "from-red-500/20 to-orange-500/20", border: "border-red-500/30", bonus: "+40 damage",
            },
            {
              name: "Ink Splash",
              desc: "Ink blots splatter on screen revealing phoneme patterns. Identify and pronounce each phoneme correctly to clear the ink and reveal hidden words.",
              icon: CircleDot, color: "from-purple-500/20 to-blue-500/20", border: "border-purple-500/30", bonus: "+35 damage",
            },
            {
              name: "Fireball Barrage",
              desc: "A rapid-fire sequence of words! Read as many as possible in 15 seconds. Each correct word launches a fireball at the enemy. Speed is key!",
              icon: Flame, color: "from-orange-500/20 to-yellow-500/20", border: "border-orange-500/30", bonus: "+50 damage",
            },
          ].map((game) => {
            const Icon = game.icon;
            return (
              <Card key={game.name} className={`bg-gradient-to-b ${game.color} ${game.border} border`}>
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{game.name}</h3>
                  <p className="text-xs text-white/50 mb-3 leading-relaxed">{game.desc}</p>
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full inline-block">
                    {game.bonus}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-[#2d1b69]/50 rounded-xl p-4 border border-purple-500/20 text-center">
          <p className="text-white/50 text-sm">
            <Timer className="w-4 h-4 inline mr-1" />
            Mini-games appear randomly mid-battle. Performance is tracked by AURA and contributes to your reading analytics.
          </p>
        </div>
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Battle Victory View (NEW) ──────────────────────────────
const BattleVictoryView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="battle-victory" tooltip="After defeating an enemy, AURA analyzes your reading performance in detail">
      <Card className="bg-[#2d1b69]/80 border-purple-500/20 max-w-3xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">💥</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">Enemy Defeated!</h2>
            <p className="text-white/50 text-sm">Goblin Scout has been vanquished!</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Damage", val: "160", icon: Swords, color: "text-red-400" },
              { label: "Accuracy", val: "94%", icon: Target, color: "text-green-400" },
              { label: "Best Streak", val: "8", icon: Flame, color: "text-orange-400" },
              { label: "Time", val: "2:34", icon: Timer, color: "text-blue-400" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-[#3a2480] rounded-xl p-3 text-center">
                  <Icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                  <div className={`font-bold text-lg ${s.color}`}>{s.val}</div>
                  <div className="text-[10px] text-white/40">{s.label}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#1a1040] rounded-xl p-4 mb-4 border border-purple-500/10">
            <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Word-by-Word Breakdown
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {["Sam", "was", "a", "friendly", "dog", "He", "loved", "to", "run", "and", "play", "in", "the", "park"].map((w, i) => (
                <div
                  key={i}
                  className={`text-[10px] px-1.5 py-1 rounded text-center font-medium ${
                    i === 3 || i === 6 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-white/40">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500/40" /> Correct</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-500/40" /> Struggled</span>
            </div>
          </div>

          <div className="bg-[#1a1040] rounded-xl p-4 border border-purple-500/10">
            <h3 className="text-sm font-bold text-white/80 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> AURA Insights
            </h3>
            <ul className="text-xs text-white/50 space-y-1.5">
              <li>• Words "friendly" and "loved" flagged for extra practice</li>
              <li>• Pronunciation latency improved 12% from last session</li>
              <li>• Reading pace: 18 WPM (up from 12 WPM last week)</li>
              <li>• Phoneme accuracy strong on consonant blends</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </motion.div>
);

// ── Victory View ───────────────────────────────────────────
const VictoryView = () => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="victory" tooltip="XP levels up your hero, Gold is spent in the shop, Stars rate your performance">
      <Card className="bg-gradient-to-b from-yellow-500/20 via-[#2d1b69]/80 to-[#1a1040] border-yellow-500/20">
        <CardContent className="p-8 text-center">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-yellow-400 mb-2">Victory!</h2>
          <p className="text-white/50 mb-6">You defeated Goblin Scout and rescued a book!</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-8">
            {[
              { icon: Star, color: "text-yellow-400", val: "+150", label: "XP Earned" },
              { icon: Award, color: "text-amber-400", val: "+50", label: "Gold" },
              { icon: Swords, color: "text-green-400", val: "160", label: "Damage Dealt" },
              { icon: BookOpen, color: "text-blue-400", val: "62", label: "Words Read" },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="bg-[#2d1b69] rounded-xl p-4 text-center border border-purple-500/20">
                  <Icon className={`w-6 h-6 ${r.color} mx-auto mb-1`} />
                  <div className={`font-bold ${r.color} text-lg`}>{r.val}</div>
                  <div className="text-[10px] text-white/40">{r.label}</div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((i) => (
              <Star key={i} className={`w-10 h-10 ${i <= 2 ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
            ))}
          </div>
          <p className="text-sm text-white/40 mb-4">2 out of 3 stars earned</p>

          <div className="bg-[#1a1040] rounded-xl p-4 max-w-sm mx-auto border border-purple-500/10 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Level Progress</span>
              <span className="text-yellow-400 font-bold">Level 4 → 5</span>
            </div>
            <Progress value={75} className="h-2 mt-2" />
            <div className="text-[10px] text-white/30 mt-1">320 / 500 XP to next level</div>
          </div>

          <div className="text-white/30 text-xs">
            📚 Book rescued! The kingdom's library grows stronger.
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </motion.div>
);

// ── Rewards Shop View (NEW) ────────────────────────────────
const RewardsShopView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="rewards-shop" tooltip="Spend gold on cosmetic upgrades — no pay-to-win, purely motivational rewards">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-yellow-400" /> Rewards Shop
            </h2>
            <p className="text-white/40 text-sm mt-1">Spend your hard-earned gold on cosmetic upgrades</p>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2">
            <Award className="w-4 h-4" /> 350 Gold
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: "Flame Sword", desc: "Fiery attack animation", cost: 100, emoji: "🗡️🔥", owned: true },
            { name: "Ice Shield", desc: "Frosty defend effect", cost: 150, emoji: "🛡️❄️", owned: false },
            { name: "Thunder Clap", desc: "Electric victory animation", cost: 200, emoji: "⚡✨", owned: false },
            { name: "Rainbow Trail", desc: "Colorful streak effect", cost: 120, emoji: "🌈💫", owned: false },
            { name: "Dragon Helm", desc: "Hero cosmetic headgear", cost: 300, emoji: "🐉👑", owned: false },
            { name: "Starfall Cape", desc: "Sparkling hero cape", cost: 250, emoji: "🌟🧥", owned: false },
            { name: "Confetti Burst", desc: "Party victory effect", cost: 80, emoji: "🎉🎊", owned: true },
            { name: "Echo Voice", desc: "Dramatic read effect", cost: 175, emoji: "🔊✨", owned: false },
          ].map((item) => (
            <Card key={item.name} className={`bg-[#2d1b69]/80 border-purple-500/20 ${item.owned ? "ring-1 ring-green-500/40" : "cursor-pointer hover:scale-[1.02]"} transition-all`}>
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <h4 className="font-bold text-white text-sm mb-1">{item.name}</h4>
                <p className="text-[10px] text-white/40 mb-2">{item.desc}</p>
                {item.owned ? (
                  <div className="text-green-400 text-xs font-bold flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Owned
                  </div>
                ) : (
                  <div className="text-yellow-400 text-xs font-bold flex items-center justify-center gap-1">
                    <Award className="w-3 h-3" /> {item.cost} Gold
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Pet Companion View (NEW) ───────────────────────────────
const PetCompanionView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="pet-companion" tooltip="Pets are earned through achievements — they appear in battle beside your heroes">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white mb-2">🐾 Pet Companions</h2>
          <p className="text-white/40 text-sm">Earn pets through achievements and milestones. Equip one to join you in battle!</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { name: "Spark", type: "Fire Fox", emoji: "🦊", earned: true, equipped: true, source: "Complete World 1" },
            { name: "Bubbles", type: "Water Sprite", emoji: "💧", earned: true, equipped: false, source: "Read 100 stories" },
            { name: "Whiskers", type: "Star Cat", emoji: "🐱", earned: true, equipped: false, source: "7-day login streak" },
            { name: "Rocky", type: "Earth Golem", emoji: "🪨", earned: false, equipped: false, source: "Complete World 3" },
            { name: "Zephyr", type: "Wind Eagle", emoji: "🦅", earned: false, equipped: false, source: "Reach Level 10" },
            { name: "Luna", type: "Moon Owl", emoji: "🦉", earned: false, equipped: false, source: "100% accuracy in 5 battles" },
          ].map((pet) => (
            <Card key={pet.name} className={`bg-[#2d1b69]/80 border-purple-500/20 transition-all ${
              pet.equipped ? "ring-2 ring-yellow-500/40" : pet.earned ? "cursor-pointer hover:scale-[1.02]" : "opacity-50"
            }`}>
              <CardContent className="p-4 text-center relative">
                {pet.equipped && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full">
                    EQUIPPED
                  </div>
                )}
                <div className="text-4xl mb-2">{pet.emoji}</div>
                <h4 className="font-bold text-white text-sm">{pet.name}</h4>
                <div className="text-[11px] text-white/40 mb-2">{pet.type}</div>
                {pet.earned ? (
                  <div className="text-green-400 text-[10px] font-bold flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Earned
                  </div>
                ) : (
                  <div className="text-white/30 text-[10px]">
                    <Lock className="w-3 h-3 inline mr-1" /> {pet.source}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-[#2d1b69]/50 rounded-xl p-4 border border-purple-500/20 text-center">
          <p className="text-white/50 text-sm">
            Equipped pets appear next to your heroes during battle and have unique victory celebrations! 🎉
          </p>
        </div>
      </div>
    </DemoHighlight>
  </motion.div>
);

export default GameRPGDemo;
