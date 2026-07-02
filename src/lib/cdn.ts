// CDN URL resolver for R2-backed media.
// Feature-flagged so we can flip back to Supabase Storage instantly.

const CDN_BASE = "https://cdn.nabulearn.com";

// Buckets fully migrated to R2 AND safe to serve publicly (no PII/student audio).
// Verified 2026-07-02: cdn.nabulearn.com returns HTTP 200 with correct content-type.
const R2_ENABLED_BUCKETS = new Set<string>([
  "prek-level-videos",
  "prek-level-audio",
  "world-backgrounds",
  "campaign-assets",
  "avatars",
  "email-assets",
]);

// Explicitly excluded (private / signed-URL / student data):
// - aura-audio: student reading recordings (PRIVATE, FERPA)
// - assignment-question-images: classroom-scoped private bucket
// - assignment-audio: student submissions
// - classroom-syllabus: teacher-scoped private docs

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

/**
 * Rewrites a Supabase Storage public URL to the R2 CDN URL when the bucket
 * has been migrated. Returns the original URL if the bucket isn't R2-enabled
 * or the URL doesn't match the Supabase public-object format.
 */
export function rewriteToCdn(supabaseUrl: string | null | undefined): string | null | undefined {
  if (!supabaseUrl) return supabaseUrl;
  // Match .../storage/v1/object/public/<bucket>/<path>
  const m = supabaseUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return supabaseUrl;
  const [, bucket, path] = m;
  const cdn = getCdnUrl(bucket, path);
  return cdn ?? supabaseUrl;
}
