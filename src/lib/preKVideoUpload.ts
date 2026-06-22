// Browser → Supabase Storage uploader for Pre-K admin videos.
// Path scheme: {worldId}/{levelId}/{slot}-{timestamp}.{ext}
//
// Returns the bucket-relative path (NOT a URL). Store this in the DB column;
// the runtime resolver in preKLevelFromDb.ts turns it into a signed URL.

import { supabase } from "@/integrations/supabase/client";
import { PREK_VIDEO_BUCKET } from "./preKLevelFromDb";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];

export interface UploadResult {
  path: string;
  size: number;
  contentType: string;
}

export async function uploadPreKVideo(
  file: File,
  worldId: string,
  levelId: string,
  slot: string,
): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 50 MB.`);
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error(`Unsupported video type: ${file.type || "unknown"}. Use MP4, WebM, or MOV.`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const safeSlot = slot.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const path = `${worldId}/${levelId}/${safeSlot}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(PREK_VIDEO_BUCKET)
    .upload(path, file, {
      // 1 year, immutable — every upload writes to a new timestamped path,
      // so the bytes at any given URL never change. This lets browsers and
      // any CDN in front of Storage cache aggressively.
      cacheControl: "31536000, immutable",
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;

  return { path, size: file.size, contentType: file.type };
}

/** Best-effort delete; ignores not-found errors. */
export async function deletePreKVideo(path: string | null | undefined) {
  if (!path) return;
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return; // external URL, not ours
  try {
    await supabase.storage.from(PREK_VIDEO_BUCKET).remove([path]);
  } catch {
    // swallow
  }
}
