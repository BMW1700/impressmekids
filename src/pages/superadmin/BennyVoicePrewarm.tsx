import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Volume2, Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { segmentCacheEntries, type SegKind } from "@/lib/phonicsSegmenter";
import { teachWord } from "@/lib/bennyTeach";

const LEGACY_VERSION = "v2";
const CACHE_VERSION = "v3";
const SEG_KINDS: SegKind[] = ["whole", "narration", "letter", "sound", "syllable", "blend"];

interface WordItem { word: string; }
type Cell = "pending" | "running" | "cached" | "generated" | "error";
interface RowState {
  word: string;
  say: Cell;
  teach: Cell;
  segments: Cell; // aggregate of per-kind segment jobs
  segTotal: number;
  segDone: number;
  segError: number;
  error?: string;
}

const CONCURRENCY = 1;

function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").trim().replace(/\s+/g, " ");
}

const BennyVoicePrewarm = () => {
  const [voiceId, setVoiceId] = useState("");
  const [scanLoading, setScanLoading] = useState(true);
  const [items, setItems] = useState<WordItem[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [running, setRunning] = useState(false);
  const [cancelFlag, setCancelFlag] = useState(false);
  const [force, setForce] = useState(false);

  useEffect(() => {
    (async () => {
      setScanLoading(true);
      const { data: worlds } = await supabase
        .from("prek_worlds")
        .select("id, title, is_published, default_redub_voice_id")
        .eq("is_published", true);
      const firstVoice = worlds?.find((w: any) => w.default_redub_voice_id)?.default_redub_voice_id;
      if (firstVoice) setVoiceId(firstVoice);

      const worldIds = (worlds ?? []).map((w: any) => w.id);
      if (worldIds.length === 0) { setItems([]); setScanLoading(false); return; }
      const { data: levels } = await supabase
        .from("prek_levels")
        .select("id, world_id, is_published")
        .in("world_id", worldIds)
        .eq("is_published", true);
      const levelIds = (levels ?? []).map((l: any) => l.id);
      if (levelIds.length === 0) { setItems([]); setScanLoading(false); return; }
      const { data: words } = await supabase
        .from("prek_level_words")
        .select("word, level_id")
        .in("level_id", levelIds);

      const collected: WordItem[] = [];
      for (const w of words ?? []) {
        const norm = normalizeWord(w.word ?? "");
        if (!norm) continue;
        for (const token of norm.split(" ")) {
          if (token) collected.push({ word: token });
        }
      }
      setItems(collected);
      setScanLoading(false);
    })().catch((e) => {
      console.error(e);
      toast.error("Failed to scan Pre-K content");
      setScanLoading(false);
    });
  }, []);

  const uniqueWords = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) s.add(it.word);
    return Array.from(s).sort();
  }, [items]);

  // Segment plan per word (deterministic).
  const segPlan = useMemo(() => {
    const map = new Map<string, Array<{ kind: SegKind; text: string; slug: string }>>();
    for (const w of uniqueWords) map.set(w, segmentCacheEntries(w));
    return map;
  }, [uniqueWords]);

  // Probe storage on load so prior progress shows up as ✓.
  useEffect(() => {
    if (uniqueWords.length === 0 || !voiceId) return;
    let cancelled = false;
    (async () => {
      const listAll = async (prefix: string): Promise<Set<string>> => {
        const out = new Set<string>();
        let offset = 0;
        for (;;) {
          const { data, error } = await supabase.storage
            .from("prek-word-tts")
            .list(prefix, { limit: 1000, offset });
          if (error || !data || data.length === 0) break;
          for (const f of data) if (f.name.endsWith(".mp3")) out.add(f.name.replace(/\.mp3$/, ""));
          if (data.length < 1000) break;
          offset += 1000;
        }
        return out;
      };
      const slugify = (w: string) =>
        w.toLowerCase().replace(/[^a-z0-9']+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

      const [saySet, ...segSets] = await Promise.all([
        listAll(`${voiceId}/${LEGACY_VERSION}/say`),
        ...SEG_KINDS.map((k) => listAll(`${voiceId}/${CACHE_VERSION}/${k}`)),
      ]);
      if (cancelled) return;
      const segByKind: Record<SegKind, Set<string>> = SEG_KINDS.reduce((acc, k, i) => {
        acc[k] = segSets[i]; return acc;
      }, {} as Record<SegKind, Set<string>>);

      const seed: Record<string, RowState> = {};
      for (const w of uniqueWords) {
        const slug = slugify(w);
        const plan = segPlan.get(w) ?? [];
        let segDone = 0;
        for (const s of plan) if (segByKind[s.kind]?.has(s.slug)) segDone++;
        seed[w] = {
          word: w,
          say: saySet.has(slug) ? "cached" : "pending",
          teach: "cached",
          segments: plan.length > 0 && segDone === plan.length ? "cached" : "pending",
          segTotal: plan.length,
          segDone,
          segError: 0,
        };
      }
      setRows(seed);
    })().catch((e) => console.warn("[prewarm] storage probe failed", e));
    return () => { cancelled = true; };
  }, [uniqueWords, voiceId, segPlan]);

  // Totals
  const segTotalAll = useMemo(() => Array.from(segPlan.values()).reduce((n, arr) => n + arr.length, 0), [segPlan]);
  const totalCalls = uniqueWords.length + segTotalAll;
  const creditEstimate = totalCalls * 3;
  const usdEstimate = (creditEstimate / 1000).toFixed(2);

  const doneCount = Object.values(rows).reduce((n, r) => {
    let d = 0;
    if (r.say === "cached" || r.say === "generated") d++;
    d += r.segDone;
    return n + d;
  }, 0);
  const errorCount = Object.values(rows).reduce(
    (n, r) => n + (r.say === "error" ? 1 : 0) + r.segError, 0,
  );
  const progress = totalCalls > 0 ? Math.round(((doneCount + errorCount) / totalCalls) * 100) : 0;

  const callLegacy = async (word: string, mode: "say" | "teach"): Promise<"cached" | "generated" | "error"> => {
    try {
      const { data, error } = await supabase.functions.invoke("prek-word-tts", {
        body: { word, mode, voiceId: voiceId || undefined, force },
      });
      if (error || !data?.signedUrl) return "error";
      return data.cached ? "cached" : "generated";
    } catch { return "error"; }
  };

  const callSegment = async (kind: SegKind, text: string): Promise<"cached" | "generated" | "error"> => {
    try {
      const { data, error } = await supabase.functions.invoke("prek-word-tts", {
        body: { mode: "teach-segment", segmentKind: kind, segmentText: text, voiceId: voiceId || undefined, force },
      });
      if (error || !data?.signedUrl) return "error";
      return data.cached ? "cached" : "generated";
    } catch { return "error"; }
  };

  const startPrewarm = async () => {
    if (running) return;
    setRunning(true);
    setCancelFlag(false);

    type Job =
      | { kind: "legacy"; word: string; mode: "say" | "teach" }
      | { kind: "seg"; word: string; segKind: SegKind; text: string; slug: string };
    const queue: Job[] = [];

    setRows((cur) => {
      const next = { ...cur };
      for (const w of uniqueWords) {
        const plan = segPlan.get(w) ?? [];
        const r = next[w] ?? {
          word: w, say: "pending" as Cell, teach: "pending" as Cell,
          segments: "pending" as Cell, segTotal: plan.length, segDone: 0, segError: 0,
        };
        const alreadySay = r.say === "cached" || r.say === "generated";
        if (force || !alreadySay) { queue.push({ kind: "legacy", word: w, mode: "say" }); r.say = "pending"; }
        // segments — only enqueue missing
        if (force) { r.segDone = 0; r.segError = 0; }
        // Without probing again, assume seed segDone is accurate; enqueue plan.length - segDone
        const stillNeeded = plan.length - (force ? 0 : r.segDone);
        if (stillNeeded > 0) {
          // Enqueue every plan entry when force; else enqueue all (probe already marked cached ones — but we can't know which). Safe: rely on `cached: true` return from function.
          for (const p of plan) queue.push({ kind: "seg", word: w, segKind: p.kind, text: p.text, slug: p.slug });
          r.segments = "pending";
        }
        next[w] = r;
      }
      return next;
    });

    if (queue.length === 0) {
      setRunning(false);
      toast.success("Every word is already cached — nothing to do.");
      return;
    }

    let idx = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (true) {
        if (cancelFlag) return;
        const i = idx++;
        if (i >= queue.length) return;
        const job = queue[i];
        if (job.kind === "legacy") {
          setRows((cur) => ({ ...cur, [job.word]: { ...cur[job.word], [job.mode]: "running" } }));
          const result = await callLegacy(job.word, job.mode);
          setRows((cur) => ({ ...cur, [job.word]: { ...cur[job.word], [job.mode]: result } }));
        } else {
          setRows((cur) => ({ ...cur, [job.word]: { ...cur[job.word], segments: "running" } }));
          const result = await callSegment(job.segKind, job.text);
          setRows((cur) => {
            const r = cur[job.word]; if (!r) return cur;
            const segDone = r.segDone + (result === "cached" || result === "generated" ? 1 : 0);
            const segError = r.segError + (result === "error" ? 1 : 0);
            const segments: Cell =
              segError > 0 && segDone + segError >= r.segTotal ? "error" :
              segDone >= r.segTotal ? "cached" : "running";
            return { ...cur, [job.word]: { ...r, segDone, segError, segments } };
          });
        }
      }
    });
    await Promise.all(workers);
    setRunning(false);
    toast.success(`Benny voice prewarm complete — ${queue.length} calls attempted`);
  };

  const previewLegacy = async (word: string, mode: "say" | "teach") => {
    const { data, error } = await supabase.functions.invoke("prek-word-tts", {
      body: { word, mode, voiceId: voiceId || undefined },
    });
    if (error || !data?.signedUrl) { toast.error("Preview failed"); return; }
    const a = new Audio(data.signedUrl);
    a.play().catch(() => toast.error("Playback blocked"));
  };

  const previewSegmented = async (word: string) => {
    try { await teachWord(word, { voiceId: voiceId || undefined }); }
    catch { toast.error("Teach preview failed"); }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/super-admin"><ArrowLeft className="h-4 w-4 mr-1" /> Super Admin</Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Volume2 className="h-7 w-7 text-primary" /> Benny Voice Prewarm
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cache every word in Benny's voice — once</CardTitle>
            <CardDescription>
              Generates the final-word MP3 and every phonics segment used by the
              segmented Teach flow. Legacy full-lesson Teach files are skipped so
              Benny never uses the garbled/repeating cache.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="voice">ElevenLabs voice ID (optional)</Label>
              <Input
                id="voice"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="Leave blank to use the default Benny voice"
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Unique words</div>
                <div className="text-2xl font-bold">{scanLoading ? "…" : uniqueWords.length}</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Total API calls</div>
                <div className="text-2xl font-bold">{scanLoading ? "…" : totalCalls}</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Est. credits</div>
                <div className="text-2xl font-bold">~{creditEstimate.toLocaleString()}</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Est. cost</div>
                <div className="text-2xl font-bold">~${usdEstimate}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded border border-amber-500/30 bg-amber-500/5 p-3">
              <Switch id="force" checked={force} onCheckedChange={setForce} />
              <div className="flex-1">
                <Label htmlFor="force" className="font-semibold">Force regenerate (overwrite cache)</Label>
                <p className="text-xs text-muted-foreground">
                  Off = only missing files (free). On = re-run every file (spends credits).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button size="lg" onClick={startPrewarm} disabled={running || scanLoading || uniqueWords.length === 0}>
                {running ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Prewarming…</>) : (<>Prewarm all {uniqueWords.length} words</>)}
              </Button>
              {running && <Button variant="outline" onClick={() => setCancelFlag(true)}>Cancel</Button>}
              {totalCalls > 0 && (
                <div className="flex-1">
                  <Progress value={progress} />
                  <div className="text-xs text-muted-foreground mt-1">
                    {doneCount} / {totalCalls} cached
                    {errorCount > 0 && <span className="text-destructive"> · {errorCount} errors</span>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Words ({uniqueWords.length})</CardTitle>
            <CardDescription>Every unique word across published Pre-K levels.</CardDescription>
          </CardHeader>
          <CardContent>
            {scanLoading ? (
              <div className="text-muted-foreground text-sm">Scanning…</div>
            ) : uniqueWords.length === 0 ? (
              <div className="text-muted-foreground text-sm">No published words found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {uniqueWords.map((w) => {
                  const r = rows[w];
                  return (
                    <div key={w} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span className="font-mono font-semibold">{w}</span>
                      <div className="flex items-center gap-1">
                        <StatusBadge label="Say" state={r?.say ?? "pending"} />
                        <SegBadge state={r?.segments ?? "pending"} done={r?.segDone ?? 0} total={r?.segTotal ?? 0} />
                        <Button size="sm" variant="ghost" onClick={() => previewLegacy(w, "say")} title="Preview say">
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => previewSegmented(w)} title="Preview segmented teach">
                          <Play className="h-3 w-3" /> Seg
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function StatusBadge({ label, state }: { label: string; state: Cell }) {
  if (state === "cached" || state === "generated") {
    return <Badge variant="secondary" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />{label}</Badge>;
  }
  if (state === "running") {
    return <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />{label}</Badge>;
  }
  if (state === "error") {
    return <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />{label}</Badge>;
  }
  return <Badge variant="outline" className="text-xs opacity-60">{label}</Badge>;
}

function SegBadge({ state, done, total }: { state: Cell; done: number; total: number }) {
  const label = `Seg ${done}/${total}`;
  if (state === "cached") return <Badge variant="secondary" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />{label}</Badge>;
  if (state === "running") return <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />{label}</Badge>;
  if (state === "error") return <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />{label}</Badge>;
  return <Badge variant="outline" className="text-xs opacity-60">{label}</Badge>;
}

export default BennyVoicePrewarm;
