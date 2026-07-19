// Region Rescue for Pre-K redubs.
//
// Given a source video/audio storage path and a [startSec, endSec] window,
// this decodes the audio in the browser via Web Audio API, slices the exact
// region, encodes a 16-bit PCM WAV, uploads it to prek-level-audio, then
// invokes the prek-clip-redub edge function with sourceBucket set to the
// audio bucket and clipIsPreTrimmed:true so the resulting redub plays the
// exact phrase — regardless of which scene the region came from.

import { supabase } from "@/integrations/supabase/client";
import { PREK_AUDIO_BUCKET } from "@/lib/preKAudioUpload";

const VIDEO_BUCKET = "prek-level-videos";

async function fetchAsAudioBuffer(url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Source fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const AC = window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    return await ctx.decodeAudioData(buf.slice(0));
  } finally {
    try { void ctx.close(); } catch { /* noop */ }
  }
}

function sliceBuffer(src: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const sr = src.sampleRate;
  const start = Math.max(0, Math.floor(startSec * sr));
  const end = Math.min(src.length, Math.floor(endSec * sr));
  const length = Math.max(1, end - start);
  const AC = window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  // We just need an empty buffer to copy into; OfflineAudioContext isn't
  // needed. Create an AudioBuffer directly via a throwaway context.
  const tmpCtx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const out = tmpCtx.createBuffer(src.numberOfChannels, length, sr);
  for (let ch = 0; ch < src.numberOfChannels; ch++) {
    const from = src.getChannelData(ch).subarray(start, end);
    out.getChannelData(ch).set(from);
  }
  try { void tmpCtx.close(); } catch { /* noop */ }
  void AC; // silence unused
  return out;
}

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const byteRate = sr * blockAlign;
  const dataSize = len * blockAlign;
  const bufOut = new ArrayBuffer(44 + dataSize);
  const view = new DataView(bufOut);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  // interleave
  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i];
      s = Math.max(-1, Math.min(1, s));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([bufOut], { type: "audio/wav" });
}

export interface RedubFromRegionArgs {
  levelId: string;
  /** Scene to write the resulting redub INTO. */
  targetSceneKey: string;
  /** Source video storage path (from any scene) to sample the region from. */
  sourceVideoStoragePath: string;
  /** Window in the source video, in seconds. */
  regionStartSeconds: number;
  regionEndSeconds: number;
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
}

export async function redubFromSourceRegion(args: RedubFromRegionArgs): Promise<{
  storagePath?: string;
  signedUrl?: string;
}> {
  if (args.regionEndSeconds <= args.regionStartSeconds) {
    throw new Error("Region end must be after region start.");
  }
  const regionLen = args.regionEndSeconds - args.regionStartSeconds;

  // 1. Sign the source video, fetch bytes, decode, slice, encode WAV.
  const { data: signed, error: signErr } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(args.sourceVideoStoragePath, 60 * 60);
  if (signErr || !signed?.signedUrl) throw new Error("Could not sign source video URL.");
  const audioBuf = await fetchAsAudioBuffer(signed.signedUrl);
  const region = sliceBuffer(audioBuf, args.regionStartSeconds, args.regionEndSeconds);
  const wav = encodeWav(region);

  // 2. Upload WAV to prek-level-audio bucket as a fresh source.
  const wavPath = `redub-source/${args.levelId}/${args.targetSceneKey}-${Date.now()}.wav`;
  const up = await supabase.storage.from(PREK_AUDIO_BUCKET).upload(wavPath, wav, {
    contentType: "audio/wav",
    upsert: true,
  });
  if (up.error) throw new Error(`Region upload failed: ${up.error.message}`);

  // 3. Invoke redub against the pre-trimmed WAV.
  const { data, error } = await supabase.functions.invoke("prek-clip-redub", {
    body: {
      levelId: args.levelId,
      sceneKey: args.targetSceneKey,
      sourceStoragePath: wavPath,
      sourceBucket: PREK_AUDIO_BUCKET,
      voiceId: args.voiceId,
      stability: args.stability,
      similarityBoost: args.similarityBoost,
      isolate: true,
      isolateOnly: false,
      // No stage — run isolate+STS in one shot; region is short.
      clipIsPreTrimmed: true,
      sourceRawDurationSeconds: regionLen,
      sourceTrimStartSeconds: 0,
      sourceTrimEndSeconds: regionLen,
      sceneDurationSeconds: regionLen,
    },
  });
  if (error) throw error;
  return {
    storagePath: data?.storagePath ?? undefined,
    signedUrl: data?.signedUrl ?? undefined,
  };
}
