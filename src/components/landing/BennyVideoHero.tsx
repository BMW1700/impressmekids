import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import videoAsset from "@/assets/yubi-hero-v2.mp4.asset.json";
import posterAsset from "@/assets/yubi-hero-v2-poster.jpg.asset.json";

/**
 * Cinematic video stage for Sir Bookears.
 * - Autoplay-muted-loop on every load (desktop + mobile)
 * - Respects the `paused` prop for explicit pause
 * - Always letterboxed inside a 16:9 frame with a gold radial glow
 */
export const BennyVideoHero = ({ paused = false }: { paused?: boolean } = {}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.defaultMuted = true;
    v.muted = true;
    v.volume = 0;
    (v as HTMLVideoElement & { playsInline: boolean }).playsInline = true;

    if (paused) {
      v.pause();
      return;
    }

    let cancelled = false;

    const tryPlay = () => {
      if (cancelled || paused) return;
      const el = videoRef.current;
      if (!el || !el.paused) return;
      el.muted = true;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
    };

    // Immediate + repeated attempts (covers slow metadata, Low Power Mode, bfcache).
    tryPlay();
    const interval = window.setInterval(tryPlay, 700);
    const stopAfter = window.setTimeout(() => window.clearInterval(interval), 15000);

    const mediaEvents = ["loadedmetadata", "loadeddata", "canplay", "canplaythrough", "suspend", "pause"];
    mediaEvents.forEach((e) => v.addEventListener(e, tryPlay));

    // Any first user gesture anywhere on the page unblocks playback instantly.
    const gestureEvents = ["pointerdown", "touchstart", "keydown", "scroll", "mousemove"];
    gestureEvents.forEach((e) =>
      document.addEventListener(e, tryPlay, { passive: true, capture: true })
    );

    window.addEventListener("pageshow", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(stopAfter);
      mediaEvents.forEach((e) => v.removeEventListener(e, tryPlay));
      gestureEvents.forEach((e) =>
        document.removeEventListener(e, tryPlay, { capture: true } as EventListenerOptions)
      );
      window.removeEventListener("pageshow", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
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
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          // @ts-expect-error legacy iOS/webview autoplay hints
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="auto"
          className="h-full w-full object-contain"
        />


        {/* Cinema letterboxing (subtle inner bars) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-black/80" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-black/80" />
      </motion.div>
    </div>
  );
};
