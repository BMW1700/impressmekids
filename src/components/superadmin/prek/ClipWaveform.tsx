// Renders a downsampled waveform of an audio clip into a <canvas>. Decodes
// once per signed URL and caches peaks in a module-level Map so adding many
// clips doesn't decode the same file repeatedly.
//
// While a waveform is decoding the canvas shows a thin baseline so layout
// doesn't jump. Failures fall back to the baseline silently — the timeline
// stays usable.

import { useEffect, useRef, useState } from "react";

// Cache: signedUrl -> Float32Array of peaks (downsampled to TARGET_PEAKS bins)
const TARGET_PEAKS = 600;
const peakCache = new Map<string, Float32Array>();
const inflight = new Map<string, Promise<Float32Array | null>>();

async function decodePeaks(url: string): Promise<Float32Array | null> {
  if (peakCache.has(url)) return peakCache.get(url)!;
  const existing = inflight.get(url);
  if (existing) return existing;
  const job = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      const AC = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const tmp = new AC();
      const audioBuf = await tmp.decodeAudioData(buf.slice(0));
      try { void tmp.close(); } catch { /* noop */ }
      const ch = audioBuf.getChannelData(0);
      const bins = Math.min(TARGET_PEAKS, ch.length);
      const step = Math.max(1, Math.floor(ch.length / bins));
      const peaks = new Float32Array(bins);
      for (let i = 0; i < bins; i++) {
        let max = 0;
        const start = i * step;
        const end = Math.min(ch.length, start + step);
        for (let j = start; j < end; j++) {
          const v = Math.abs(ch[j]);
          if (v > max) max = v;
        }
        peaks[i] = max;
      }
      peakCache.set(url, peaks);
      return peaks;
    } catch {
      return null;
    } finally {
      inflight.delete(url);
    }
  })();
  inflight.set(url, job);
  return job;
}

interface Props {
  url: string | null;
  widthPx: number;
  heightPx: number;
  /** CSS color for the waveform fill. Defaults to currentColor at ~70% alpha. */
  colorClass?: string;
  /** Optional slice (0-1) of the source waveform to render. Used when a clip
   *  visually teleports across a word-card boundary and is drawn as multiple
   *  sub-segments — each segment renders just its own slice of the audio. */
  peakStart?: number;
  peakEnd?: number;
  /** Multiply peak values for visibility on quiet sources (e.g. video audio). */
  gain?: number;
  /** Normalize so the loudest visible bar fills the lane. */
  normalize?: boolean;
}

export function ClipWaveform({ url, widthPx, heightPx, colorClass = "text-foreground/70", peakStart = 0, peakEnd = 1, gain = 1, normalize = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(url ? peakCache.get(url) ?? null : null);

  useEffect(() => {
    let cancelled = false;
    if (!url) { setPeaks(null); return; }
    const cached = peakCache.get(url);
    if (cached) { setPeaks(cached); return; }
    void decodePeaks(url).then((p) => { if (!cancelled) setPeaks(p); });
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(widthPx));
    const h = Math.max(1, Math.floor(heightPx));
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext("2d"); if (!g) return;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    const style = getComputedStyle(c);
    g.fillStyle = style.color || "rgba(255,255,255,0.7)";
    const mid = h / 2;
    if (!peaks || peaks.length === 0) {
      g.fillRect(0, mid - 0.5, w, 1);
      return;
    }
    const bins = peaks.length;
    const s = Math.max(0, Math.min(1, peakStart));
    const e = Math.max(s, Math.min(1, peakEnd));
    const startBin = Math.floor(s * bins);
    const endBin = Math.max(startBin + 1, Math.ceil(e * bins));
    const sliceBins = endBin - startBin;
    let scale = gain;
    if (normalize) {
      let maxV = 0;
      for (let i = startBin; i < endBin; i++) if (peaks[i] > maxV) maxV = peaks[i];
      if (maxV > 0) scale = gain / maxV;
    }
    for (let x = 0; x < w; x++) {
      const idx = Math.min(bins - 1, startBin + Math.floor((x / w) * sliceBins));
      const v = Math.min(1, peaks[idx] * scale);
      const barH = Math.max(1, v * (h - 2));
      g.fillRect(x, mid - barH / 2, 1, barH);
    }
  }, [peaks, widthPx, heightPx, peakStart, peakEnd, gain, normalize]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${colorClass} pointer-events-none`}
      style={{ width: widthPx, height: heightPx }}
    />
  );
}
