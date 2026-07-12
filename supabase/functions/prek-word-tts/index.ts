// prek-word-tts — ElevenLabs TTS for Pre-K word pronunciation & phonics teach.
//
// Modes:
//   "say"            — single MP3 that speaks the whole word twice (word card).
//   "teach"          — legacy single MP3 (DEPRECATED, kept only for old cached calls).
//   "teach-segment"  — one tiny MP3 per phonics segment (letter, sound,
//                      syllable, blend, whole, narration). Client plays them
//                      in order with code-controlled silences.
//   "purge"          — superadmin-only. Delete every cached MP3 under the
//                      poisoned legacy prefixes so nothing garbled can be served.
//
// v4 cache layout (isolated + multilingual_v2 for quality — this is what ships):
//   Legacy:   <voiceId>/v3/<mode>/<slug>.mp3
//   Segment:  <voiceId>/v4/<segmentKind>/<slugSegmentText>.mp3
// Older prefixes (v2/say, v3/*) are treated as poisoned and never read.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const BUCKET = "prek-word-tts";
const LEGACY_VERSION = "v3";     // was v2 — bumped to invalidate garbled cache
const CACHE_VERSION = "v4";      // was v3 — bumped to invalidate garbled cache
const POISONED_PREFIXES = ["v2", "v3"]; // purge action nukes these
const DEFAULT_VOICE_ID =
  Deno.env.get("BENNY_DEFAULT_VOICE_ID")?.trim() || "IKne3meq5aSn9XLyUdCD";
const MODEL_ID = "eleven_multilingual_v2"; // highest quality, not turbo
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

type SegKind = "whole" | "narration" | "letter" | "sound" | "syllable" | "blend";
const SEG_KINDS: SegKind[] = ["whole", "narration", "letter", "sound", "syllable", "blend"];

// Per-kind ElevenLabs voice_settings tuned for a 4-year-old's ear:
// higher stability + speaker_boost = fewer artifacts, less "garble".
const KIND_SETTINGS: Record<SegKind, {
  speed: number; stability: number; style: number; similarity_boost: number;
}> = {
  whole:     { speed: 0.90, stability: 0.70, style: 0.10, similarity_boost: 0.90 },
  narration: { speed: 1.00, stability: 0.75, style: 0.15, similarity_boost: 0.85 },
  letter:    { speed: 0.85, stability: 0.80, style: 0.05, similarity_boost: 0.90 },
  sound:     { speed: 0.75, stability: 0.85, style: 0.10, similarity_boost: 0.90 },
  syllable:  { speed: 0.80, stability: 0.75, style: 0.10, similarity_boost: 0.90 },
  blend:     { speed: 0.80, stability: 0.75, style: 0.10, similarity_boost: 0.90 },
};

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const LETTER_SOUND: Record<string, string> = {
  a: "ah", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fff", g: "guh",
  h: "huh", i: "ih", j: "juh", k: "kuh", l: "lll", m: "mmm", n: "nnn",
  o: "ah", p: "puh", q: "kwuh", r: "rrr", s: "sss", t: "tuh", u: "uh",
  v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz",
};

function slugify(text: string, max = 80): string {
  return text.toLowerCase().replace(/[^a-z0-9']+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);
}

function splitSyllablesLoose(word: string): string[] {
  const w = word.toLowerCase();
  const parts: string[] = [];
  let cur = "";
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    const isVowel = VOWELS.has(ch);
    cur += ch;
    if (isVowel && !prevVowel && cur.length > 1 && i + 1 < w.length && !VOWELS.has(w[i + 1])) {
      parts.push(cur);
      cur = "";
    }
    prevVowel = isVowel;
  }
  if (cur) parts.push(cur);
  return parts.length ? parts : [w];
}

function buildLegacyTeachPrompt(word: string): string {
  const clean = word.trim();
  const letters = clean.replace(/[^a-zA-Z']/g, "").toLowerCase().split("");
  const syllables = splitSyllablesLoose(clean);
  if (syllables.length <= 1 && letters.length <= 5) {
    const letterNames = letters.map((l) => l.toUpperCase()).join("... ");
    const sounds = letters.map((l) => LETTER_SOUND[l] ?? l).join("... ");
    return `${clean}... Let's sound it out. ${letterNames}... ${sounds}... ${clean}!`;
  }
  return `${clean}... Let's sound it out. ${syllables.join("... ")}... ${clean}!`;
}

function buildSayPrompt(word: string): string {
  const clean = word.trim();
  return `${clean}... ${clean}.`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Run the raw ElevenLabs TTS bytes through the Voice Isolator so background
 * hiss / breath artifacts / repeated-syllable ghosts get stripped.
 * Returns { bytes, isolated } — `isolated=false` means the API rejected the
 * request (usually missing scope) and we fell back to the raw TTS bytes.
 * Callers decide whether to accept that fallback or hard-fail.
 */
async function isolateAudioIfPossible(
  apiKey: string,
  mp3Bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; isolated: boolean; error?: string }> {
  try {
    const form = new FormData();
    form.append("audio", new Blob([mp3Bytes], { type: "audio/mpeg" }), "tts.mp3");
    const res = await fetch("https://api.elevenlabs.io/v1/audio-isolation", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[prek-word-tts] isolation ${res.status}: ${errText}`);
      return { bytes: mp3Bytes, isolated: false, error: `isolation_${res.status}: ${errText.slice(0, 400)}` };
    }
    const isolated = new Uint8Array(await res.arrayBuffer());
    if (isolated.byteLength === 0) {
      return { bytes: mp3Bytes, isolated: false, error: "isolation_empty_response" };
    }
    return { bytes: isolated, isolated: true };
  } catch (err) {
    console.warn("[prek-word-tts] isolation threw:", err);
    return { bytes: mp3Bytes, isolated: false, error: `isolation_threw: ${(err as Error).message}` };
  }
}

async function generateAndStore(
  admin: ReturnType<typeof createClient>,
  apiKey: string,
  args: {
    voiceId: string;
    objectPath: string;
    prompt: string;
    voiceSettings: {
      stability: number; similarity_boost: number; style: number; speed: number;
    };
    isolate: boolean;
    requireIsolation: boolean;
  },
): Promise<
  | { ok: true; signedUrl: string; isolated: boolean }
  | { ok: false; status: number; details: string; code?: string }
> {
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${args.voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: args.prompt,
        model_id: MODEL_ID,
        voice_settings: {
          stability: args.voiceSettings.stability,
          similarity_boost: args.voiceSettings.similarity_boost,
          style: args.voiceSettings.style,
          use_speaker_boost: true,
          speed: args.voiceSettings.speed,
        },
      }),
    },
  );
  if (!ttsRes.ok) {
    const errText = await ttsRes.text().catch(() => "");
    console.error(`[prek-word-tts] ElevenLabs ${ttsRes.status}: ${errText}`);
    return { ok: false, status: ttsRes.status, details: errText };
  }
  let audioBytes = new Uint8Array(await ttsRes.arrayBuffer());
  let wasIsolated = false;
  if (args.isolate) {
    const iso = await isolateAudioIfPossible(apiKey, audioBytes);
    if (!iso.isolated && args.requireIsolation) {
      return {
        ok: false,
        status: 502,
        code: "isolation_unavailable",
        details: iso.error ?? "Audio isolation failed and requireIsolation=true",
      };
    }
    audioBytes = iso.bytes;
    wasIsolated = iso.isolated;
  }

  const uploadRes = await admin.storage.from(BUCKET).upload(args.objectPath, audioBytes, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (uploadRes.error) {
    console.error("[prek-word-tts] upload error:", uploadRes.error);
    return { ok: false, status: 500, details: uploadRes.error.message };
  }
  void admin.functions
    .invoke("migrate-to-r2", {
      body: {
        action: "copy-path",
        bucket: BUCKET,
        path: args.objectPath,
        contentType: "audio/mpeg",
        size: audioBytes.byteLength,
      },
    })
    .catch((e) => console.warn(`[prek-word-tts] R2 mirror failed: ${e}`));

  const signed = await admin.storage.from(BUCKET).createSignedUrl(args.objectPath, SIGNED_URL_TTL);
  if (!signed.data?.signedUrl) return { ok: false, status: 500, details: "Signing failed" };
  return { ok: true, signedUrl: signed.data.signedUrl, isolated: wasIsolated };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return json({ error: "ElevenLabs is not connected" }, 500);

    const body = (await req.json().catch(() => ({}))) as {
      word?: string;
      voiceId?: string;
      mode?: "say" | "teach" | "teach-segment" | "purge";
      segmentKind?: SegKind;
      segmentText?: string;
      force?: boolean;
      isolate?: boolean; // per-request override; default true
    };
    const rawMode = body.mode ?? "say";
    const voiceId = (body.voiceId && body.voiceId.trim()) || DEFAULT_VOICE_ID;
    const force = body.force === true;
    const isolate = body.isolate !== false; // default ON

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --------------- purge (super_admin only) ---------------
    if (rawMode === "purge") {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      const userId = claims?.claims?.sub as string | undefined;
      if (!userId) return json({ error: "Unauthorized" }, 401);
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
      const isSuper = (roles ?? []).some((r) => r.role === "super_admin");
      if (!isSuper) return json({ error: "Forbidden" }, 403);

      let totalDeleted = 0;
      for (const prefix of POISONED_PREFIXES) {
        // list every subfolder + file under <voiceId>/<prefix>/**
        const walk = async (dir: string): Promise<string[]> => {
          const paths: string[] = [];
          let offset = 0;
          for (;;) {
            const { data, error } = await admin.storage.from(BUCKET).list(dir, {
              limit: 1000,
              offset,
            });
            if (error || !data || data.length === 0) break;
            for (const entry of data) {
              if (entry.name.endsWith(".mp3")) paths.push(`${dir}/${entry.name}`);
              else if (!entry.name.includes(".")) {
                const nested = await walk(`${dir}/${entry.name}`);
                paths.push(...nested);
              }
            }
            if (data.length < 1000) break;
            offset += 1000;
          }
          return paths;
        };
        const paths = await walk(`${voiceId}/${prefix}`);
        // batch delete in chunks of 100
        for (let i = 0; i < paths.length; i += 100) {
          const chunk = paths.slice(i, i + 100);
          const { error } = await admin.storage.from(BUCKET).remove(chunk);
          if (!error) totalDeleted += chunk.length;
          else console.error("[prek-word-tts:purge] remove chunk failed:", error);
        }
      }
      return json({ purged: totalDeleted, voiceId, prefixes: POISONED_PREFIXES });
    }

    const mode: "say" | "teach" | "teach-segment" =
      rawMode === "teach-segment" || rawMode === "teach" ? rawMode : "say";

    // --------------- teach-segment ---------------
    if (mode === "teach-segment") {
      const kind = body.segmentKind;
      const text = (body.segmentText ?? "").trim();
      if (!kind || !SEG_KINDS.includes(kind)) return json({ error: "Invalid segmentKind" }, 400);
      if (!text || text.length > 200) return json({ error: "Invalid segmentText" }, 400);

      const slug = slugify(text);
      if (!slug) return json({ error: "Invalid segmentText" }, 400);
      const objectPath = `${voiceId}/${CACHE_VERSION}/${kind}/${slug}.mp3`;

      if (!force) {
        const existing = await admin.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL);
        if (existing.data?.signedUrl) {
          return json({ signedUrl: existing.data.signedUrl, cached: true });
        }
      }

      const settings = KIND_SETTINGS[kind];
      // Prompt trick: wrap letter names with trailing period so ElevenLabs
      // reads them as a name ("cee.") not the phoneme /k/.
      const prompt = kind === "letter" ? `${text}.` : text;

      const result = await generateAndStore(admin, apiKey, {
        voiceId, objectPath, prompt,
        voiceSettings: settings,
        isolate,
      });
      if (!result.ok) return json({ error: "TTS failed", status: result.status, details: result.details }, result.status);
      return json({ signedUrl: result.signedUrl, cached: false });
    }

    // --------------- say / teach (legacy) ---------------
    const word = (body.word ?? "").trim();
    if (!word || word.length > 60) return json({ error: "Invalid word" }, 400);
    const slug = slugify(word, 60);
    if (!slug) return json({ error: "Invalid word" }, 400);
    const objectPath = `${voiceId}/${LEGACY_VERSION}/${mode}/${slug}.mp3`;

    if (!force) {
      const existing = await admin.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL);
      if (existing.data?.signedUrl) {
        return json({ signedUrl: existing.data.signedUrl, cached: true });
      }
    }

    const prompt = mode === "teach" ? buildLegacyTeachPrompt(word) : buildSayPrompt(word);
    const settings = {
      stability: mode === "teach" ? 0.75 : 0.70,
      similarity_boost: 0.90,
      style: mode === "teach" ? 0.15 : 0.10,
      speed: mode === "teach" ? 0.80 : 0.90,
    };

    const result = await generateAndStore(admin, apiKey, {
      voiceId, objectPath, prompt,
      voiceSettings: settings,
      isolate,
    });
    if (!result.ok) return json({ error: "TTS failed", status: result.status, details: result.details }, result.status);
    return json({ signedUrl: result.signedUrl, cached: false });
  } catch (err) {
    console.error("[prek-word-tts] error:", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});
