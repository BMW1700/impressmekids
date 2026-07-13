// useBennyRedub — orchestrator for calling the prek-clip-redub edge function.
//
// Given a Pre-K level's scenes + source storage paths, this hook:
//   - Tracks per-scene status (idle / running / done / error).
//   - Provides `redubScene(sceneKey)` to redub a single scene.
//   - Provides `redubAll(scenes)` to sequentially redub every scene, with progress.
//   - Reloads the level's `redub_audio_paths` from DB after each success so the
//     UI can immediately preview the newly generated MP3.

import { useCallback, useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PREK_AUDIO_BUCKET } from "@/lib/preKAudioUpload";

export type RedubStatus = "idle" | "running" | "done" | "error";

export interface RedubSceneInput {
  sceneKey: string;
  sourceStoragePath: string; // relative path in prek-level-videos
  label: string;             // for display
}

export interface RedubState {
  status: RedubStatus;
  errorMessage?: string;
  progressMessage?: string;
  storagePath?: string;
  signedUrl?: string;
  isolatedStoragePath?: string;
  isolatedSignedUrl?: string;
}

export interface MusicState {
  status: RedubStatus;
  errorMessage?: string;
  progressMessage?: string;
  storagePath?: string;
  signedUrl?: string;
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const details = await error.context.text().catch(() => "");
    if (details) {
      try {
        const parsed = JSON.parse(details);
        const detailText = typeof parsed.details === "string"
          ? parsed.details
          : parsed.details
            ? JSON.stringify(parsed.details)
            : "";
        const message = [parsed.error, parsed.status ? `status ${parsed.status}` : "", detailText]
          .filter(Boolean)
          .join(" — ");
        return message || error.message;
      } catch {
        return details;
      }
    }
  }
  return error instanceof Error ? error.message : "Unknown error";
}

export interface LevelRedubSettings {
  voiceId: string;              // effective voice ID (level override or world default)
  levelVoiceId: string;         // raw level override (may be empty)
  worldDefaultVoiceId: string;  // world-level default (may be empty)
  worldId: string | null;
  stability: number;
  similarityBoost: number;
  audioPaths: Record<string, string>;
  isolatedPaths: Record<string, string>;
  musicPaths: Record<string, string>;
  generatedAt: string | null;
  musicGeneratedAt: string | null;
}

export function useBennyRedub(levelId: string | null) {
  const [settings, setSettings] = useState<LevelRedubSettings>({
    voiceId: "",
    levelVoiceId: "",
    worldDefaultVoiceId: "",
    worldId: null,
    stability: 0.5,
    similarityBoost: 0.85,
    audioPaths: {},
    isolatedPaths: {},
    musicPaths: {},
    generatedAt: null,
    musicGeneratedAt: null,
  });
  const [signedRedubUrls, setSignedRedubUrls] = useState<Record<string, string>>({});
  const [signedIsolatedUrls, setSignedIsolatedUrls] = useState<Record<string, string>>({});
  const [signedMusicUrls, setSignedMusicUrls] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, RedubState>>({});
  const [musicStates, setMusicStates] = useState<Record<string, MusicState>>({});
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [musicBatchProgress, setMusicBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [autoProgress, setAutoProgress] = useState<{ done: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!levelId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("prek_levels")
      .select("world_id, redub_voice_id, redub_stability, redub_similarity_boost, redub_audio_paths, redub_isolated_paths, redub_generated_at, music_audio_paths, music_generated_at")
      .eq("id", levelId)
      .maybeSingle();
    const paths = ((data?.redub_audio_paths as Record<string, string> | null) ?? {});
    const isoPaths = (((data as any)?.redub_isolated_paths as Record<string, string> | null) ?? {});
    const musicPaths = (((data as any)?.music_audio_paths as Record<string, string> | null) ?? {});
    const levelVoiceId = data?.redub_voice_id ?? "";
    const worldId = data?.world_id ?? null;
    let worldDefaultVoiceId = "";
    if (worldId) {
      const { data: w } = await supabase
        .from("prek_worlds")
        .select("default_redub_voice_id")
        .eq("id", worldId)
        .maybeSingle();
      worldDefaultVoiceId = (w as any)?.default_redub_voice_id ?? "";
    }
    setSettings({
      voiceId: levelVoiceId || worldDefaultVoiceId,
      levelVoiceId,
      worldDefaultVoiceId,
      worldId,
      stability: data?.redub_stability != null ? Number(data.redub_stability) : 0.5,
      similarityBoost: data?.redub_similarity_boost != null ? Number(data.redub_similarity_boost) : 0.85,
      audioPaths: paths,
      isolatedPaths: isoPaths,
      musicPaths,
      generatedAt: data?.redub_generated_at ?? null,
      musicGeneratedAt: (data as any)?.music_generated_at ?? null,
    });

    const allPaths = Array.from(new Set([
      ...Object.values(paths),
      ...Object.values(isoPaths),
      ...Object.values(musicPaths),
    ].filter(Boolean)));
    if (allPaths.length > 0) {
      const { data: signed } = await supabase.storage
        .from(PREK_AUDIO_BUCKET)
        .createSignedUrls(allPaths, 60 * 60 * 24 * 7);
      const map: Record<string, string> = {};
      (signed ?? []).forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      const byScene: Record<string, string> = {};
      const byIsoScene: Record<string, string> = {};
      const byMusicScene: Record<string, string> = {};
      for (const [sceneKey, storagePath] of Object.entries(paths)) {
        if (map[storagePath]) byScene[sceneKey] = map[storagePath];
      }
      for (const [sceneKey, storagePath] of Object.entries(isoPaths)) {
        if (map[storagePath]) byIsoScene[sceneKey] = map[storagePath];
      }
      for (const [sceneKey, storagePath] of Object.entries(musicPaths)) {
        if (map[storagePath]) byMusicScene[sceneKey] = map[storagePath];
      }
      setSignedRedubUrls(byScene);
      setSignedIsolatedUrls(byIsoScene);
      setSignedMusicUrls(byMusicScene);
    } else {
      setSignedRedubUrls({});
      setSignedIsolatedUrls({});
      setSignedMusicUrls({});
    }
    setLoading(false);
  }, [levelId]);

  useEffect(() => { void reload(); }, [reload]);

  const saveVoiceSettings = useCallback(async (patch: Partial<Pick<LevelRedubSettings, "voiceId" | "stability" | "similarityBoost">>) => {
    if (!levelId) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.voiceId !== undefined) dbPatch.redub_voice_id = patch.voiceId || null;
    if (patch.stability !== undefined) dbPatch.redub_stability = patch.stability;
    if (patch.similarityBoost !== undefined) dbPatch.redub_similarity_boost = patch.similarityBoost;
    await supabase.from("prek_levels").update(dbPatch).eq("id", levelId);
    setSettings((s) => {
      const nextLevel = patch.voiceId !== undefined ? (patch.voiceId ?? "") : s.levelVoiceId;
      return {
        ...s,
        ...patch,
        levelVoiceId: nextLevel,
        voiceId: nextLevel || s.worldDefaultVoiceId,
      };
    });
  }, [levelId]);

  const saveWorldDefaultVoiceId = useCallback(async (voiceId: string) => {
    if (!settings.worldId) return;
    await supabase
      .from("prek_worlds")
      .update({ default_redub_voice_id: voiceId || null } as any)
      .eq("id", settings.worldId);
    setSettings((s) => ({
      ...s,
      worldDefaultVoiceId: voiceId,
      voiceId: s.levelVoiceId || voiceId,
    }));
  }, [settings.worldId]);

  const redubScene = useCallback(async (
    scene: RedubSceneInput,
    overrides?: { voiceId?: string; stability?: number; similarityBoost?: number; isolate?: boolean; isolateOnly?: boolean; forceReisolate?: boolean },
  ): Promise<boolean> => {
    if (!levelId) return false;
    const isolateOnly = overrides?.isolateOnly === true;
    const isolate = overrides?.isolate !== false;
    const forceReisolate = overrides?.forceReisolate === true;
    const voiceId = overrides?.voiceId ?? settings.voiceId;
    if (!isolateOnly && !voiceId) {
      setStates((m) => ({ ...m, [scene.sceneKey]: { status: "error", errorMessage: "Set a Benny voice ID first." } }));
      return false;
    }
    setStates((m) => ({ ...m, [scene.sceneKey]: { status: "running", progressMessage: isolate ? "Isolating voice…" : "Redubbing…" } }));

    const baseBody = {
      levelId,
      sceneKey: scene.sceneKey,
      sourceStoragePath: scene.sourceStoragePath,
      voiceId,
      stability: overrides?.stability ?? settings.stability,
      similarityBoost: overrides?.similarityBoost ?? settings.similarityBoost,
    };

    try {
      let isolatedStoragePath: string | undefined = settings.isolatedPaths[scene.sceneKey];
      let isolatedSignedUrl: string | undefined = signedIsolatedUrls[scene.sceneKey];

      // Phase A — isolation. Skipped if isolate=false, if forceReisolate is
      // off and we already have a stored isolated stem (retry-friendly:
      // don't re-pay ElevenLabs when Phase B failed but Phase A succeeded).
      const needsPhaseA = isolate && (forceReisolate || !isolatedStoragePath);
      if (needsPhaseA) {
        const { data: isoData, error: isoError } = await supabase.functions.invoke("prek-clip-redub", {
          body: { ...baseBody, stage: "isolate", isolate: true, isolateOnly: false },
        });
        if (isoError) throw new Error(await getFunctionErrorMessage(isoError));
        isolatedStoragePath = isoData?.isolatedStoragePath ?? undefined;
        isolatedSignedUrl = isoData?.isolatedSignedUrl ?? undefined;
        if (isolatedStoragePath) {
          setSettings((s) => ({ ...s, isolatedPaths: { ...s.isolatedPaths, [scene.sceneKey]: isolatedStoragePath! } }));
        }
        if (isolatedSignedUrl) {
          setSignedIsolatedUrls((m) => ({ ...m, [scene.sceneKey]: isolatedSignedUrl! }));
        }
      }

      if (isolateOnly) {
        setStates((m) => ({
          ...m,
          [scene.sceneKey]: { status: "done", isolatedStoragePath, isolatedSignedUrl },
        }));
        return true;
      }

      setStates((m) => ({
        ...m,
        [scene.sceneKey]: { status: "running", progressMessage: "Swapping voice…", isolatedStoragePath, isolatedSignedUrl },
      }));

      // Phase B — STS. If isolation ran or was reused, feed the isolated MP3;
      // else fall back to legacy single-shot pipeline (no isolation).
      const stsBody = isolate && isolatedStoragePath
        ? { ...baseBody, stage: "sts" as const, isolatedStoragePath }
        : { ...baseBody, isolate: false, isolateOnly: false };
      const { data, error } = await supabase.functions.invoke("prek-clip-redub", { body: stsBody });
      if (error) throw new Error(await getFunctionErrorMessage(error));
      const storagePath: string | undefined = data?.storagePath ?? undefined;
      const signedUrl: string | undefined = data?.signedUrl ?? undefined;

      setStates((m) => ({
        ...m,
        [scene.sceneKey]: { status: "done", storagePath, signedUrl, isolatedStoragePath, isolatedSignedUrl },
      }));
      if (storagePath) {
        setSettings((s) => ({ ...s, audioPaths: { ...s.audioPaths, [scene.sceneKey]: storagePath } }));
      }
      if (signedUrl) {
        setSignedRedubUrls((m) => ({ ...m, [scene.sceneKey]: signedUrl }));
      }
      return true;
    } catch (e) {
      const msg = (e as Error).message || "Unknown error";
      setStates((m) => ({ ...m, [scene.sceneKey]: { status: "error", errorMessage: msg } }));
      return false;
    }
  }, [levelId, settings.voiceId, settings.stability, settings.similarityBoost, settings.isolatedPaths, signedIsolatedUrls]);

  const redubAll = useCallback(async (scenes: RedubSceneInput[]) => {
    setBatchProgress({ done: 0, total: scenes.length });
    let done = 0;
    for (const s of scenes) {
      await redubScene(s);
      done += 1;
      setBatchProgress({ done, total: scenes.length });
    }
    setBatchProgress(null);
  }, [redubScene]);

  const extractMusic = useCallback(async (scene: RedubSceneInput): Promise<boolean> => {
    if (!levelId) return false;
    setMusicStates((m) => ({ ...m, [scene.sceneKey]: { status: "running", progressMessage: "Uploading to LALAL.AI…" } }));

    // LALAL can take a few minutes; the edge function caps its own poll at ~90s
    // and returns { status: "pending", jobId } if not done. Resume from client.
    const CLIENT_MAX_MS = 10 * 60 * 1000;
    const startedAt = Date.now();
    let resumeJobId: string | undefined;

    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke("prek-clip-music-extract", {
          body: {
            levelId,
            sceneKey: scene.sceneKey,
            sourceStoragePath: scene.sourceStoragePath,
            resumeJobId,
          },
        });
        if (error) throw new Error(await getFunctionErrorMessage(error));

        if (data?.status === "pending" && data?.jobId) {
          resumeJobId = data.jobId as string;
          if (Date.now() - startedAt > CLIENT_MAX_MS) {
            throw new Error("Music extraction timed out (client-side cap)");
          }
          setMusicStates((m) => ({
            ...m,
            [scene.sceneKey]: { status: "running", progressMessage: "Separating stems…" },
          }));
          await new Promise((r) => setTimeout(r, 15000));
          continue;
        }

        const storagePath: string | undefined = data?.storagePath ?? undefined;
        const signedUrl: string | undefined = data?.signedUrl ?? undefined;
        setMusicStates((m) => ({
          ...m,
          [scene.sceneKey]: { status: "done", storagePath, signedUrl },
        }));
        if (storagePath) {
          setSettings((s) => ({ ...s, musicPaths: { ...s.musicPaths, [scene.sceneKey]: storagePath } }));
        }
        if (signedUrl) {
          setSignedMusicUrls((m) => ({ ...m, [scene.sceneKey]: signedUrl }));
        }
        return true;
      }
    } catch (e) {
      const msg = (e as Error).message || "Unknown error";
      setMusicStates((m) => ({ ...m, [scene.sceneKey]: { status: "error", errorMessage: msg } }));
      return false;
    }
  }, [levelId]);

  // Full auto: for each scene, run redub + music extraction in PARALLEL.
  // Scenes flow through a small worker pool so we get concurrency without
  // hammering ElevenLabs / LALAL.
  const runFullAuto = useCallback(async (scenes: RedubSceneInput[]) => {
    const CONCURRENCY = 3;
    // Clear stale per-scene status so previous run's errors don't linger.
    setStates((m) => {
      const next = { ...m };
      for (const s of scenes) next[s.sceneKey] = { status: "idle" };
      return next;
    });
    setMusicStates((m) => {
      const next = { ...m };
      for (const s of scenes) next[s.sceneKey] = { status: "idle" };
      return next;
    });
    setAutoProgress({ done: 0, total: scenes.length });
    const queue = [...scenes];
    let done = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, scenes.length) }, async () => {
      while (queue.length) {
        const s = queue.shift();
        if (!s) return;
        await Promise.allSettled([redubScene(s), extractMusic(s)]);
        done += 1;
        setAutoProgress({ done, total: scenes.length });
      }
    });
    await Promise.all(workers);
    setAutoProgress(null);
    // Refresh from DB so generated_at + any late writes are authoritative.
    await reload();
  }, [redubScene, extractMusic, reload]);

  // Bulk LALAL music extraction with 3-worker concurrency.
  const runMusicAll = useCallback(async (scenes: RedubSceneInput[]) => {
    const CONCURRENCY = 3;
    setMusicStates((m) => {
      const next = { ...m };
      for (const s of scenes) next[s.sceneKey] = { status: "idle" };
      return next;
    });
    setMusicBatchProgress({ done: 0, total: scenes.length });
    const queue = [...scenes];
    let done = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, scenes.length) }, async () => {
      while (queue.length) {
        const s = queue.shift();
        if (!s) return;
        await extractMusic(s);
        done += 1;
        setMusicBatchProgress({ done, total: scenes.length });
      }
    });
    await Promise.all(workers);
    setMusicBatchProgress(null);
    await reload();
  }, [extractMusic, reload]);

  return {
    loading,
    settings,
    signedRedubUrls,
    signedIsolatedUrls,
    signedMusicUrls,
    states,
    musicStates,
    batchProgress,
    musicBatchProgress,
    autoProgress,
    reload,
    saveVoiceSettings,
    saveWorldDefaultVoiceId,
    redubScene,
    redubAll,
    extractMusic,
    runMusicAll,
    runFullAuto,
  };
}
