import { motion } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";

interface Props {
  wave: number;
  coins: number;
  show: boolean;
}

export const WaveInterstitial = ({ wave, coins, show }: Props) => {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 pointer-events-none"
    >
      <div className="bg-slate-900/95 border-2 border-amber-400/50 rounded-2xl px-8 py-6 text-center shadow-2xl">
        <div className="text-amber-300 text-sm uppercase tracking-wide">Wave {wave} cleared</div>
        <div className="flex items-center justify-center gap-2 mt-2 text-3xl font-black text-white">
          <Coins className="w-7 h-7 text-amber-400" /> +{coins}
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" /> Next wave starting…
        </div>
      </div>
    </motion.div>
  );
};
