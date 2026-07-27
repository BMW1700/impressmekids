import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SirValor } from '../characters/SirValor';
import { Elara } from '../characters/Elara';
import { PrincessElla } from '../characters/PrincessElla';
import { Shield, Sparkles, Flower2, Heart, Zap, Sword, Backpack, Trophy, HelpCircle } from 'lucide-react';
import { AgentCharacterSelect } from './AgentCharacterSelect';
import { getStoredTheme } from '@/lib/gameTheme';
import { RPGGearLocker } from './v2/RPGGearLocker';
import { RPGDailyHubPanel } from './v2/RPGDailyHubPanel';
import { RPGCoachMarks, hasSeenRPGCoachMarks } from './v2/RPGCoachMarks';
import { awardQuestProgress } from '@/hooks/useDailyQuests';
// FOCUS PASS: hub systems arrive one at a time instead of all at once, so a
// first-time player sees heroes and combat — not a dashboard.
import { useRPGUnlocks, markPlayedToday } from '@/lib/rpg/rpgUnlocks';



export type PlayableCharacter = 'valor' | 'elara' | 'ella' | 'agent_x' | 'cipher' | 'shadow';

interface RPGCharacterSelectProps {
  onSelect: (character: PlayableCharacter) => void;
}

export const RPGCharacterSelect = ({ onSelect }: RPGCharacterSelectProps) => {
  const theme = getStoredTheme();
  const [gearOpen, setGearOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const { unlocked, justUnlocked, markUnlockSeen } = useRPGUnlocks();

  // Day counter for the day-2 Daily Hub gate.
  useEffect(() => {
    markPlayedToday();
  }, []);



  // First-time players get the tour once; it can be replayed from the "?" button.
  useEffect(() => {
    if (hasSeenRPGCoachMarks()) return;
    const t = setTimeout(() => setCoachOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  // `play_streak` daily quest: credit once per calendar day when the student
  // enters the Adventure. The local guard just avoids redundant round-trips —
  // the server clamps quest progress to the target, so a stale guard is harmless.
  useEffect(() => {
    const today = new Date().toDateString();
    const KEY = 'rpg_play_streak_awarded_on';
    if (localStorage.getItem(KEY) === today) return;
    localStorage.setItem(KEY, today);
    void awardQuestProgress('play_streak');
  }, []);


  // Delegate to agent character select if in agent mode
  if (theme === 'agent') {
    return <AgentCharacterSelect onSelect={onSelect} />;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-purple-900/50 to-slate-900 flex flex-col items-center justify-center p-4 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setCoachOpen(true)}
          aria-label="How the Adventure works"
          className="flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 h-9 w-9 backdrop-blur transition"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          data-coach="daily-hub"
          onClick={() => setHubOpen(true)}
          className="flex items-center gap-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-200 px-4 py-2 text-sm font-bold backdrop-blur transition"
        >
          <Trophy className="h-4 w-4" /> Daily & Season
        </button>
        <button
          data-coach="gear-locker"
          onClick={() => setGearOpen(true)}
          className="flex items-center gap-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 px-4 py-2 text-sm font-bold backdrop-blur transition"
        >
          <Backpack className="h-4 w-4" /> Gear Locker
        </button>
      </div>


      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 drop-shadow-lg mb-2">
          ⚔️ CHOOSE YOUR HERO ⚔️
        </h1>
        <p className="text-white/80 text-lg">Select a champion to battle the forces of evil!</p>
      </motion.div>

      <div className="flex flex-wrap gap-6 items-stretch justify-center max-w-5xl">
        {/* Sir Valor - Tank */}
        <motion.div
          className="flex flex-col items-center w-64"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
        >
          <div 
            className="bg-gradient-to-b from-blue-900/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-blue-500/50 hover:border-blue-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('valor')}
          >
            <div className="flex justify-center mb-3">
              <SirValor state="idle" healthPercent={100} size="medium" showHealthBar={false} />
            </div>
            
            <div className="text-center mb-3">
              <h3 className="text-xl font-bold text-white">Sir Valor</h3>
              <div className="flex items-center justify-center gap-1 text-blue-300">
                <Shield className="h-4 w-4" />
                <span className="text-sm">The Brave Knight</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" /> HP
                </span>
                <span className="text-green-400 font-bold">100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sword className="h-3 w-3 text-orange-400" /> Attack
                </span>
                <span className="text-orange-400 font-bold">Medium</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-400" /> Defense
                </span>
                <span className="text-blue-400 font-bold">High</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center mb-3">
              Balanced fighter with strong defense. Great for beginners!
            </p>
          </div>
          
          <Button
            onClick={() => onSelect('valor')}
            className="mt-3 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 w-full"
          >
            Choose Valor
          </Button>
        </motion.div>

        {/* Elara - Glass Cannon */}
        <motion.div
          className="flex flex-col items-center w-64"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
        >
          <div 
            className="bg-gradient-to-b from-purple-900/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-500/50 hover:border-purple-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('elara')}
          >
            <div className="flex justify-center mb-3">
              <Elara state="idle" healthPercent={100} size="medium" showHealthBar={false} />
            </div>
            
            <div className="text-center mb-3">
              <h3 className="text-xl font-bold text-white">Elara</h3>
              <div className="flex items-center justify-center gap-1 text-purple-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">The Wise Wizard</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" /> HP
                </span>
                <span className="text-yellow-400 font-bold">60</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-cyan-400" /> Attack
                </span>
                <span className="text-red-400 font-bold">Very High</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-400" /> Defense
                </span>
                <span className="text-slate-400 font-bold">Low</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center mb-3">
              <span className="text-cyan-400 font-bold">FAST MODE:</span> Read 5 words quickly for 3x damage plasma beam!
            </p>
          </div>
          
          <Button
            onClick={() => onSelect('elara')}
            className="mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 w-full"
          >
            Choose Elara
          </Button>
        </motion.div>

        {/* Princess Ella - Balanced with Flower Powers */}
        <motion.div
          className="flex flex-col items-center w-64"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
        >
          <div 
            className="bg-gradient-to-b from-pink-900/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-pink-500/50 hover:border-pink-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('ella')}
          >
            <div className="flex justify-center mb-3">
              <PrincessElla state="idle" healthPercent={100} size="medium" showHealthBar={false} />
            </div>
            
            <div className="text-center mb-3">
              <h3 className="text-xl font-bold text-white">Princess Ella</h3>
              <div className="flex items-center justify-center gap-1 text-pink-300">
                <Flower2 className="h-4 w-4" />
                <span className="text-sm">The Flower Princess</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" /> HP
                </span>
                <span className="text-green-400 font-bold">100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flower2 className="h-3 w-3 text-pink-400" /> Attack
                </span>
                <span className="text-pink-400 font-bold">Medium</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-400" /> Defense
                </span>
                <span className="text-green-400 font-bold">Medium</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center mb-3">
              <span className="text-pink-400 font-bold">Flower Powers:</span> Thorn strikes & petal shields!
            </p>
          </div>
          
          <Button
            onClick={() => onSelect('ella')}
            className="mt-3 bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 w-full"
          >
            Choose Ella
          </Button>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 text-white/50 text-sm"
      >
        Each hero has unique abilities. Choose wisely!
      </motion.p>

      <RPGGearLocker open={gearOpen} onClose={() => setGearOpen(false)} />
      <RPGDailyHubPanel open={hubOpen} onClose={() => setHubOpen(false)} />
      <RPGCoachMarks open={coachOpen} onClose={() => setCoachOpen(false)} />

    </motion.div>
  );
};
