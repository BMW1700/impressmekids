import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NabuOwl } from "./NabuOwl";
import { speak, cancelSpeech } from "@/lib/tts";
import type { NabuEpisodeIntro } from "@/lib/nabuStoryCopy";

interface Props {
  intro: NabuEpisodeIntro;
  onStart: () => void;
}

export const NabuEpisodeIntroOverlay = ({ intro, onStart }: Props) => {
  useEffect(() => {
    speak(intro.line);
    return () => cancelSpeech();
  }, [intro.line]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-pink-100/95 via-rose-100/95 to-orange-100/95 backdrop-blur-sm p-6"
      role="dialog"
      aria-label="Nabu's mission"
    >
      <div className="flex flex-col items-center text-center max-w-xl gap-6">
        <motion.div
          initial={{ scale: 0.85, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <NabuOwl size={160} mood="curious" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative rounded-3xl bg-white px-6 py-5 shadow-lg border-2 border-rose-200"
        >
          {/* speech bubble tail */}
          <div className="absolute -top-3 left-12 h-6 w-6 rotate-45 bg-white border-l-2 border-t-2 border-rose-200" />
          <p className="text-xl sm:text-2xl font-semibold text-rose-900 leading-snug">
            {intro.line}
          </p>
        </motion.div>

        <Button
          size="lg"
          onClick={onStart}
          className="px-10 py-7 text-xl font-bold rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg"
        >
          {intro.cta} →
        </Button>
      </div>
    </motion.div>
  );
};
