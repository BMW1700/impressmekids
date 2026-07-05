// Browser → Storage uploader for Pre-K audio overlay clips.
// Returns the bucket-relative path (NOT a URL). The hook resolves signed URLs.

import { supabase } from "@/integrations/supabase/client";
import { mirrorToR2Async } from "./r2Mirror";

export const PREK_AUDIO_BUCKET = "prek-level-audio";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/ogg", "audio/webm"];

export interface AudioUploadResult {
  path: string;
  size: number;
  contentType: string;
}

export async function uploadPreKAudio(
  file: File,
  levelId: string,
  trackIndex: number,
): Promise<AudioUploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 10 MB.`);
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    throw new Error(`Unsupported audio type: ${file.type}. Use MP3, WAV, M4A, or OGG.`);
  }
  const ext = (file.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${levelId}/track-${trackIndex}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(PREK_AUDIO_BUCKET)
    .upload(path, file, {
      // 1 year, immutable — path is timestamped per upload (see line 29).
      cacheControl: "31536000, immutable",
      contentType: file.type || `audio/${ext}`,
      upsert: false,
    });
  if (error) throw error;
  mirrorToR2Async(PREK_AUDIO_BUCKET, path, file.type || `audio/${ext}`, file.size);
  return { path, size: file.size, contentType: file.type || `audio/${ext}` };
}

export async function deletePreKAudio(path: string | null | undefined) {
  if (!path) return;
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return;
  try {
    await supabase.storage.from(PREK_AUDIO_BUCKET).remove([path]);
  } catch {
    // swallow
  }
}

/** Best-effort probe of an uploaded file's duration using an offscreen <audio>. */
export function probeAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const d = isFinite(audio.duration) ? audio.duration : null;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}
