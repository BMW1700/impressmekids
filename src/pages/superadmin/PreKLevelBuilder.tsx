// Pre-K Level Builder
//
// Vertical timeline matching the "Visit Grandma" template:
//   Opening Video → (intro words: First Video → WORD → Second Video) × N → Closing Video
//
// Super admins upload the videos, type the spoken word + lines, save. Each
// upload writes the storage path to the corresponding *_video_url DB column.
// Playback uses the same YubiVideoAdventure runner the kids see.

import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Plus, ArrowUp, ArrowDown, Loader2, Play, Save, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { uploadPreKVideo, deletePreKVideo } from "@/lib/preKVideoUpload";
import { PREK_VIDEO_BUCKET, invalidatePreKLevelCacheByDbId } from "@/lib/preKLevelFromDb";
import { toast } from "sonner";
import { AudioMixEditor } from "@/components/superadmin/prek/AudioMixEditor";
import { backfillLevelVideoDurations } from "@/lib/preKVideoDurationProbe";
import { VideoTrimEditor } from "@/components/superadmin/prek/VideoTrimEditor";
import { alignPreKAudioClipsToVideoTrims } from "@/lib/preKAlignAudioToTrim";

interface LevelRow {
  id: string;
  world_id: string;
  title: string;
  level_number: number;
  goal: string;
  ending_line: string;
  opening_video_url: string | null;
  closing_video_url: string | null;
  is_published: boolean;
  opening_video_duration_seconds: number | null;
  closing_video_duration_seconds: number | null;
  audio_master_volume: number | null;
  mute_source_video_audio: boolean | null;
  opening_trim_in_seconds: number | null;
  opening_trim_out_seconds: number | null;
  closing_trim_in_seconds: number | null;
  closing_trim_out_seconds: number | null;
}
interface WordRow {
  id: string;
  level_id: string;
  sort_order: number;
  word: string;
  ask_line: string;
  success_line: string;
  first_video_url: string | null;
  second_video_url: string | null;
  hold_poster_url: string | null;
  word_hold_seconds: number | null;
  first_video_duration_seconds: number | null;
  second_video_duration_seconds: number | null;
  first_trim_in_seconds: number | null;
  first_trim_out_seconds: number | null;
  second_trim_in_seconds: number | null;
  second_trim_out_seconds: number | null;
}

// Resolves a storage path or full URL into something the admin editor can play.
// Admin previews intentionally use signed backend storage directly instead of
// CDN-first, because recently uploaded files may not have reached R2 yet and
// Windows browsers can get stuck on the failed media load.
function useSignedSrc(pathOrUrl: string | null): { src: string | null; fallbackSrc: string | null } {
  const [src, setSrc] = useState<string | null>(null);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) {
      setSrc(null);
      setFallbackSrc(null);
      return;
    }
    if (/^https?:\/\//.test(pathOrUrl) || pathOrUrl.startsWith("/")) {
      setSrc(pathOrUrl);
      setFallbackSrc(null);
      return;
    }
    setSrc(null);
    setFallbackSrc(null);
    supabase.storage
      .from(PREK_VIDEO_BUCKET)
      .createSignedUrl(pathOrUrl, 60 * 60)
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setSrc(null);
          return;
        }
        setSrc(data.signedUrl);
        setFallbackSrc(null);
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null);
          setFallbackSrc(null);
        }
      });
    return () => { cancelled = true; };
  }, [pathOrUrl]);
  return { src, fallbackSrc };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const VideoSlot = ({
  label,
  pathOrUrl,
  uploading,
  onPick,
  onClear,
  trimIn,
  trimOut,
  onTrimChange,
}: {
  label: string;
  pathOrUrl: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
  trimIn: number | null;
  trimOut: number | null;
  onTrimChange: (next: { trimIn: number | null; trimOut: number | null }) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { src, fallbackSrc } = useSignedSrc(pathOrUrl);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {pathOrUrl ? (
        <div className="space-y-2">
          <VideoTrimEditor
            src={src}
            fallbackSrc={fallbackSrc}
            trimIn={trimIn}
            trimOut={trimOut}
            onChange={onTrimChange}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={onClear} disabled={uploading}>
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading} className="w-full max-w-sm">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload {label}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const PreKLevelBuilder = () => {
  const { worldId, levelId } = useParams<{ worldId: string; levelId: string }>();
  const [level, setLevel] = useState<LevelRow | null>(null);
  const [words, setWords] = useState<WordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const persistEdits = async ({ showToast = true }: { showToast?: boolean } = {}): Promise<boolean> => {
    if (!level) return false;
    setSaving(true);
    try {
      const [{ error: levelError }, ...results] = await Promise.all([
        supabase
          .from("prek_levels")
          .update({
            opening_trim_in_seconds: level.opening_trim_in_seconds,
            opening_trim_out_seconds: level.opening_trim_out_seconds,
            closing_trim_in_seconds: level.closing_trim_in_seconds,
            closing_trim_out_seconds: level.closing_trim_out_seconds,
          })
          .eq("id", level.id),
        ...words.map((w) =>
          supabase
            .from("prek_level_words")
            .update({
              word: (w.word ?? "").trim(),
              ask_line: w.ask_line ?? "",
              success_line: w.success_line ?? "",
              first_trim_in_seconds: w.first_trim_in_seconds,
              first_trim_out_seconds: w.first_trim_out_seconds,
              second_trim_in_seconds: w.second_trim_in_seconds,
              second_trim_out_seconds: w.second_trim_out_seconds,
            })
            .eq("id", w.id),
        ),
      ]);
      if (levelError) throw levelError;
      const firstErr = results.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
      // Cascade the freshly-saved video trims onto every redub/music clip so
      // audio never drifts ahead of the video (e.g. intern trims after redub).
      const patched = await alignPreKAudioClipsToVideoTrims(level.id).catch(() => 0);
      invalidatePreKLevelCacheByDbId(level.id);
      if (showToast) {
        toast.success(
          patched > 0
            ? `Saved — realigned ${patched} audio clip${patched === 1 ? "" : "s"} to new trims`
            : "Saved — all clip crops are locked in",
        );
      }
      return true;
    } catch (e: unknown) {
      toast.error(errorMessage(e, "Save failed"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveProgress = () => persistEdits();

  // Manual "Update Live" — flush pending edits, bust the cache, and bump the
  // level row so any open student session picks up the changes immediately
  // via the realtime subscription in usePreKVideoLevel.
  const pushLive = async () => {
    if (!level) return;
    const saved = await persistEdits({ showToast: false });
    if (!saved) return;
    invalidatePreKLevelCacheByDbId(level.id);
    const { error } = await supabase
      .from("prek_levels")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", level.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pushed live — next play will use these edits");
  };


  const load = async () => {
    if (!levelId) return;
    setLoading(true);
    const [{ data: l }, { data: ws }] = await Promise.all([
      supabase.from("prek_levels").select("*").eq("id", levelId).maybeSingle(),
      supabase.from("prek_level_words").select("*").eq("level_id", levelId).order("sort_order"),
    ]);
    const levelRow = l as LevelRow | null;
    const wordRows = (ws ?? []) as WordRow[];
    setLevel(levelRow);
    setWords(wordRows);
    setLoading(false);

    // Auto-probe any missing video durations so the audio overlay editor's
    // scene graph has accurate timing. Runs in the background — if it updates
    // anything, silently re-fetch so the editor picks up the new values.
    if (levelRow) {
      void backfillLevelVideoDurations(levelRow, wordRows).then(async (n) => {
        if (n > 0) {
          const [{ data: l2 }, { data: ws2 }] = await Promise.all([
            supabase.from("prek_levels").select("*").eq("id", levelId).maybeSingle(),
            supabase.from("prek_level_words").select("*").eq("level_id", levelId).order("sort_order"),
          ]);
          const durationLevel = l2 as LevelRow | null;
          const durationWordsById = new Map(((ws2 ?? []) as WordRow[]).map((w) => [w.id, w]));
          setLevel((cur) => {
            if (!cur || !durationLevel || cur.id !== durationLevel.id) return cur;
            return {
              ...cur,
              opening_video_duration_seconds: durationLevel.opening_video_duration_seconds,
              closing_video_duration_seconds: durationLevel.closing_video_duration_seconds,
            };
          });
          setWords((cur) => cur.map((w) => {
            const fresh = durationWordsById.get(w.id);
            return fresh
              ? {
                  ...w,
                  first_video_duration_seconds: fresh.first_video_duration_seconds,
                  second_video_duration_seconds: fresh.second_video_duration_seconds,
                }
              : w;
          }));
        }
      });
    }
  };

  useEffect(() => { load(); }, [levelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!level) {
    return <div className="p-8">Level not found.</div>;
  }

  // ---- Level-level operations ------------------------------------------------
  const uploadLevelVideo = async (
    slot: "opening" | "closing",
    file: File,
  ) => {
    const key = `level-${slot}`;
    setUploadingKey(key);
    try {
      // Remove any prior path
      const prior = slot === "opening" ? level.opening_video_url : level.closing_video_url;
      if (prior) await deletePreKVideo(prior);

      const { path, r2Copied } = await uploadPreKVideo(file, level.world_id, level.id, slot);
      const column = slot === "opening" ? "opening_video_url" : "closing_video_url";
      // Reset trim + cached duration so the new file isn't cut by the old clip's marks.
      const { error } = await supabase
        .from("prek_levels")
        .update({
          [column]: path,
          [`${slot}_trim_in_seconds`]: null,
          [`${slot}_trim_out_seconds`]: null,
          [`${slot}_video_duration_seconds`]: null,
        })
        .eq("id", level.id);
      if (error) throw error;
      invalidatePreKLevelCacheByDbId(level.id);
      toast.success(
        r2Copied
          ? `${slot === "opening" ? "Opening" : "Closing"} video saved and copied to R2`
          : `${slot === "opening" ? "Opening" : "Closing"} video saved — backend preview is ready`,
      );
      load();
    } catch (e: unknown) {
      toast.error(errorMessage(e, "Upload failed"));
    } finally {
      setUploadingKey(null);
    }
  };

  const clearLevelVideo = async (slot: "opening" | "closing") => {
    const column = slot === "opening" ? "opening_video_url" : "closing_video_url";
    const prior = slot === "opening" ? level.opening_video_url : level.closing_video_url;
    if (prior) await deletePreKVideo(prior);
    await supabase.from("prek_levels").update({
      [column]: null,
      [`${slot}_trim_in_seconds`]: null,
      [`${slot}_trim_out_seconds`]: null,
    }).eq("id", level.id);
    invalidatePreKLevelCacheByDbId(level.id);
    load();
  };

  const updateLevelTrim = async (
    slot: "opening" | "closing",
    next: { trimIn: number | null; trimOut: number | null },
  ) => {
    const patch = {
      [`${slot}_trim_in_seconds`]: next.trimIn,
      [`${slot}_trim_out_seconds`]: next.trimOut,
    };
    setLevel((cur) => (cur ? ({ ...cur, ...patch } as LevelRow) : cur));
  };

  const updateWordTrim = async (
    wordId: string,
    slot: "first" | "second",
    next: { trimIn: number | null; trimOut: number | null },
  ) => {
    const patch = {
      [`${slot}_trim_in_seconds`]: next.trimIn,
      [`${slot}_trim_out_seconds`]: next.trimOut,
    };
    setWords((cur) => cur.map((w) => (w.id === wordId ? ({ ...w, ...patch } as WordRow) : w)));
  };

  // ---- Word-level operations -------------------------------------------------
  const addWord = async () => {
    const sort_order = (words.at(-1)?.sort_order ?? 0) + 1;
    const { error } = await supabase
      .from("prek_level_words")
      .insert({ level_id: level.id, sort_order, word: "NEW", ask_line: "", success_line: "" });
    if (error) toast.error(error.message);
    else {
      invalidatePreKLevelCacheByDbId(level.id);
      load();
    }
  };

  const updateWord = async (id: string, patch: Partial<WordRow>) => {
    setWords((cur) => cur.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    const { error } = await supabase.from("prek_level_words").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else invalidatePreKLevelCacheByDbId(level.id);
  };

  const uploadWordVideo = async (
    word: WordRow,
    slot: "first" | "second",
    file: File,
  ) => {
    const key = `word-${word.id}-${slot}`;
    setUploadingKey(key);
    try {
      const prior = slot === "first" ? word.first_video_url : word.second_video_url;
      if (prior) await deletePreKVideo(prior);
      const { path, r2Copied } = await uploadPreKVideo(
        file,
        level.world_id,
        level.id,
        `word-${word.sort_order}-${slot}`,
      );
      const column = slot === "first" ? "first_video_url" : "second_video_url";
      // Reset trim + cached duration so the new file isn't cut by the old clip's marks.
      const { error } = await supabase
        .from("prek_level_words")
        .update({
          [column]: path,
          [`${slot}_trim_in_seconds`]: null,
          [`${slot}_trim_out_seconds`]: null,
          [`${slot}_video_duration_seconds`]: null,
        })
        .eq("id", word.id);
      if (error) throw error;
      invalidatePreKLevelCacheByDbId(level.id);
      toast.success(r2Copied ? "Word video saved and copied to R2" : "Word video saved — backend preview is ready");
      load();
    } catch (e: unknown) {
      toast.error(errorMessage(e, "Upload failed"));
    } finally {
      setUploadingKey(null);
    }
  };

  const clearWordVideo = async (word: WordRow, slot: "first" | "second") => {
    const prior = slot === "first" ? word.first_video_url : word.second_video_url;
    if (prior) await deletePreKVideo(prior);
    const column = slot === "first" ? "first_video_url" : "second_video_url";
    await supabase.from("prek_level_words").update({
      [column]: null,
      [`${slot}_trim_in_seconds`]: null,
      [`${slot}_trim_out_seconds`]: null,
      [`${slot}_video_duration_seconds`]: null,
    }).eq("id", word.id);
    invalidatePreKLevelCacheByDbId(level.id);
    load();
  };

  const removeWord = async (word: WordRow) => {
    if (!confirm(`Remove word "${word.word}"?`)) return;
    await deletePreKVideo(word.first_video_url);
    await deletePreKVideo(word.second_video_url);
    const { error } = await supabase.from("prek_level_words").delete().eq("id", word.id);
    if (error) toast.error(error.message);
    else {
      invalidatePreKLevelCacheByDbId(level.id);
      load();
    }
  };

  const moveWord = async (word: WordRow, dir: -1 | 1) => {
    const idx = words.findIndex((w) => w.id === word.id);
    const neighborIdx = idx + dir;
    if (neighborIdx < 0 || neighborIdx >= words.length) return;
    const neighbor = words[neighborIdx];
    await Promise.all([
      supabase.from("prek_level_words").update({ sort_order: neighbor.sort_order }).eq("id", word.id),
      supabase.from("prek_level_words").update({ sort_order: word.sort_order }).eq("id", neighbor.id),
    ]);
    invalidatePreKLevelCacheByDbId(level.id);
    load();
  };


  const togglePublish = async () => {
    if (!level) return;
    const saved = await persistEdits({ showToast: false });
    if (!saved) return;
    const ready =
      !!level.opening_video_url &&
      !!level.closing_video_url &&
      words.length > 0 &&
      words.every((w) => w.first_video_url && w.second_video_url && w.word.trim());
    if (!level.is_published && !ready) {
      toast.error("Add opening + closing videos and complete every word before publishing.");
      return;
    }
    const { error } = await supabase
      .from("prek_levels")
      .update({ is_published: !level.is_published })
      .eq("id", level.id);
    if (error) toast.error(error.message);
    else {
      toast.success(level.is_published ? "Unpublished" : "Published!");
      load();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to={`/super-admin/prek/${worldId}`}><ArrowLeft className="h-4 w-4 mr-1" /> Levels</Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{level.title}</h1>
              <p className="text-sm text-muted-foreground">Level {level.level_number} · {level.goal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={level.is_published ? "default" : "secondary"}>
              {level.is_published ? "Published" : "Draft"}
            </Badge>
            <Button onClick={saveProgress} variant="outline" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save Progress
            </Button>
            <Button onClick={pushLive} variant="default" disabled={saving} title="Force any open student session to reload this level with your latest edits.">
              <Radio className="h-4 w-4 mr-1" />
              Update Live
            </Button>
            <Button onClick={togglePublish} variant={level.is_published ? "outline" : "default"} disabled={saving}>
              {level.is_published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>

        {/* Opening */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opening Video</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoSlot
              label="Opening clip"
              pathOrUrl={level.opening_video_url}
              uploading={uploadingKey === "level-opening"}
              onPick={(f) => uploadLevelVideo("opening", f)}
              onClear={() => clearLevelVideo("opening")}
              trimIn={level.opening_trim_in_seconds}
              trimOut={level.opening_trim_out_seconds}
              onTrimChange={(next) => updateLevelTrim("opening", next)}
            />
          </CardContent>
        </Card>

        {/* Words */}
        {words.map((w, i) => (
          <Card key={w.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Word {i + 1}</Badge>
                <CardTitle className="text-base">{w.word || "(no word)"}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => moveWord(w, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => moveWord(w, 1)} disabled={i === words.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeWord(w)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Word (spoken)</Label>
                  <Input
                    value={w.word}
                    onChange={(e) => setWords((cur) => cur.map((x) => (x.id === w.id ? { ...x, word: e.target.value } : x)))}
                    onBlur={(e) => updateWord(w.id, { word: e.target.value.trim() })}
                    placeholder="JUMP"
                  />
                </div>
                <div>
                  <Label>Ask line</Label>
                  <Input
                    value={w.ask_line}
                    onChange={(e) => setWords((cur) => cur.map((x) => (x.id === w.id ? { ...x, ask_line: e.target.value } : x)))}
                    onBlur={(e) => updateWord(w.id, { ask_line: e.target.value })}
                    placeholder="I need to..."
                  />
                </div>
                <div>
                  <Label>Success line</Label>
                  <Input
                    value={w.success_line}
                    onChange={(e) => setWords((cur) => cur.map((x) => (x.id === w.id ? { ...x, success_line: e.target.value } : x)))}
                    onBlur={(e) => updateWord(w.id, { success_line: e.target.value })}
                    placeholder="Whoosh! Over we go!"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VideoSlot
                  label="First Video (before word)"
                  pathOrUrl={w.first_video_url}
                  uploading={uploadingKey === `word-${w.id}-first`}
                  onPick={(f) => uploadWordVideo(w, "first", f)}
                  onClear={() => clearWordVideo(w, "first")}
                  trimIn={w.first_trim_in_seconds}
                  trimOut={w.first_trim_out_seconds}
                  onTrimChange={(next) => updateWordTrim(w.id, "first", next)}
                />
                <VideoSlot
                  label="Second Video (after word)"
                  pathOrUrl={w.second_video_url}
                  uploading={uploadingKey === `word-${w.id}-second`}
                  onPick={(f) => uploadWordVideo(w, "second", f)}
                  onClear={() => clearWordVideo(w, "second")}
                  trimIn={w.second_trim_in_seconds}
                  trimOut={w.second_trim_out_seconds}
                  onTrimChange={(next) => updateWordTrim(w.id, "second", next)}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addWord} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add Word
        </Button>

        {/* Closing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Closing Video</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoSlot
              label="Closing clip"
              pathOrUrl={level.closing_video_url}
              uploading={uploadingKey === "level-closing"}
              onPick={(f) => uploadLevelVideo("closing", f)}
              onClear={() => clearLevelVideo("closing")}
              trimIn={level.closing_trim_in_seconds}
              trimOut={level.closing_trim_out_seconds}
              onTrimChange={(next) => updateLevelTrim("closing", next)}
            />
          </CardContent>
        </Card>


        {/* ── Audio overlay editor ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audio Overlay Mix</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Add unlimited audio tracks over the videos. Each clip can be a one-shot, loop a scene, play under the whole level, or span across multiple videos (skipping the word-card pauses). You can also mute the original video audio.
            </p>
          </CardHeader>
          <CardContent>
            <AudioMixEditor levelId={level.id} level={level} words={words} />
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          When everything looks right, click <strong>Publish</strong> at the top to make this level visible to students.
        </div>
      </div>
    </div>
  );
};


export default PreKLevelBuilder;
