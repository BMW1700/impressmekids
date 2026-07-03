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
  r2Copied: boolean;
  r2Error?: string;
}

function validateBrowserCanReadVideo(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = document.createElement("video");
    const support = probe.canPlayType(file.type || "video/mp4");
    if (!support) {
      reject(new Error("This browser cannot play that video format. Use MP4/H.264 for Pre-K level videos."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => {
      window.clearTimeout(timeout);
      probe.removeAttribute("src");
      probe.load();
      URL.revokeObjectURL(objectUrl);
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The video metadata could not load on this browser. Re-export as MP4/H.264 and upload again."));
    }, 10000);

    probe.preload = "metadata";
    probe.muted = true;
    probe.playsInline = true;
    probe.onloadedmetadata = () => {
      if (!Number.isFinite(probe.duration) || probe.duration <= 0) {
        cleanup();
        reject(new Error("The video has no readable duration. Re-export as MP4/H.264 and upload again."));
        return;
      }
      cleanup();
      resolve();
    };
    probe.onerror = () => {
      cleanup();
      reject(new Error("This video could not be decoded by the browser. Re-export as MP4/H.264 and upload again."));
    };
    probe.src = objectUrl;
    probe.load();
  });
}

async function copyPreKVideoToR2(path: string, file: File): Promise<{ copied: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("migrate-to-r2", {
      body: {
        action: "copy-path",
        bucket: PREK_VIDEO_BUCKET,
        path,
        contentType: file.type || "video/mp4",
        size: file.size,
      },
    });
    if (error) return { copied: false, error: error.message };
    if ((data as any)?.error) return { copied: false, error: String((data as any).error) };
    return { copied: Boolean((data as any)?.copied ?? (data as any)?.ok) };
  } catch (e: any) {
    return { copied: false, error: String(e?.message || e) };
  }
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
  await validateBrowserCanReadVideo(file);

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
  const r2 = await copyPreKVideoToR2(path, file);

  return { path, size: file.size, contentType: file.type, r2Copied: r2.copied, r2Error: r2.error };
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
