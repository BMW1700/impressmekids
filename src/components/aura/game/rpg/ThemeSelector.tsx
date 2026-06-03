import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Crosshair, Sparkles, GraduationCap } from 'lucide-react';
import type { GameTheme } from '@/lib/gameTheme';

interface ThemeSelectorProps {
  onSelect: (theme: GameTheme) => void;
}

export const ThemeSelector = ({ onSelect }: ThemeSelectorProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 drop-shadow-lg mb-2">
          🎮 CHOOSE YOUR MODE 🎮
        </h1>
        <p className="text-white/70 text-lg">Select a campaign that fits your reading level</p>
      </motion.div>

      <div className="flex flex-wrap gap-8 items-stretch justify-center max-w-4xl">
        {/* Classic Adventure */}
        <motion.div
          className="flex flex-col items-center w-80"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
        >
          <div
            className="bg-gradient-to-b from-emerald-900/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('classic')}
          >
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-white">Classic Adventure</h3>
              <div className="flex items-center justify-center gap-1 text-emerald-300 mt-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Fantasy RPG Campaign</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Grades K-8</span>
            </div>

            <p className="text-sm text-slate-400 text-center mb-2">
              Join Sir Valor, Elara, and Princess Ella on a quest to rescue stolen books from the Goblin King! Battle goblins, dragons, and more across 8 magical worlds.
            </p>

            <div className="flex flex-wrap gap-1 justify-center mt-3">
              {['⚔️ Knights', '🐉 Dragons', '🏰 Castles', '✨ Magic'].map(tag => (
                <span key={tag} className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          <Button
            onClick={() => onSelect('classic')}
            className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 w-full"
          >
            Play Classic
          </Button>
        </motion.div>

        {/* Agent Mode */}
        <motion.div
          className="flex flex-col items-center w-80"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
        >
          <div
            className="bg-gradient-to-b from-slate-800/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyan-500/50 hover:border-cyan-400 transition-all cursor-pointer w-full relative overflow-hidden"
            onClick={() => onSelect('agent')}
          >
            {/* Neon scan line effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent"
              animate={{ y: [-200, 400] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center">
                  <Crosshair className="h-12 w-12 text-white" />
                </div>
              </div>

              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white">Agent Mode</h3>
                <div className="flex items-center justify-center gap-1 text-cyan-300 mt-1">
                  <Crosshair className="h-4 w-4" />
                  <span className="text-sm">Spy Thriller Campaign</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                <span className="text-cyan-300 font-medium">Grades 9-12</span>
              </div>

              <p className="text-sm text-slate-400 text-center mb-2">
                Become Agent X, Cipher, or Shadow. Infiltrate the Syndicate, hack their networks, and take down The Director in this espionage thriller with advanced reading content.
              </p>

              <div className="flex flex-wrap gap-1 justify-center mt-3">
                {['🕵️ Spies', '💻 Hacking', '🔫 Action', '🌃 Noir'].map(tag => (
                  <span key={tag} className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={() => onSelect('agent')}
            className="mt-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 w-full"
          >
            Play Agent Mode
          </Button>
        </motion.div>

        {/* Pre-K */}
        <motion.div
          className="flex flex-col items-center w-80"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
        >
          <div
            className="bg-gradient-to-b from-pink-900/60 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-pink-500/50 hover:border-pink-400 transition-all cursor-pointer w-full"
            onClick={() => onSelect('prek')}
          >
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-white">Pre-K</h3>
              <div className="flex items-center justify-center gap-1 text-pink-300 mt-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">First Words & Friends</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="h-4 w-4 text-pink-400" />
              <span className="text-pink-300 font-medium">Ages 3–5</span>
            </div>
            <p className="text-sm text-slate-400 text-center mb-2">
              Big friendly words with Benny, Maddy, and Nabu Village. Made for our youngest readers.
            </p>
            <div className="flex flex-wrap gap-1 justify-center mt-3">
              {['✨ Benny', '💙 Maddy', '🏡 Nabu', '🔤 Big Words'].map(tag => (
                <span key={tag} className="text-xs bg-pink-900/50 text-pink-300 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
          <Button
            onClick={() => onSelect('prek')}
            className="mt-3 bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 w-full"
          >
            Play Pre-K
          </Button>
        </motion.div>
      </div>


      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-white/40 text-sm"
      >
        You can switch modes anytime from the world map.
      </motion.p>
    </motion.div>
  );
};
