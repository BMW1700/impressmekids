import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NabuOwl } from "./NabuOwl";
import { speak, cancelSpeech } from "@/lib/tts";
import type { NabuEpisodeOutro } from "@/lib/nabuStoryCopy";

interface Props {
  outro: NabuEpisodeOutro;
  onContinue: () => void;
}

export const NabuEpisodeOutroOverlay = ({ outro, onContinue }: Props) => {
  useEffect(() => {
    speak(outro.line);
    return () => cancelSpeech();
  }, [outro.line]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-amber-100/95 via-rose-100/95 to-pink-100/95 backdrop-blur-sm p-6"
      role="dialog"
      aria-label="Episode complete"
    >
      <div className="flex flex-col items-center text-center max-w-xl gap-6">
        <motion.div
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="rounded-full bg-white px-6 py-2 shadow-md border-2 border-amber-300"
        >
          <span className="text-sm sm:text-base font-bold uppercase tracking-wide text-amber-700">
            ⭐ {outro.title} ⭐
          </span>
        </motion.div>

        <motion.div
          initial={{ scale: 0.85, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        >
          <NabuOwl size={160} mood="cheer" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative rounded-3xl bg-white px-6 py-5 shadow-lg border-2 border-amber-200"
        >
          <div className="absolute -top-3 left-12 h-6 w-6 rotate-45 bg-white border-l-2 border-t-2 border-amber-200" />
          <p className="text-xl sm:text-2xl font-semibold text-amber-900 leading-snug">
            {outro.line}
          </p>
        </motion.div>

        <Button
          size="lg"
          onClick={onContinue}
          className="px-10 py-7 text-xl font-bold rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
        >
          Yay! Continue →
        </Button>
      </div>
    </motion.div>
  );
};
