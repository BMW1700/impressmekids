import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import videoAsset from "@/assets/yubi-hero-v2.mp4.asset.json";
import posterAsset from "@/assets/yubi-hero-v2-poster.jpg.asset.json";

/**
 * Cinematic video stage for Benny.
 * - Autoplay-muted-loop on every load (desktop + mobile)
 * - Respects the `paused` prop for explicit pause
 * - Always letterboxed inside a 16:9 frame with a gold radial glow
 */
export const BennyVideoHero = ({ paused = false }: { paused?: boolean } = {}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) {
      v.pause();
    } else {
      v.play().catch(() => undefined);
    }
  }, [paused]);

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Gold radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, hsl(48 100% 55% / 0.28), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_120px_-30px_hsl(48_100%_55%/0.4)]"
      >
        <video
          ref={videoRef}
          src={videoAsset.url}
          poster={posterAsset.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
        />

        {/* Cinema letterboxing (subtle inner bars) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-black/80" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-black/80" />
      </motion.div>
    </div>
  );
};
