// RedubStudioPanel — Benny voice-swap UI inside the Pre-K level editor.
//
// Flow: paste ElevenLabs voice ID → adjust stability/similarity → hit
// "Redub entire level" (or per-scene). Each row shows spinner → ✓ → ▶ preview.
// After success, the redub MP3 lives on prek_levels.redub_audio_paths keyed
// by scene key; the student player picks it up automatically.

import { useMemo, useRef, useState } from "react";
import { Loader2, Play, Pause, RotateCw, CheckCircle2, AlertCircle, Sparkles, Wand2, Layers, Music2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBennyRedub, type RedubSceneInput } from "@/hooks/useBennyRedub";
import { SCENE_KEYS, isVideoScene, type SceneGraph } from "@/lib/preKSceneGraph";
import { ClipWaveform } from "./ClipWaveform";

interface Props {
  levelId: string;
  sceneGraph: SceneGraph;
  /** From the level / words rows: scene key -> source video storage_path (relative). */
  sourcePathsByScene: Record<string, string>;
}

export const RedubStudioPanel = ({ levelId, sceneGraph, sourcePathsByScene }: Props) => {
  const redub = useBennyRedub(levelId);
  const [voiceIdDraft, setVoiceIdDraft] = useState<string>("");
  const [voiceIdInitialized, setVoiceIdInitialized] = useState(false);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);

  // Sync draft with loaded settings once
  if (!voiceIdInitialized && !redub.loading) {
    setVoiceIdDraft(redub.settings.levelVoiceId);
    setVoiceIdInitialized(true);
  }

  const scenes: RedubSceneInput[] = useMemo(() => {
    return sceneGraph.scenes.filter(isVideoScene).map((s) => ({
      sceneKey: s.key,
      sourceStoragePath: sourcePathsByScene[s.key] ?? "",
      label: s.label,
      sceneDurationSeconds: s.timelineDurationSeconds,
      sourceRawDurationSeconds: s.sourceRawDurationSeconds,
      sourceTrimStartSeconds: s.sourceTrimInSeconds,
      sourceTrimEndSeconds: s.sourceTrimOutSeconds ?? undefined,
    })).filter((s) => !!s.sourceStoragePath);
  }, [sceneGraph, sourcePathsByScene]);

  const missingCount = sceneGraph.scenes.filter(isVideoScene).length - scenes.length;

  const stopPreview = () => {
    const a = previewRef.current;
    if (a) { try { a.pause(); } catch { /* noop */ } }
    setPreviewingKey(null);
  };
  const startPreview = (sceneKey: string, url: string) => {
    stopPreview();
    const a = new Audio(url);
    previewRef.current = a;
    a.onended = () => setPreviewingKey((k) => (k === sceneKey ? null : k));
    a.play().catch(() => setPreviewingKey(null));
    setPreviewingKey(sceneKey);
  };

  const effectiveVoice = voiceIdDraft || redub.settings.worldDefaultVoiceId;

  const handleRedubAll = async () => {
    if (!effectiveVoice) { toast.error("Set a Benny voice ID (level or world default) first."); return; }
    if (voiceIdDraft !== redub.settings.levelVoiceId) await redub.saveVoiceSettings({ voiceId: voiceIdDraft });
    if (scenes.length === 0) { toast.error("No source videos found to redub."); return; }
    toast.info(`Redubbing ${scenes.length} clips in Benny's voice… this will take ~${Math.ceil(scenes.length * 45 / 60)} min.`);
    await redub.redubAll(scenes);
    toast.success("Redub complete. Preview each clip inline.");
  };

  const handleRedubOne = async (scene: RedubSceneInput) => {
    if (!effectiveVoice) { toast.error("Set a Benny voice ID (level or world default) first."); return; }
    if (voiceIdDraft !== redub.settings.levelVoiceId) await redub.saveVoiceSettings({ voiceId: voiceIdDraft });
    const ok = await redub.redubScene(scene);
    if (ok) toast.success(`Redubbed ${scene.label} → auto-placed on "Benny (Redub)" track`);
  };

  const handleExtractMusic = async (scene: RedubSceneInput) => {
    const ok = await redub.extractMusic(scene);
    if (ok) toast.success(`Music extracted for ${scene.label} → placed on "Benny (Music)" track`);
  };

  const handleFullAuto = async () => {
    if (!effectiveVoice) { toast.error("Set a Benny voice ID (level or world default) first."); return; }
    if (voiceIdDraft !== redub.settings.levelVoiceId) await redub.saveVoiceSettings({ voiceId: voiceIdDraft });
    if (scenes.length === 0) { toast.error("No source videos found."); return; }
    toast.info(`Full auto: redubbing voice + extracting music for ${scenes.length} clips…`);
    await redub.runFullAuto(scenes);
    toast.success("Full auto complete — voice on Redub lane, music on Music lane.");
  };

  const handleMusicAll = async () => {
    if (scenes.length === 0) { toast.error("No source videos found."); return; }
    toast.info(`Extracting music/SFX from ${scenes.length} clips via LALAL.AI…`);
    await redub.runMusicAll(scenes);
    toast.success("Music extraction complete — placed on Benny (Music) lane.");
  };



  return (
    <Card className="border-purple-500/40 bg-purple-500/5">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-purple-500"/>
          Redub Studio — swap voice with ElevenLabs (lip-sync preserved)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-background/60 p-3 text-xs text-muted-foreground space-y-1">
          <p><strong>How it works:</strong> Each clip is cleaned through ElevenLabs Voice Isolator, then re-voiced into the Benny voice while preserving cadence so mouth movements still match. The final MP3 is auto-layered on the <strong>Benny (Redub)</strong> timeline track at the same start time as the original clip, and source video audio is muted for you.</p>
          <p><strong>Workflow:</strong> Hit <strong>Redub</strong> per clip → preview <strong>Final Audio</strong> → approve or re-run. Every approved redub is already placed on the timeline lip-to-lip with the video.</p>
          <p><strong>Cost:</strong> ~1 credit per ~1000 characters of source audio + isolation minutes.</p>
        </div>


        {/* World-level default */}
        {redub.settings.worldId && (
          <div className="rounded-md border border-purple-500/30 bg-purple-500/5 p-3 space-y-2">
            <Label className="text-xs font-semibold text-purple-900 dark:text-purple-200">
              World default Benny voice ID (applies to every level in this world unless overridden)
            </Label>
            <div className="flex gap-2">
              <Input
                defaultValue={redub.settings.worldDefaultVoiceId}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== redub.settings.worldDefaultVoiceId) {
                    void redub.saveWorldDefaultVoiceId(v).then(() => toast.success("World default voice saved"));
                  }
                }}
                placeholder="paste once → every level in this world uses it"
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Voice + settings */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_auto_auto] gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">
              This level's voice ID override
              {!voiceIdDraft && redub.settings.worldDefaultVoiceId && (
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                  (using world default: <span className="font-mono">{redub.settings.worldDefaultVoiceId.slice(0, 8)}…</span>)
                </span>
              )}
            </Label>
            <Input
              value={voiceIdDraft}
              onChange={(e) => setVoiceIdDraft(e.target.value.trim())}
              onBlur={() => { if (voiceIdDraft !== redub.settings.levelVoiceId) void redub.saveVoiceSettings({ voiceId: voiceIdDraft }); }}
              placeholder={redub.settings.worldDefaultVoiceId ? "leave blank to use world default" : "paste the voice_id from ElevenLabs → My Voices"}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-xs">Stability: {redub.settings.stability.toFixed(2)}</Label>
            <Slider
              min={0} max={1} step={0.05}
              value={[redub.settings.stability]}
              onValueChange={(v) => void redub.saveVoiceSettings({ stability: v[0] })}
            />
          </div>
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-xs">Similarity: {redub.settings.similarityBoost.toFixed(2)}</Label>
            <Slider
              min={0} max={1} step={0.05}
              value={[redub.settings.similarityBoost]}
              onValueChange={(v) => void redub.saveVoiceSettings({ similarityBoost: v[0] })}
            />
          </div>
        </div>


        {missingCount > 0 && (
          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3"/> {missingCount} scene(s) have no source video uploaded — upload them first to include in redub.
          </div>
        )}

        {/* Batch controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleFullAuto}
            disabled={!!redub.autoProgress || !!redub.batchProgress || !!redub.musicBatchProgress || scenes.length === 0}
            className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white"
          >
            {redub.autoProgress
              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin"/> Full auto {redub.autoProgress.done}/{redub.autoProgress.total}…</>
              : <><Zap className="h-3 w-3 mr-1"/> Full auto: Redub + Music ({scenes.length} clips)</>
            }
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRedubAll}
            disabled={!!redub.batchProgress || !!redub.musicBatchProgress || !!redub.autoProgress || scenes.length === 0}
          >
            {redub.batchProgress
              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin"/> Redubbing {redub.batchProgress.done}/{redub.batchProgress.total}…</>
              : <><Sparkles className="h-3 w-3 mr-1"/> Redub only</>
            }
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMusicAll}
            disabled={!!redub.batchProgress || !!redub.musicBatchProgress || !!redub.autoProgress || scenes.length === 0}
          >
            {redub.musicBatchProgress
              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin"/> Extracting music {redub.musicBatchProgress.done}/{redub.musicBatchProgress.total}…</>
              : <><Music2 className="h-3 w-3 mr-1"/> Music only</>
            }
          </Button>
          {redub.settings.generatedAt && (
            <Badge variant="outline" className="text-[10px]">
              Last redub: {new Date(redub.settings.generatedAt).toLocaleString()}
            </Badge>
          )}
          {redub.settings.musicGeneratedAt && (
            <Badge variant="outline" className="text-[10px]">
              Last music: {new Date(redub.settings.musicGeneratedAt).toLocaleString()}
            </Badge>
          )}
        </div>

        {/* Per-scene table */}
        <div className="rounded-md border bg-background/40 divide-y">
          {scenes.map((s) => {
            const state = redub.states[s.sceneKey];
            const existingRedub = redub.signedRedubUrls[s.sceneKey];
            const redubUrl = state?.signedUrl ?? existingRedub;
            const musicState = redub.musicStates[s.sceneKey];
            const existingMusic = redub.signedMusicUrls[s.sceneKey];
            const musicUrl = musicState?.signedUrl ?? existingMusic;

            const status = state?.status ?? (existingRedub ? "done" : "idle");
            const musicStatus = musicState?.status ?? (existingMusic ? "done" : "idle");
            const previewKeyFor = (kind: "src" | "iso" | "redub" | "music") => `${s.sceneKey}::${kind}`;
            const isPlaying = (kind: "src" | "iso" | "redub" | "music") => previewingKey === previewKeyFor(kind);
            const togglePlay = (kind: "src" | "iso" | "redub" | "music", u: string) => {
              const k = previewKeyFor(kind);
              if (previewingKey === k) stopPreview();
              else { stopPreview(); startPreview(k, u); }
            };
            return (
              <div key={s.sceneKey} className="px-3 py-2 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{s.sceneKey}</div>
                  </div>
                {status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/>}
                {status === "error" && (
                  <span className="text-[10px] text-red-500 truncate max-w-[200px]" title={state?.errorMessage}>
                    <AlertCircle className="inline h-3 w-3 mr-0.5"/>{state?.errorMessage}
                  </span>
                )}
                {redubUrl && (
                  <Button
                    size="sm" variant="outline"
                    className="h-7 px-2 text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                    onClick={() => togglePlay("redub", redubUrl)}
                    title="Preview final redubbed Benny audio"
                  >
                    {isPlaying("redub") ? <Pause className="h-3 w-3 mr-0.5"/> : <Play className="h-3 w-3 mr-0.5"/>}Voice
                  </Button>
                )}
                {musicUrl && (
                  <Button
                    size="sm" variant="outline"
                    className="h-7 px-2 text-[10px] border-blue-500/40 text-blue-700 dark:text-blue-300"
                    onClick={() => togglePlay("music", musicUrl)}
                    title="Preview extracted music/SFX stem"
                  >
                    {isPlaying("music") ? <Pause className="h-3 w-3 mr-0.5"/> : <Play className="h-3 w-3 mr-0.5"/>}Music
                  </Button>
                )}
                {(redubUrl || musicUrl) && (
                  <Badge
                    variant="secondary"
                    className="h-7 text-[10px] gap-1"
                    title="Auto-placed on timeline. Voice on Redub track (90), music on Music track (89), source video audio muted."
                  >
                    <Layers className="h-3 w-3"/> lanes 90/89 · src muted
                  </Badge>
                )}
                <Button
                  size="sm" variant="ghost"
                  disabled={status === "running" || !!redub.batchProgress || !!redub.autoProgress}
                  onClick={() => handleRedubOne(s)}
                  title={existingRedub ? "Re-run redub" : "Isolate → redub → place on Benny (Redub) track"}
                  className="h-7"
                >
                  {status === "running"
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin"/> Voice…</>
                    : existingRedub ? <><RotateCw className="h-3 w-3 mr-1"/> Redub</> : <><Wand2 className="h-3 w-3 mr-1"/> Redub</>}
                </Button>
                <Button
                  size="sm" variant="ghost"
                  disabled={musicStatus === "running" || !!redub.autoProgress}
                  onClick={() => handleExtractMusic(s)}
                  title={existingMusic ? "Re-run music extraction" : "Extract music+SFX via LALAL.AI → place on Benny (Music) track"}
                  className="h-7"
                >
                  {musicStatus === "running"
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin"/> Music…</>
                    : existingMusic ? <><RotateCw className="h-3 w-3 mr-1"/> Music</> : <><Music2 className="h-3 w-3 mr-1"/> Music</>}
                </Button>
                </div>
                {musicStatus === "error" && (
                  <div className="flex items-start gap-1 rounded-sm border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] leading-snug text-red-600 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0"/>
                    <span className="break-words">{musicState?.errorMessage}</span>
                  </div>
                )}
                {redubUrl && (
                  <div className="rounded-sm bg-purple-500/5 border border-purple-500/30 px-2 py-1 overflow-hidden">
                    <ClipWaveform
                      url={redubUrl}
                      widthPx={640}
                      heightPx={32}
                      colorClass="text-purple-700 dark:text-purple-300"
                      normalize
                      gain={0.9}
                    />
                  </div>
                )}
                {musicUrl && (
                  <div className="rounded-sm bg-blue-500/5 border border-blue-500/30 px-2 py-1 overflow-hidden">
                    <ClipWaveform
                      url={musicUrl}
                      widthPx={640}
                      heightPx={32}
                      colorClass="text-blue-700 dark:text-blue-300"
                      normalize
                      gain={0.9}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {scenes.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No source videos uploaded yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
