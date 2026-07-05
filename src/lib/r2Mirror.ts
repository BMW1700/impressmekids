// Shared "mirror-on-upload" helper.
//
// For every write to a public R2-enabled bucket, we fire a best-effort copy to
// Cloudflare R2 so future reads serve from cdn.yubilearn.com (zero egress cost)
// instead of Supabase Storage. The existing HEAD-check fallback in src/lib/cdn.ts
// still catches anything this misses, so a failure here is non-fatal — the file
// keeps working, we just pay egress on it until the next full R2 migration scan.

import { supabase } from "@/integrations/supabase/client";

const R2_MIRRORED_BUCKETS = new Set<string>([
  "prek-level-videos",
  "prek-level-audio",
  "world-backgrounds",
  "campaign-assets",
  "avatars",
  "email-assets",
  // Private student audio. Mirrored to R2 for zero-egress reads via
  // sign-r2-audio-url; the bucket itself remains private (never CDN'd).
  "aura-audio",
]);

export interface MirrorResult {
  attempted: boolean;
  copied: boolean;
  error?: string;
}

/**
 * Best-effort copy of a freshly-uploaded object to Cloudflare R2. Safe to call
 * on any bucket — buckets that aren't R2-enabled are skipped silently. Never
 * throws; callers should ignore the result unless they want to surface it.
 */
export async function mirrorToR2(
  bucket: string,
  path: string,
  contentType?: string,
  size?: number,
): Promise<MirrorResult> {
  if (!R2_MIRRORED_BUCKETS.has(bucket)) {
    return { attempted: false, copied: false };
  }
  try {
    const { data, error } = await supabase.functions.invoke("migrate-to-r2", {
      body: {
        action: "copy-path",
        bucket,
        path,
        contentType: contentType || "application/octet-stream",
        size: size ?? 0,
      },
    });
    if (error) return { attempted: true, copied: false, error: error.message };
    if ((data as any)?.error) {
      return { attempted: true, copied: false, error: String((data as any).error) };
    }
    return { attempted: true, copied: Boolean((data as any)?.copied ?? (data as any)?.ok) };
  } catch (e: any) {
    return { attempted: true, copied: false, error: String(e?.message || e) };
  }
}

/** Fire-and-forget variant for call sites that don't need to await. */
export function mirrorToR2Async(
  bucket: string,
  path: string,
  contentType?: string,
  size?: number,
): void {
  void mirrorToR2(bucket, path, contentType, size).catch(() => {
    /* swallow — the HEAD-check fallback covers us */
  });
}
