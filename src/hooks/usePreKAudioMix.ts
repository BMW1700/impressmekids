// Loads the per-level audio mix (tracks + clips + signed URLs + level settings).
// Used by both the editor (with full reactivity) and the runtime mixer.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREK_AUDIO_BUCKET } from "@/lib/preKAudioUpload";

export interface PreKAudioTrack {
  id: string;
  level_id: string;
  track_index: number;
  name: string;
  volume: number;
  muted: boolean;
}

export type PreKAudioDurationMode = "fixed" | "fill-scene" | "fill-level" | "span-videos";
export type PreKAudioAnchorEdge = "start" | "end";

export interface PreKAudioClip {
  id: string;
  level_id: string;
  track_index: number;
  sort_order: number;
  storage_path: string;
  display_name: string;
  duration_seconds: number | null;

  anchor_scene_key: string;
  anchor_edge: PreKAudioAnchorEdge;
  anchor_offset_seconds: number;

  duration_mode: PreKAudioDurationMode;
  end_anchor_scene_key: string | null;
  end_anchor_edge: PreKAudioAnchorEdge | null;
  end_anchor_offset_seconds: number | null;

  volume: number;
  fade_in_seconds: number;
  fade_out_seconds: number;
  loop_clip: boolean;
  pause_on_word_card: boolean;

  trim_start_seconds: number;
  trim_end_seconds: number | null;

  playback_rate: number;
}

export interface PreKLevelAudioSettings {
  audio_master_volume: number;
  mute_source_video_audio: boolean;
}

export interface PreKAudioMix {
  loading: boolean;
  tracks: PreKAudioTrack[];
  clips: PreKAudioClip[];
  signedUrls: Record<string, string>; // storage_path -> signed url
  settings: PreKLevelAudioSettings;
  reload: () => Promise<void>;
}

const SIGNED_TTL = 60 * 60;

async function signMany(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const unique = Array.from(new Set(paths));
  const { data } = await supabase.storage
    .from(PREK_AUDIO_BUCKET)
    .createSignedUrls(unique, SIGNED_TTL);
  const out: Record<string, string> = {};
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  });
  return out;
}

export function usePreKAudioMix(levelId: string | undefined | null): PreKAudioMix {
  const [tracks, setTracks] = useState<PreKAudioTrack[]>([]);
  const [clips, setClips] = useState<PreKAudioClip[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<PreKLevelAudioSettings>({
    audio_master_volume: 1,
    mute_source_video_audio: false,
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!levelId) {
      setTracks([]); setClips([]); setSignedUrls({}); setLoading(false);
      return;
    }
    // NOTE: do NOT setLoading(true) on re-fetches. Flipping `loading` true on
    // every edit causes the editor to unmount its timeline / waveforms /
    // preview video and visibly "reset". Only the initial mount keeps the
    // `loading: true` default; subsequent reloads refresh data in place.
    const [{ data: ts }, { data: cs }, { data: lv }] = await Promise.all([
      supabase.from("prek_level_audio_tracks").select("*").eq("level_id", levelId).is("deleted_at", null).order("track_index"),
      supabase.from("prek_level_audio_clips").select("*").eq("level_id", levelId).is("deleted_at", null).order("sort_order"),
      supabase.from("prek_levels").select("audio_master_volume, mute_source_video_audio").eq("id", levelId).maybeSingle(),
    ]);
    const tracksRows = (ts ?? []) as unknown as PreKAudioTrack[];
    const clipsRows = (cs ?? []) as unknown as PreKAudioClip[];
    setTracks(tracksRows);
    setClips(clipsRows);
    if (lv) setSettings({
      audio_master_volume: Number((lv as { audio_master_volume?: number }).audio_master_volume ?? 1),
      mute_source_video_audio: Boolean((lv as { mute_source_video_audio?: boolean }).mute_source_video_audio ?? false),
    });
    // Preserve existing signed URLs for paths we've already signed, but await
    // genuinely-new paths before marking the mix loaded. The runtime player
    // fires scene-start once; if loading flips false before URLs exist, the
    // first redub/music clip can be silently missed.
    const needed = clipsRows.map((c) => c.storage_path);
    const missing = needed.filter((p) => !signedUrls[p]);
    const fresh = missing.length > 0 ? await signMany(missing) : {};
    if (Object.keys(fresh).length > 0) {
      setSignedUrls((prev) => ({ ...prev, ...fresh }));
    }
    setLoading(false);
  }, [levelId, signedUrls]);

  useEffect(() => { void reload(); }, [reload]);

  return useMemo(() => ({ loading, tracks, clips, signedUrls, settings, reload }),
    [loading, tracks, clips, signedUrls, settings, reload]);
}
