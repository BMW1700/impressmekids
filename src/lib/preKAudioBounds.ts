import type { PreKAudioClip } from "@/hooks/usePreKAudioMix";

export interface PreKAudioBounds {
  baseStart: number;
  baseEnd: number;
  start: number;
  end: number;
  length: number;
  finite: boolean;
}

/**
 * Resolve the source-audio window in one place.
 *
 * trim_* is the source-video alignment baseline. manual_crop_* is the
 * editor-owned, non-destructive crop layered inside that baseline.
 */
export function audioBoundsForClip(clip: PreKAudioClip): PreKAudioBounds {
  const baseStart = Math.max(0, Number(clip.trim_start_seconds || 0));
  const rawBaseEnd = clip.trim_end_seconds ?? clip.duration_seconds ?? Number.POSITIVE_INFINITY;
  const baseEnd = Math.max(baseStart + 0.1, Number(rawBaseEnd));
  const manualStart = Math.max(0, Number(clip.manual_crop_start_seconds || 0));
  const manualEnd = Math.max(0, Number(clip.manual_crop_end_seconds || 0));
  const start = Math.min(baseEnd - 0.1, baseStart + manualStart);
  const end = Math.max(start + 0.1, baseEnd - manualEnd);
  return {
    baseStart,
    baseEnd,
    start,
    end,
    length: Math.max(0.1, end - start),
    finite: Number.isFinite(end),
  };
}