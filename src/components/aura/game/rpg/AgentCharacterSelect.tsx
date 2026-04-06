import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AgentX } from '../characters/AgentX';
import { Cipher } from '../characters/Cipher';
import { Shadow } from '../characters/Shadow';
import { Crosshair, Cpu, Eye, Heart, Zap, Shield } from 'lucide-react';
import type { PlayableCharacter } from './RPGCharacterSelect';

interface AgentCharacterSelectProps {
  onSelect: (character: PlayableCharacter) => void;
}

export const AgentCharacterSelect = ({ onSelect }: AgentCharacterSelectProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-blue-950/50 to-slate-950 flex flex-col items-center justify-center p-4 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-200 drop-shadow-lg mb-2">
          🕵️ SELECT YOUR AGENT 🕵️
        </h1>
        <p className="text-white/80 text-lg">Choose your operative for the mission</p>
      </motion.div>

      <div className="flex flex-wrap gap-6 items-stretch justify-center max-w-5xl">
        {/* Agent X - Balanced */}
        <motion.div
          className="flex flex-col items-center w-64"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
        >
          <div
            className="bg-gradient-to-b from-slate-800/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-slate-500/50 hover:border-slate-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('agent_x')}
          >
            <div className="flex justify-center mb-3">
              <AgentX state="idle" healthPercent={100} size="medium" showHealthBar={false} />
            </div>

            <div className="text-center mb-3">
              <h3 className="text-xl font-bold text-white">Agent X</h3>
              <div className="flex items-center justify-center gap-1 text-slate-300">
                <Crosshair className="h-4 w-4" />
                <span className="text-sm">Field Operative</span>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" /> HP
                </span>
                <span className="text-green-400 font-bold">100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-orange-400" /> Attack
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
              Versatile field agent. Strong defense, reliable in any situation.
            </p>
          </div>

          <Button
            onClick={() => onSelect('agent_x')}
            className="mt-3 bg-slate-600 hover:bg-slate-500 text-white font-bold px-8 w-full"
          >
            Choose Agent X
          </Button>
        </motion.div>

        {/* Cipher - Glass Cannon */}
        <motion.div
          className="flex flex-col items-center w-64"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
        >
          <div
            className="bg-gradient-to-b from-cyan-900/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-cyan-500/50 hover:border-cyan-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('cipher')}
          >
            <div className="flex justify-center mb-3">
              <Cipher state="idle" healthPercent={100} size="medium" showHealthBar={false} />
            </div>

            <div className="text-center mb-3">
              <h3 className="text-xl font-bold text-white">Cipher</h3>
              <div className="flex items-center justify-center gap-1 text-cyan-300">
                <Cpu className="h-4 w-4" />
                <span className="text-sm">Elite Hacker</span>
              </div>
            </div>

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
              <span className="text-cyan-400 font-bold">FAST MODE:</span> Read 5 words quickly for 3x damage DDoS Overload!
            </p>
          </div>

          <Button
            onClick={() => onSelect('cipher')}
            className="mt-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 w-full"
          >
            Choose Cipher
          </Button>
        </motion.div>

        {/* Shadow - Balanced Stealth */}
        <motion.div
          className="flex flex-col items-center w-64"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
        >
          <div
            className="bg-gradient-to-b from-purple-900/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-500/50 hover:border-purple-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('shadow')}
          >
            <div className="flex justify-center mb-3">
              <Shadow state="idle" healthPercent={100} size="medium" showHealthBar={false} />
            </div>

            <div className="text-center mb-3">
              <h3 className="text-xl font-bold text-white">Shadow</h3>
              <div className="flex items-center justify-center gap-1 text-purple-300">
                <Eye className="h-4 w-4" />
                <span className="text-sm">Stealth Specialist</span>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" /> HP
                </span>
                <span className="text-green-400 font-bold">100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-purple-400" /> Attack
                </span>
                <span className="text-purple-400 font-bold">Medium</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-400" /> Defense
                </span>
                <span className="text-green-400 font-bold">Medium</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center mb-3">
              <span className="text-purple-400 font-bold">Stealth Ops:</span> Silent takedowns & smoke screens!
            </p>
          </div>

          <Button
            onClick={() => onSelect('shadow')}
            className="mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 w-full"
          >
            Choose Shadow
          </Button>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 text-white/50 text-sm"
      >
        Each agent has unique abilities. Choose your operative wisely.
      </motion.p>
    </motion.div>
  );
};
