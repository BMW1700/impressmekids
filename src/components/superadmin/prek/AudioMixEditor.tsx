// AudioMixEditor — Pre-K level audio overlay editor (DAW-style).
//
// Layout:
//   [Master row: master vol, mute-source-video toggle]
//   [Track strip rows: drag, name, M, S, volume, + add clip] × N
//   [+ Add Track]
//   [Inspector for the selected clip — anchor, mode, volume, fade, loop]
//
// This is the v4 functional first pass: clips are anchored by picking a
// scene + edge + numeric offset (no canvas drag yet). The data shape and
// runtime mixer are the full v4 contract, so a future drag-canvas pass is
// purely UI on top of this.

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload, Loader2, Music, Volume2, VolumeX, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  usePreKAudioMix,
  type PreKAudioClip,
  type PreKAudioDurationMode,
  type PreKAudioTrack,
} from "@/hooks/usePreKAudioMix";
import { uploadPreKAudio, deletePreKAudio, probeAudioDuration } from "@/lib/preKAudioUpload";
import {
  buildSceneGraph,
  isVideoScene,
  type Scene,
} from "@/lib/preKSceneGraph";

interface Props {
  levelId: string;
  level: {
    id: string;
    opening_video_duration_seconds?: number | null;
    closing_video_duration_seconds?: number | null;
    audio_master_volume?: number | null;
    mute_source_video_audio?: boolean | null;
  };
  words: Array<{
    id: string;
    sort_order: number;
    word: string;
    word_hold_seconds?: number | null;
    first_video_duration_seconds?: number | null;
    second_video_duration_seconds?: number | null;
  }>;
}

const MODE_LABELS: Record<PreKAudioDurationMode, string> = {
  "fixed": "Fixed (one-shot)",
  "fill-scene": "Fill scene (loop while scene plays)",
  "fill-level": "Fill level (background music)",
  "span-videos": "Span across videos (skip word cards)",
};

export const AudioMixEditor = ({ levelId, level, words }: Props) => {
  const mix = usePreKAudioMix(levelId);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [soloTrackIndex, setSoloTrackIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const sceneGraph = useMemo(() => buildSceneGraph(level, words), [level, words]);
  const sceneByKey = useMemo(() => new Map(sceneGraph.scenes.map((s) => [s.key, s])), [sceneGraph]);

  const videoScenes = sceneGraph.scenes.filter(isVideoScene);

  // ── Level settings updates ────────────────────────────────────────────────
  const updateLevelSetting = async (patch: Partial<{ audio_master_volume: number; mute_source_video_audio: boolean }>) => {
    const { error } = await supabase.from("prek_levels").update(patch).eq("id", levelId);
    if (error) toast.error(error.message); else mix.reload();
  };

  // ── Track CRUD ────────────────────────────────────────────────────────────
  const addTrack = async () => {
    const next_index = (mix.tracks.at(-1)?.track_index ?? -1) + 1;
    const { error } = await supabase.from("prek_level_audio_tracks").insert({
      level_id: levelId, track_index: next_index, name: `Track ${next_index + 1}`,
    });
    if (error) toast.error(error.message); else mix.reload();
  };
  const renameTrack = async (t: PreKAudioTrack, name: string) => {
    await supabase.from("prek_level_audio_tracks").update({ name }).eq("id", t.id);
    mix.reload();
  };
  const updateTrack = async (t: PreKAudioTrack, patch: Partial<PreKAudioTrack>) => {
    await supabase.from("prek_level_audio_tracks").update(patch).eq("id", t.id);
    mix.reload();
  };
  const deleteTrack = async (t: PreKAudioTrack) => {
    const trackClips = mix.clips.filter((c) => c.track_index === t.track_index);
    if (trackClips.length > 0 && !confirm(`Delete "${t.name}" and its ${trackClips.length} clip(s)?`)) return;
    for (const c of trackClips) await deletePreKAudio(c.storage_path);
    await supabase.from("prek_level_audio_clips").delete().eq("level_id", levelId).eq("track_index", t.track_index);
    await supabase.from("prek_level_audio_tracks").delete().eq("id", t.id);
    mix.reload();
  };
  const moveTrack = async (t: PreKAudioTrack, dir: -1 | 1) => {
    const idx = mix.tracks.findIndex((x) => x.id === t.id);
    const ni = idx + dir;
    if (ni < 0 || ni >= mix.tracks.length) return;
    const other = mix.tracks[ni];
    // Swap indices via two-step to avoid unique-violation: park `t` at a sentinel value
    await supabase.from("prek_level_audio_tracks").update({ track_index: -9999 }).eq("id", t.id);
    await supabase.from("prek_level_audio_tracks").update({ track_index: t.track_index }).eq("id", other.id);
    await supabase.from("prek_level_audio_tracks").update({ track_index: other.track_index }).eq("id", t.id);
    // Re-point clips
    await supabase.from("prek_level_audio_clips").update({ track_index: -8888 }).eq("level_id", levelId).eq("track_index", t.track_index);
    await supabase.from("prek_level_audio_clips").update({ track_index: t.track_index }).eq("level_id", levelId).eq("track_index", other.track_index);
    await supabase.from("prek_level_audio_clips").update({ track_index: other.track_index }).eq("level_id", levelId).eq("track_index", -8888);
    mix.reload();
  };

  // ── Clip CRUD ─────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTrackRef = useRef<PreKAudioTrack | null>(null);
  const pickClipFor = (t: PreKAudioTrack) => {
    pendingTrackRef.current = t;
    fileInputRef.current?.click();
  };
  const onFilePicked = async (file: File) => {
    const t = pendingTrackRef.current; if (!t) return;
    pendingTrackRef.current = null;
    setBusy(true);
    try {
      const dur = await probeAudioDuration(file);
      const { path } = await uploadPreKAudio(file, levelId, t.track_index);
      const sort_order = (mix.clips.filter((c) => c.track_index === t.track_index).at(-1)?.sort_order ?? -1) + 1;
      const { data, error } = await supabase.from("prek_level_audio_clips").insert({
        level_id: levelId,
        track_index: t.track_index,
        sort_order,
        storage_path: path,
        display_name: file.name.replace(/\.[^.]+$/, ""),
        duration_seconds: dur ?? null,
        anchor_scene_key: "opening",
        anchor_edge: "start",
        anchor_offset_seconds: 0,
        duration_mode: "fixed" as PreKAudioDurationMode,
      }).select("id").maybeSingle();
      if (error) throw error;
      if (data?.id) setSelectedClipId(data.id);
      toast.success("Audio clip added");
      mix.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };
  const deleteClip = async (c: PreKAudioClip) => {
    if (!confirm(`Delete "${c.display_name}"?`)) return;
    await deletePreKAudio(c.storage_path);
    await supabase.from("prek_level_audio_clips").delete().eq("id", c.id);
    if (selectedClipId === c.id) setSelectedClipId(null);
    mix.reload();
  };
  const updateClip = async (c: PreKAudioClip, patch: Partial<PreKAudioClip>) => {
    const { error } = await supabase.from("prek_level_audio_clips").update(patch).eq("id", c.id);
    if (error) toast.error(error.message); else mix.reload();
  };

  // Bootstrap: ensure at least one track exists
  useEffect(() => {
    if (mix.loading) return;
    if (mix.tracks.length === 0) void addTrack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mix.loading, mix.tracks.length]);

  const selectedClip = mix.clips.find((c) => c.id === selectedClipId) || null;

  if (mix.loading) {
    return <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading audio mix…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Master strip */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2"><Music className="h-4 w-4"/> Master</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3 min-w-[260px]">
            <Label className="text-sm">Master volume</Label>
            <Slider
              className="w-40"
              min={0} max={200} step={5}
              value={[Math.round(mix.settings.audio_master_volume * 100)]}
              onValueChange={(v) => updateLevelSetting({ audio_master_volume: v[0] / 100 })}
            />
            <span className="text-xs text-muted-foreground w-10">{Math.round(mix.settings.audio_master_volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={mix.settings.mute_source_video_audio}
              onCheckedChange={(v) => updateLevelSetting({ mute_source_video_audio: v })}
            />
            <Label className="text-sm">Mute original video audio</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tracks */}
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Audio Tracks</CardTitle>
          <Button size="sm" variant="outline" onClick={addTrack}><Plus className="h-3 w-3 mr-1"/> Add Track</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {mix.tracks.map((t, i) => {
            const trackClips = mix.clips.filter((c) => c.track_index === t.track_index).sort((a, b) => a.sort_order - b.sort_order);
            const isSolo = soloTrackIndex === t.track_index;
            const effectivelyMuted = t.muted || (soloTrackIndex !== null && !isSolo);
            return (
              <div key={t.id} className={`rounded-lg border p-3 ${effectivelyMuted ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => moveTrack(t, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3"/></Button>
                    <Button size="icon" variant="ghost" onClick={() => moveTrack(t, 1)} disabled={i === mix.tracks.length - 1}><ArrowDown className="h-3 w-3"/></Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground"/>
                  </div>
                  <Input
                    className="w-44"
                    defaultValue={t.name}
                    onBlur={(e) => { if (e.target.value.trim() && e.target.value !== t.name) renameTrack(t, e.target.value.trim()); }}
                  />
                  <Button size="sm" variant={t.muted ? "default" : "outline"} onClick={() => updateTrack(t, { muted: !t.muted })}>
                    {t.muted ? <VolumeX className="h-3 w-3 mr-1"/> : <Volume2 className="h-3 w-3 mr-1"/>} M
                  </Button>
                  <Button size="sm" variant={isSolo ? "default" : "outline"} onClick={() => setSoloTrackIndex(isSolo ? null : t.track_index)}>S</Button>
                  <div className="flex items-center gap-2">
                    <Slider
                      className="w-32"
                      min={0} max={200} step={5}
                      value={[Math.round(t.volume * 100)]}
                      onValueChange={(v) => updateTrack(t, { volume: v[0] / 100 })}
                    />
                    <span className="text-xs text-muted-foreground w-10">{Math.round(t.volume * 100)}%</span>
                  </div>
                  <div className="flex-1" />
                  <Button size="sm" variant="outline" onClick={() => pickClipFor(t)} disabled={busy}>
                    {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Upload className="h-3 w-3 mr-1"/>} Add audio
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteTrack(t)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
                {trackClips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {trackClips.map((c) => {
                      const scene = sceneByKey.get(c.anchor_scene_key);
                      const selected = selectedClipId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedClipId(c.id)}
                          className={`text-left rounded-md border px-2 py-1.5 text-xs ${selected ? "border-primary bg-primary/10" : "bg-muted/40"}`}
                        >
                          <div className="font-medium truncate max-w-[200px]">{c.display_name}</div>
                          <div className="text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] mr-1">{c.duration_mode}</Badge>
                            @ {scene?.label ?? c.anchor_scene_key} {c.anchor_edge}{c.anchor_offset_seconds >= 0 ? "+" : ""}{c.anchor_offset_seconds}s
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {mix.tracks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tracks yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Inspector */}
      {selectedClip && (
        <ClipInspector
          clip={selectedClip}
          scenes={sceneGraph.scenes}
          videoScenes={videoScenes}
          tracks={mix.tracks}
          onUpdate={updateClip}
          onDelete={deleteClip}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/x-m4a,audio/ogg,audio/webm"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFilePicked(f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// ── Inspector ──────────────────────────────────────────────────────────────
interface InspectorProps {
  clip: PreKAudioClip;
  scenes: Scene[];
  videoScenes: Scene[];
  tracks: PreKAudioTrack[];
  onUpdate: (clip: PreKAudioClip, patch: Partial<PreKAudioClip>) => Promise<void> | void;
  onDelete: (clip: PreKAudioClip) => Promise<void> | void;
}

const ClipInspector = ({ clip, scenes, videoScenes, tracks, onUpdate, onDelete }: InspectorProps) => {
  const track = tracks.find((t) => t.track_index === clip.track_index);
  const isSpan = clip.duration_mode === "span-videos";
  const anchorScenes = isSpan ? videoScenes : scenes;

  const setMode = async (mode: PreKAudioDurationMode) => {
    if (mode === "span-videos" && !clip.end_anchor_scene_key) {
      // Default end anchor to last video scene end+0
      const last = videoScenes[videoScenes.length - 1];
      await onUpdate(clip, {
        duration_mode: mode,
        end_anchor_scene_key: last.key,
        end_anchor_edge: "start",
        end_anchor_offset_seconds: last.nominalDurationSeconds,
      });
      return;
    }
    await onUpdate(clip, { duration_mode: mode });
  };

  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Clip: <span className="font-mono">{clip.display_name}</span>
          {track && <Badge variant="outline" className="ml-2">{track.name}</Badge>}
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => onDelete(clip)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Display name</Label>
          <Input defaultValue={clip.display_name} onBlur={(e) => onUpdate(clip, { display_name: e.target.value })}/>
        </div>
        <div>
          <Label>Duration mode</Label>
          <Select value={clip.duration_mode} onValueChange={(v) => setMode(v as PreKAudioDurationMode)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              {(Object.keys(MODE_LABELS) as PreKAudioDurationMode[]).map((k) => (
                <SelectItem key={k} value={k}>{MODE_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {clip.duration_mode !== "fill-level" && (
          <>
            <div>
              <Label>Anchor scene</Label>
              <Select value={clip.anchor_scene_key} onValueChange={(v) => onUpdate(clip, { anchor_scene_key: v })}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {anchorScenes.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Edge</Label>
                <Select value={clip.anchor_edge} onValueChange={(v) => onUpdate(clip, { anchor_edge: v as "start" | "end" })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Offset (s)</Label>
                <Input
                  type="number" step="0.1"
                  defaultValue={clip.anchor_offset_seconds}
                  onBlur={(e) => onUpdate(clip, { anchor_offset_seconds: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </>
        )}

        {isSpan && (
          <>
            <div>
              <Label>End anchor scene</Label>
              <Select value={clip.end_anchor_scene_key ?? ""} onValueChange={(v) => onUpdate(clip, { end_anchor_scene_key: v })}>
                <SelectTrigger><SelectValue placeholder="Pick a video scene"/></SelectTrigger>
                <SelectContent>
                  {videoScenes.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>End edge</Label>
                <Select value={clip.end_anchor_edge ?? "start"} onValueChange={(v) => onUpdate(clip, { end_anchor_edge: v as "start" | "end" })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>End offset (s)</Label>
                <Input
                  type="number" step="0.1"
                  defaultValue={clip.end_anchor_offset_seconds ?? 0}
                  onBlur={(e) => onUpdate(clip, { end_anchor_offset_seconds: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </>
        )}

        <div>
          <Label>Clip volume ({Math.round(clip.volume * 100)}%)</Label>
          <Slider min={0} max={200} step={5} value={[Math.round(clip.volume * 100)]} onValueChange={(v) => onUpdate(clip, { volume: v[0] / 100 })}/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Fade in (s)</Label>
            <Input type="number" step="0.1" defaultValue={clip.fade_in_seconds} onBlur={(e) => onUpdate(clip, { fade_in_seconds: Math.max(0, Number(e.target.value) || 0) })}/>
          </div>
          <div>
            <Label>Fade out (s)</Label>
            <Input type="number" step="0.1" defaultValue={clip.fade_out_seconds} onBlur={(e) => onUpdate(clip, { fade_out_seconds: Math.max(0, Number(e.target.value) || 0) })}/>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={clip.loop_clip} onCheckedChange={(v) => onUpdate(clip, { loop_clip: v })}/>
          <Label>Loop within own duration</Label>
        </div>
        {clip.duration_mode === "fill-level" && (
          <div className="flex items-center gap-3">
            <Switch checked={clip.pause_on_word_card} onCheckedChange={(v) => onUpdate(clip, { pause_on_word_card: v })}/>
            <Label>Pause when child is speaking</Label>
          </div>
        )}
        <div>
          <Label>Trim start (s)</Label>
          <Input type="number" step="0.1" defaultValue={clip.trim_start_seconds} onBlur={(e) => onUpdate(clip, { trim_start_seconds: Math.max(0, Number(e.target.value) || 0) })}/>
        </div>
        <div>
          <Label>Trim end (s)</Label>
          <Input type="number" step="0.1" defaultValue={clip.trim_end_seconds ?? ""} onBlur={(e) => onUpdate(clip, { trim_end_seconds: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })}/>
        </div>
      </CardContent>
    </Card>
  );
};
