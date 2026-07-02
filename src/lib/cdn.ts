// CDN URL resolver for R2-backed media.
// Feature-flagged so we can flip back to Supabase Storage instantly.

const CDN_BASE = "https://cdn.nabulearn.com";

// Buckets that have been fully migrated to R2 AND are safe to serve public.
// Only add a bucket here after the migration console reports 100% copied.
const R2_ENABLED_BUCKETS = new Set<string>([
  // e.g. "pre-k-videos", "story-audio", "avatars", "world-backgrounds"
]);

const USE_R2 =
  (import.meta as any).env?.VITE_USE_R2_CDN === "true" ||
  (import.meta as any).env?.VITE_USE_R2_CDN === true;

export function isR2Enabled(bucket: string): boolean {
  return USE_R2 && R2_ENABLED_BUCKETS.has(bucket);
}

/**
 * Returns a CDN URL for a public storage object when the bucket has been
 * migrated to R2 and the feature flag is on. Otherwise returns null so the
 * caller can fall back to the existing Supabase Storage URL.
 */
export function getCdnUrl(bucket: string, path: string): string | null {
  if (!isR2Enabled(bucket)) return null;
  const cleanPath = path.replace(/^\/+/, "");
  return `${CDN_BASE}/${bucket}/${cleanPath}`;
}
