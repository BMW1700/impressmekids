import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crosshair } from "lucide-react";
import { getStoredTheme } from "@/lib/gameTheme";

interface PowerWordDisplay {
  id: number;
  word: string;
  definition: string | null;
}

interface RPGWordPowerUpProps {
  powerWord: PowerWordDisplay | null;
}

export const RPGWordPowerUp = ({ powerWord }: RPGWordPowerUpProps) => {
  const theme = getStoredTheme();
  const isAgent = theme === 'agent';

  return (
    <AnimatePresence>
      {powerWord && (
        <motion.div
          key={powerWord.id}
          className="absolute top-[15%] left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className={`${
            isAgent 
              ? 'bg-gradient-to-br from-slate-900/95 to-cyan-900/95 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
              : 'bg-gradient-to-br from-purple-900/95 to-indigo-900/95 border-2 border-purple-400 shadow-[0_0_30px_rgba(147,51,234,0.5)]'
          } rounded-xl px-5 py-3 backdrop-blur-sm max-w-xs`}>
            {/* Glow effect */}
            <motion.div
              className={`absolute inset-0 rounded-xl ${isAgent ? 'bg-cyan-500/20' : 'bg-purple-500/20'}`}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            
            <div className="relative flex items-start gap-3">
              <motion.div
                className={`shrink-0 w-8 h-8 rounded-lg ${isAgent ? 'bg-cyan-500/30' : 'bg-purple-500/30'} flex items-center justify-center`}
                animate={{ rotate: isAgent ? [0, 0, 0] : [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {isAgent 
                  ? <Crosshair className="w-4 h-4 text-cyan-300" />
                  : <Sparkles className="w-4 h-4 text-purple-300" />
                }
              </motion.div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isAgent ? 'text-cyan-400' : 'text-purple-400'}`}>
                    {isAgent ? 'Intel Keyword' : 'Power Word'}
                  </span>
                  <span className={`text-[10px] ${isAgent ? 'text-cyan-300' : 'text-amber-400'}`}>+2 🪙</span>
                </div>
                <p className="text-white font-bold text-sm truncate">{powerWord.word}</p>
                {powerWord.definition ? (
                  <p className={`text-xs mt-0.5 line-clamp-2 ${isAgent ? 'text-cyan-200' : 'text-purple-200'}`}>{powerWord.definition}</p>
                ) : (
                  <p className={`text-xs mt-0.5 italic ${isAgent ? 'text-cyan-300/70' : 'text-purple-300/70'}`}>
                    {isAgent ? 'New keyword decoded!' : 'New word collected!'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
