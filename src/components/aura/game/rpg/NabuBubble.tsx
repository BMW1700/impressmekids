import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { speak } from "@/lib/tts";

interface Props {
  /** Changes whenever a new cheer should appear. Pass a counter or nonce. */
  nonce: number;
  /** Optional text override; otherwise a random short cheer is chosen. */
  text?: string;
}

const CHEERS = ["Yes!", "Great!", "Nice!", "Yay!", "One more!", "Wow!", "Keep going!"];

export const YubiBubble = ({ nonce, text }: Props) => {
  const message =
    text ?? CHEERS[Math.abs(nonce) % CHEERS.length];

  useEffect(() => {
    if (nonce > 0) speak(message, { rate: 1.05, pitch: 1.25 });
  }, [nonce, message]);

  return (
    <AnimatePresence>
      {nonce > 0 && (
        <motion.div
          key={nonce}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-2xl bg-white/95 px-4 py-2 shadow-md border-2 border-rose-200"
        >
          <span className="text-base sm:text-lg font-bold text-rose-700">
            🦉 {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
