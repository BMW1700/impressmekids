import { useState } from "react";
import { Helmet } from "react-helmet-async";
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
  TrendingUp, Target, Award, Mic, Package,
  Timer, BarChart3, Brain, Crosshair, CircleDot,
  Gem, Cloud, Waves, Eclipse,
} from "lucide-react";

// ── Tour Steps ─────────────────────────────────────────────
type DemoView =
  | "world-map"
  | "level-select"
  | "battle-mode"
  | "battle"
  | "mini-game"
  | "battle-victory"
  | "victory";

const tourSteps: TourStep[] = [
  {
    id: "world-map",
    title: "🗺️ World Map",
    description: "The main hub of RPG Mode. 9 worlds are displayed in a 2-column grid, each with a gradient icon, boss silhouette, and animated progress bar. Completed worlds glow gold. Locked worlds show a bouncing lock icon with unlock requirements.",
  },
  {
    id: "world-progress",
    title: "📊 Reading Progress Panel",
    description: "A fixed sidebar on desktop (scrollable card on mobile) shows your live AURA-powered reading stats: current grade-level, words per minute, accuracy %, words mastered, and stories read. Updates after every battle.",
  },
  {
    id: "level-select",
    title: "📖 Level Select",
    description: "Tapping a world opens its level grid. Each card shows the story title, word count, grade level, enemy icons (👺 minion, ⚔️ guard, 🛡️ elite), and earned stars. Boss levels have a pulsing red crown badge. Locked levels show a dark overlay.",
  },
  {
    id: "battle-mode",
    title: "⚔️ Choose Your Battle Style",
    description: "A fullscreen modal with 3 mode cards. Classic LexiQuest has a RECOMMENDED badge. Each card has a gradient icon, description, and hover scale effect. All modes track the same reading data. Press X to go back.",
  },
  {
    id: "battle-arena",
    title: "🏟️ Battle Arena",
    description: "The main battle screen. Sir Valor (your knight) stands on the left, the enemy on the right, with a VS indicator between them. Energy beam effects fire when you deal or take damage. Screen shakes on hits, with particle bursts on criticals.",
  },
  {
    id: "battle-commands",
    title: "🎮 Command Menu",
    description: "A blue-bordered RPG panel on the left with 4 commands: Read (attack), Magic (character-specific spells that cost MP), Defend (skip a hard word), and Items (health/magic potions). A yellow ▶ cursor highlights your selection. Shows 'Your Turn' or 'Enemy Turn'.",
  },
  {
    id: "battle-streaks",
    title: "🔥 Streak & Combo System",
    description: "Consecutive correct words build your streak counter. At 3+ it glows blue, 5+ purple, 10+ legendary gold. Streaks multiply damage and trigger fire effects at the bottom of the arena. Your best streak is permanently tracked.",
  },
  {
    id: "mini-game",
    title: "🎯 Mini-Game Interrupts",
    description: "Mid-battle, mini-games interrupt to test specific skills. Word Cannon: read flying words before they escape. Ink Splash: identify phoneme patterns in ink blots. Fireball Barrage: rapid-fire 15-second reading sprint. Bonus damage awarded for performance.",
  },
  {
    id: "battle-victory",
    title: "💥 Post-Battle Analysis",
    description: "After defeating an enemy, AURA shows a detailed breakdown: total damage, accuracy %, best streak, time taken. A word-by-word grid highlights struggled words in yellow. AURA Insights list specific areas for improvement and progress trends.",
  },
  {
    id: "victory",
    title: "🏆 Victory & Rewards",
    description: "The final victory screen shows XP earned (fills a level progress bar), gold collected, total damage dealt, and words read. 1-3 stars are awarded based on accuracy. A rescued book animation plays. XP and gold persist to your profile.",
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
      "battle-mode": "battle-mode",
      "battle-arena": "battle",
      "battle-commands": "battle",
      "battle-streaks": "battle",
      "mini-game": "mini-game",
      "battle-victory": "battle-victory",
      "victory": "victory",
    };
    setView(viewMap[step.id] || "world-map");
  };

  return (
    <DemoTourProvider steps={tourSteps} onStepChange={handleStepChange}>
      <Helmet>
        <title>LexiQuest Demo — NabuLearn</title>
        <meta name="description" content="Interactive LexiQuest RPG demo: explore the world map, battle bosses, and see how reading powers gameplay." />
        <link rel="canonical" href="https://nabulearn.com/game/demo" />
        <meta property="og:title" content="LexiQuest Demo — NabuLearn" />
        <meta property="og:description" content="Interactive LexiQuest RPG demo for NabuLearn." />
        <meta property="og:url" content="https://nabulearn.com/game/demo" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <GameHeader />

        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/game/dashboard")} className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <span className="text-white/40 text-sm">RPG Campaign Demo</span>
          </div>

          <AnimatePresence mode="wait">
            {view === "world-map" && <WorldMapView key="wm" />}
            {view === "level-select" && <LevelSelectView key="ls" />}
            {view === "battle-mode" && <BattleModeView key="bm" />}
            {view === "battle" && <BattleArenaView key="ba" />}
            {view === "mini-game" && <MiniGameView key="mg" />}
            {view === "battle-victory" && <BattleVictoryView key="bv" />}
            {view === "victory" && <VictoryView key="v" />}
          </AnimatePresence>
        </main>
      </div>
    </DemoTourProvider>
  );
};

// ── World Map View (matches RPGWorldMap.tsx) ────────────────
const WorldMapView = () => {
  const worlds = [
    { id: 0, name: "Tutorial", desc: "Learn the basics of reading battles", icon: GraduationCap, gradient: "from-emerald-500 to-green-600", levels: 1, completed: 0, stars: 0, unlocked: true },
    { id: 1, name: "The Enchanted Forest", desc: "Where Grog's goblins first scattered the stolen books", icon: TreePine, gradient: "from-green-500 to-emerald-600", levels: 5, completed: 5, stars: 12, unlocked: true },
    { id: 2, name: "The Frozen Depths", desc: "The icy caverns where the Ice Golem guards stolen books", icon: Mountain, gradient: "from-blue-500 to-indigo-600", levels: 5, completed: 5, stars: 10, unlocked: true },
    { id: 3, name: "The Ancient Ruins", desc: "Where the Stone Guardian protects ancient knowledge", icon: Flame, gradient: "from-orange-500 to-red-600", levels: 5, completed: 3, stars: 7, unlocked: true },
    { id: 4, name: "Grog's Throne Room", desc: "The Goblin King's fortress awaits the bravest readers", icon: Crown, gradient: "from-purple-500 to-violet-700", levels: 5, completed: 0, stars: 0, unlocked: false, boss: true },
    { id: 5, name: "Whispering Caverns", desc: "Echo Wraiths haunt these crystal-filled caves", icon: Gem, gradient: "from-cyan-500 to-teal-600", levels: 5, completed: 0, stars: 0, unlocked: false },
    { id: 6, name: "Floating Isles", desc: "Storm Harpies patrol the skies above", icon: Cloud, gradient: "from-sky-500 to-blue-600", levels: 5, completed: 0, stars: 0, unlocked: false },
    { id: 7, name: "Sunken Library", desc: "The Ink Kraken lurks in the deep", icon: Waves, gradient: "from-indigo-500 to-blue-700", levels: 5, completed: 0, stars: 0, unlocked: false },
    { id: 8, name: "The Void", desc: "The Word Eater devours all language", icon: Eclipse, gradient: "from-violet-600 to-purple-900", levels: 5, completed: 0, stars: 0, unlocked: false },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -80], opacity: [0, 0.6, 0] }}
            transition={{ duration: 4 + Math.random() * 3, delay: Math.random() * 3, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Title - matches actual RPGWorldMap header */}
      <motion.div
        className="text-center mb-8"
        animate={{ textShadow: ['0 0 20px rgba(251,191,36,0.3)', '0 0 40px rgba(251,191,36,0.5)', '0 0 20px rgba(251,191,36,0.3)'] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 mb-2">
          ⚔️ RPG Mode
        </h1>
        <p className="text-purple-300 text-lg">Your reading adventure awaits, hero!</p>
      </motion.div>

      {/* Player HUD Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Award className="w-4 h-4" /> 350 Gold
          </div>
          <div className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Star className="w-4 h-4" /> 1,240 XP
          </div>
          <div className="bg-orange-500/20 border border-orange-500/40 text-orange-300 text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Flame className="w-4 h-4" /> 8 Best Streak
          </div>
        </div>
        <motion.div
          className="bg-amber-900/60 px-4 py-2 rounded-full border border-amber-500/50"
          animate={{ boxShadow: ['0 0 10px rgba(245,158,11,0.3)', '0 0 20px rgba(245,158,11,0.5)', '0 0 10px rgba(245,158,11,0.3)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-amber-200 font-bold text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> 📚 149 Books Rescued
          </span>
        </motion.div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Reading Progress Panel (matches ReadingProgressPanel) */}
        <DemoHighlight stepId="world-progress" tooltip="Live reading stats updated by AURA AI after every battle">
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3 text-sm">
                <BookOpen className="w-4 h-4 text-purple-400" /> My Reading Journey
              </h3>

              <div className="bg-slate-900/60 rounded-lg p-3 mb-3">
                <div className="text-xs text-slate-400 mb-1">Reading Level</div>
                <div className="text-lg font-bold text-yellow-400">Grade 1</div>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 3 ? "bg-green-400" : "bg-slate-700"}`} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { icon: Zap, color: "text-blue-400", val: "24", label: "Words/Min" },
                  { icon: Target, color: "text-green-400", val: "90%", label: "Accuracy" },
                  { icon: Star, color: "text-yellow-400", val: "142", label: "Mastered" },
                  { icon: Award, color: "text-purple-400", val: "282", label: "Stories" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                      <Icon className={`w-3.5 h-3.5 ${s.color} mx-auto mb-1`} />
                      <div className="text-sm font-bold text-white">{s.val}</div>
                      <div className="text-[9px] text-slate-500">{s.label}</div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500 text-center">📚 Every story makes you stronger!</p>
            </div>
          </div>
        </DemoHighlight>

        {/* World Cards Grid (matches RPGWorldMap 2-col grid) */}
        <DemoHighlight stepId="world-map" tooltip="9 worlds in a 2-column grid. Boss silhouettes appear behind each card. Tap to enter.">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {worlds.map((world, index) => {
              const Icon = world.icon;
              const isComplete = world.completed >= world.levels;
              const completionPercent = world.levels > 0 ? (world.completed / world.levels) * 100 : 0;
              const avgStars = world.completed > 0 ? Math.floor(world.stars / world.completed) : 0;

              return (
                <motion.div
                  key={world.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card
                    className={`relative overflow-hidden transition-all duration-300 border-2 ${
                      world.unlocked
                        ? "cursor-pointer hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/30 border-purple-500/50"
                        : "opacity-60 cursor-not-allowed grayscale border-slate-600"
                    }`}
                  >
                    {/* Background gradient */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${world.gradient} opacity-20`}
                      animate={world.unlocked && !isComplete ? { opacity: [0.15, 0.25, 0.15] } : {}}
                      transition={{ duration: 3, repeat: Infinity }}
                    />

                    {/* Completion glow */}
                    {isComplete && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10"
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Lock overlay */}
                    {!world.unlocked && (
                      <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center z-10">
                        <div className="text-center">
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Lock className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                          </motion.div>
                          <p className="text-slate-400 text-xs">Complete stories in previous world</p>
                        </div>
                      </div>
                    )}

                    <CardContent className="p-5 relative z-[5]">
                      {/* Completion badge */}
                      {isComplete && (
                        <motion.div
                          className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          ✓ COMPLETE
                        </motion.div>
                      )}

                      {/* World icon & number */}
                      <div className="flex items-start justify-between mb-3">
                        <motion.div
                          className={`p-2.5 rounded-xl bg-gradient-to-br ${world.gradient} text-white shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Icon className="w-6 h-6" />
                        </motion.div>
                        <div className="text-right">
                          <span className="text-xs text-purple-300">World</span>
                          <div className="text-2xl font-black text-white">{world.id}</div>
                        </div>
                      </div>

                      {/* World name */}
                      <h3 className={`text-lg font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${world.gradient}`}>
                        {world.name}
                      </h3>
                      <p className="text-xs text-slate-300 mb-3">{world.desc}</p>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{world.completed}/{world.levels} Levels</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercent}%` }}
                            transition={{ delay: index * 0.08 + 0.3, duration: 0.5 }}
                            className={`h-full bg-gradient-to-r ${world.gradient}`}
                          />
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= avgStars ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                        ))}
                        <span className="text-yellow-400 font-bold text-xs ml-1">{world.stars}</span>
                      </div>

                      {/* Boss indicator */}
                      {world.boss && (
                        <motion.div
                          className="mt-3 flex items-center gap-2 bg-red-900/50 px-3 py-1.5 rounded-lg border border-red-500/50"
                          animate={{ boxShadow: ['0 0 10px rgba(239,68,68,0.2)', '0 0 20px rgba(239,68,68,0.4)', '0 0 10px rgba(239,68,68,0.2)'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="h-4 w-4 text-red-400" />
                          <span className="text-red-300 font-bold text-xs">FINAL BOSS: Grog the Goblin King!</span>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </DemoHighlight>
      </div>

      {/* Bottom lore */}
      <motion.p
        className="text-purple-400 italic max-w-2xl mx-auto text-center mt-8 text-sm"
        animate={{ textShadow: ['0 0 10px rgba(168,85,247,0.2)', '0 0 20px rgba(168,85,247,0.3)', '0 0 10px rgba(168,85,247,0.2)'] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        "Princess Ella's books are scattered across the worlds. Defeat Grog's minions, rescue the books, and restore magic to the kingdom!"
      </motion.p>
    </motion.div>
  );
};

// ── Level Select View (matches RPGLevelSelect.tsx) ─────────
const LevelSelectView = () => {
  const levels = [
    { id: 1, title: "The Friendly Dog", words: 62, grade: 0, enemies: ["👺"], stars: 2, completed: true, isBoss: false },
    { id: 2, title: "My Pet Fish", words: 60, grade: 0, enemies: ["👺"], stars: 2, completed: true, isBoss: false },
    { id: 3, title: "The Big Red Ball", words: 58, grade: 0, enemies: ["👺", "⚔️"], stars: 2, completed: true, multi: true, isBoss: false },
    { id: 4, title: "The Little Star", words: 55, grade: 0, enemies: ["⚔️", "🛡️"], stars: 1, completed: true, multi: true, isBoss: false },
    { id: 5, title: "The Magic Garden", words: 56, grade: 0, enemies: ["⚔️", "👑"], stars: 0, completed: false, multi: true, isBoss: true },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="min-h-[60vh]"
    >
      <DemoHighlight stepId="level-select" tooltip="Each card is a level. Stars rate performance. Boss levels pulse red.">
        {/* Header - matches RPGLevelSelect */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" /> World Map
          </Button>
        </div>

        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold mb-2">
            World 1
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
            The Enchanted Forest
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            The Enchanted Forest was once full of reading fairies. Now Grog's minions roam the trees, guarding stolen books.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {levels.map((level, index) => (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  level.isBoss
                    ? "border-2 border-red-500/50 shadow-red-500/20"
                    : level.completed
                      ? "border border-slate-700 bg-green-900/20"
                      : "border border-slate-700 bg-slate-800/50"
                }`}
              >
                <CardContent className="p-4 relative">
                  {/* Boss badge */}
                  {level.isBoss && (
                    <motion.div
                      className="absolute top-2 right-2"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" /> BOSS
                      </div>
                    </motion.div>
                  )}

                  {/* Level number + completion */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      level.completed ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"
                    }`}>
                      {level.completed ? <Check className="w-5 h-5" /> : level.id}
                    </div>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < level.stars ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                      ))}
                    </div>
                  </div>

                  <h4 className="font-bold text-white mb-1">{level.title}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> {level.words} words • Grade {level.grade}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Enemies:</span>
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
            </motion.div>
          ))}
        </div>
      </DemoHighlight>
    </motion.div>
  );
};

// ── Battle Mode View (matches RPGBattleModeSelector.tsx) ────
const BattleModeView = () => {
  const modes = [
    {
      id: "classic", name: "Classic LexiQuest Battle",
      desc: "Traditional HP-based combat with mini-games and special attacks",
      icon: Swords, gradient: "from-red-600 to-orange-500", bgGradient: "from-red-900/30 to-orange-900/30", recommended: true,
    },
    {
      id: "tug", name: "Tug of War Challenge",
      desc: "Pull the rope with reading accuracy - every word counts!",
      icon: Anchor, gradient: "from-blue-600 to-cyan-500", bgGradient: "from-blue-900/30 to-cyan-900/30", recommended: false,
    },
    {
      id: "balloon", name: "Balloon Bonanza",
      desc: "Pop enemy balloons with correct words before yours pop!",
      icon: Sparkles, gradient: "from-purple-600 to-pink-500", bgGradient: "from-purple-900/30 to-pink-900/30", recommended: false,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <DemoHighlight stepId="battle-mode" tooltip="Fullscreen modal in actual app. All modes track the same reading progress.">
        {/* Simulated fullscreen overlay */}
        <div className="rounded-2xl bg-black/60 p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Choose Your Battle Style</h2>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 cursor-pointer">
              ✕
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modes.map((mode, index) => {
              const Icon = mode.icon;
              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-white/30 bg-gradient-to-br ${mode.bgGradient} p-6 h-full`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-10`} />

                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4 shadow-lg relative`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${mode.gradient} mb-2 relative`}>
                      {mode.name}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed relative">{mode.desc}</p>

                    {mode.recommended && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                        RECOMMENDED
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-slate-400 mt-6 text-sm">
            All modes use the same story words and track your reading progress
          </p>
        </div>
      </DemoHighlight>
    </motion.div>
  );
};

// ── Battle Arena View (matches BattleArena + RPGCommandMenu + BattleHUD) ──
const BattleArenaView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="battle-arena" tooltip="Sir Valor (left) vs Enemy (right). Energy beams fire on attacks. Screen shakes on hits.">
      <div className="rounded-2xl overflow-hidden border border-white/10">
        {/* Battle HUD - Top bar (matches BattleHUD) */}
        <div className="bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Player HP (left, matching actual layout) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-pink-500" />
                <span className="text-xs font-bold text-white">Your Energy</span>
              </div>
              <div className="w-28 h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: "92%" }} />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">92/100</div>
            </div>
          </div>

          {/* Center info */}
          <div className="text-center">
            <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
              <BookOpen className="w-3 h-3 inline mr-1" /> Enchanted Forest
            </div>
            <div className="text-white/50 text-[10px] mt-0.5">The Friendly Dog</div>
          </div>

          {/* Enemy HP (right, matching actual layout) */}
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs font-bold text-white">Goblin Scout</span>
              <Swords className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="w-28 h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: "67%" }} />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">54/80</div>
          </div>
        </div>

        {/* Battle Scene (matches BattleArena.tsx layout) */}
        <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/80 p-6 relative min-h-[220px]">
          {/* Battle background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,120,120,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
          </div>

          {/* Characters - Player LEFT, Enemy RIGHT (matches actual) */}
          <div className="relative flex items-center justify-between px-8">
            {/* Player (left) - Sir Valor knight */}
            <motion.div className="text-center" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <div className="text-5xl mb-2">🗡️🛡️</div>
              <div className="text-blue-400 text-xs font-bold">Sir Valor</div>
              <div className="text-[10px] text-slate-400">The Brave Knight</div>
            </motion.div>

            {/* VS indicator (matches actual) */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
              <div className="text-2xl font-black text-slate-500/30">VS</div>
            </motion.div>

            {/* Enemy (right) - Goblin Guard */}
            <motion.div className="text-center" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <div className="text-5xl mb-2">👺</div>
              <div className="text-red-400 text-xs font-bold">Goblin Scout</div>
              <div className="text-[10px] text-slate-400">World 1 Enemy</div>
            </motion.div>
          </div>

          {/* Streak fire effect at bottom (matches actual for 5+ streak) */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-t from-orange-500/40 to-transparent"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </div>

        {/* Bottom UI - Command + Word + Stats (matches actual RPG layout) */}
        <div className="bg-slate-950 p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-start">
          {/* Command Menu (matches RPGCommandMenu exactly) */}
          <DemoHighlight stepId="battle-commands" tooltip="Blue-bordered RPG panel. ▶ cursor highlights selection. Read attacks, Magic costs MP.">
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-lg border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-sm overflow-hidden w-36">
              <div className="px-3 py-2 border-b border-blue-400/30 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
                <h3 className="text-xs font-bold text-blue-200 tracking-wider uppercase">Command</h3>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { label: "Read", icon: BookOpen, active: true, color: "from-emerald-500 to-green-600" },
                  { label: "Magic", icon: Sparkles, active: false, color: "from-purple-500 to-indigo-600" },
                  { label: "Defend", icon: Shield, active: false, color: "from-blue-500 to-cyan-600" },
                  { label: "Items", icon: Package, active: false, color: "from-amber-500 to-orange-600" },
                ].map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <div key={cmd.label} className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                      cmd.active ? `bg-gradient-to-r ${cmd.color} text-white` : "text-slate-200"
                    }`}>
                      {cmd.active && (
                        <motion.span className="absolute left-0 text-yellow-400 text-xs" animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>▶</motion.span>
                      )}
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cmd.active ? "bg-white/20" : `bg-gradient-to-br ${cmd.color}/20`}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold tracking-wide">{cmd.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="px-3 py-1.5 border-t border-blue-400/30 text-center text-[10px] font-medium text-emerald-400">
                ✦ Your Turn ✦
              </div>
            </div>
          </DemoHighlight>

          {/* Word Display (center) */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
              {["Sam", "was", "a", "friendly", "dog"].map((w, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    i < 2 ? "bg-green-500/20 text-green-400 line-through" : i === 2 ? "bg-green-500 text-white" : "bg-white/5 text-white/30"
                  }`}
                >
                  {w}
                </span>
              ))}
            </div>

            <div className="bg-slate-900 border-2 border-blue-500/30 rounded-xl px-8 py-5 inline-block relative shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-wider">a</div>
              <motion.div
                className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Mic className="w-2.5 h-2.5" /> Listening...
              </motion.div>
            </div>
            <div className="text-white/30 text-xs mt-2">Word 3 of 62</div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white gap-1.5 text-xs">
                <Volume2 className="w-3.5 h-3.5" /> Hear Word
              </Button>
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white gap-1.5 font-semibold text-xs">
                <Mic className="w-3.5 h-3.5" /> Reading...
              </Button>
            </div>
          </div>

          {/* Streak & Stats Panel (right) */}
          <DemoHighlight stepId="battle-streaks" tooltip="Streak counter glows by tier. Fire effect appears at bottom of arena at 5+ streak.">
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 w-36">
              <div className="text-xs font-bold text-white/80 mb-2">Battle Stats</div>
              
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Accuracy</span>
                    <span className="text-green-400 font-bold">94%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "94%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Progress</span>
                    <span className="text-blue-400 font-bold">3/62</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "5%" }} />
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-black text-xl">x3</span>
                </div>
                <div className="text-[9px] text-orange-300/60">Streak • Best: 8</div>
                <div className="text-[8px] text-white/30 mt-0.5">2 more for x3 damage</div>
              </div>
            </div>
          </DemoHighlight>
        </div>
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Mini-Game View ─────────────────────────────────────────
const MiniGameView = () => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="mini-game" tooltip="Mini-games pop up mid-battle. Bonus damage awarded for performance.">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <motion.div
            className="inline-block bg-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-3"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ⚡ MINI-GAME INTERRUPT!
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-1">Bonus Challenge!</h2>
          <p className="text-slate-400 text-sm">Complete for massive bonus damage</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: "Word Cannon", desc: "Words fly across screen — read each before it escapes! Tests rapid recognition.", icon: Crosshair, gradient: "from-red-900/30 to-orange-900/30", border: "border-red-500/30", bonus: "+40 dmg" },
            { name: "Ink Splash", desc: "Ink blots reveal phoneme patterns. Identify and pronounce to clear them.", icon: CircleDot, gradient: "from-purple-900/30 to-blue-900/30", border: "border-purple-500/30", bonus: "+35 dmg" },
            { name: "Fireball Barrage", desc: "15-second sprint! Read as many words as possible. Each launches a fireball.", icon: Flame, gradient: "from-orange-900/30 to-yellow-900/30", border: "border-orange-500/30", bonus: "+50 dmg" },
          ].map((game) => {
            const Icon = game.icon;
            return (
              <Card key={game.name} className={`bg-gradient-to-b ${game.gradient} ${game.border} border-2 overflow-hidden`}>
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{game.name}</h3>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{game.desc}</p>
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full inline-block border border-green-500/30">
                    {game.bonus}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DemoHighlight>
  </motion.div>
);

// ── Battle Victory / Post-Battle Analysis View ─────────────
const BattleVictoryView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
    <DemoHighlight stepId="battle-victory" tooltip="AURA analyzes every word you read and provides actionable insights">
      <Card className="bg-slate-900/80 border-slate-700 max-w-3xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <motion.div className="text-5xl mb-3" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>💥</motion.div>
            <h2 className="text-2xl font-black text-red-400 mb-1">Enemy Defeated!</h2>
            <p className="text-slate-400 text-sm">Goblin Scout has been vanquished!</p>
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
                <div key={s.label} className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                  <Icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                  <div className={`font-bold text-lg ${s.color}`}>{s.val}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-950 rounded-xl p-4 mb-4 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Word-by-Word Breakdown
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {["Sam", "was", "a", "friendly", "dog", "He", "loved", "to", "run", "and", "play", "in", "the", "park"].map((w, i) => (
                <div
                  key={i}
                  className={`text-[10px] px-1.5 py-1 rounded text-center font-medium ${
                    i === 3 || i === 6 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-green-500/10 text-green-400"
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500/40" /> Correct</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-500/40" /> Struggled</span>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> AURA Insights
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li>• Words "friendly" and "loved" flagged for extra practice</li>
              <li>• Pronunciation latency improved 12% from last session</li>
              <li>• Reading pace: 24 WPM (up from 18 WPM last week)</li>
              <li>• Strong performance on consonant blends</li>
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
    <DemoHighlight stepId="victory" tooltip="XP fills your level bar, Gold persists to spend later, Stars rate performance">
      <Card className="bg-gradient-to-b from-yellow-500/10 via-slate-900/80 to-slate-900 border-yellow-500/20 max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-black text-yellow-400 mb-2">Victory!</h2>
          <p className="text-slate-400 mb-6">You defeated Goblin Scout and rescued a book!</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-8">
            {[
              { icon: Star, color: "text-yellow-400", val: "+150", label: "XP Earned" },
              { icon: Award, color: "text-amber-400", val: "+50", label: "Gold" },
              { icon: Swords, color: "text-green-400", val: "160", label: "Damage" },
              { icon: BookOpen, color: "text-blue-400", val: "62", label: "Words Read" },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                  <Icon className={`w-6 h-6 ${r.color} mx-auto mb-1`} />
                  <div className={`font-bold ${r.color} text-lg`}>{r.val}</div>
                  <div className="text-[10px] text-slate-500">{r.label}</div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.2, type: "spring" }}>
                <Star className={`w-10 h-10 ${i <= 2 ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-slate-400 mb-4">2 out of 3 stars earned</p>

          <div className="bg-slate-950 rounded-xl p-4 max-w-sm mx-auto border border-slate-800 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Level Progress</span>
              <span className="text-yellow-400 font-bold">Level 4 → 5</span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full"
                initial={{ width: "50%" }}
                animate={{ width: "75%" }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">320 / 500 XP to next level</div>
          </div>

          <div className="text-slate-500 text-xs">
            📚 Book rescued! The kingdom's library grows stronger.
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </motion.div>
);

export default GameRPGDemo;
