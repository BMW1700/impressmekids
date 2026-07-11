// prek-word-tts — ElevenLabs TTS for Pre-K word pronunciation & phonics teach.
//
// Cache-first: if an MP3 already exists at prek-word-tts/<voiceId>/v2/<mode>/<slug>.mp3
// we return a fresh signed URL and skip ElevenLabs entirely.
// Otherwise we call ElevenLabs TTS, upload the MP3, and return a signed URL.
//
// Body: { word: string, voiceId?: string, mode?: "say" | "teach", force?: boolean }
// Response: { signedUrl: string, cached: boolean }

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const BUCKET = "prek-word-tts";
const CACHE_VERSION = "v2"; // Bump to invalidate all previous cached MP3s
const DEFAULT_VOICE_ID = Deno.env.get("BENNY_DEFAULT_VOICE_ID")?.trim() || "IKne3meq5aSn9XLyUdCD";
const MODEL_ID = "eleven_turbo_v2_5";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

// Very rough letter → phoneme sound map for CVC teaching. Written using
// simple English "sound out" spellings that ElevenLabs pronounces well —
// avoids IPA which most TTS voices butcher.
const LETTER_SOUND: Record<string, string> = {
  a: "ah",
  b: "buh",
  c: "kuh",
  d: "duh",
  e: "eh",
  f: "fff",
  g: "guh",
  h: "huh",
  i: "ih",
  j: "juh",
  k: "kuh",
  l: "lll",
  m: "mmm",
  n: "nnn",
  o: "ah",
  p: "puh",
  q: "kwuh",
  r: "rrr",
  s: "sss",
  t: "tuh",
  u: "uh",
  v: "vvv",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zzz",
};

function slugifyWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
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

function buildTeachPrompt(word: string): string {
  const clean = word.trim();
  const letters = clean.replace(/[^a-zA-Z']/g, "").toLowerCase().split("");
  const syllables = splitSyllablesLoose(clean);

  if (syllables.length <= 1 && letters.length <= 5) {
    // CVC / short word: name letters, then sound them out, then blend.
    const letterNames = letters.map((l) => l.toUpperCase()).join("... ");
    const sounds = letters.map((l) => LETTER_SOUND[l] ?? l).join("... ");
    return `${clean}... Let's sound it out. ${letterNames}... ${sounds}... ${clean}!`;
  }
  // Longer / multi-syllable: name letters, break into syllables, blend.
  return `${clean}... Let's sound it out. ${syllables.join("... ")}... ${clean}!`;
}

function buildSayPrompt(word: string): string {
  // Say it twice with a real pause so a child hears it clearly.
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
      mode?: "say" | "teach";
      force?: boolean;
    };
    const word = (body.word ?? "").trim();
    if (!word || word.length > 60) return json({ error: "Invalid word" }, 400);
    const mode = body.mode === "teach" ? "teach" : "say";
    const voiceId = (body.voiceId && body.voiceId.trim()) || DEFAULT_VOICE_ID;
    const force = body.force === true;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const slug = slugifyWord(word);
    if (!slug) return json({ error: "Invalid word" }, 400);
    const objectPath = `${voiceId}/${CACHE_VERSION}/${mode}/${slug}.mp3`;

    if (!force) {
      const existing = await admin.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL);
      if (existing.data?.signedUrl) {
        return json({ signedUrl: existing.data.signedUrl, cached: true });
      }
    }

    const prompt = mode === "teach" ? buildTeachPrompt(word) : buildSayPrompt(word);
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
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
    // Best-effort mirror to R2 so future backfills / migrations pick it up.
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
