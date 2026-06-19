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
import { Scissors, RotateCcw } from "lucide-react";

interface Props {
  /** Resolved playable URL (signed URL or asset URL). */
  src: string | null;
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

export function VideoTrimEditor({ src, trimIn, trimOut, onChange }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  const [duration, setDuration] = useState<number>(0);
  const [playhead, setPlayhead] = useState<number>(0);

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
    if (isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
    // Snap preview to the trim-in point so admins see what runtime will see.
    try {
      const startAt = Math.max(0, Number(trimIn ?? 0));
      if (startAt > 0) v.currentTime = startAt;
    } catch { /* noop */ }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setPlayhead(v.currentTime);
    // Enforce trim-out: pause and rewind to In when playhead crosses Out.
    const outAt = draftOut ?? (duration || 0);
    const inAt = Math.max(0, draftIn ?? 0);
    if (outAt > 0 && v.currentTime >= outAt - 0.02 && !v.paused) {
      try {
        v.pause();
        v.currentTime = inAt;
      } catch { /* noop */ }
    }
  };

  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = Math.max(0, Math.min(duration || t, t));
    } catch { /* noop */ }
  }, [duration]);

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

  if (!src) return null;

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        src={src}
        controls
        preload="metadata"
        className="w-full max-w-sm rounded border bg-black aspect-video"
        onLoadedMetadata={onLoadedMeta}
        onTimeUpdate={onTimeUpdate}
      />

      {/* Trim bar */}
      <div className="max-w-sm space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>In {fmt(effIn)}s</span>
          <span>Playhead {fmt(playhead)}s</span>
          <span>Out {fmt(effOut)}s</span>
        </div>
        <div
          ref={barRef}
          className="relative h-7 w-full rounded bg-muted/40 border border-border select-none"
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
          />
          {/* Out handle */}
          <div
            role="slider"
            aria-label="Trim out"
            className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-primary rounded cursor-ew-resize shadow"
            style={{ left: pct(effOut) }}
            onPointerDown={startDrag("out")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" type="button" onClick={setInAtPlayhead}>
            <Scissors className="h-3 w-3 mr-1" /> Set In
          </Button>
          <Button size="sm" variant="outline" type="button" onClick={setOutAtPlayhead}>
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
