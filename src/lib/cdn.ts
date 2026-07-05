// CDN URL resolver for R2-backed media.
// Feature-flagged so we can flip back to Supabase Storage instantly.

const CDN_BASE = "https://cdn.yubilearn.com";

// Buckets fully migrated to R2 AND safe to serve publicly (no PII/student audio).
// Verified 2026-07-02: cdn.yubilearn.com returns HTTP 200 with correct content-type.
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

// Independent flag for private student audio (aura-audio). Uses the
// sign-r2-audio-url edge function, NOT the public CDN.
export const USE_R2_AURA =
  (import.meta as any).env?.VITE_USE_R2_AURA === "true" ||
  (import.meta as any).env?.VITE_USE_R2_AURA === true;

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

// ---------------------------------------------------------------------------
// HEAD-check fallback
//
// The R2 migration was a one-shot copy. Files uploaded AFTER cutover live only
// in Supabase Storage — a naive CDN rewrite 404s on them and breaks previews
// (black video, 0 duration, broken editor). To keep 100% of the R2 savings on
// migrated files while unbreaking new uploads, we HEAD-check the CDN once per
// URL per session and cache the result. Hit = keep CDN (free egress). Miss =
// fall back to the original Storage URL.
//
// The cache is module-scoped, so a single page-load pays at most one HEAD per
// unique CDN URL and never repeats it. A negative result also caches so we
// don't hammer R2 with repeated 404s.
// ---------------------------------------------------------------------------

type ProbeResult = "hit" | "miss";
const probeCache = new Map<string, ProbeResult>();
const inflightProbes = new Map<string, Promise<ProbeResult>>();

async function probeCdn(cdnUrl: string): Promise<ProbeResult> {
  const cached = probeCache.get(cdnUrl);
  if (cached) return cached;
  const existing = inflightProbes.get(cdnUrl);
  if (existing) return existing;
  const p = (async (): Promise<ProbeResult> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(cdnUrl, { method: "HEAD", mode: "cors", signal: controller.signal });
      const result: ProbeResult = res.ok ? "hit" : "miss";
      probeCache.set(cdnUrl, result);
      return result;
    } catch {
      probeCache.set(cdnUrl, "miss");
      return "miss";
    } finally {
      window.clearTimeout(timeout);
      inflightProbes.delete(cdnUrl);
    }
  })();
  inflightProbes.set(cdnUrl, p);
  return p;
}

/**
 * Try the R2 CDN first; fall back to `fallbackUrl` if the CDN 404s. Result is
 * cached per session so repeated resolutions cost nothing. If the bucket is
 * not R2-enabled, returns `fallbackUrl` immediately without a network call.
 */
export async function resolveCdnOrFallback(
  bucket: string,
  path: string,
  fallbackUrl: string,
): Promise<string> {
  const cdn = getCdnUrl(bucket, path);
  if (!cdn) return fallbackUrl;
  const result = await probeCdn(cdn);
  return result === "hit" ? cdn : fallbackUrl;
}

