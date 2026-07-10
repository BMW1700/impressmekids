// useBennyRedub — orchestrator for calling the prek-clip-redub edge function.
//
// Given a Pre-K level's scenes + source storage paths, this hook:
//   - Tracks per-scene status (idle / running / done / error).
//   - Provides `redubScene(sceneKey)` to redub a single scene.
//   - Provides `redubAll(scenes)` to sequentially redub every scene, with progress.
//   - Reloads the level's `redub_audio_paths` from DB after each success so the
//     UI can immediately preview the newly generated MP3.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREK_VIDEO_BUCKET } from "@/lib/preKLevelFromDb";

export type RedubStatus = "idle" | "running" | "done" | "error";

export interface RedubSceneInput {
  sceneKey: string;
  sourceStoragePath: string; // relative path in prek-level-videos
  label: string;             // for display
}

export interface RedubState {
  status: RedubStatus;
  errorMessage?: string;
  storagePath?: string;
  signedUrl?: string;
}

export interface LevelRedubSettings {
  voiceId: string;              // effective voice ID (level override or world default)
  levelVoiceId: string;         // raw level override (may be empty)
  worldDefaultVoiceId: string;  // world-level default (may be empty)
  worldId: string | null;
  stability: number;
  similarityBoost: number;
  audioPaths: Record<string, string>;
  generatedAt: string | null;
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
    generatedAt: null,
  });
  const [signedRedubUrls, setSignedRedubUrls] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, RedubState>>({});
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!levelId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("prek_levels")
      .select("world_id, redub_voice_id, redub_stability, redub_similarity_boost, redub_audio_paths, redub_generated_at")
      .eq("id", levelId)
      .maybeSingle();
    const paths = ((data?.redub_audio_paths as Record<string, string> | null) ?? {});
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
      generatedAt: data?.redub_generated_at ?? null,
    });

    const pathsList = Object.values(paths).filter(Boolean);
    if (pathsList.length > 0) {
      const { data: signed } = await supabase.storage
        .from(PREK_VIDEO_BUCKET)
        .createSignedUrls(pathsList, 60 * 60 * 24 * 7);
      const map: Record<string, string> = {};
      (signed ?? []).forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      const byScene: Record<string, string> = {};
      for (const [sceneKey, storagePath] of Object.entries(paths)) {
        if (map[storagePath]) byScene[sceneKey] = map[storagePath];
      }
      setSignedRedubUrls(byScene);
    } else {
      setSignedRedubUrls({});
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

  const redubScene = useCallback(async (scene: RedubSceneInput, overrides?: { voiceId?: string; stability?: number; similarityBoost?: number }): Promise<boolean> => {
    if (!levelId) return false;
    const voiceId = overrides?.voiceId ?? settings.voiceId;
    if (!voiceId) {
      setStates((m) => ({ ...m, [scene.sceneKey]: { status: "error", errorMessage: "Set a Benny voice ID first." } }));
      return false;
    }
    setStates((m) => ({ ...m, [scene.sceneKey]: { status: "running" } }));
    try {
      const { data, error } = await supabase.functions.invoke("prek-clip-redub", {
        body: {
          levelId,
          sceneKey: scene.sceneKey,
          sourceStoragePath: scene.sourceStoragePath,
          voiceId,
          stability: overrides?.stability ?? settings.stability,
          similarityBoost: overrides?.similarityBoost ?? settings.similarityBoost,
        },
      });
      if (error) throw error;
      const storagePath: string | undefined = data?.storagePath;
      const signedUrl: string | undefined = data?.signedUrl;
      setStates((m) => ({ ...m, [scene.sceneKey]: { status: "done", storagePath, signedUrl } }));
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
  }, [levelId, settings.voiceId, settings.stability, settings.similarityBoost]);

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

  return {
    loading,
    settings,
    signedRedubUrls,
    states,
    batchProgress,
    reload,
    saveVoiceSettings,
    redubScene,
    redubAll,
  };
}
