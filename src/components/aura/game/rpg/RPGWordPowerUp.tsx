import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen } from "lucide-react";

interface PowerWordDisplay {
  id: number;
  word: string;
  definition: string | null;
}

interface RPGWordPowerUpProps {
  powerWord: PowerWordDisplay | null;
}

export const RPGWordPowerUp = ({ powerWord }: RPGWordPowerUpProps) => {
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
          <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 border-2 border-purple-400 
            rounded-xl px-5 py-3 shadow-[0_0_30px_rgba(147,51,234,0.5)] backdrop-blur-sm max-w-xs">
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-purple-500/20"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            
            <div className="relative flex items-start gap-3">
              <motion.div
                className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
              </motion.div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Power Word</span>
                  <span className="text-[10px] text-amber-400">+2 🪙</span>
                </div>
                <p className="text-white font-bold text-sm truncate">{powerWord.word}</p>
                {powerWord.definition ? (
                  <p className="text-purple-200 text-xs mt-0.5 line-clamp-2">{powerWord.definition}</p>
                ) : (
                  <p className="text-purple-300/70 text-xs mt-0.5 italic">New word collected!</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
