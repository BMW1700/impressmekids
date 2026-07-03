// Non-destructive in/out trim for a Pre-K video clip.
//
// The uploaded file in storage is never modified — we just persist `trim_in`
// and `trim_out` (seconds) and the runtime + previews respect them.
//
// UX:
//   • Preview <video> at the top.
//   • Trim bar below with two draggable handles over the full clip duration.
//   • "Set In at playhead" / "Set Out at playhead" + Reset.
//   • Numeric inputs (3-decimal) for frame-accurate values.
//   • Live scrub: while dragging a handle, the preview seeks to that time.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, RotateCcw, Play, Pause } from "lucide-react";

interface Props {
  /** Resolved playable URL (signed URL or asset URL). */
  src: string | null;
  /** Signed backend URL used if the CDN URL is missing or blocked. */
  fallbackSrc?: string | null;
  /** Persisted trim_in seconds (null = clip start). */
  trimIn: number | null;
  /** Persisted trim_out seconds (null = clip end). */
  trimOut: number | null;
  /** Persist changes. Called on drag end / blur / explicit button click. */
  onChange: (next: { trimIn: number | null; trimOut: number | null }) => void;
}

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) return "0.000";
  return t.toFixed(3);
}

export function VideoTrimEditor({ src, fallbackSrc, trimIn, trimOut, onChange }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  const [duration, setDuration] = useState<number>(0);
  const [playhead, setPlayhead] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [activeSrc, setActiveSrc] = useState<string | null>(src);

  useEffect(() => {
    setActiveSrc(src);
    setDuration(0);
    setPlayhead(0);
    setIsPlaying(false);
    setLoadError(false);
    setIsReady(false);
  }, [src]);

  // Local draft values during a drag so we don't spam onChange.
  const [draftIn, setDraftIn] = useState<number | null>(trimIn);
  const [draftOut, setDraftOut] = useState<number | null>(trimOut);
  useEffect(() => { setDraftIn(trimIn); }, [trimIn]);
  useEffect(() => { setDraftOut(trimOut); }, [trimOut]);

  const effIn = draftIn ?? 0;
  const effOut = draftOut ?? duration;

  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setLoadError(false);
    setIsReady(true);
    if (isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
    // Snap preview to the trim-in point so admins see what runtime will see.
    try {
      const startAt = Math.max(0, Number(trimIn ?? 0));
      if (startAt > 0) v.currentTime = startAt;
    } catch { /* noop */ }
  };

  const handleLoadError = () => {
    if (fallbackSrc && activeSrc !== fallbackSrc) {
      setActiveSrc(fallbackSrc);
      setLoadError(false);
      setIsReady(false);
      window.setTimeout(() => {
        try { videoRef.current?.load(); } catch { /* noop */ }
      }, 0);
      return;
    }
    setIsReady(false);
    setLoadError(true);
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setPlayhead(v.currentTime);
    const outAt = draftOut ?? (duration || 0);
    const inAt = Math.max(0, draftIn ?? 0);
    // Enforce trim-out: pause and rewind to In when playhead crosses Out.
    if (outAt > 0 && v.currentTime >= outAt - 0.02 && !v.paused) {
      try {
        v.pause();
        v.currentTime = inAt;
      } catch { /* noop */ }
      return;
    }
    // Enforce trim-in: if currentTime drifts before In, snap forward.
    if (v.currentTime < inAt - 0.05) {
      try { v.currentTime = inAt; } catch { /* noop */ }
    }
  };

  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = Math.max(0, Math.min(duration || t, t));
    } catch { /* noop */ }
  }, [duration]);

  // ── Transport (custom play/pause — native controls are hidden) ────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      const inAt = Math.max(0, draftIn ?? 0);
      const outAt = draftOut ?? (duration || 0);
      if (v.currentTime < inAt || (outAt > 0 && v.currentTime >= outAt - 0.02)) {
        try { v.currentTime = inAt; } catch { /* noop */ }
      }
      try { void v.play(); } catch { /* noop */ }
    } else {
      try { v.pause(); } catch { /* noop */ }
    }
  };

  // ── Drag handling ──────────────────────────────────────────────────────────
  const draggingRef = useRef<"in" | "out" | null>(null);

  const pctToTime = (clientX: number): number => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    return pct * (duration || 0);
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    const which = draggingRef.current;
    if (!which) return;
    const t = pctToTime(e.clientX);
    if (which === "in") {
      const next = Math.min(t, (draftOut ?? duration) - 0.05);
      setDraftIn(Math.max(0, next));
      seek(Math.max(0, next));
    } else {
      const next = Math.max(t, (draftIn ?? 0) + 0.05);
      setDraftOut(Math.min(duration, next));
      seek(Math.min(duration, next));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, draftIn, draftOut, seek]);

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    // Commit
    const nextIn = draftIn !== null && draftIn > 0.001 ? draftIn : null;
    const nextOut = draftOut !== null && duration > 0 && draftOut < duration - 0.001 ? draftOut : null;
    onChange({ trimIn: nextIn, trimOut: nextOut });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftIn, draftOut, duration, onChange, onPointerMove]);

  const startDrag = (which: "in" | "out") => (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = which;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const setInAtPlayhead = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = Math.min(v.currentTime, (draftOut ?? duration) - 0.05);
    const nextIn = Math.max(0, t);
    setDraftIn(nextIn);
    onChange({ trimIn: nextIn > 0.001 ? nextIn : null, trimOut: draftOut !== null && duration > 0 && draftOut < duration - 0.001 ? draftOut : null });
  };
  const setOutAtPlayhead = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = Math.max(v.currentTime, (draftIn ?? 0) + 0.05);
    const nextOut = Math.min(duration, t);
    setDraftOut(nextOut);
    onChange({ trimIn: draftIn !== null && draftIn > 0.001 ? draftIn : null, trimOut: nextOut < duration - 0.001 ? nextOut : null });
  };
  const reset = () => {
    setDraftIn(null);
    setDraftOut(null);
    onChange({ trimIn: null, trimOut: null });
  };

  const pct = (t: number) => (duration > 0 ? `${(t / duration) * 100}%` : "0%");

  const inputIn = useMemo(() => fmt(effIn), [effIn]);
  const inputOut = useMemo(() => fmt(effOut), [effOut]);

  if (!activeSrc) return null;

  // Click-to-seek anywhere inside the kept region of the trim bar.
  const onBarClick = (e: React.MouseEvent) => {
    // Ignore if a handle drag is in progress.
    if (draggingRef.current) return;
    const t = pctToTime(e.clientX);
    const inAt = Math.max(0, draftIn ?? 0);
    const outAt = draftOut ?? (duration || 0);
    // Clamp clicks in the trimmed-away regions back to the kept window edge.
    const clamped = Math.max(inAt, Math.min(outAt > 0 ? outAt - 0.02 : t, t));
    seek(clamped);
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full max-w-sm overflow-hidden rounded border bg-black aspect-video">
        <video
          ref={videoRef}
          src={activeSrc}
          preload="metadata"
          playsInline
          className={`h-full w-full object-contain ${isReady ? "opacity-100" : "opacity-0"}`}
          onLoadedMetadata={onLoadedMeta}
          onCanPlay={() => setIsReady(true)}
          onError={handleLoadError}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
        {!isReady && !loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-xs text-muted-foreground">
            Loading video…
          </div>
        ) : null}
      </div>
      {loadError ? (
        <div className="max-w-sm rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          This video could not be loaded. Replace it or try saving again.
        </div>
      ) : null}

      {/* Trim bar — the SINGLE source of truth for playback position. */}
      <div className="max-w-sm space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>In {fmt(effIn)}s</span>
          <span>
            Playhead {fmt(Math.max(0, playhead - effIn))}s
            <span className="opacity-50"> / {fmt(Math.max(0, effOut - effIn))}s</span>
          </span>
          <span>Out {fmt(effOut)}s</span>
        </div>
        <div
          ref={barRef}
          onClick={onBarClick}
          className="relative h-7 w-full rounded bg-muted/40 border border-border select-none cursor-pointer"
        >
          {/* Trimmed-away regions (faded) */}
          <div
            className="absolute inset-y-0 left-0 bg-background/70 rounded-l"
            style={{ width: pct(effIn) }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-background/70 rounded-r"
            style={{ width: duration > 0 ? `${((duration - effOut) / duration) * 100}%` : "0%" }}
          />
          {/* Kept region */}
          <div
            className="absolute inset-y-0 bg-primary/30 border-y border-primary"
            style={{ left: pct(effIn), right: duration > 0 ? `${((duration - effOut) / duration) * 100}%` : "0%" }}
          />
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-foreground/80 pointer-events-none"
            style={{ left: pct(Math.max(0, Math.min(duration, playhead))) }}
          />
          {/* In handle */}
          <div
            role="slider"
            aria-label="Trim in"
            className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-primary rounded cursor-ew-resize shadow"
            style={{ left: pct(effIn) }}
            onPointerDown={startDrag("in")}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Out handle */}
          <div
            role="slider"
            aria-label="Trim out"
            className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-primary rounded cursor-ew-resize shadow"
            style={{ left: pct(effOut) }}
            onPointerDown={startDrag("out")}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="default" type="button" onClick={togglePlay} disabled={!isReady || loadError}>
            {isPlaying ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button size="sm" variant="outline" type="button" onClick={setInAtPlayhead} disabled={!isReady || loadError}>
            <Scissors className="h-3 w-3 mr-1" /> Set In
          </Button>
          <Button size="sm" variant="outline" type="button" onClick={setOutAtPlayhead} disabled={!isReady || loadError}>
            <Scissors className="h-3 w-3 mr-1" /> Set Out
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={reset}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">In (s)</Label>
            <Input
              type="number"
              step="0.001"
              min={0}
              max={duration || undefined}
              value={inputIn}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isFinite(v)) return;
                setDraftIn(Math.max(0, Math.min(v, (draftOut ?? duration) - 0.05)));
              }}
              onBlur={() => onChange({
                trimIn: draftIn !== null && draftIn > 0.001 ? draftIn : null,
                trimOut: draftOut !== null && duration > 0 && draftOut < duration - 0.001 ? draftOut : null,
              })}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Out (s)</Label>
            <Input
              type="number"
              step="0.001"
              min={0}
              max={duration || undefined}
              value={inputOut}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isFinite(v)) return;
                setDraftOut(Math.max((draftIn ?? 0) + 0.05, Math.min(v, duration || v)));
              }}
              onBlur={() => onChange({
                trimIn: draftIn !== null && draftIn > 0.001 ? draftIn : null,
                trimOut: draftOut !== null && duration > 0 && draftOut < duration - 0.001 ? draftOut : null,
              })}
              className="h-8 font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
