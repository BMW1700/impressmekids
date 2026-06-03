import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { speak, cancelSpeech } from "@/lib/tts";
import type { NabuEpisodeIntro } from "@/lib/nabuStoryCopy";
import { NabuProblemScene } from "./NabuProblemScene";

interface Props {
  intro: NabuEpisodeIntro;
  worldId: number;
  onStart: () => void;
}

export const NabuEpisodeIntroOverlay = ({ intro, worldId, onStart }: Props) => {
  // 3-4 year olds can't read — narrate the problem out loud (if TTS is on)
  // while the animation visually communicates it.
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
      aria-label={intro.line}
    >
      <div className="flex flex-col items-center text-center gap-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <NabuProblemScene worldId={worldId} size={300} />
        </motion.div>

        <Button
          size="lg"
          onClick={onStart}
          className="px-12 py-8 text-2xl font-extrabold rounded-3xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl"
          aria-label={intro.cta}
        >
          {intro.cta} →
        </Button>
      </div>
    </motion.div>
  );
};
