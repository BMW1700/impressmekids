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
import { Zap, Play, Pause, Trash2, Scissors } from "lucide-react";
import type { PreKAudioClip, PreKAudioTrack } from "@/hooks/usePreKAudioMix";
import type { SceneGraph } from "@/lib/preKSceneGraph";
import { resolveClip } from "@/lib/preKClipResolve";
import { ClipWaveform } from "./ClipWaveform";

const PX_PER_SEC_FULL = 48;
const PX_PER_SEC_COMPACT_CARD = 10; // collapse card scenes when wall-clock is off
const TRACK_HEIGHT = 78;
const TRACK_GAP = 6;
const HEADER_HEIGHT = 32;
const VIDEO_LANE_HEIGHT = 84; // read-only source-video waveform lane

interface Props {
  graph: SceneGraph;
  tracks: PreKAudioTrack[];
  clips: PreKAudioClip[];
  selectedClipId: string | null;
  wallClock: boolean;
  playheadSec?: number | null;
  /** storage_path -> signed audio URL, for waveform decode + isolated preview. */
  signedUrls?: Record<string, string>;
  /** sceneKey -> signed video URL. Used to render the read-only "Video" lane. */
  videoUrls?: Record<string, string>;
  onSelectClip: (id: string | null) => void;
  onMoveClipStart: (clip: PreKAudioClip, newStartSec: number, newTrackIndex: number) => void;
  onMoveSpanEnd: (clip: PreKAudioClip, newEndSec: number) => void;
  onDropOnNewTrack: (clip: PreKAudioClip, newStartSec: number) => void;
  /** Delete a clip (inline trash button on each block). */
  onDeleteClip?: (clip: PreKAudioClip) => void;
  /** Split a clip at the current playhead (inline scissors button). */
  onSplitClip?: (clip: PreKAudioClip, atSec: number) => void;
  /** Crop/trim a clip edge by dragging its left or right edge handle. */
  onTrimClip?: (clip: PreKAudioClip, edge: "start" | "end", atSec: number) => void;
  /** Click/drag on the timeline header to move the playhead. */
  onScrub?: (sec: number) => void;
  /** Fired during clip drags so the preview can scrub to the drop target. */
  onDragPreview?: (sec: number | null) => void;
  /** Stops the main transport before isolated clip-button playback. */
  onBeforeIsolatedPreview?: () => void;
}


interface DragState {
  clipId: string;
  mode: "body" | "end" | "trim-start" | "trim-end";
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  rowIndex: number;
}

export function TimelineCanvas({
  graph, tracks, clips, selectedClipId, wallClock, playheadSec, signedUrls, videoUrls,
  onSelectClip, onMoveClipStart, onMoveSpanEnd, onDropOnNewTrack, onDeleteClip, onSplitClip, onTrimClip, onScrub, onDragPreview, onBeforeIsolatedPreview,
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
  const startClipPreview = useCallback((clipId: string, url: string, rate: number, trim: number, trimEnd?: number | null) => {
    onBeforeIsolatedPreview?.();
    stopClipPreview();
    const a = new Audio(url);
    a.playbackRate = rate || 1;
    const inSec = Math.max(0, trim || 0);
    const outSec = trimEnd != null && trimEnd > inSec ? trimEnd : null;
    const seek = () => { try { a.currentTime = inSec; } catch { /* noop */ } };
    seek();
    a.addEventListener("loadedmetadata", seek, { once: true });
    if (outSec != null) {
      // Audition exactly what the level will play: hard-stop at the crop-out.
      a.ontimeupdate = () => {
        if (a.currentTime >= outSec - 0.02) {
          try { a.pause(); } catch { /* noop */ }
          a.ontimeupdate = null;
          setPreviewingClipId((id) => (id === clipId ? null : id));
        }
      };
    }
    previewAudioRef.current = a;
    a.onended = () => setPreviewingClipId((id) => id === clipId ? null : id);
    a.play().catch(() => setPreviewingClipId(null));
    setPreviewingClipId(clipId);
  }, [onBeforeIsolatedPreview, stopClipPreview]);
  useEffect(() => () => stopClipPreview(), [stopClipPreview]);

  // Per-scene rendered width. Word-card scenes are zero-width on the timeline
  // and always render as a fixed-width "skip notch"; clip time math uses
  // timelineDurationSeconds so audio teleports across cards.
  const segs = useMemo(() => {
    let cursor = 0;
    let renderCursor = 0;
    const out = graph.scenes.map((s) => {
      const tlDur = s.timelineDurationSeconds;
      const isCard = s.kind === "word-card";
      const realStart = cursor;
      cursor += tlDur;
      const renderWidth = isCard ? PX_PER_SEC_COMPACT_CARD : tlDur * PX_PER_SEC_FULL;
      const left = renderCursor;
      renderCursor += renderWidth;
      const pxPerSec = isCard || tlDur <= 0 ? 0 : renderWidth / tlDur;
      return { scene: s, realStart, realEnd: cursor, left, width: renderWidth, pxPerSec, isCard };
    });
    return { items: out, totalRenderPx: renderCursor };
  }, [graph]);

  // Convert a wall-clock second to canvas-x. Card scenes are zero-width in
  // time, so a sec exactly at a boundary maps to the notch's left edge.
  const secToPx = useCallback((sec: number) => {
    for (const it of segs.items) {
      if (it.isCard) continue;
      if (sec <= it.realEnd) {
        const localSec = Math.max(0, sec - it.realStart);
        return it.left + localSec * it.pxPerSec;
      }
    }
    return segs.totalRenderPx;
  }, [segs]);

  // Convert canvas-x back to a wall-clock second. Clicking on a card notch
  // snaps to the start of the next video scene (teleport target).
  const pxToSec = useCallback((px: number) => {
    for (const it of segs.items) {
      if (px <= it.left + it.width) {
        if (it.isCard) return it.realEnd; // == realStart, snaps to next video start
        const localPx = Math.max(0, px - it.left);
        return it.realStart + localPx / it.pxPerSec;
      }
    }
    return graph.nominalDurationTotal;
  }, [segs, graph]);

  const beginDrag = (e: RPointerEvent, clip: PreKAudioClip, mode: DragState["mode"]) => {
    if (clip.duration_mode === "fill-level") return;
    e.preventDefault();
    e.stopPropagation();
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    onSelectClip(clip.id);
    const rowIndex = orderedTracks.findIndex((t) => t.track_index === clip.track_index);
    setDrag({ clipId: clip.id, mode, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, rowIndex: rowIndex >= 0 ? rowIndex : 0 });
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
        if (d.mode === "end" || d.mode === "trim-end") {
          const endPx = secToPx(res.endSec);
          onDragPreview(Math.max(0, Math.min(graph.nominalDurationTotal, pxToSec(endPx + dx))));
        } else if (d.mode === "trim-start") {
          const startPx = secToPx(res.startSec);
          onDragPreview(Math.max(0, Math.min(graph.nominalDurationTotal, pxToSec(startPx + dx))));
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

    // Compute RAW media bounds in timeline seconds so trim handles can drag
    // both directions (shrink AND grow back to the original media length).
    const rate = Math.max(0.05, clip.playback_rate || 1);
    const trimStart = Math.max(0, clip.trim_start_seconds || 0);
    const rawDur = clip.duration_seconds ?? ((res.endSec - res.startSec) * rate + trimStart);
    const currentTrimEnd = clip.trim_end_seconds != null ? Math.min(rawDur, clip.trim_end_seconds) : rawDur;
    const rawStartSec = res.startSec - trimStart / rate;
    const rawEndSec = res.endSec + Math.max(0, rawDur - currentTrimEnd) / rate;

    if (d.mode === "end") {
      const newEndSec = Math.max(0.1, Math.min(graph.nominalDurationTotal, pxToSec(endPx + d.dx)));
      onMoveSpanEnd(clip, newEndSec);
    } else if (d.mode === "trim-start") {
      const nextStart = Math.max(rawStartSec, Math.min(res.endSec - 0.1, pxToSec(startPx + d.dx)));
      onTrimClip?.(clip, "start", nextStart);
    } else if (d.mode === "trim-end") {
      const nextEnd = Math.max(res.startSec + 0.1, Math.min(rawEndSec, pxToSec(endPx + d.dx)));
      onTrimClip?.(clip, "end", nextEnd);
    } else {
      const newStartSec = Math.max(0, Math.min(graph.nominalDurationTotal - 0.1, pxToSec(startPx + d.dx)));
      const rowDelta = Math.round(d.dy / (TRACK_HEIGHT + TRACK_GAP));
      const newRow = d.rowIndex + rowDelta;
      if (newRow >= orderedTracks.length) {
        onDropOnNewTrack(clip, newStartSec);
      } else {
        const clampedRow = Math.max(0, Math.min(orderedTracks.length - 1, newRow));
        onMoveClipStart(clip, newStartSec, orderedTracks[clampedRow].track_index);
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

  // Pin the auto-generated "Sir Bookears (Redub)" (index 90) and "Sir Bookears (Music)"
  // (index 89) tracks directly beneath the Video lane so redub + extracted
  // music waveforms line up visually with their source scenes.
  const REDUB_TRACK_INDEX = 90;
  const MUSIC_TRACK_INDEX = 89;
  const redubTrack = tracks.find((t) => t.track_index === REDUB_TRACK_INDEX) ?? null;
  const musicTrack = tracks.find((t) => t.track_index === MUSIC_TRACK_INDEX) ?? null;
  const otherTracks = tracks.filter((t) => t.track_index !== REDUB_TRACK_INDEX && t.track_index !== MUSIC_TRACK_INDEX);
  const pinned: PreKAudioTrack[] = [];
  if (redubTrack) pinned.push(redubTrack);
  if (musicTrack) pinned.push(musicTrack);
  const orderedTracks: PreKAudioTrack[] = [...pinned, ...otherTracks];
  const lanes = [...orderedTracks, null as PreKAudioTrack | null]; // null lane = "create new track"
  const videoLaneTop = HEADER_HEIGHT + 4;
  const tracksTopOffset = videoLaneTop + VIDEO_LANE_HEIGHT + TRACK_GAP;
  const canvasHeight = tracksTopOffset + lanes.length * (TRACK_HEIGHT + TRACK_GAP);

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

        {/* Track 0 — read-only source video audio lane */}
        <div
          className="absolute left-0 right-1 rounded-md border border-border/50 bg-slate-500/5"
          style={{ top: videoLaneTop, height: VIDEO_LANE_HEIGHT }}
        >
          <div className="absolute left-2 top-1 text-[10px] text-muted-foreground pointer-events-none z-[1]">
            Video
          </div>
          {segs.items.map(({ scene, left, width, isCard }) => {
            if (isCard) return null;
            const url = videoUrls?.[scene.key] ?? null;
            const blockLeft = left + 2;
            const blockWidth = Math.max(8, width - 4);
            const waveLeft = 4;
            const waveRight = 4;
            return (
              <div
                key={`video-${scene.key}`}
                className="absolute top-5 bottom-2 rounded-md border-2 bg-slate-900/10 dark:bg-slate-100/10 border-slate-500/70 overflow-hidden pointer-events-none shadow-sm"
                style={{ left: blockLeft, width: blockWidth }}
                title={scene.label}
              >
                <div
                  className="absolute top-1 rounded-sm bg-background/60 border border-background/40 flex items-center overflow-hidden"
                  style={{ left: waveLeft, right: waveRight, bottom: 14 }}
                >
                  <ClipWaveform
                    url={url}
                    widthPx={Math.max(1, blockWidth - waveLeft - waveRight)}
                    heightPx={48}
                    colorClass="text-slate-900 dark:text-slate-50"
                    normalize
                    gain={0.95}
                  />
                </div>
                <div className="absolute left-0 right-0 bottom-0 h-3.5 px-1.5 bg-background/80 border-t border-background/40 flex items-center pointer-events-none">
                  <span className="truncate text-[9px] leading-none opacity-90">{scene.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Track lanes */}
        {lanes.map((t, rowIdx) => {
          const isNew = t === null;
          const top = tracksTopOffset + rowIdx * (TRACK_HEIGHT + TRACK_GAP);
          const targetRowIdx = drag && drag.mode === "body"
            ? Math.max(0, Math.min(lanes.length - 1, drag.rowIndex + Math.round(drag.dy / (TRACK_HEIGHT + TRACK_GAP))))
            : -1;
          const isDropTarget = targetRowIdx === rowIdx;
          const isRedubLane = !isNew && t!.track_index === REDUB_TRACK_INDEX;
          const isMusicLane = !isNew && t!.track_index === MUSIC_TRACK_INDEX;
          return (
            <div
              key={isNew ? "__new" : t!.id}
              className={`absolute left-0 right-1 rounded-md transition-colors ${
                isNew
                  ? `border-2 border-dashed ${isDropTarget ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-transparent"}`
                  : isRedubLane
                    ? `border-2 ${isDropTarget ? "border-primary bg-primary/5" : "border-purple-500/60 bg-purple-500/5"}`
                    : isMusicLane
                      ? `border-2 ${isDropTarget ? "border-primary bg-primary/5" : "border-blue-500/60 bg-blue-500/5"}`
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
                <div className="absolute left-2 top-1 text-[10px] pointer-events-none z-[1] flex items-center gap-1">
                  <span className={isRedubLane ? "text-purple-700 dark:text-purple-300 font-semibold" : "text-muted-foreground"}>
                    {t!.name}
                  </span>
                  {isRedubLane && (
                    <span className="rounded-sm bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-200 px-1 text-[9px] leading-none">
                      🔒 aligned to source
                    </span>
                  )}
                </div>
              )}
              {!isNew && clips
                .filter((c) => c.track_index === t!.track_index)
                .flatMap((c) => {
                  const res = resolveClip(c, graph);
                  const dragging = drag?.clipId === c.id;
                  const dx = dragging ? drag!.dx : 0;
                  const dy = dragging ? drag!.dy : 0;
                  const selected = selectedClipId === c.id;
                  const color =
                    c.duration_mode === "fill-level" ? "bg-blue-500/30 border-blue-500/70" :
                    c.duration_mode === "fill-scene" ? "bg-emerald-500/30 border-emerald-500/70" :
                    c.duration_mode === "span-videos" ? "bg-violet-500/30 border-violet-500/70" :
                    "bg-primary/30 border-primary/70";
                  const audioUrl = signedUrls?.[c.storage_path] ?? null;
                  const isPreviewing = previewingClipId === c.id;
                  const audioDurTL = Math.max(0.0001, res.endSec - res.startSec);

                  // Build visual segments: while dragging, a single block
                  // tracks the pointer; otherwise the clip is split around any
                  // zero-width card notches so the audio teleports across.
                  type Seg = { leftPx: number; widthPx: number; peakStart: number; peakEnd: number };
                  const segments: Seg[] = [];
                  if (dragging) {
                    const startPx = secToPx(res.startSec);
                    const endPx = secToPx(res.endSec);
                    const lp = drag!.mode === "body" ? startPx + dx : startPx;
                    const rp = drag!.mode === "end" ? endPx + dx : drag!.mode === "body" ? endPx + dx : endPx;
                    segments.push({ leftPx: lp, widthPx: Math.max(24, rp - lp), peakStart: 0, peakEnd: 1 });
                  } else {
                    for (const it of segs.items) {
                      if (it.isCard) continue;
                      const segStart = Math.max(it.realStart, res.startSec);
                      const segEnd = Math.min(it.realEnd, res.endSec);
                      if (segEnd <= segStart) continue;
                      const localStart = segStart - it.realStart;
                      const localEnd = segEnd - it.realStart;
                      const leftPx = it.left + localStart * it.pxPerSec;
                      const widthPx = Math.max(8, (localEnd - localStart) * it.pxPerSec);
                      const peakStart = (segStart - res.startSec) / audioDurTL;
                      const peakEnd = (segEnd - res.startSec) / audioDurTL;
                      segments.push({ leftPx, widthPx, peakStart, peakEnd });
                    }
                    if (segments.length === 0) {
                      segments.push({ leftPx: secToPx(res.startSec), widthPx: 24, peakStart: 0, peakEnd: 1 });
                    }
                  }

                  return segments.map((seg, segIdx) => {
                    const isFirst = segIdx === 0;
                    const isLast = segIdx === segments.length - 1;
                    const waveLeft = isFirst ? 28 : 8;
                    const waveRight = isLast ? 8 : 4;
                    const canCrop = Boolean(onTrimClip && c.duration_mode !== "fill-level" && seg.widthPx >= 28);
                    return (
                      <div
                        key={`${c.id}-${segIdx}`}
                        onPointerDown={(e) => beginDrag(e, c, "body")}
                        className={`absolute top-5 bottom-2 rounded-md border-2 ${color} ${selected ? "ring-2 ring-primary" : ""} text-[10px] font-medium overflow-hidden cursor-grab active:cursor-grabbing shadow-sm`}
                        style={{
                          left: seg.leftPx,
                          width: seg.widthPx,
                          transform: dragging ? `translateY(${dy}px)` : undefined,
                          opacity: dragging ? 0.85 : 1,
                          zIndex: dragging ? 50 : 2,
                        }}
                      >
                        <div
                          className="absolute top-1 rounded-sm bg-background/35 border border-background/30 flex items-center overflow-hidden"
                          style={{ left: waveLeft, right: waveRight, bottom: isLast ? 20 : 4 }}
                        >
                          <ClipWaveform
                            url={audioUrl}
                            widthPx={Math.max(1, seg.widthPx - waveLeft - waveRight)}
                            heightPx={36}
                            colorClass="text-foreground/85"
                            peakStart={seg.peakStart}
                            peakEnd={seg.peakEnd}
                          />
                        </div>
                        {isFirst && (
                          <div className="absolute left-1 top-1 z-[3] flex items-center gap-1">
                            <button
                              type="button"
                              onPointerDown={(e) => { e.stopPropagation(); }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPreviewing) stopClipPreview();
                                else if (audioUrl) startClipPreview(c.id, audioUrl, c.playback_rate || 1, c.trim_start_seconds || 0);
                              }}
                              title={isPreviewing ? "Stop preview" : "Preview this clip"}
                              className="h-5 w-5 rounded-sm bg-background/90 hover:bg-background text-foreground grid place-items-center shadow-sm border border-border/60"
                            >
                              {isPreviewing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            </button>
                            {onSplitClip && playheadSec != null && (
                              <button
                                type="button"
                                onPointerDown={(e) => { e.stopPropagation(); }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSplitClip(c, playheadSec);
                                }}
                                title="Split clip at playhead"
                                className="h-5 w-5 rounded-sm bg-background/90 hover:bg-background text-foreground grid place-items-center shadow-sm border border-border/60"
                              >
                                <Scissors className="h-3 w-3" />
                              </button>
                            )}
                            {onDeleteClip && (
                              <button
                                type="button"
                                onPointerDown={(e) => { e.stopPropagation(); }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteClip(c);
                                }}
                                title="Delete this clip"
                                className="h-5 w-5 rounded-sm bg-background/90 hover:bg-destructive/20 text-destructive grid place-items-center shadow-sm border border-border/60"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                        {isLast && (
                          <div className="absolute left-0 right-0 bottom-0 h-4 px-1.5 bg-background/80 border-t border-background/40 flex items-center gap-1 pointer-events-none">
                            <span className="truncate text-[9px] leading-none opacity-90">{c.display_name}</span>
                            {c.playback_rate && c.playback_rate !== 1 && (
                              <span className="ml-auto shrink-0 rounded-sm bg-background px-1 text-[8px] leading-3 tabular-nums border border-border/50">
                                {c.playback_rate.toFixed(2)}×
                              </span>
                            )}
                          </div>
                        )}
                        {isLast && c.duration_mode === "span-videos" && (
                          <div
                            onPointerDown={(e) => beginDrag(e, c, "end")}
                            className="absolute right-0 top-0 bottom-0 w-2.5 bg-violet-600/55 cursor-ew-resize z-[3]"
                            title="Drag to set end anchor"
                          />
                        )}
                        {canCrop && isFirst && (
                          <div
                            onPointerDown={(e) => beginDrag(e, c, "trim-start")}
                            className="absolute left-0 top-0 bottom-0 w-2 bg-background/95 border-r border-primary/80 cursor-ew-resize z-[4] hover:bg-primary/25"
                            title="Crop start"
                          />
                        )}
                        {canCrop && isLast && (
                          <div
                            onPointerDown={(e) => beginDrag(e, c, "trim-end")}
                            className="absolute right-0 top-0 bottom-0 w-2 bg-background/95 border-l border-primary/80 cursor-ew-resize z-[4] hover:bg-primary/25"
                            title="Crop end"
                          />
                        )}
                      </div>
                    );
                  });
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
