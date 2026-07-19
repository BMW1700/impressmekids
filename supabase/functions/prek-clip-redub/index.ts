// prek-clip-redub — ElevenLabs Voice Isolator + Speech-to-Speech for one Pre-K clip.
//
// Pipeline:
//   1) Verify caller is authenticated + content_editor / super_admin.
//   2) Download source MP4 audio bytes from prek-level-videos (server-side, no CORS).
//   3) If `isolate !== false`: POST bytes to ElevenLabs Voice Isolator
//      (/v1/audio-isolation), upload the isolated MP3 to prek-level-audio at
//      redub/<levelId>/<sceneKey>-isolated.mp3 and stash the path in
//      prek_levels.redub_isolated_paths.
//   4) If `isolateOnly` — return the isolated preview URL and stop (saves STS credits).
//   5) POST the isolated MP3 (or raw source if isolation was disabled) to STS
//      /v1/speech-to-speech/{voiceId} to swap voice identity while preserving cadence.
//   6) Upload the redub MP3 to prek-level-audio at redub/<levelId>/<sceneKey>-<ts>.mp3
//      and merge into prek_levels.redub_audio_paths.
//   7) Ensure a "Benny (Redub)" track exists and upsert a `source_kind='redub'`
//      audio clip anchored to this scene, so the redub appears on the timeline
//      automatically and replaces any previous redub for the same scene.
//   8) Return { storagePath, signedUrl, isolatedStoragePath, isolatedSignedUrl }.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ELEVENLABS_STS_MODEL = "eleven_multilingual_sts_v2";
const VIDEO_BUCKET = "prek-level-videos";
const AUDIO_BUCKET = "prek-level-audio";
const REDUB_TRACK_NAME = "Benny (Redub)";
const REDUB_TRACK_INDEX = 90; // high index so it sits on top of manual tracks

interface Body {
  levelId: string;
  sceneKey: string;
  sourceStoragePath: string;
  /** Optional storage bucket for source. Defaults to VIDEO_BUCKET. Set to
   *  AUDIO_BUCKET when the "source" is a pre-trimmed WAV/MP3 written by the
   *  Region Rescue tool. */
  sourceBucket?: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  isolate?: boolean;     // default true
  isolateOnly?: boolean; // default false — skip STS
  stage?: "isolate" | "sts";
  isolatedStoragePath?: string; // required when stage === "sts"
  sceneDurationSeconds?: number;
  sourceRawDurationSeconds?: number;
  sourceTrimStartSeconds?: number;
  sourceTrimEndSeconds?: number;
  /** When true the client already trimmed the audio to the exact phrase; the
   *  resulting clip is placed with trim_start=0 / trim_end=null so it plays
   *  in full at the scene's timeline start. */
  clipIsPreTrimmed?: boolean;
}

// Retry helper: retries on network errors, 5xx, and 429 rate limits.
// Honors Retry-After when present (capped at 15s). 4xx (non-429) returns immediately.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  label: string,
  attempts = 3,
): Promise<Response> {
  let lastErr: unknown = null;
  for (let i = 0; i <= attempts; i++) {
    let waitMs = Math.min(1500 * Math.pow(2, i), 15000); // 1.5s → 15s cap
    try {
      const resp = await fetch(url, init);
      if (resp.ok) return resp;
      if (resp.status !== 429 && resp.status >= 400 && resp.status < 500) return resp;
      if (resp.status === 429) {
        const ra = resp.headers.get("retry-after");
        const raSec = ra ? Number(ra) : NaN;
        if (Number.isFinite(raSec) && raSec > 0) waitMs = Math.min(raSec * 1000, 15000);
        console.warn(`[${label}] attempt ${i + 1} 429, waiting ${waitMs}ms`);
      } else {
        console.warn(`[${label}] attempt ${i + 1} got ${resp.status}, retrying…`);
      }
      lastErr = new Error(`${label} HTTP ${resp.status}`);
    } catch (e) {
      lastErr = e;
      console.warn(`[${label}] attempt ${i + 1} network error:`, (e as Error).message);
    }
    if (i < attempts) await new Promise((r) => setTimeout(r, waitMs));
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} failed`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) throw new Error("ElevenLabs is not connected to this project");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

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
    if (!body.levelId || !body.sceneKey || !body.sourceStoragePath) {
      return json({ error: "Missing required fields" }, 400);
    }
    const isolate = body.isolate !== false;
    const isolateOnly = body.isolateOnly === true;
    const stage = body.stage; // "isolate" | "sts" | undefined
    const doIsolatePhase = stage === "isolate" || (stage === undefined && isolate);
    const doStsPhase = stage === "sts" || (stage === undefined && !isolateOnly);
    if (doStsPhase && !body.voiceId) {
      return json({ error: "voiceId is required unless isolateOnly=true" }, 400);
    }
    if (stage === "sts" && !body.isolatedStoragePath) {
      return json({ error: "isolatedStoragePath is required for stage=sts" }, 400);
    }

    let audioBytes: Uint8Array;
    let audioMime = "audio/mpeg";
    let isolatedStoragePath: string | null = null;
    let isolatedSignedUrl: string | null = null;

    if (stage === "sts") {
      // Phase B — load previously isolated MP3 directly from storage.
      isolatedStoragePath = body.isolatedStoragePath!;
      const dl = await admin.storage.from(AUDIO_BUCKET).download(isolatedStoragePath);
      if (dl.error || !dl.data) return json({ error: `Isolated download failed: ${dl.error?.message}` }, 500);
      audioBytes = new Uint8Array(await dl.data.arrayBuffer());
      audioMime = "audio/mpeg";
    } else {
      // 1. Download source bytes (Phase A, or legacy single-shot). Source
      //    normally lives in VIDEO_BUCKET, but the Region Rescue tool uploads
      //    a pre-trimmed WAV to AUDIO_BUCKET and passes sourceBucket to point
      //    us at it.
      const srcBucket = body.sourceBucket || VIDEO_BUCKET;
      const dl = await admin.storage.from(srcBucket).download(body.sourceStoragePath);
      if (dl.error || !dl.data) return json({ error: `Source download failed: ${dl.error?.message}` }, 500);
      audioBytes = new Uint8Array(await dl.data.arrayBuffer());
      audioMime = srcBucket === AUDIO_BUCKET ? "audio/wav" : "video/mp4";

      // 2. Voice isolation (removes music, secondary voices, room noise → clean Benny stem).
      if (doIsolatePhase) {
        const isoForm = new FormData();
        isoForm.append("audio", new Blob([audioBytes], { type: audioMime }), audioMime === "audio/wav" ? "source.wav" : "source.mp4");
        const isoResp = await fetchWithRetry("https://api.elevenlabs.io/v1/audio-isolation", {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: isoForm,
        }, "ElevenLabs Isolation");
        if (!isoResp.ok) {
          const errText = await isoResp.text();
          console.error(`ElevenLabs Isolation [${isoResp.status}]: ${errText}`);
          return json({ error: "Voice Isolation failed", status: isoResp.status, details: errText }, isoResp.status);
        }
        const isolatedBytes = new Uint8Array(await isoResp.arrayBuffer());

        isolatedStoragePath = `redub/${body.levelId}/${body.sceneKey}-isolated-${Date.now()}.mp3`;
        const isoUp = await admin.storage.from(AUDIO_BUCKET).upload(isolatedStoragePath, isolatedBytes, {
          contentType: "audio/mpeg", upsert: true,
        });
        if (isoUp.error) return json({ error: `Isolated upload failed: ${isoUp.error.message}` }, 500);
        mirrorToR2Async(admin, AUDIO_BUCKET, isolatedStoragePath, "audio/mpeg", isolatedBytes.byteLength);

        // Atomic JSONB merge — safe under parallel Full Auto workers.
        await admin.rpc("prek_merge_level_json" as any, {
          _level_id: body.levelId,
          _column: "redub_isolated_paths",
          _patch: { [body.sceneKey]: isolatedStoragePath },
        });

        const { data: isoSigned } = await admin.storage
          .from(AUDIO_BUCKET).createSignedUrl(isolatedStoragePath, 60 * 60 * 24 * 7);
        isolatedSignedUrl = isoSigned?.signedUrl ?? null;

        // Feed the isolated stem into STS instead of the raw MP4.
        audioBytes = isolatedBytes;
        audioMime = "audio/mpeg";
      }
    }

    // Stage A only — return early so caller can invoke Phase B separately.
    if (stage === "isolate" || isolateOnly) {
      return json({
        status: "isolated",
        storagePath: null,
        signedUrl: null,
        isolatedStoragePath,
        isolatedSignedUrl,
      });
    }

    if (!doStsPhase) {
      // Defensive — shouldn't reach here.
      return json({ error: "No work to do" }, 400);
    }


    // 3. Speech-to-Speech — swap voice identity, preserve cadence for lip-sync.
    const stsForm = new FormData();
    const stsFilename = audioMime === "audio/mpeg" ? "source.mp3" : "source.mp4";
    stsForm.append("audio", new Blob([audioBytes], { type: audioMime }), stsFilename);
    stsForm.append("model_id", ELEVENLABS_STS_MODEL);
    stsForm.append("output_format", "mp3_44100_128");
    if (body.stability != null) stsForm.append("voice_settings", JSON.stringify({
      stability: body.stability,
      similarity_boost: body.similarityBoost ?? 0.85,
    }));

    const stsResp = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/speech-to-speech/${body.voiceId}?output_format=mp3_44100_128`,
      { method: "POST", headers: { "xi-api-key": apiKey }, body: stsForm },
      "ElevenLabs STS",
    );
    if (!stsResp.ok) {
      const errText = await stsResp.text();
      console.error(`ElevenLabs STS [${stsResp.status}]: ${errText}`);
      return json({ error: "ElevenLabs STS failed", status: stsResp.status, details: errText }, stsResp.status);
    }
    const mp3Bytes = new Uint8Array(await stsResp.arrayBuffer());

    // 4. Upload the redubbed MP3 to the audio bucket (so the timeline clip can play it).
    const outPath = `redub/${body.levelId}/${body.sceneKey}-${Date.now()}.mp3`;
    const up = await admin.storage.from(AUDIO_BUCKET).upload(outPath, mp3Bytes, {
      contentType: "audio/mpeg", upsert: true,
    });
    if (up.error) return json({ error: `Upload failed: ${up.error.message}` }, 500);
    mirrorToR2Async(admin, AUDIO_BUCKET, outPath, "audio/mpeg", mp3Bytes.byteLength);

    // 5. Atomic JSONB merge into redub_audio_paths, plus scalar metadata.
    await admin.rpc("prek_merge_level_json" as any, {
      _level_id: body.levelId,
      _column: "redub_audio_paths",
      _patch: { [body.sceneKey]: outPath },
    });
    await admin.from("prek_levels").update({
      redub_voice_id: body.voiceId,
      redub_stability: body.stability ?? null,
      redub_similarity_boost: body.similarityBoost ?? null,
      redub_generated_at: new Date().toISOString(),
    }).eq("id", body.levelId);

    // 6. Auto-place on timeline: ensure "Benny (Redub)" track exists, upsert clip.
    await ensureRedubClip(admin, {
      levelId: body.levelId,
      sceneKey: body.sceneKey,
      storagePath: outPath,
      sceneDurationSeconds: body.sceneDurationSeconds,
      sourceRawDurationSeconds: body.sourceRawDurationSeconds,
      sourceTrimStartSeconds: body.clipIsPreTrimmed ? 0 : body.sourceTrimStartSeconds,
      sourceTrimEndSeconds: body.clipIsPreTrimmed ? undefined : body.sourceTrimEndSeconds,
      clipIsPreTrimmed: body.clipIsPreTrimmed === true,
    });

    const { data: signed } = await admin.storage.from(AUDIO_BUCKET).createSignedUrl(outPath, 60 * 60 * 24 * 7);

    return json({
      storagePath: outPath,
      signedUrl: signed?.signedUrl ?? null,
      isolatedStoragePath,
      isolatedSignedUrl,
    });
  } catch (e) {
    console.error("prek-clip-redub error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function ensureRedubClip(
  admin: ReturnType<typeof createClient>,
  args: {
    levelId: string;
    sceneKey: string;
    storagePath: string;
    sceneDurationSeconds?: number;
    sourceRawDurationSeconds?: number;
    sourceTrimStartSeconds?: number;
    sourceTrimEndSeconds?: number;
    clipIsPreTrimmed?: boolean;
  },
) {
  // 1. Idempotent track upsert — safe under parallel workers racing the same
  // (level_id, track_index). ignoreDuplicates skips if a track already exists.
  await admin
    .from("prek_level_audio_tracks")
    .upsert(
      {
        level_id: args.levelId,
        track_index: REDUB_TRACK_INDEX,
        name: REDUB_TRACK_NAME,
        volume: 1.0,
        muted: false,
      },
      { onConflict: "level_id,track_index", ignoreDuplicates: true },
    );

  // 2. Upsert the redub clip for this scene (unique per (level, track, scene) when source_kind='redub').
  const { data: existingClip } = await admin
    .from("prek_level_audio_clips")
    .select("id")
    .eq("level_id", args.levelId)
    .eq("track_index", REDUB_TRACK_INDEX)
    .eq("anchor_scene_key", args.sceneKey)
    .eq("source_kind", "redub")
    .is("deleted_at", null)
    .maybeSingle();

  const trimmedDuration = Number.isFinite(args.sceneDurationSeconds) && Number(args.sceneDurationSeconds) > 0
    ? Number(args.sceneDurationSeconds)
    : null;
  const rawDuration = Number.isFinite(args.sourceRawDurationSeconds) && Number(args.sourceRawDurationSeconds) > 0
    ? Number(args.sourceRawDurationSeconds)
    : trimmedDuration != null
      ? Number(args.sourceTrimStartSeconds || 0) + trimmedDuration
      : null;
  const trimStart = Number.isFinite(args.sourceTrimStartSeconds) && Number(args.sourceTrimStartSeconds) > 0
    ? Number(args.sourceTrimStartSeconds)
    : 0;
  const trimEnd = Number.isFinite(args.sourceTrimEndSeconds) && Number(args.sourceTrimEndSeconds) > 0
    ? Number(args.sourceTrimEndSeconds)
    : null;
  // Keep trim-in for lip sync, but don't hard-cut exactly at source trim-out.
  // ElevenLabs can add a small sentence tail; the runtime already freeze-holds
  // the last frame while fixed redub audio finishes.
  // Region-rescue redubs are already trimmed to the exact phrase, so we play
  // them start-to-end without any tail trimming.
  const redubTrimEnd = args.clipIsPreTrimmed
    ? null
    : trimEnd != null && rawDuration != null
      ? Math.min(rawDuration, trimEnd + 2) >= rawDuration - 0.01
        ? null
        : Math.min(rawDuration, trimEnd + 2)
      : null;

  const clipPatch = {
    level_id: args.levelId,
    track_index: REDUB_TRACK_INDEX,
    storage_path: args.storagePath,
    display_name: `Redub — ${args.sceneKey}`,
    anchor_scene_key: args.sceneKey,
    anchor_edge: "start" as const,
    anchor_offset_seconds: 0,
    duration_mode: "fixed" as const,
    duration_seconds: rawDuration,
    volume: 1.0,
    fade_in_seconds: 0,
    fade_out_seconds: 0,
    loop_clip: false,
    pause_on_word_card: true,
    trim_start_seconds: trimStart,
    trim_end_seconds: redubTrimEnd,
    playback_rate: 1.0,
    source_kind: "redub" as const,
  };

  if (existingClip?.id) {
    const { error } = await admin.from("prek_level_audio_clips").update(clipPatch).eq("id", existingClip.id);
    if (error) throw new Error(`Failed to update redub clip: ${error.message}`);
  } else {
    const { error } = await admin.from("prek_level_audio_clips").insert(clipPatch);
    if (error) {
      const { data: racedClip, error: racedReadError } = await admin
        .from("prek_level_audio_clips")
        .select("id")
        .eq("level_id", args.levelId)
        .eq("track_index", REDUB_TRACK_INDEX)
        .eq("anchor_scene_key", args.sceneKey)
        .eq("source_kind", "redub")
        .is("deleted_at", null)
        .maybeSingle();
      if (racedReadError || !racedClip?.id) throw new Error(`Failed to insert redub clip: ${error.message}`);
      const { error: retryError } = await admin.from("prek_level_audio_clips").update(clipPatch).eq("id", racedClip.id);
      if (retryError) throw new Error(`Failed to repair raced redub clip: ${retryError.message}`);
    }
  }

  // 3. Auto-enable "mute source video audio" so the redub isn't fighting the original.
  await admin.from("prek_levels").update({ mute_source_video_audio: true }).eq("id", args.levelId);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Fire-and-forget copy of a freshly-uploaded Supabase Storage object into
 * Cloudflare R2 via the migrate-to-r2 edge function. Zero-egress reads via
 * cdn.yubilearn.com (or presigned R2 URLs for private buckets). Failures
 * are non-fatal — the HEAD-check fallback in src/lib/cdn.ts still catches
 * anything this misses, and the manual R2 Migration tool can backfill.
 */
function mirrorToR2Async(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  contentType: string,
  size: number,
): void {
  void (async () => {
    try {
      await admin.functions.invoke("migrate-to-r2", {
        body: { action: "copy-path", bucket, path, contentType, size },
        headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      });
    } catch (e) {
      console.warn(`[prek-clip-redub] R2 mirror failed for ${bucket}/${path}:`, e);
    }
  })();
}
