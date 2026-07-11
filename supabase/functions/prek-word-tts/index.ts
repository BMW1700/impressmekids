// prek-word-tts — ElevenLabs TTS for Pre-K word pronunciation & phonics teach.
//
// Cache-first: if an MP3 already exists at prek-word-tts/<voiceId>/<mode>/<slug>.mp3
// we return a fresh signed URL and skip ElevenLabs entirely.
// Otherwise we call ElevenLabs TTS, upload the MP3, and return a signed URL.
//
// Body: { word: string, voiceId?: string, mode?: "say" | "teach" }
// Response: { signedUrl: string, cached: boolean }

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const BUCKET = "prek-word-tts";
const DEFAULT_VOICE_ID = Deno.env.get("BENNY_DEFAULT_VOICE_ID")?.trim() || "IKne3meq5aSn9XLyUdCD";
const MODEL_ID = "eleven_turbo_v2_5";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

function slugifyWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function splitSyllablesLoose(word: string): string[] {
  // Simple heuristic mirroring the client's syllableHint.
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
  const letters = clean.replace(/[^a-zA-Z']/g, "").toUpperCase().split("").join(" — ");
  const syllables = splitSyllablesLoose(clean);
  if (syllables.length <= 1) {
    // CVC / short word: spell it, blend it, say it
    const blend = clean.replace(/[^a-zA-Z']/g, "").toLowerCase().split("").join(" - ");
    return `${clean}. ${letters}. ${blend}... ${clean}!`;
  }
  return `${clean}. ${syllables.join(" — ")}... ${clean}!`;
}

function buildSayPrompt(word: string): string {
  return `${word.trim()}.`;
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
    };
    const word = (body.word ?? "").trim();
    if (!word || word.length > 60) return json({ error: "Invalid word" }, 400);
    const mode = body.mode === "teach" ? "teach" : "say";
    const voiceId = (body.voiceId && body.voiceId.trim()) || DEFAULT_VOICE_ID;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const slug = slugifyWord(word);
    if (!slug) return json({ error: "Invalid word" }, 400);
    const objectPath = `${voiceId}/${mode}/${slug}.mp3`;

    // Cache probe: try to sign — if the object doesn't exist, signing fails.
    const existing = await admin.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL);
    if (existing.data?.signedUrl) {
      return json({ signedUrl: existing.data.signedUrl, cached: true });
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
            stability: 0.55,
            similarity_boost: 0.85,
            style: 0.35,
            use_speaker_boost: true,
            speed: mode === "teach" ? 0.9 : 1.0,
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
