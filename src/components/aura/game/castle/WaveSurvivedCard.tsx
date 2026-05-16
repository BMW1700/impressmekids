import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, RotateCcw, Home } from "lucide-react";
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
  onPlayAgain: () => void;
  onExit: () => void;
}

/**
 * Shareable end-of-run card. Renders as a styled DOM card that can be
 * rasterised to PNG via the browser's canvas (html2canvas-free approach
 * using SVG foreignObject) so kids/parents can screenshot or download.
 *
 * Built-in to Phase 1 because it's the distribution lever.
 */
export const WaveSurvivedCard = ({ summary, onPlayAgain, onExit }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadPng = async () => {
    const node = cardRef.current;
    if (!node) return;
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    const xml = new XMLSerializer().serializeToString(node);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${xml}</div>
        </foreignObject>
      </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("image load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `castle-swarm-wave-${summary.waveReached}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // foreignObject can be blocked by CSP / tainting; fall back to a printable view
      window.print();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const share = async () => {
    const text = `I survived Wave ${summary.waveReached} in Castle Swarm Defense on NabuLearn — ${summary.wordsRead} words read at ${summary.accuracy}% accuracy! 🏰⚔️`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Castle Swarm Defense", text, url: "https://nabulearn.com/game/castle-swarm" });
        return;
      } catch {
        /* user dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }
  };

  const title =
    summary.endedReason === "win" ? "Victory!" :
    summary.endedReason === "quit" ? "Run Ended" :
    "Castle Fallen";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm space-y-4">
        <div
          ref={cardRef}
          className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl"
        >
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">{summary.endedReason === "win" ? "🏆" : "🏰"}</div>
            <h2 className="text-2xl font-black text-amber-300">{title}</h2>
            <p className="text-sm text-slate-400">{summary.characterName} · Castle Swarm Defense</p>
          </div>

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

          <p className="mt-3 text-center text-[10px] text-slate-500">nabulearn.com · AI-Powered Literacy</p>
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
