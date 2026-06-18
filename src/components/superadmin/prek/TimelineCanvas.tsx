// DAW-style timeline canvas for the Pre-K audio overlay editor.
//
//   ┌────────── sticky scene header (videos + ↯ card scenes) ──────────┐
//   │ Track 1 lane:  [─── clip ───]      [── span clip ━━━━━━━]        │
//   │ Track 2 lane:                  [───── fill-scene ─────]          │
//   │ + Drop here to create a new track                                │
//   └─────────────────────────────────────────────────────────────────-┘
//
// Pointer-based drag (works for mouse + iPad touch via Pointer Events):
//   • Drag clip body  → horizontal = re-anchor start; vertical = change track
//   • Drag span-end handle → re-anchor end of span-videos clip
//   • Drop onto bottom "+" lane → create a new track and move the clip there

import { useEffect, useMemo, useRef, useState, useCallback, type PointerEvent as RPointerEvent } from "react";
import { Zap, Play, Pause } from "lucide-react";
import type { PreKAudioClip, PreKAudioTrack } from "@/hooks/usePreKAudioMix";
import type { SceneGraph } from "@/lib/preKSceneGraph";
import { resolveClip } from "@/lib/preKClipResolve";
import { ClipWaveform } from "./ClipWaveform";

const PX_PER_SEC_FULL = 48;
const PX_PER_SEC_COMPACT_CARD = 10; // collapse card scenes when wall-clock is off
const TRACK_HEIGHT = 56;
const TRACK_GAP = 6;
const HEADER_HEIGHT = 32;

interface Props {
  graph: SceneGraph;
  tracks: PreKAudioTrack[];
  clips: PreKAudioClip[];
  selectedClipId: string | null;
  wallClock: boolean;
  playheadSec?: number | null;
  /** storage_path -> signed audio URL, for waveform decode + isolated preview. */
  signedUrls?: Record<string, string>;
  onSelectClip: (id: string | null) => void;
  onMoveClipStart: (clip: PreKAudioClip, newStartSec: number, newTrackIndex: number) => void;
  onMoveSpanEnd: (clip: PreKAudioClip, newEndSec: number) => void;
  onDropOnNewTrack: (clip: PreKAudioClip, newStartSec: number) => void;
  /** Click/drag on the timeline header to move the playhead. */
  onScrub?: (sec: number) => void;
  /** Fired during clip drags so the preview can scrub to the drop target. */
  onDragPreview?: (sec: number | null) => void;
}

interface DragState {
  clipId: string;
  mode: "body" | "end";
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  rowIndex: number;
}

export function TimelineCanvas({
  graph, tracks, clips, selectedClipId, wallClock, playheadSec, signedUrls,
  onSelectClip, onMoveClipStart, onMoveSpanEnd, onDropOnNewTrack, onScrub, onDragPreview,
}: Props) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  // Single shared audio element for clip-isolated previews (▶ button on each
  // clip). Guarantees only one preview plays at a time.
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingClipId, setPreviewingClipId] = useState<string | null>(null);
  const stopClipPreview = useCallback(() => {
    const a = previewAudioRef.current;
    if (a) { try { a.pause(); } catch { /* noop */ } }
    setPreviewingClipId(null);
  }, []);
  const startClipPreview = useCallback((clipId: string, url: string, rate: number, trim: number) => {
    stopClipPreview();
    const a = new Audio(url);
    a.playbackRate = rate || 1;
    try { a.currentTime = trim || 0; } catch { /* noop */ }
    previewAudioRef.current = a;
    a.onended = () => setPreviewingClipId((id) => id === clipId ? null : id);
    a.play().catch(() => setPreviewingClipId(null));
    setPreviewingClipId(clipId);
  }, [stopClipPreview]);
  useEffect(() => () => stopClipPreview(), [stopClipPreview]);

  // Per-scene rendered width. When wallClock=false, card scenes shrink to a notch.
  const segs = useMemo(() => {
    let cursor = 0;
    let renderCursor = 0;
    const out = graph.scenes.map((s) => {
      const realStart = cursor;
      cursor += s.nominalDurationSeconds;
      const renderWidth = wallClock || s.kind !== "word-card"
        ? s.nominalDurationSeconds * PX_PER_SEC_FULL
        : PX_PER_SEC_COMPACT_CARD;
      const left = renderCursor;
      renderCursor += renderWidth;
      const pxPerSec = renderWidth / Math.max(0.1, s.nominalDurationSeconds);
      return { scene: s, realStart, realEnd: cursor, left, width: renderWidth, pxPerSec };
    });
    return { items: out, totalRenderPx: renderCursor };
  }, [graph, wallClock]);

  // Convert a wall-clock second to canvas-x (handles wallClock=false squish)
  const secToPx = useCallback((sec: number) => {
    for (const it of segs.items) {
      if (sec <= it.realEnd) {
        const localSec = Math.max(0, sec - it.realStart);
        return it.left + localSec * it.pxPerSec;
      }
    }
    return segs.totalRenderPx;
  }, [segs]);

  // Convert canvas-x back to a wall-clock second
  const pxToSec = useCallback((px: number) => {
    for (const it of segs.items) {
      if (px <= it.left + it.width) {
        const localPx = Math.max(0, px - it.left);
        return it.realStart + localPx / it.pxPerSec;
      }
    }
    return graph.nominalDurationTotal;
  }, [segs, graph]);

  const beginDrag = (e: RPointerEvent, clip: PreKAudioClip, mode: "body" | "end") => {
    if (clip.duration_mode === "fill-level") return;
    e.preventDefault();
    e.stopPropagation();
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    onSelectClip(clip.id);
    const rowIndex = tracks.findIndex((t) => t.track_index === clip.track_index);
    setDrag({ clipId: clip.id, mode, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, rowIndex });
  };

  const onPointerMove = (e: RPointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setDrag({ ...d, dx, dy });
    // Live scrub preview to the proposed drop position
    if (onDragPreview) {
      const clip = clips.find((c) => c.id === d.clipId);
      if (clip) {
        const res = resolveClip(clip, graph);
        if (d.mode === "end") {
          const endPx = secToPx(res.endSec);
          onDragPreview(Math.max(0, Math.min(graph.nominalDurationTotal, pxToSec(endPx + dx))));
        } else {
          const startPx = secToPx(res.startSec);
          onDragPreview(Math.max(0, Math.min(graph.nominalDurationTotal, pxToSec(startPx + dx))));
        }
      }
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current; if (!d) { return; }
    const clip = clips.find((c) => c.id === d.clipId);
    if (!clip) { setDrag(null); onDragPreview?.(null); return; }
    const res = resolveClip(clip, graph);
    const startPx = secToPx(res.startSec);
    const endPx = secToPx(res.endSec);

    if (d.mode === "end") {
      const newEndSec = Math.max(0.1, Math.min(graph.nominalDurationTotal, pxToSec(endPx + d.dx)));
      onMoveSpanEnd(clip, newEndSec);
    } else {
      const newStartSec = Math.max(0, Math.min(graph.nominalDurationTotal - 0.1, pxToSec(startPx + d.dx)));
      const rowDelta = Math.round(d.dy / (TRACK_HEIGHT + TRACK_GAP));
      const newRow = d.rowIndex + rowDelta;
      if (newRow >= tracks.length) {
        onDropOnNewTrack(clip, newStartSec);
      } else {
        const clampedRow = Math.max(0, Math.min(tracks.length - 1, newRow));
        onMoveClipStart(clip, newStartSec, tracks[clampedRow].track_index);
      }
    }
    setDrag(null);
    onDragPreview?.(null);
  };

  // Scrub by clicking/dragging the scene header (or empty canvas area)
  const scrubFromEvent = (e: RPointerEvent) => {
    if (!onScrub) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left + (e.currentTarget as HTMLElement).scrollLeft;
    onScrub(Math.max(0, Math.min(graph.nominalDurationTotal, pxToSec(x))));
  };
  const scrubbingRef = useRef(false);
  const onHeaderPointerDown = (e: RPointerEvent) => {
    if (!onScrub) return;
    e.preventDefault();
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch { /* noop */ }
    scrubbingRef.current = true;
    scrubFromEvent(e);
  };
  const onHeaderPointerMove = (e: RPointerEvent) => {
    if (!scrubbingRef.current) return;
    scrubFromEvent(e);
  };
  const onHeaderPointerUp = () => { scrubbingRef.current = false; };

  const lanes = [...tracks, null as PreKAudioTrack | null]; // null lane = "create new track"
  const canvasHeight = HEADER_HEIGHT + 8 + lanes.length * (TRACK_HEIGHT + TRACK_GAP);

  return (
    <div
      className="overflow-x-auto overflow-y-hidden border rounded-md bg-muted/10 touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ userSelect: "none" }}
    >
      <div style={{ width: Math.max(800, segs.totalRenderPx), height: canvasHeight, position: "relative" }}>
        {/* Playhead */}
        {playheadSec != null && playheadSec >= 0 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/80 pointer-events-none z-20"
            style={{ left: secToPx(playheadSec) }}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
          </div>
        )}
        {/* Sticky scene header (also acts as the scrub strip) */}
        <div
          className="absolute top-0 left-0 right-0 bg-background/95 border-b z-10 cursor-ew-resize touch-none"
          style={{ height: HEADER_HEIGHT }}
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
        >
          {segs.items.map(({ scene, left, width }) => (
            <div
              key={scene.key}
              title={scene.label}
              className={`absolute top-0 bottom-0 border-r text-[10px] flex items-center justify-center truncate px-1 ${
                scene.kind === "word-card"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : scene.kind === "opening" || scene.kind === "closing"
                    ? "bg-blue-500/10"
                    : "bg-muted/30"
              }`}
              style={{ left, width }}
            >
              {scene.kind === "word-card"
                ? <Zap className="h-3 w-3 shrink-0" />
                : <span className="truncate">{scene.label}</span>}
            </div>
          ))}
        </div>

        {/* Vertical guide lines at scene boundaries */}
        {segs.items.map(({ scene, left }) => (
          <div
            key={`grid-${scene.key}`}
            className="absolute top-0 bottom-0 border-l border-border/30 pointer-events-none"
            style={{ left, top: HEADER_HEIGHT }}
          />
        ))}

        {/* Track lanes */}
        {lanes.map((t, rowIdx) => {
          const isNew = t === null;
          const top = HEADER_HEIGHT + 4 + rowIdx * (TRACK_HEIGHT + TRACK_GAP);
          const targetRowIdx = drag && drag.mode === "body"
            ? Math.max(0, Math.min(lanes.length - 1, drag.rowIndex + Math.round(drag.dy / (TRACK_HEIGHT + TRACK_GAP))))
            : -1;
          const isDropTarget = targetRowIdx === rowIdx;
          return (
            <div
              key={isNew ? "__new" : t!.id}
              className={`absolute left-0 right-1 rounded-md transition-colors ${
                isNew
                  ? `border-2 border-dashed ${isDropTarget ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-transparent"}`
                  : `border ${isDropTarget ? "border-primary bg-primary/5" : "border-border/50 bg-background/40"}`
              }`}
              style={{ top, height: TRACK_HEIGHT }}
            >
              {isNew && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
                  Drop here to create a new track
                </div>
              )}
              {!isNew && (
                <div className="absolute left-2 top-1 text-[10px] text-muted-foreground pointer-events-none z-[1]">
                  {t!.name}
                </div>
              )}
              {!isNew && clips
                .filter((c) => c.track_index === t!.track_index)
                .map((c) => {
                  const res = resolveClip(c, graph);
                  const startPx = secToPx(res.startSec);
                  const endPx = secToPx(res.endSec);
                  const dragging = drag?.clipId === c.id;
                  const dx = dragging ? drag!.dx : 0;
                  const dy = dragging ? drag!.dy : 0;
                  const leftPx = dragging && drag!.mode === "body" ? startPx + dx : startPx;
                  const rightPx = dragging && drag!.mode === "end"
                    ? endPx + dx
                    : (dragging && drag!.mode === "body" ? endPx + dx : endPx);
                  const widthPx = Math.max(24, rightPx - leftPx);
                  const selected = selectedClipId === c.id;
                  const color =
                    c.duration_mode === "fill-level" ? "bg-blue-500/30 border-blue-500/70" :
                    c.duration_mode === "fill-scene" ? "bg-emerald-500/30 border-emerald-500/70" :
                    c.duration_mode === "span-videos" ? "bg-violet-500/30 border-violet-500/70" :
                    "bg-primary/30 border-primary/70";
                  return (
                    <div
                      key={c.id}
                      onPointerDown={(e) => beginDrag(e, c, "body")}
                      className={`absolute top-5 bottom-1 rounded border-2 ${color} ${selected ? "ring-2 ring-primary" : ""} flex items-center px-2 text-[11px] font-medium overflow-hidden cursor-grab active:cursor-grabbing`}
                      style={{
                        left: leftPx,
                        width: widthPx,
                        transform: dragging ? `translateY(${dy}px)` : undefined,
                        opacity: dragging ? 0.85 : 1,
                        zIndex: dragging ? 50 : 2,
                      }}
                    >
                      <span className="truncate pr-2">{c.display_name}</span>
                      {c.duration_mode === "span-videos" && (
                        <div
                          onPointerDown={(e) => beginDrag(e, c, "end")}
                          className="absolute right-0 top-0 bottom-0 w-2.5 bg-violet-600/70 cursor-ew-resize"
                          title="Drag to set end anchor"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
