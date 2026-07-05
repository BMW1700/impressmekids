// Shared resolver for aura-audio playback URLs.
//
// When VITE_USE_R2_AURA is on, mints a Cloudflare R2 presigned URL via the
// sign-r2-audio-url edge function (zero backend egress). Otherwise falls back
// to a plain Supabase Storage signed URL. The studentId is derived from the
// path prefix (`<studentId>/<filename>`), which the edge function then
// re-verifies against RLS via `get_signed_audio_url`.

import { supabase } from "@/integrations/supabase/client";
import { USE_R2_AURA } from "./cdn";

const DEFAULT_TTL_S = 900; // 15 min

function studentIdFromPath(path: string): string | null {
  const cleaned = path.replace(/^\/+/, "");
  const first = cleaned.split("/")[0];
  // uuid v4 length is 36; accept any non-empty first segment and let the
  // server-side access check reject bad values.
  return first && first.length > 0 ? first : null;
}

export async function signAuraAudioUrl(path: string): Promise<string | null> {
  if (!path) return null;

  if (USE_R2_AURA) {
    const studentId = studentIdFromPath(path);
    if (!studentId) return null;
    try {
      const { data, error } = await supabase.functions.invoke("sign-r2-audio-url", {
        body: { studentId, path, ttl: DEFAULT_TTL_S },
      });
      if (error || !(data as any)?.url) {
        console.warn("[aura-audio] R2 sign failed, falling back:", error?.message);
      } else {
        return (data as any).url as string;
      }
    } catch (e: any) {
      console.warn("[aura-audio] R2 sign threw, falling back:", e?.message);
    }
    // fall through to Storage fallback so playback still works
  }

  const { data, error } = await supabase.storage
    .from("aura-audio")
    .createSignedUrl(path, DEFAULT_TTL_S);
  if (error || !data?.signedUrl) {
    console.warn("[aura-audio] Storage sign failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}
