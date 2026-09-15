// Live video preview for the audio overlay editor. Renders the frame at the
// current `playheadSec` so authors can visually line up sound effects with
// what the child sees. Plays during preview, scrubs while dragging.

import { useEffect, useMemo, useRef } from "react";
import { Zap, Film } from "lucide-react";
import { resolveTimelineFrame } from "@/lib/preKTimelineFrameResolver";
import type { SceneGraph } from "@/lib/preKSceneGraph";

interface Props {
  graph: SceneGraph;
  videoUrls: Record<string, string>;
  posterUrls: Record<string, string>;
  fallbackVideoUrls?: Record<string, string>;
  fallbackPosterUrls?: Record<string, string>;
  playheadSec: number;
  playing: boolean;
  muteSourceVideo: boolean;
  /** Approx label of the word being shown on a card scene (e.g. "JUMP"). */
  wordsByIndex?: Record<number, string>;
}

export function TimelinePreviewPlayer({
  graph, videoUrls, posterUrls, fallbackVideoUrls, fallbackPosterUrls, playheadSec, playing, muteSourceVideo, wordsByIndex,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSrcRef = useRef<string | null>(null);
  const seekTimerRef = useRef<number | null>(null);

  const lookup = useMemo(
    () => resolveTimelineFrame(playheadSec, graph, videoUrls, posterUrls),
    [playheadSec, graph, videoUrls, posterUrls],
  );
  const fallbackVideoSrc = lookup.src ? fallbackVideoUrls?.[lookup.sceneKey] ?? null : null;
  const fallbackPosterSrc = lookup.posterUrl ? fallbackPosterUrls?.[lookup.sceneKey] ?? null : null;

  // Swap src only when the active video actually changes (avoids reload spam
  // when the user just scrubs inside one clip).
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (lookup.src && lookup.src !== lastSrcRef.current) {
      v.src = lookup.src;
      lastSrcRef.current = lookup.src;
      v.load();
    } else if (!lookup.src) {
      lastSrcRef.current = null;
    }
  }, [lookup.src]);

  const handleVideoError = () => {
    const v = videoRef.current;
    if (!v || !fallbackVideoSrc || lastSrcRef.current === fallbackVideoSrc) return;
    v.src = fallbackVideoSrc;
    lastSrcRef.current = fallbackVideoSrc;
    v.load();
    if (playing && !lookup.isCard) {
      v.play().catch(() => { /* autoplay-blocked, fine for preview */ });
    }
  };

  // Reactive seek to the requested local time (debounced ~30ms so dragging
  // doesn't fire seeks faster than the browser can keep up).
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (lookup.isCard || !lookup.src) {
      try { v.pause(); } catch { /* noop */ }
      return;
    }
    if (seekTimerRef.current) window.clearTimeout(seekTimerRef.current);
    seekTimerRef.current = window.setTimeout(() => {
      try {
        if (Math.abs((v.currentTime || 0) - lookup.localTime) > 0.05) {
          v.currentTime = Math.max(0, lookup.localTime);
        }
      } catch { /* noop */ }
    }, 30);
    return () => { if (seekTimerRef.current) window.clearTimeout(seekTimerRef.current); };
  }, [lookup.localTime, lookup.isCard, lookup.src]);

  // Play / pause based on transport state and whether we're on a video scene.
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    v.muted = muteSourceVideo;
    if (playing && !lookup.isCard && lookup.src) {
      v.play().catch(() => { /* autoplay-blocked, fine for preview */ });
    } else {
      try { v.pause(); } catch { /* noop */ }
    }
  }, [playing, lookup.isCard, lookup.src, muteSourceVideo]);

  const wordIdxMatch = lookup.sceneKey.match(/^word-(\d+)-card$/);
  const cardWord = wordIdxMatch ? wordsByIndex?.[Number(wordIdxMatch[1])] : undefined;

  return (
    <div className="rounded-lg border bg-black/95 overflow-hidden mx-auto" style={{ maxWidth: 480 }}>
      <div className="relative aspect-video w-full">
        {/* Video element — always mounted so seeks are fast */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-contain ${lookup.isCard ? "opacity-0" : "opacity-100"}`}
          playsInline
          preload="auto"
          onError={handleVideoError}
        />
        {/* Card overlay: freeze-frame poster + amber badge */}
        {lookup.isCard && (
          <>
            {lookup.posterUrl ? (
              <img
                src={lookup.posterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  if (fallbackPosterSrc && e.currentTarget.src !== fallbackPosterSrc) e.currentTarget.src = fallbackPosterSrc;
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                <Film className="h-10 w-10" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-amber-500/90 text-white px-2 py-1 text-[11px] font-medium shadow-lg">
              <Zap className="h-3 w-3" />
              Word card{cardWord ? `: ${cardWord.toLowerCase()}` : ""}
            </div>
          </>
        )}
        {/* No-video fallback */}
        {!lookup.isCard && !lookup.src && (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
            No video for this scene
          </div>
        )}
        {/* Bottom time strip */}
        <div className="absolute bottom-1 right-2 text-[10px] text-white/70 tabular-nums bg-black/40 rounded px-1.5 py-0.5">
          {playheadSec.toFixed(2)}s · {lookup.sceneKey}
        </div>
      </div>
    </div>
  );
}
