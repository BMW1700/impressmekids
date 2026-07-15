// BulkAudioDropzone — optional one-file drop → scene-anchored slices.
//
// Sits at the TOP of RedubStudioPanel, collapsed by default. Manual per-scene
// flow underneath is 100% unchanged. Deterministic modes only:
//   - Scene-aligned: one slice per video scene, matching each scene's duration.
//   - Fixed length: N-second slices placed sequentially on video scenes.
//
// Runs entirely client-side (Web Audio decode + WAV encode) and uploads each
// slice to the existing prek-level-audio bucket, then inserts one
// prek_level_audio_clips row per slice in fixed / pause_on_word_card mode —
// same shape Redub/Music already use.

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Upload, Scissors, Undo2, Loader2, AlertCircle, Music2, Mic2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isVideoScene, type SceneGraph } from "@/lib/preKSceneGraph";
import { PREK_AUDIO_BUCKET } from "@/lib/preKAudioUpload";
import { mirrorToR2Async } from "@/lib/r2Mirror";
import {
  decodeAudioFile,
  buildFixedSpecs,
  buildSceneAlignedSpecs,
  sliceAndEncode,
  type SliceSpec,
} from "@/lib/preKBulkAudioSplit";

type TargetTrack = "redub" | "music";
type SplitMode = "scene" | "fixed";

interface Props {
  levelId: string;
  sceneGraph: SceneGraph;
}

const BATCH_KEY = (levelId: string) => `prek-bulk-split:last-batch:${levelId}`;

export const BulkAudioDropzone = ({ levelId, sceneGraph }: Props) => {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [decoding, setDecoding] = useState(false);
  const bufferRef = useRef<AudioBuffer | null>(null);

  const [mode, setMode] = useState<SplitMode>("scene");
  const [chunkSeconds, setChunkSeconds] = useState<number>(8);
  const [target, setTarget] = useState<TargetTrack>("redub");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const videoScenes = useMemo(() => sceneGraph.scenes.filter(isVideoScene), [sceneGraph]);
  const totalSceneDuration = useMemo(
    () => videoScenes.reduce((s, sc) => s + sc.timelineDurationSeconds, 0),
    [videoScenes],
  );

  const specs: SliceSpec[] = useMemo(() => {
    if (!audioDuration) return [];
    if (mode === "scene") {
      return buildSceneAlignedSpecs(audioDuration, videoScenes.map((s) => s.timelineDurationSeconds));
    }
    return buildFixedSpecs(audioDuration, chunkSeconds, videoScenes.length);
  }, [audioDuration, mode, chunkSeconds, videoScenes]);

  const pickFile = () => fileInputRef.current?.click();

  const onFile = async (f: File) => {
    setFile(f);
    setAudioDuration(null);
    bufferRef.current = null;
    setDecoding(true);
    try {
      const buf = await decodeAudioFile(f);
      bufferRef.current = buf;
      setAudioDuration(buf.duration);
    } catch (e) {
      toast.error(`Couldn't decode audio: ${(e as Error).message}`);
      setFile(null);
    } finally {
      setDecoding(false);
    }
  };

  const reset = () => {
    setFile(null);
    setAudioDuration(null);
    bufferRef.current = null;
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSplitAndPlace = async () => {
    if (!bufferRef.current || !file) { toast.error("Drop an audio file first."); return; }
    if (videoScenes.length === 0) { toast.error("This level has no video scenes to anchor to."); return; }
    if (specs.length === 0) { toast.error("No slices to place — check chunk length."); return; }

    const trackIndex = target === "redub" ? 90 : 89;
    const trackName = target === "redub" ? "Benny (Redub)" : "Benny (Music)";
    const sourceKind = target === "redub" ? "redub" : "music";
    const batchId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    setBusy(true);
    setProgress({ done: 0, total: specs.length });
    try {
      // 1. Encode all slices client-side.
      const slices = await sliceAndEncode(bufferRef.current, specs);
      if (slices.length === 0) { toast.error("All slices were empty."); return; }

      // 2. Ensure track row exists (idempotent).
      await supabase
        .from("prek_level_audio_tracks")
        .upsert(
          { level_id: levelId, track_index: trackIndex, name: trackName, volume: target === "music" ? 0.8 : 1.0, muted: false },
          { onConflict: "level_id,track_index", ignoreDuplicates: true },
        );

      // 3. Upload + insert one clip per slice, anchored to the matching scene.
      const placedIds: string[] = [];
      for (let i = 0; i < slices.length; i++) {
        const s = slices[i];
        const scene = videoScenes[i];
        if (!scene) break; // more slices than scenes — stop

        const path = `${levelId}/bulk-${batchId}-${target}-${i}-${Date.now()}.wav`;
        const { error: upErr } = await supabase.storage
          .from(PREK_AUDIO_BUCKET)
          .upload(path, s.blob, { contentType: "audio/wav", cacheControl: "31536000, immutable", upsert: false });
        if (upErr) throw new Error(`Upload failed on slice ${i + 1}: ${upErr.message}`);
        mirrorToR2Async(PREK_AUDIO_BUCKET, path, "audio/wav", s.blob.size);

        const displayName = `[bulk:${batchId}] ${target === "redub" ? "Voice" : "Music"} — ${scene.key} (${i + 1}/${slices.length})`;
        const { data: inserted, error: insErr } = await supabase
          .from("prek_level_audio_clips")
          .insert({
            level_id: levelId,
            track_index: trackIndex,
            storage_path: path,
            display_name: displayName,
            anchor_scene_key: scene.key,
            anchor_edge: "start",
            anchor_offset_seconds: 0,
            duration_mode: "fixed",
            duration_seconds: s.durationSec,
            volume: target === "music" ? 0.8 : 1.0,
            fade_in_seconds: 0,
            fade_out_seconds: 0,
            loop_clip: false,
            pause_on_word_card: true,
            trim_start_seconds: 0,
            trim_end_seconds: null,
            playback_rate: 1.0,
            source_kind: sourceKind,
          })
          .select("id")
          .single();
        if (insErr) throw new Error(`Insert failed on slice ${i + 1}: ${insErr.message}`);
        if (inserted?.id) placedIds.push(inserted.id);
        setProgress({ done: i + 1, total: slices.length });
      }

      // 4. Auto-mute source video audio so nothing fights the placed audio.
      await supabase.from("prek_levels").update({ mute_source_video_audio: true }).eq("id", levelId);

      // 5. Remember batch id for one-click undo.
      try { localStorage.setItem(BATCH_KEY(levelId), batchId); } catch { /* noop */ }

      toast.success(`Placed ${placedIds.length} clip${placedIds.length === 1 ? "" : "s"} on ${trackName}. Undo available.`);
      reset();
    } catch (e) {
      toast.error(`Bulk split failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const handleUndoBatch = async () => {
    let batchId: string | null = null;
    try { batchId = localStorage.getItem(BATCH_KEY(levelId)); } catch { /* noop */ }
    if (!batchId) { toast.error("No recent bulk batch to undo on this level."); return; }
    setBusy(true);
    try {
      // Soft-delete every clip whose display_name carries this batch tag.
      const { data, error } = await supabase
        .from("prek_level_audio_clips")
        .update({ deleted_at: new Date().toISOString() })
        .eq("level_id", levelId)
        .like("display_name", `[bulk:${batchId}]%`)
        .is("deleted_at", null)
        .select("id");
      if (error) throw error;
      try { localStorage.removeItem(BATCH_KEY(levelId)); } catch { /* noop */ }
      toast.success(`Undid ${data?.length ?? 0} bulk clip${(data?.length ?? 0) === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error(`Undo failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const audioLongerThanScenes = audioDuration != null && audioDuration > totalSceneDuration + 0.5;
  const audioShorterThanScenes = audioDuration != null && audioDuration < totalSceneDuration - 0.5;

  return (
    <div className="rounded-md border border-dashed border-purple-500/40 bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-purple-500/5"
      >
        {open ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
        <Upload className="h-3 w-3 text-purple-500"/>
        Bulk import (optional) — drop one long audio file, auto-slice onto scenes
        <Badge variant="outline" className="ml-auto text-[9px]">beta</Badge>
      </button>

      {open && (
        <div className="p-3 space-y-3 border-t border-purple-500/20">
          <p className="text-[11px] text-muted-foreground flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0"/>
            <span>
              Deterministic modes only. Each slice becomes a fixed one-shot clip anchored to a video scene — same shape as manual Redub/Music clips.
              Source video audio auto-mutes. Undo removes the whole batch.
            </span>
          </p>

          {/* File picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
            />
            <Button size="sm" variant="outline" onClick={pickFile} disabled={busy || decoding}>
              <Upload className="h-3 w-3 mr-1"/> {file ? "Replace file" : "Choose audio file"}
            </Button>
            {decoding && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> decoding…</span>}
            {file && audioDuration != null && (
              <>
                <span className="text-[11px] font-mono truncate max-w-[240px]" title={file.name}>{file.name}</span>
                <Badge variant="secondary" className="text-[10px]">{audioDuration.toFixed(1)}s</Badge>
                <Button size="sm" variant="ghost" onClick={reset} className="h-7 text-[11px]">Clear</Button>
              </>
            )}
          </div>

          {/* Mode + target */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Split mode</Label>
              <div className="flex gap-1">
                <Button
                  size="sm" variant={mode === "scene" ? "default" : "outline"}
                  onClick={() => setMode("scene")} className="h-7 text-[11px] flex-1"
                >
                  Scene-aligned
                </Button>
                <Button
                  size="sm" variant={mode === "fixed" ? "default" : "outline"}
                  onClick={() => setMode("fixed")} className="h-7 text-[11px] flex-1"
                >
                  Fixed length
                </Button>
              </div>
            </div>
            {mode === "fixed" && (
              <div className="space-y-1">
                <Label className="text-[11px]">Seconds per slice</Label>
                <Input
                  type="number" min={1} max={120} step={1}
                  value={chunkSeconds}
                  onChange={(e) => setChunkSeconds(Math.max(1, Math.min(120, Number(e.target.value) || 8)))}
                  className="h-7 text-xs"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[11px]">Target track</Label>
              <div className="flex gap-1">
                <Button
                  size="sm" variant={target === "redub" ? "default" : "outline"}
                  onClick={() => setTarget("redub")} className="h-7 text-[11px] flex-1"
                >
                  <Mic2 className="h-3 w-3 mr-1"/>Redub (90)
                </Button>
                <Button
                  size="sm" variant={target === "music" ? "default" : "outline"}
                  onClick={() => setTarget("music")} className="h-7 text-[11px] flex-1"
                >
                  <Music2 className="h-3 w-3 mr-1"/>Music (89)
                </Button>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {audioDuration != null && (
            <>
              {audioLongerThanScenes && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3"/> Audio is {(audioDuration - totalSceneDuration).toFixed(1)}s longer than total scene duration ({totalSceneDuration.toFixed(1)}s). Trailing audio will be truncated on the last scene.
                </div>
              )}
              {audioShorterThanScenes && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3"/> Audio is {(totalSceneDuration - audioDuration).toFixed(1)}s shorter than total scene duration. Later scenes will get no slice.
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {specs.length > 0 && audioDuration != null && (
            <div className="rounded-sm border bg-background/60 max-h-40 overflow-auto">
              <table className="w-full text-[10px] font-mono">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1">#</th>
                    <th className="text-left px-2 py-1">time</th>
                    <th className="text-left px-2 py-1">→ scene</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.map((sp, i) => {
                    const scene = videoScenes[i];
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-0.5">{i + 1}</td>
                        <td className="px-2 py-0.5">{sp.startSec.toFixed(1)}s → {sp.endSec.toFixed(1)}s</td>
                        <td className="px-2 py-0.5 truncate">{scene ? scene.label : <span className="text-red-500">no scene — skipped</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleSplitAndPlace}
              disabled={busy || !file || audioDuration == null || specs.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {busy && progress
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin"/> Placing {progress.done}/{progress.total}…</>
                : <><Scissors className="h-3 w-3 mr-1"/> Split &amp; place on {target === "redub" ? "Redub (90)" : "Music (89)"}</>}
            </Button>
            <Button size="sm" variant="outline" onClick={handleUndoBatch} disabled={busy}>
              <Undo2 className="h-3 w-3 mr-1"/> Undo last batch
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
