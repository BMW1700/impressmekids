import { useRef } from "react";
import * as htmlToImage from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, Share2, RotateCcw, Home, Star } from "lucide-react";
import { motion } from "framer-motion";

export interface RunSummary {
  waveReached: number;
  wordsRead: number;
  accuracy: number;
  knightsSummoned: number;
  coinsEarned: number;
  longestStreak: number;
  endedReason: "win" | "loss" | "quit";
  characterName: string;
}

interface Props {
  summary: RunSummary;
  stars?: number;
  showStars?: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const WaveSurvivedCard = ({ summary, stars = 0, showStars = false, onPlayAgain, onExit }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadPng = async () => {
    if (!cardRef.current) return;
    try {
      const url = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#0f172a" });
      const link = document.createElement("a");
      link.download = `castle-swarm-wave-${summary.waveReached}.png`;
      link.href = url;
      link.click();
    } catch (e) {
      console.error("[WaveSurvivedCard] PNG export failed", e);
    }
  };

  const share = async () => {
    const text = `I survived Wave ${summary.waveReached} in Castle Swarm Defense on YubiLearn — ${summary.wordsRead} words read at ${summary.accuracy}% accuracy! 🏰⚔️`;
    try {
      if (!cardRef.current) throw new Error("no card");
      const blob = await htmlToImage.toBlob(cardRef.current, { pixelRatio: 2, backgroundColor: "#0f172a" });
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], "card.png", { type: "image/png" })] })) {
        await navigator.share({
          title: "Castle Swarm Defense",
          text,
          url: "https://yubilearn.com/game/castle-swarm",
          files: [new File([blob], `castle-swarm-wave-${summary.waveReached}.png`, { type: "image/png" })],
        });
        return;
      }
    } catch { /* fall through */ }
    if (navigator.share) {
      try { await navigator.share({ title: "Castle Swarm Defense", text, url: "https://yubilearn.com/game/castle-swarm" }); return; }
      catch { /* dismissed */ }
    }
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  const title = summary.endedReason === "win" ? "Victory!" : summary.endedReason === "quit" ? "Run Ended" : "Castle Fallen";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm space-y-4">
        <div ref={cardRef}
          className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
          <div className="text-center mb-3">
            <div className="text-5xl mb-2">{summary.endedReason === "win" ? "🏆" : "🏰"}</div>
            <h2 className="text-2xl font-black text-amber-300">{title}</h2>
            <p className="text-sm text-slate-400">{summary.characterName} · Castle Swarm Defense</p>
          </div>

          {showStars && (
            <div className="flex items-center justify-center gap-1 mb-3">
              {[1, 2, 3].map(i => (
                <Star key={i} className={`w-7 h-7 ${i <= stars ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
              ))}
            </div>
          )}

          <div className="text-center mb-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Wave Reached</div>
            <div className="text-6xl font-black text-white">{summary.waveReached}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Words Read" value={summary.wordsRead.toLocaleString()} />
            <Stat label="Accuracy" value={`${summary.accuracy}%`} />
            <Stat label="Knights" value={summary.knightsSummoned.toString()} />
            <Stat label="Best Streak" value={summary.longestStreak.toString()} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">Coins earned</span>
            <span className="font-bold text-amber-300">+{summary.coinsEarned} 🪙</span>
          </div>

          <p className="mt-3 text-center text-[10px] text-slate-500">yubilearn.com · AI-Powered Literacy</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={downloadPng} variant="outline" className="bg-slate-800/80 border-slate-600 text-white">
            <Download className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button onClick={share} variant="outline" className="bg-slate-800/80 border-slate-600 text-white">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onExit} variant="ghost" className="text-slate-300">
            <Home className="w-4 h-4 mr-2" /> Exit
          </Button>
          <Button onClick={onPlayAgain} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
            <RotateCcw className="w-4 h-4 mr-2" /> Play Again
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-2 text-center">
    <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    <div className="text-lg font-bold text-white">{value}</div>
  </div>
);
