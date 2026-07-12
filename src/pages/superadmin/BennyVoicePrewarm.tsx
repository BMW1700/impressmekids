import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Volume2, Play, CheckCircle2, AlertCircle, Loader2, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { segmentCacheEntries, type SegKind } from "@/lib/phonicsSegmenter";
import { teachWord } from "@/lib/bennyTeach";

// v3 = legacy say cache. v4 = segment cache. Older prefixes (v2, v3-segments)
// are treated as poisoned and never read — use "Nuke poisoned cache" first.
const LEGACY_VERSION = "v3";
const CACHE_VERSION = "v4";
const SEG_KINDS: SegKind[] = ["whole", "narration", "letter", "sound", "syllable", "blend"];
const MIN_ISOLATED_BYTES = 4 * 1024; // <4KB after isolation ≈ silence/broken

interface WordItem { word: string; }
type Cell = "pending" | "running" | "cached" | "generated" | "error";
interface RowState {
  word: string;
  say: Cell;
  segments: Cell;
  segTotal: number;
  segDone: number;
  segError: number;
  isolated?: boolean; // last-observed isolation status from the edge fn
  error?: string;
}

const CONCURRENCY = 1;

function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").trim().replace(/\s+/g, " ");
}

function slugifyWord(w: string) {
  return w.toLowerCase().replace(/[^a-z0-9']+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

const BennyVoicePrewarm = () => {
  const [voiceId, setVoiceId] = useState("");
  const [scanLoading, setScanLoading] = useState(true);
  const [items, setItems] = useState<WordItem[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [running, setRunning] = useState(false);
  const [force, setForce] = useState(false);
  const [segByKind, setSegByKind] = useState<Record<SegKind, Set<string>>>(() =>
    SEG_KINDS.reduce((acc, k) => { acc[k] = new Set(); return acc; }, {} as Record<SegKind, Set<string>>)
  );
  const [saySet, setSaySet] = useState<Set<string>>(new Set());

  // Refs so workers see live values without stale-closure bugs.
  const cancelRef = useRef(false);
  const wakeLockRef = useRef<any>(null);

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
        for (const token of norm.split(" ")) if (token) collected.push({ word: token });
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

  const segPlan = useMemo(() => {
    const map = new Map<string, Array<{ kind: SegKind; text: string; slug: string }>>();
    for (const w of uniqueWords) map.set(w, segmentCacheEntries(w));
    return map;
  }, [uniqueWords]);

  // Probe storage: build authoritative sets of what's cached RIGHT NOW.
  const probeStorage = async () => {
    if (uniqueWords.length === 0 || !voiceId) return;
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
    const [saySetLocal, ...segSets] = await Promise.all([
      listAll(`${voiceId}/${LEGACY_VERSION}/say`),
      ...SEG_KINDS.map((k) => listAll(`${voiceId}/${CACHE_VERSION}/${k}`)),
    ]);
    const segByKindLocal: Record<SegKind, Set<string>> = SEG_KINDS.reduce((acc, k, i) => {
      acc[k] = segSets[i]; return acc;
    }, {} as Record<SegKind, Set<string>>);
    setSaySet(saySetLocal);
    setSegByKind(segByKindLocal);

    const seed: Record<string, RowState> = {};
    for (const w of uniqueWords) {
      const slug = slugifyWord(w);
      const plan = segPlan.get(w) ?? [];
      let segDone = 0;
      for (const s of plan) if (segByKindLocal[s.kind]?.has(s.slug)) segDone++;
      seed[w] = {
        word: w,
        say: saySetLocal.has(slug) ? "cached" : "pending",
        segments: plan.length > 0 && segDone === plan.length ? "cached" : "pending",
        segTotal: plan.length,
        segDone,
        segError: 0,
      };
    }
    setRows(seed);
  };

  useEffect(() => {
    probeStorage().catch((e) => console.warn("[prewarm] storage probe failed", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueWords, voiceId, segPlan]);

  const segTotalAll = useMemo(
    () => Array.from(segPlan.values()).reduce((n, arr) => n + arr.length, 0),
    [segPlan],
  );
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
  const progress = totalCalls > 0 ? Math.min(100, Math.round(((doneCount + errorCount) / totalCalls) * 100)) : 0;

  const callLegacy = async (word: string, mode: "say" | "teach"): Promise<{ result: Cell; isolated?: boolean; err?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("prek-word-tts", {
        body: { word, mode, voiceId: voiceId || undefined, force, requireIsolation: true },
      });
      if (error) {
        const details = (error as any)?.context ? await (error as any).context.text().catch(() => "") : (error as any).message;
        return { result: "error", err: details || "unknown" };
      }
      if (!data?.signedUrl) return { result: "error", err: "no signedUrl" };
      return { result: data.cached ? "cached" : "generated", isolated: data.isolated };
    } catch (e: any) {
      return { result: "error", err: e?.message ?? "threw" };
    }
  };

  const callSegment = async (kind: SegKind, text: string): Promise<{ result: Cell; isolated?: boolean; err?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("prek-word-tts", {
        body: { mode: "teach-segment", segmentKind: kind, segmentText: text, voiceId: voiceId || undefined, force, requireIsolation: true },
      });
      if (error) {
        const details = (error as any)?.context ? await (error as any).context.text().catch(() => "") : (error as any).message;
        return { result: "error", err: details || "unknown" };
      }
      if (!data?.signedUrl) return { result: "error", err: "no signedUrl" };
      return { result: data.cached ? "cached" : "generated", isolated: data.isolated };
    } catch (e: any) {
      return { result: "error", err: e?.message ?? "threw" };
    }
  };

  const acquireWakeLock = async () => {
    try {
      const anyNav = navigator as any;
      if (anyNav.wakeLock?.request) wakeLockRef.current = await anyNav.wakeLock.request("screen");
    } catch (e) {
      console.warn("[prewarm] wakeLock unavailable", e);
    }
  };
  const releaseWakeLock = async () => {
    try { await wakeLockRef.current?.release?.(); } catch {}
    wakeLockRef.current = null;
  };

  const startPrewarm = async () => {
    if (running) return;
    setRunning(true);
    cancelRef.current = false;
    await acquireWakeLock();

    // Rebuild the queue from the AUTHORITATIVE storage probe so we never
    // enqueue segments that are already cached (unless force=true).
    type Job =
      | { kind: "legacy"; word: string; mode: "say" }
      | { kind: "seg"; word: string; segKind: SegKind; text: string; slug: string };
    const queue: Job[] = [];

    for (const w of uniqueWords) {
      const slug = slugifyWord(w);
      const saySkip = !force && saySet.has(slug);
      if (!saySkip) queue.push({ kind: "legacy", word: w, mode: "say" });
      const plan = segPlan.get(w) ?? [];
      for (const p of plan) {
        const already = !force && segByKind[p.kind]?.has(p.slug);
        if (!already) queue.push({ kind: "seg", word: w, segKind: p.kind, text: p.text, slug: p.slug });
      }
    }

    if (queue.length === 0) {
      setRunning(false);
      await releaseWakeLock();
      toast.success("Every word is already cached — nothing to do.");
      return;
    }

    toast.info(`Prewarming ${queue.length} files, serially, with isolation required. Keep this tab open.`);

    let hardStopReason: string | null = null;

    let idx = 0;
    const worker = async () => {
      while (true) {
        if (cancelRef.current || hardStopReason) return;
        const i = idx++;
        if (i >= queue.length) return;
        const job = queue[i];
        if (job.kind === "legacy") {
          setRows((cur) => ({ ...cur, [job.word]: { ...cur[job.word], say: "running" } }));
          const { result, isolated, err } = await callLegacy(job.word, job.mode);
          setRows((cur) => ({
            ...cur,
            [job.word]: { ...cur[job.word], say: result, isolated, error: err },
          }));
          if (result === "error" && err && err.includes("isolation_unavailable")) {
            hardStopReason = "ElevenLabs key is missing the audio_isolation scope. Enable it and rerun.";
            return;
          }
        } else {
          setRows((cur) => ({ ...cur, [job.word]: { ...cur[job.word], segments: "running" } }));
          const { result, isolated, err } = await callSegment(job.segKind, job.text);
          setRows((cur) => {
            const r = cur[job.word]; if (!r) return cur;
            const segDone = r.segDone + (result === "cached" || result === "generated" ? 1 : 0);
            const segError = r.segError + (result === "error" ? 1 : 0);
            const segments: Cell =
              segError > 0 && segDone + segError >= r.segTotal ? "error" :
              segDone >= r.segTotal ? "cached" : "running";
            return { ...cur, [job.word]: { ...r, segDone, segError, segments, isolated: isolated ?? r.isolated, error: err ?? r.error } };
          });
          if (result === "error" && err && err.includes("isolation_unavailable")) {
            hardStopReason = "ElevenLabs key is missing the audio_isolation scope. Enable it and rerun.";
            return;
          }
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    await releaseWakeLock();
    setRunning(false);
    if (hardStopReason) {
      toast.error(hardStopReason, { duration: 12000 });
    } else if (cancelRef.current) {
      toast.warning("Prewarm cancelled.");
    } else {
      toast.success(`Benny voice prewarm complete — ${queue.length} calls attempted`);
      // Re-probe so seed matches truth.
      probeStorage().catch(() => {});
    }
  };

  const cancelPrewarm = () => {
    cancelRef.current = true;
    toast.info("Stopping after current file…");
  };

  const previewLegacy = async (word: string) => {
    const { data, error } = await supabase.functions.invoke("prek-word-tts", {
      body: { word, mode: "say", voiceId: voiceId || undefined },
    });
    if (error || !data?.signedUrl) { toast.error("Preview failed"); return; }
    const a = new Audio(data.signedUrl);
    a.play().catch(() => toast.error("Playback blocked"));
  };

  const previewSegmented = async (word: string) => {
    try { await teachWord(word, { voiceId: voiceId || undefined }); }
    catch { toast.error("Teach preview failed"); }
  };

  // ---- Purge ----
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [purging, setPurging] = useState(false);
  const handlePurge = async () => {
    if (purgeConfirm !== "DELETE") { toast.error('Type DELETE to confirm.'); return; }
    setPurging(true);
    try {
      const { data, error } = await supabase.functions.invoke("prek-word-tts", {
        body: { mode: "purge", voiceId: voiceId || undefined },
      });
      if (error) throw error;
      toast.success(`Purged ${data?.purged ?? 0} poisoned files. Prewarm to rebuild.`);
      setRows({});
      setPurgeConfirm("");
      probeStorage().catch(() => {});
    } catch (e: any) {
      toast.error(`Purge failed: ${e?.message ?? e}`);
    } finally {
      setPurging(false);
    }
  };

  // ---- Verify sample ----
  const [verifying, setVerifying] = useState(false);
  const [verifyReport, setVerifyReport] = useState<string | null>(null);
  const verifySample = async () => {
    if (uniqueWords.length === 0) return;
    setVerifying(true);
    setVerifyReport(null);
    try {
      const pickN = <T,>(arr: T[], n: number) => {
        const copy = [...arr];
        const picked: T[] = [];
        while (picked.length < n && copy.length > 0) {
          picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
        }
        return picked;
      };
      const wordPicks = pickN(uniqueWords, 5);
      const allSegs: Array<{ word: string; kind: SegKind; text: string; slug: string }> = [];
      for (const w of uniqueWords) {
        for (const p of segPlan.get(w) ?? []) allSegs.push({ word: w, ...p });
      }
      const segPicks = pickN(allSegs, 5);

      const results: string[] = [];
      for (const w of wordPicks) {
        const { data } = await supabase.functions.invoke("prek-word-tts", {
          body: { word: w, mode: "say", voiceId: voiceId || undefined },
        });
        const url = data?.signedUrl as string | undefined;
        if (!url) { results.push(`❌ say "${w}" — no signed URL`); continue; }
        try {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          const ok = buf.byteLength >= MIN_ISOLATED_BYTES;
          results.push(`${ok ? "✅" : "⚠️"} say "${w}" — ${(buf.byteLength / 1024).toFixed(1)} KB`);
        } catch (e: any) {
          results.push(`❌ say "${w}" — ${e?.message}`);
        }
      }
      for (const s of segPicks) {
        const { data } = await supabase.functions.invoke("prek-word-tts", {
          body: { mode: "teach-segment", segmentKind: s.kind, segmentText: s.text, voiceId: voiceId || undefined },
        });
        const url = data?.signedUrl as string | undefined;
        if (!url) { results.push(`❌ ${s.kind} "${s.text}" — no signed URL`); continue; }
        try {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          const ok = buf.byteLength >= MIN_ISOLATED_BYTES;
          results.push(`${ok ? "✅" : "⚠️"} ${s.kind} "${s.text}" — ${(buf.byteLength / 1024).toFixed(1)} KB`);
        } catch (e: any) {
          results.push(`❌ ${s.kind} "${s.text}" — ${e?.message}`);
        }
      }
      setVerifyReport(results.join("\n"));
      const failed = results.filter((r) => r.startsWith("❌") || r.startsWith("⚠️")).length;
      if (failed === 0) toast.success("All 10 sample files look healthy.");
      else toast.warning(`${failed}/10 samples flagged — see report.`);
    } finally {
      setVerifying(false);
    }
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
              Serial, one-file-at-a-time. Every clip is generated with
              <b> eleven_multilingual_v2</b> and passed through Voice Isolation.
              If isolation isn't available on your ElevenLabs key, the run
              hard-fails on file #1 so nothing garbled ever hits the cache.
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

            <div className="flex items-center gap-3 flex-wrap">
              <Button size="lg" onClick={startPrewarm} disabled={running || scanLoading || uniqueWords.length === 0}>
                {running ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Prewarming…</>) : (<>Prewarm all {uniqueWords.length} words</>)}
              </Button>
              {running && <Button variant="outline" onClick={cancelPrewarm}>Cancel</Button>}
              <Button variant="outline" onClick={verifySample} disabled={verifying || uniqueWords.length === 0}>
                {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</> : <>Verify 10 random files</>}
              </Button>
              {totalCalls > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <Progress value={progress} />
                  <div className="text-xs text-muted-foreground mt-1">
                    {doneCount} / {totalCalls} cached
                    {errorCount > 0 && <span className="text-destructive"> · {errorCount} errors</span>}
                  </div>
                </div>
              )}
            </div>

            {verifyReport && (
              <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap max-h-72 overflow-auto">{verifyReport}</pre>
            )}

            {/* Purge poisoned cache */}
            <div className="rounded border border-destructive/40 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-destructive">Purge poisoned cache (v2 + v3)</div>
                  <p className="text-xs text-muted-foreground">
                    Deletes every garbled MP3 from the old cache prefixes for this voice ID. The new v3/v4 layout is untouched.
                    Use this once, then Prewarm to rebuild with the new isolated multilingual_v2 pipeline.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={purging || !voiceId}>
                    {purging ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Purging…</> : <><Trash2 className="h-3 w-3 mr-1" /> Nuke poisoned cache</>}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete every cached MP3 under v2/ and v3/?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Voice ID: <span className="font-mono">{voiceId || "(default)"}</span>. This cannot be undone.
                      Type <b>DELETE</b> to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input value={purgeConfirm} onChange={(e) => setPurgeConfirm(e.target.value)} placeholder="Type DELETE" />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPurgeConfirm("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePurge} disabled={purgeConfirm !== "DELETE"}>Purge now</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                      <span className="font-mono font-semibold flex items-center gap-2">
                        {w}
                        {r?.isolated === true && <ShieldCheck className="h-3 w-3 text-green-500" aria-label="isolated" />}
                        {r?.isolated === false && <ShieldAlert className="h-3 w-3 text-amber-500" aria-label="not isolated" />}
                      </span>
                      <div className="flex items-center gap-1">
                        <StatusBadge label="Say" state={r?.say ?? "pending"} />
                        <SegBadge state={r?.segments ?? "pending"} done={r?.segDone ?? 0} total={r?.segTotal ?? 0} />
                        <Button size="sm" variant="ghost" onClick={() => previewLegacy(w)} title="Preview say">
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
