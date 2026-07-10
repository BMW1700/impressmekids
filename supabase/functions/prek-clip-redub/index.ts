// prek-clip-redub — ElevenLabs Speech-to-Speech redub for one Pre-K source clip.
//
// Client sends { levelId, sceneKey, sourceStoragePath, voiceId, stability?, similarityBoost? }.
// We:
//   1) Verify caller is authenticated + content_editor / super_admin.
//   2) Download the source MP4 audio track from Storage (server-side, no CORS issues).
//   3) POST the audio bytes to ElevenLabs STS with the requested cloned voice.
//   4) Upload the returned MP3 to Storage at prek-level-videos/redub/<levelId>/<sceneKey>.mp3.
//   5) Merge the returned path into prek_levels.redub_audio_paths jsonb, keyed by sceneKey.
//   6) Return { storagePath, signedUrl }.
//
// STS preserves the source cadence, so lip-sync stays aligned with the original video
// while the voice identity swaps to the customer's cloned "Benny" voice.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ELEVENLABS_STS_MODEL = "eleven_multilingual_sts_v2";
const BUCKET = "prek-level-videos";

interface Body {
  levelId: string;
  sceneKey: string;
  sourceStoragePath: string; // relative path inside prek-level-videos
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) throw new Error("ElevenLabs is not connected to this project");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", userId);
    const allowed = (roles ?? []).some((r) => r.role === "super_admin" || r.role === "content_editor");
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const body = (await req.json()) as Body;
    if (!body.levelId || !body.sceneKey || !body.sourceStoragePath || !body.voiceId) {
      return json({ error: "Missing required fields" }, 400);
    }

    // 1. Download source video bytes (server-side; no browser CORS).
    const dl = await admin.storage.from(BUCKET).download(body.sourceStoragePath);
    if (dl.error || !dl.data) return json({ error: `Source download failed: ${dl.error?.message}` }, 500);
    const srcBytes = new Uint8Array(await dl.data.arrayBuffer());

    // 2. Call ElevenLabs Speech-to-Speech. It accepts multipart audio.
    const form = new FormData();
    form.append("audio", new Blob([srcBytes], { type: "video/mp4" }), "source.mp4");
    form.append("model_id", ELEVENLABS_STS_MODEL);
    form.append("output_format", "mp3_44100_128");
    if (body.stability != null) form.append("voice_settings", JSON.stringify({
      stability: body.stability,
      similarity_boost: body.similarityBoost ?? 0.85,
    }));

    const stsResp = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${body.voiceId}?output_format=mp3_44100_128`,
      { method: "POST", headers: { "xi-api-key": apiKey }, body: form },
    );
    if (!stsResp.ok) {
      const errText = await stsResp.text();
      console.error(`ElevenLabs STS [${stsResp.status}]: ${errText}`);
      return json({ error: "ElevenLabs STS failed", status: stsResp.status, details: errText }, stsResp.status);
    }
    const mp3Bytes = new Uint8Array(await stsResp.arrayBuffer());

    // 3. Upload the redubbed MP3.
    const outPath = `redub/${body.levelId}/${body.sceneKey}-${Date.now()}.mp3`;
    const up = await admin.storage.from(BUCKET).upload(outPath, mp3Bytes, {
      contentType: "audio/mpeg", upsert: true,
    });
    if (up.error) return json({ error: `Upload failed: ${up.error.message}` }, 500);

    // 4. Merge into prek_levels.redub_audio_paths (jsonb: { [sceneKey]: storagePath }).
    const { data: levelRow } = await admin
      .from("prek_levels").select("redub_audio_paths").eq("id", body.levelId).single();
    const paths = (levelRow?.redub_audio_paths as Record<string, string> | null) ?? {};
    paths[body.sceneKey] = outPath;
    await admin.from("prek_levels").update({
      redub_audio_paths: paths,
      redub_voice_id: body.voiceId,
      redub_stability: body.stability ?? null,
      redub_similarity_boost: body.similarityBoost ?? null,
      redub_generated_at: new Date().toISOString(),
    }).eq("id", body.levelId);

    // 5. Return a signed URL for immediate playback.
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(outPath, 60 * 60 * 24 * 7);

    return json({ storagePath: outPath, signedUrl: signed?.signedUrl ?? null });
  } catch (e) {
    console.error("prek-clip-redub error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
