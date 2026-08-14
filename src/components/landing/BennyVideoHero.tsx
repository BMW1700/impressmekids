import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import videoAsset from "@/assets/yubi-hero-v2.mp4.asset.json";
import posterAsset from "@/assets/yubi-hero-v2-poster.jpg.asset.json";

/**
 * Cinematic video stage for Benny.
 * - Desktop: autoplay-muted-loop with poster fallback
 * - Mobile / reduced motion: poster + tap-to-play
 * - Always letterboxed inside a 16:9 frame with a gold radial glow
 */
export const BennyVideoHero = ({ paused = false }: { paused?: boolean } = {}) => {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const shouldAutoplay = !reduce && !isMobile;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !shouldAutoplay) return;
    if (paused) {
      v.pause();
    } else {
      v.play().catch(() => undefined);
    }
  }, [paused, shouldAutoplay]);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => undefined);
    setPlaying(true);
  };

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
        {shouldAutoplay ? (
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
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoAsset.url}
              poster={posterAsset.url}
              muted
              loop
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              className="h-full w-full object-contain"
            />
            {!playing && (
              <button
                type="button"
                onClick={handlePlay}
                aria-label="Play Benny's intro"
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-[hsl(270_45%_8%)] shadow-2xl transition hover:scale-105">
                  <Play className="ml-1 h-8 w-8 fill-current" />
                </span>
              </button>
            )}
          </>
        )}


        {/* Cinema letterboxing (subtle inner bars) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-black/80" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-black/80" />
      </motion.div>
    </div>
  );
};
