// prek-clip-music-extract — LALAL.AI stem separation for one Pre-K clip.
//
// Pipeline:
//   1) Verify caller is authenticated + content_editor / super_admin.
//   2) Download source MP4 audio bytes from prek-level-videos.
//   3) POST bytes to LALAL.AI /api/v1/upload/ → returns source_id.
//   4) POST /api/v1/split/stem_separator/ with splitter=phoenix, stem=vocals.
//      (Vocals stem is used only as the target; we keep the inverse "back" track
//      which contains music + SFX minus the voice.)
//   5) Poll /api/v1/check/ until status=success.
//   6) Download the back/no_vocals URL, upload to prek-level-audio at
//      music/<levelId>/<sceneKey>-<ts>.mp3, merge into
//      prek_levels.music_audio_paths.
//   7) Ensure a "Benny (Music)" track (index 89) exists and upsert a
//      `source_kind='music'` audio clip anchored to this scene.
//   8) Return { storagePath, signedUrl }.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const VIDEO_BUCKET = "prek-level-videos";
const AUDIO_BUCKET = "prek-level-audio";
const MUSIC_TRACK_NAME = "Benny (Music)";
const MUSIC_TRACK_INDEX = 89; // sits directly below Redub (index 90)

const LALAL_BASE = "https://www.lalal.ai/api/v1";
// Cap in-function polling well under Supabase Edge Function wall-clock
// (~150s free / 400s paid). If LALAL isn't done, return {status:"pending", jobId}
// and let the client resume by re-invoking with { resumeJobId }.
const POLL_DEADLINE_MS = 90 * 1000;

const PREMIUM_REQUIRED_COPY =
  "LALAL API access is blocked: Premium license required to access this feature. Upgrade/replace LALAL_API_KEY with a Pro/API-enabled license.";

interface Body {
  levelId: string;
  sceneKey: string;
  sourceStoragePath: string;
  resumeJobId?: string;
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
    let waitMs = Math.min(1500 * Math.pow(2, i), 15000);
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
    const apiKey = Deno.env.get("LALAL_API_KEY");
    if (!apiKey) throw new Error("LALAL_API_KEY is not configured");

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

    let taskId: string;

    if (body.resumeJobId) {
      // Resuming an in-flight LALAL job — skip upload + split.
      taskId = body.resumeJobId;
    } else {
      // 0. Preflight the LALAL license before uploading media. This catches
      // account/plan problems immediately and prevents per-scene mystery fails.
      const preflightResp = await fetchWithRetry(`${LALAL_BASE}/limits/minutes_left/`, {
        method: "POST",
        headers: { "X-License-Key": apiKey },
      }, "LALAL license preflight", 1);
      if (!preflightResp.ok) {
        const t = await preflightResp.text();
        console.error(`LALAL preflight [${preflightResp.status}]: ${t}`);
        return json({
          error: "LALAL license preflight failed",
          status: preflightResp.status,
          details: simplifyLalalError(t),
        }, preflightResp.status);
      }
      const preflightJson = await preflightResp.json().catch(() => null);
      const minutesLeft = Number(preflightJson?.minutes_left);
      if (Number.isFinite(minutesLeft) && minutesLeft <= 0) {
        return json({
          error: "LALAL account has no processing minutes left",
          status: 402,
          details: "Add LALAL processing minutes or upgrade the LALAL account tied to LALAL_API_KEY.",
        }, 402);
      }

      // 1. Download source.
      const dl = await admin.storage.from(VIDEO_BUCKET).download(body.sourceStoragePath);
      if (dl.error || !dl.data) return json({ error: `Source download failed: ${dl.error?.message}` }, 500);
      const srcBytes = new Uint8Array(await dl.data.arrayBuffer());

      // 2. Upload to LALAL.AI (with retry on transient errors).
      const upResp = await fetchWithRetry(`${LALAL_BASE}/upload/`, {
        method: "POST",
        headers: {
          "X-License-Key": apiKey,
          "Content-Disposition": `attachment; filename="source.mp4"`,
          "Content-Type": "application/octet-stream",
        },
        body: srcBytes,
      }, "LALAL upload");
      if (!upResp.ok) {
        const t = await upResp.text();
        console.error(`LALAL upload [${upResp.status}]: ${t}`);
        return json({ error: "LALAL upload failed", status: upResp.status, details: simplifyLalalError(t) }, upResp.status);
      }
      const upJson = await upResp.json();
      const sourceId = upJson?.id as string | undefined;
      if (!sourceId) {
        return json({ error: "LALAL upload response invalid", details: upJson }, 500);
      }

      // 3. Start split (phoenix splitter, vocals target → back/no_vocals = music+sfx).
      const splitResp = await fetchWithRetry(`${LALAL_BASE}/split/stem_separator/`, {
        method: "POST",
        headers: {
          "X-License-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_id: sourceId,
          presets: {
            stem: "vocals",
            splitter: "phoenix",
            extraction_level: "deep_extraction",
            encoder_format: "mp3",
          },
        }),
      }, "LALAL split");
      if (!splitResp.ok) {
        const t = await splitResp.text();
        console.error(`LALAL split [${splitResp.status}]: ${t}`);
        return json({ error: "LALAL split failed", status: splitResp.status, details: simplifyLalalError(t) }, splitResp.status);
      }
      const splitJson = await splitResp.json();
      taskId = splitJson?.task_id as string | undefined;
      if (!taskId) {
        return json({ error: "LALAL split rejected", details: splitJson }, 500);
      }
    }

    // 4. Poll for completion.
    let backTrackUrl: string | null = null;
    let lastEntry: unknown = null;
    let lastLogAt = 0;
    const deadline = Date.now() + POLL_DEADLINE_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4000));
      let checkResp: Response;
      try {
        checkResp = await fetchWithRetry(`${LALAL_BASE}/check/`, {
          method: "POST",
          headers: {
            "X-License-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task_ids: [taskId] }),
        }, "LALAL check");
      } catch (e) {
        console.warn(`LALAL check transient error: ${(e as Error).message}`);
        continue;
      }
      if (!checkResp.ok) {
        const t = await checkResp.text();
        console.warn(`LALAL check [${checkResp.status}]: ${t}`);
        continue;
      }
      const checkJson = await checkResp.json();
      const entry = checkJson?.result?.[taskId];
      lastEntry = entry;
      const state = entry?.status;
      if (state === "error" || state === "cancelled" || state === "server_error") {
        return json({ error: "LALAL processing failed", details: entry?.error ?? entry }, 500);
      }
      if (state === "success") {
        const tracks = Array.isArray(entry?.result?.tracks) ? entry.result.tracks : [];
        const backTrack = tracks.find((track: { type?: string; label?: string; url?: string }) => track?.type === "back")
          ?? tracks.find((track: { type?: string; label?: string; url?: string }) => String(track?.label ?? "").toLowerCase().includes("no_vocals"))
          ?? tracks.find((track: { type?: string; label?: string; url?: string }) => String(track?.label ?? "").toLowerCase().includes("music"));
        backTrackUrl = backTrack?.url ?? null;
        if (backTrackUrl) break;
        // success but no back/no_vocals track — bail with full entry so we can diagnose
        return json({ error: "LALAL reported success but no music/SFX URL", details: entry }, 500);
      }
      // Log progress every ~20s to keep logs readable.
      if (Date.now() - lastLogAt > 20000) {
        console.log(`[LALAL] ${taskId} state=${state ?? "unknown"} progress=${entry?.progress ?? "?"}`);
        lastLogAt = Date.now();
      }
    }
    if (!backTrackUrl) {
      // Not done yet — hand the jobId back so the client can resume without
      // re-uploading + re-splitting. HTTP 200 so supabase.functions.invoke
      // treats it as a normal response.
      console.log(`[LALAL] ${taskId} still processing after ${POLL_DEADLINE_MS}ms — returning pending`);
      return json({
        status: "pending",
        jobId: taskId,
        lastEntry,
      });
    }

    // 5. Download the music stem.
    const stemResp = await fetchWithRetry(backTrackUrl, {}, "LALAL stem download");
    if (!stemResp.ok) {
      const t = await stemResp.text();
      return json({ error: "Stem download failed", status: stemResp.status, details: t }, 500);
    }
    const stemBytes = new Uint8Array(await stemResp.arrayBuffer());

    // 6. Upload to storage.
    const outPath = `music/${body.levelId}/${body.sceneKey}-${Date.now()}.mp3`;
    const up = await admin.storage.from(AUDIO_BUCKET).upload(outPath, stemBytes, {
      contentType: "audio/mpeg", upsert: true,
    });
    if (up.error) return json({ error: `Upload failed: ${up.error.message}` }, 500);
    mirrorToR2Async(admin, AUDIO_BUCKET, outPath, "audio/mpeg", stemBytes.byteLength);

    // 7. Atomic JSONB merge into prek_levels.music_audio_paths — safe under
    // parallel Full Auto workers (no read-modify-write race).
    await admin.rpc("prek_merge_level_json" as any, {
      _level_id: body.levelId,
      _column: "music_audio_paths",
      _patch: { [body.sceneKey]: outPath },
    });
    await admin.from("prek_levels").update({
      music_generated_at: new Date().toISOString(),
    } as any).eq("id", body.levelId);

    // 8. Auto-place on timeline (Benny (Music) track, index 89).
    await ensureMusicClip(admin, {
      levelId: body.levelId,
      sceneKey: body.sceneKey,
      storagePath: outPath,
    });

    const { data: signed } = await admin.storage.from(AUDIO_BUCKET).createSignedUrl(outPath, 60 * 60 * 24 * 7);

    return json({
      storagePath: outPath,
      signedUrl: signed?.signedUrl ?? null,
    });
  } catch (e) {
    console.error("prek-clip-music-extract error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function ensureMusicClip(
  admin: ReturnType<typeof createClient>,
  args: { levelId: string; sceneKey: string; storagePath: string },
) {
  // Idempotent track upsert — safe when parallel workers race for the same
  // (level, track_index). ignoreDuplicates skips if the track already exists.
  await admin
    .from("prek_level_audio_tracks")
    .upsert(
      {
        level_id: args.levelId,
        track_index: MUSIC_TRACK_INDEX,
        name: MUSIC_TRACK_NAME,
        volume: 0.8,
        muted: false,
      },
      { onConflict: "level_id,track_index", ignoreDuplicates: true },
    );

  const { data: existingClip } = await admin
    .from("prek_level_audio_clips")
    .select("id")
    .eq("level_id", args.levelId)
    .eq("track_index", MUSIC_TRACK_INDEX)
    .eq("anchor_scene_key", args.sceneKey)
    .eq("source_kind", "music")
    .is("deleted_at", null)
    .maybeSingle();

  const clipPatch = {
    level_id: args.levelId,
    track_index: MUSIC_TRACK_INDEX,
    storage_path: args.storagePath,
    display_name: `Music — ${args.sceneKey}`,
    anchor_scene_key: args.sceneKey,
    anchor_edge: "start" as const,
    anchor_offset_seconds: 0,
    duration_mode: "fill-scene" as const,
    volume: 0.8,
    fade_in_seconds: 0,
    fade_out_seconds: 0,
    loop_clip: false,
    // Background music should keep playing UNDER word cards — only the redubbed
    // voice should duck. Word cards mute video + redub; music bed continues.
    pause_on_word_card: false,
    trim_start_seconds: 0,
    playback_rate: 1.0,
    source_kind: "music" as const,
  };

  if (existingClip?.id) {
    await admin.from("prek_level_audio_clips").update(clipPatch).eq("id", existingClip.id);
  } else {
    await admin.from("prek_level_audio_clips").insert(clipPatch);
  }

  // Music-only runs still need the source MP4 audio muted, otherwise the
  // original (un-swapped) Benny voice plays underneath the separated music.
  await admin.from("prek_levels").update({ mute_source_video_audio: true }).eq("id", args.levelId);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function simplifyLalalError(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    const detail = parsed?.detail ?? parsed?.error ?? parsed?.message;
    const text = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : raw;
    if (text.toLowerCase().includes("premium license required")) return PREMIUM_REQUIRED_COPY;
    return text;
  } catch {
    if (raw.toLowerCase().includes("premium license required")) return PREMIUM_REQUIRED_COPY;
    return raw;
  }
}

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
      console.warn(`[prek-clip-music-extract] R2 mirror failed for ${bucket}/${path}:`, e);
    }
  })();
}
