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

// Fast path: fetch + decodeAudioData. Works for plain audio files (mp3/wav)
// and many self-contained mp4/m4a audio files.
async function decodeViaFetch(url: string): Promise<Float32Array | null> {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn("[ClipWaveform] fetch failed", { url, status: res.status });
    return null;
  }
  const buf = await res.arrayBuffer();
  const AC = window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tmp = new AC();
  try {
    const audioBuf = await tmp.decodeAudioData(buf.slice(0));
    const ch = audioBuf.getChannelData(0);
    const bins = Math.min(TARGET_PEAKS, ch.length);
    const step = Math.max(1, Math.floor(ch.length / bins));
    const peaks = new Float32Array(bins);
    let globalMax = 0;
    for (let i = 0; i < bins; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(ch.length, start + step);
      for (let j = start; j < end; j++) {
        const v = Math.abs(ch[j]);
        if (v > max) max = v;
      }
      peaks[i] = max;
      if (max > globalMax) globalMax = max;
    }
    if (globalMax === 0) return null;
    return peaks;
  } catch {
    return null;
  } finally {
    try { void tmp.close(); } catch { /* noop */ }
  }
}

// Fallback path: hidden <video> + MediaElementSource + AnalyserNode. Plays the
// file silently at high speed and samples RMS into per-bin peaks. Works on any
// media the <video> tag can play, including muxed mp4s decodeAudioData rejects.
function decodeViaPlayback(url: string): Promise<Float32Array | null> {
  return new Promise((resolve) => {
    const AC = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = false; // must be false or MediaElementSource produces silence
    video.playsInline = true;
    video.src = url;
    // keep it off-screen but in the DOM so some browsers will actually decode
    video.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";
    document.body.appendChild(video);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { video.pause(); } catch { /* noop */ }
      try { video.removeAttribute("src"); video.load(); } catch { /* noop */ }
      try { video.remove(); } catch { /* noop */ }
      try { void ctx.close(); } catch { /* noop */ }
    };

    const fail = (reason: string) => {
      console.warn("[ClipWaveform] playback-sampling failed", { url, reason });
      cleanup();
      resolve(null);
    };

    let raf = 0;
    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) { fail("no duration"); return; }
      let src: MediaElementAudioSourceNode;
      try {
        src = ctx.createMediaElementSource(video);
      } catch (e) {
        fail("createMediaElementSource: " + String(e));
        return;
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      const gain = ctx.createGain();
      gain.gain.value = 0; // silent monitor
      src.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);

      const bins = TARGET_PEAKS;
      const peaks = new Float32Array(bins);
      const timeBuf = new Uint8Array(analyser.fftSize);

      const sample = () => {
        analyser.getByteTimeDomainData(timeBuf);
        let max = 0;
        for (let i = 0; i < timeBuf.length; i++) {
          const v = Math.abs(timeBuf[i] - 128) / 128;
          if (v > max) max = v;
        }
        const t = video.currentTime;
        const bin = Math.min(bins - 1, Math.max(0, Math.floor((t / duration) * bins)));
        if (max > peaks[bin]) peaks[bin] = max;
        raf = requestAnimationFrame(sample);
      };

      video.playbackRate = 4; // speed up; some browsers cap effective rate
      video.play().then(() => {
        raf = requestAnimationFrame(sample);
      }).catch((e) => fail("play(): " + String(e)));

      video.addEventListener("ended", () => {
        cancelAnimationFrame(raf);
        let globalMax = 0;
        for (let i = 0; i < bins; i++) if (peaks[i] > globalMax) globalMax = peaks[i];
        cleanup();
        if (globalMax === 0) {
          console.warn("[ClipWaveform] playback sampling produced silence", { url });
          resolve(null);
        } else {
          console.debug("[ClipWaveform] playback-sampled ok", { url, durationSec: duration, peak: globalMax.toFixed(3) });
          resolve(peaks);
        }
      });

      video.addEventListener("error", () => fail("video error"));

      // safety timeout: never hang forever (2x real-time as a ceiling)
      setTimeout(() => {
        if (!cleaned) { cancelAnimationFrame(raf); fail("timeout"); }
      }, Math.max(15000, duration * 2000));
    });

    video.addEventListener("error", () => fail("metadata load error"));
  });
}

async function decodePeaks(url: string): Promise<Float32Array | null> {
  if (peakCache.has(url)) return peakCache.get(url)!;
  const existing = inflight.get(url);
  if (existing) return existing;
  const job = (async () => {
    const t0 = performance.now();
    let peaks = await decodeViaFetch(url);
    if (!peaks) {
      console.debug("[ClipWaveform] fetch/decode unusable, falling back to playback sampling", { url });
      peaks = await decodeViaPlayback(url);
    }
    if (peaks) {
      peakCache.set(url, peaks);
      console.debug("[ClipWaveform] peaks ready", { url, ms: Math.round(performance.now() - t0) });
    }
    inflight.delete(url);
    return peaks;
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
