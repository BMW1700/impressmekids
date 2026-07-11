// prek-word-tts — ElevenLabs TTS for Pre-K word pronunciation & phonics teach.
//
// Modes:
//   "say"            — legacy single MP3 that speaks the whole word twice.
//   "teach"          — legacy single MP3 that mumbles the whole teach flow.
//                      DEPRECATED; kept only so old cached calls still resolve.
//   "teach-segment"  — NEW. One tiny MP3 per phonics segment (letter, sound,
//                      syllable, blend, whole, narration). The client plays
//                      them in order with real code-controlled silences.
//
// Cache layout:
//   Legacy:  <voiceId>/v2/<mode>/<slug>.mp3
//   New:     <voiceId>/v3/<segmentKind>/<slugSegmentText>.mp3

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const BUCKET = "prek-word-tts";
const LEGACY_VERSION = "v2";
const CACHE_VERSION = "v3";
const DEFAULT_VOICE_ID = Deno.env.get("BENNY_DEFAULT_VOICE_ID")?.trim() || "IKne3meq5aSn9XLyUdCD";
const MODEL_ID = "eleven_turbo_v2_5";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

type SegKind = "whole" | "narration" | "letter" | "sound" | "syllable" | "blend";
const SEG_KINDS: SegKind[] = ["whole", "narration", "letter", "sound", "syllable", "blend"];

// Per-kind ElevenLabs voice_settings. These are baked into the MP3 so
// playback never needs to speed-warp the audio.
const KIND_SETTINGS: Record<SegKind, {
  speed: number; stability: number; style: number; similarity_boost: number;
}> = {
  whole:     { speed: 0.85, stability: 0.60, style: 0.15, similarity_boost: 0.85 },
  narration: { speed: 1.00, stability: 0.70, style: 0.20, similarity_boost: 0.85 },
  letter:    { speed: 0.85, stability: 0.75, style: 0.10, similarity_boost: 0.90 },
  sound:     { speed: 0.70, stability: 0.80, style: 0.15, similarity_boost: 0.90 },
  syllable:  { speed: 0.75, stability: 0.70, style: 0.15, similarity_boost: 0.85 },
  blend:     { speed: 0.75, stability: 0.70, style: 0.15, similarity_boost: 0.85 },
};

// ------- legacy CVC helpers (used only by mode:"teach" fallback) -------
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return json({ error: "ElevenLabs is not connected" }, 500);

    const body = (await req.json().catch(() => ({}))) as {
      word?: string;
      voiceId?: string;
      mode?: "say" | "teach" | "teach-segment";
      segmentKind?: SegKind;
      segmentText?: string;
      force?: boolean;
    };
    const rawMode = body.mode ?? "say";
    const mode: "say" | "teach" | "teach-segment" =
      rawMode === "teach-segment" || rawMode === "teach" ? rawMode : "say";
    const voiceId = (body.voiceId && body.voiceId.trim()) || DEFAULT_VOICE_ID;
    const force = body.force === true;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --------------- new: teach-segment ---------------
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
      // Prompt trick: wrap letters with a trailing period so ElevenLabs
      // reads them as a name ("cee.") not the phoneme /k/.
      const prompt = kind === "letter" ? `${text}.` : text;

      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            text: prompt,
            model_id: MODEL_ID,
            voice_settings: {
              stability: settings.stability,
              similarity_boost: settings.similarity_boost,
              style: settings.style,
              use_speaker_boost: true,
              speed: settings.speed,
            },
          }),
        },
      );
      if (!ttsRes.ok) {
        const errText = await ttsRes.text().catch(() => "");
        console.error(`[prek-word-tts:seg] ElevenLabs ${ttsRes.status}: ${errText}`);
        return json({ error: "TTS provider error", status: ttsRes.status, details: errText }, ttsRes.status);
      }
      const audioBytes = new Uint8Array(await ttsRes.arrayBuffer());
      const uploadRes = await admin.storage.from(BUCKET).upload(objectPath, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });
      if (uploadRes.error) {
        console.error("[prek-word-tts:seg] upload error:", uploadRes.error);
        return json({ error: "Upload failed", details: uploadRes.error.message }, 500);
      }
      void admin.functions
        .invoke("migrate-to-r2", {
          body: {
            action: "copy-path",
            bucket: BUCKET,
            path: objectPath,
            contentType: "audio/mpeg",
            size: audioBytes.byteLength,
          },
        })
        .catch((e) => console.warn(`[prek-word-tts:seg] R2 mirror failed: ${e}`));

      const signed = await admin.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL);
      if (!signed.data?.signedUrl) return json({ error: "Signing failed" }, 500);
      return json({ signedUrl: signed.data.signedUrl, cached: false });
    }

    // --------------- legacy: say / teach ---------------
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
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prompt,
          model_id: MODEL_ID,
          voice_settings: {
            stability: mode === "teach" ? 0.7 : 0.6,
            similarity_boost: 0.85,
            style: 0.2,
            use_speaker_boost: true,
            speed: mode === "teach" ? 0.75 : 0.85,
          },
        }),
      },
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text().catch(() => "");
      console.error(`[prek-word-tts] ElevenLabs ${ttsRes.status}: ${errText}`);
      return json({ error: "TTS provider error", status: ttsRes.status, details: errText }, ttsRes.status);
    }

    const audioBytes = new Uint8Array(await ttsRes.arrayBuffer());
    const uploadRes = await admin.storage.from(BUCKET).upload(objectPath, audioBytes, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (uploadRes.error) {
      console.error("[prek-word-tts] upload error:", uploadRes.error);
      return json({ error: "Upload failed", details: uploadRes.error.message }, 500);
    }
    void admin.functions
      .invoke("migrate-to-r2", {
        body: {
          action: "copy-path",
          bucket: BUCKET,
          path: objectPath,
          contentType: "audio/mpeg",
          size: audioBytes.byteLength,
        },
      })
      .catch((e) => console.warn(`[prek-word-tts] R2 mirror failed: ${e}`));

    const signed = await admin.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL);
    if (!signed.data?.signedUrl) {
      return json({ error: "Signing failed" }, 500);
    }
    return json({ signedUrl: signed.data.signedUrl, cached: false });
  } catch (err) {
    console.error("[prek-word-tts] error:", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});
