// Client-side bulk audio splitter for Pre-K.
// Decodes one uploaded audio file, slices it into N pieces (either scene-aligned
// or fixed-length), and returns each piece as a WAV Blob ready for upload.
//
// Zero server dependency — runs in the browser via Web Audio API. Fully additive:
// consumers use these Blobs the same way `preKAudioUpload` uploads any file.

export interface AudioSlice {
  /** Zero-based slice index. */
  index: number;
  /** Start second in the original audio. */
  startSec: number;
  /** End second in the original audio. */
  endSec: number;
  /** Slice duration in seconds. */
  durationSec: number;
  /** Encoded WAV blob for this slice. */
  blob: Blob;
}

export interface SliceSpec {
  startSec: number;
  endSec: number;
}

/** Decode any browser-supported audio file to an AudioBuffer. */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arr = await file.arrayBuffer();
  const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(arr.slice(0));
  } finally {
    try { await ctx.close(); } catch { /* noop */ }
  }
}

/** Build slice specs for "fixed length" mode. */
export function buildFixedSpecs(totalDuration: number, chunkSeconds: number, maxSlices?: number): SliceSpec[] {
  const out: SliceSpec[] = [];
  const chunk = Math.max(0.25, chunkSeconds);
  let t = 0;
  while (t < totalDuration - 0.01) {
    const end = Math.min(totalDuration, t + chunk);
    out.push({ startSec: t, endSec: end });
    t = end;
    if (maxSlices != null && out.length >= maxSlices) break;
  }
  return out;
}

/**
 * Build slice specs for "scene-aligned" mode: one slice per scene, proportional
 * to that scene's timeline duration. If audio is shorter than the total scene
 * duration, the last slice gets truncated (and remaining scenes get zero-length
 * placeholder specs that the caller should skip).
 */
export function buildSceneAlignedSpecs(totalDuration: number, sceneDurations: number[]): SliceSpec[] {
  const out: SliceSpec[] = [];
  let t = 0;
  for (const d of sceneDurations) {
    const start = Math.min(totalDuration, t);
    const end = Math.min(totalDuration, t + d);
    out.push({ startSec: start, endSec: end });
    t += d;
  }
  return out;
}

/** Slice an AudioBuffer by seconds and encode each slice to a 16-bit WAV Blob. */
export async function sliceAndEncode(buffer: AudioBuffer, specs: SliceSpec[]): Promise<AudioSlice[]> {
  const out: AudioSlice[] = [];
  for (let i = 0; i < specs.length; i++) {
    const { startSec, endSec } = specs[i];
    const dur = Math.max(0, endSec - startSec);
    if (dur < 0.05) continue;
    const startFrame = Math.floor(startSec * buffer.sampleRate);
    const endFrame = Math.min(buffer.length, Math.floor(endSec * buffer.sampleRate));
    const frames = endFrame - startFrame;
    if (frames <= 0) continue;
    const channelData: Float32Array[] = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c);
      channelData.push(src.subarray(startFrame, endFrame));
    }
    const blob = encodeWav(channelData, buffer.sampleRate);
    out.push({ index: i, startSec, endSec, durationSec: dur, blob });
  }
  return out;
}

/** Encode multi-channel Float32 PCM to a 16-bit little-endian WAV Blob. */
function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
  const numCh = channels.length;
  const numFrames = channels[0].length;
  const bytesPerSample = 2;
  const dataSize = numFrames * numCh * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);       // PCM chunk size
  view.setUint16(20, 1, true);        // PCM format
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * bytesPerSample, true);
  view.setUint16(32, numCh * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(off, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}
