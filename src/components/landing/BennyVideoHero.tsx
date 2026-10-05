import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import autoplayAsset from "@/assets/yubi-hero-autoplay.mp4.asset.json";
import posterAsset from "@/assets/yubi-hero-v2-poster.jpg.asset.json";

/**
 * Cinematic video stage for Sir Bookears.
 * - Lightweight muted video starts on load without browser media controls
 * - Falls back to a static poster if playback is unavailable
 * - Always letterboxed inside a 16:9 frame with a gold radial glow
 */
export const BennyVideoHero = () => {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const showPoster = reduceMotion || videoFailed;

  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 3;

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || reduceMotion || videoFailed) return;
    if (!video.paused) return;
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      setVideoFailed(true);
      return;
    }
    attemptsRef.current += 1;

    // iOS/WebKit checks the live DOM properties, not only the JSX attributes.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video
      .play()
      .then(() => {
        attemptsRef.current = 0;
      })
      .catch(() => {
        // Blocked autoplay: stop after a few tries and show the still image.
      });
  }, [reduceMotion, videoFailed]);

  useEffect(() => {
    if (showPoster) return;

    startPlayback();
    const onVisible = () => {
      if (document.visibilityState === "visible") startPlayback();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [showPoster, startPlayback]);

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
        {showPoster ? (
          <img
            src={posterAsset.url}
            alt="Sir Bookears reading in a flower-filled meadow"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={autoplayAsset.url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            poster={posterAsset.url}
            aria-label="Sir Bookears reading in a flower-filled meadow"
            onLoadedMetadata={startPlayback}
            onCanPlay={startPlayback}
            onPause={startPlayback}
            onError={() => setVideoFailed(true)}
            className="pointer-events-none h-full w-full object-contain [&::-webkit-media-controls]:hidden"
          />
        )}
        {/* Cinema letterboxing (subtle inner bars) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-black/80" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-black/80" />
      </motion.div>
    </div>
  );
};
