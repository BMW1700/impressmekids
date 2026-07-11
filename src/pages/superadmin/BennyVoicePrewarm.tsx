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

const CACHE_VERSION = "v2"; // Must match supabase/functions/prek-word-tts/index.ts

// Benny Voice Prewarm — walks every published Pre-K level, dedupes the words,
// and pre-generates BOTH the "say" and "teach" MP3s per word so playback at
// runtime is a $0 cache hit. One credit per unique word per mode, ever.

interface WordItem {
  word: string;
  worldTitle: string;
  levelTitle: string;
}

interface RowState {
  word: string;
  say: "pending" | "running" | "cached" | "generated" | "error";
  teach: "pending" | "running" | "cached" | "generated" | "error";
  error?: string;
}

const CONCURRENCY = 3; // Be nice to ElevenLabs rate limits

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

  // Initial content scan
  useEffect(() => {
    (async () => {
      setScanLoading(true);
      // Pull default voice ID off any world that has one set
      const { data: worlds } = await supabase
        .from("prek_worlds")
        .select("id, title, is_published, default_redub_voice_id")
        .eq("is_published", true);
      const firstVoice = worlds?.find((w: any) => w.default_redub_voice_id)?.default_redub_voice_id;
      if (firstVoice) setVoiceId(firstVoice);

      const worldIds = (worlds ?? []).map((w: any) => w.id);
      if (worldIds.length === 0) {
        setItems([]);
        setScanLoading(false);
        return;
      }
      const { data: levels } = await supabase
        .from("prek_levels")
        .select("id, title, world_id, is_published")
        .in("world_id", worldIds)
        .eq("is_published", true);
      const levelIds = (levels ?? []).map((l: any) => l.id);
      if (levelIds.length === 0) {
        setItems([]);
        setScanLoading(false);
        return;
      }
      const { data: words } = await supabase
        .from("prek_level_words")
        .select("word, level_id")
        .in("level_id", levelIds);

      const worldById = new Map((worlds ?? []).map((w: any) => [w.id, w]));
      const levelById = new Map((levels ?? []).map((l: any) => [l.id, l]));

      const collected: WordItem[] = [];
      for (const w of words ?? []) {
        const norm = normalizeWord(w.word ?? "");
        if (!norm) continue;
        // Split phrases into single words too — the "Hear" button plays whole word,
        // but children benefit from per-word phonics on phrases.
        const level = levelById.get(w.level_id) as any;
        const world = level ? (worldById.get(level.world_id) as any) : null;
        for (const token of norm.split(" ")) {
          if (!token) continue;
          collected.push({
            word: token,
            worldTitle: world?.title ?? "—",
            levelTitle: level?.title ?? "—",
          });
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

  // Probe storage so previously-cached words show as ✓ across page reloads.
  useEffect(() => {
    if (uniqueWords.length === 0 || !voiceId) return;
    let cancelled = false;
    (async () => {
      const listAll = async (prefix: string): Promise<Set<string>> => {
        const out = new Set<string>();
        // Storage list is capped at 100 by default; page until empty.
        let offset = 0;
        for (;;) {
          const { data, error } = await supabase.storage
            .from("prek-word-tts")
            .list(prefix, { limit: 1000, offset });
          if (error || !data || data.length === 0) break;
          for (const f of data) {
            if (f.name.endsWith(".mp3")) out.add(f.name.replace(/\.mp3$/, ""));
          }
          if (data.length < 1000) break;
          offset += 1000;
        }
        return out;
      };
      const [saySet, teachSet] = await Promise.all([
        listAll(`${voiceId}/${CACHE_VERSION}/say`),
        listAll(`${voiceId}/${CACHE_VERSION}/teach`),
      ]);
      if (cancelled) return;
      const slugify = (w: string) =>
        w.toLowerCase().replace(/[^a-z0-9']+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
      const seed: Record<string, RowState> = {};
      for (const w of uniqueWords) {
        const slug = slugify(w);
        seed[w] = {
          word: w,
          say: saySet.has(slug) ? "cached" : "pending",
          teach: teachSet.has(slug) ? "cached" : "pending",
        };
      }
      setRows(seed);
    })().catch((e) => console.warn("[prewarm] storage probe failed", e));
    return () => {
      cancelled = true;
    };
  }, [uniqueWords, voiceId]);

  const totalCalls = uniqueWords.length * 2; // say + teach
  const creditEstimate = totalCalls * 3;
  const usdEstimate = (creditEstimate / 1000).toFixed(2);

  const cachedCount = Object.values(rows).reduce(
    (n, r) => n + (r.say === "cached" || r.say === "generated" ? 1 : 0) + (r.teach === "cached" || r.teach === "generated" ? 1 : 0),
    0,
  );
  const errorCount = Object.values(rows).reduce(
    (n, r) => n + (r.say === "error" ? 1 : 0) + (r.teach === "error" ? 1 : 0),
    0,
  );
  const progress = totalCalls > 0 ? Math.round(((cachedCount + errorCount) / totalCalls) * 100) : 0;

  const runOne = async (word: string, mode: "say" | "teach"): Promise<"cached" | "generated" | "error"> => {
    try {
      const { data, error } = await supabase.functions.invoke("prek-word-tts", {
        body: { word, mode, voiceId: voiceId || undefined, force },
      });
      if (error || !data?.signedUrl) {
        return "error";
      }
      return data.cached ? "cached" : "generated";
    } catch {
      return "error";
    }
  };

  const startPrewarm = async () => {
    if (running) return;
    setRunning(true);
    setCancelFlag(false);
    // Seed rows
    const seed: Record<string, RowState> = {};
    for (const w of uniqueWords) seed[w] = { word: w, say: "pending", teach: "pending" };
    setRows(seed);

    const queue: Array<{ word: string; mode: "say" | "teach" }> = [];
    for (const w of uniqueWords) {
      queue.push({ word: w, mode: "say" });
      queue.push({ word: w, mode: "teach" });
    }

    let idx = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (true) {
        if (cancelFlag) return;
        const i = idx++;
        if (i >= queue.length) return;
        const job = queue[i];
        setRows((cur) => ({
          ...cur,
          [job.word]: { ...cur[job.word], [job.mode]: "running" },
        }));
        const result = await runOne(job.word, job.mode);
        setRows((cur) => ({
          ...cur,
          [job.word]: { ...cur[job.word], [job.mode]: result },
        }));
      }
    });
    await Promise.all(workers);
    setRunning(false);
    toast.success("Benny voice prewarm complete");
  };

  const previewOne = async (word: string, mode: "say" | "teach") => {
    const { data, error } = await supabase.functions.invoke("prek-word-tts", {
      body: { word, mode, voiceId: voiceId || undefined },
    });
    if (error || !data?.signedUrl) {
      toast.error("Preview failed");
      return;
    }
    const a = new Audio(data.signedUrl);
    a.play().catch(() => toast.error("Playback blocked"));
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
              Walks every published Pre-K level, collects every word, and generates BOTH the
              "say it" and "teach me" audio in ElevenLabs. Files are stored so every future
              playback is a $0 cache hit. One credit per unique word per mode, ever.
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
              <p className="text-xs text-muted-foreground mt-1">
                Auto-filled from the first published world that has a default Benny voice set.
              </p>
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

            <div className="flex items-center gap-3">
              <Button size="lg" onClick={startPrewarm} disabled={running || scanLoading || uniqueWords.length === 0}>
                {running ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Prewarming…</>
                ) : (
                  <>Prewarm all {uniqueWords.length} words</>
                )}
              </Button>
              {running && (
                <Button variant="outline" onClick={() => setCancelFlag(true)}>Cancel</Button>
              )}
              {totalCalls > 0 && (
                <div className="flex-1">
                  <Progress value={progress} />
                  <div className="text-xs text-muted-foreground mt-1">
                    {cachedCount} / {totalCalls} cached
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
                        <StatusBadge label="Teach" state={r?.teach ?? "pending"} />
                        <Button size="sm" variant="ghost" onClick={() => previewOne(w, "say")}>
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => previewOne(w, "teach")}>
                          <Play className="h-3 w-3" /> T
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

function StatusBadge({ label, state }: { label: string; state: RowState["say"] }) {
  if (state === "cached" || state === "generated") {
    return (
      <Badge variant="secondary" className="text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />{label}
      </Badge>
    );
  }
  if (state === "running") {
    return (
      <Badge variant="outline" className="text-xs">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />{label}
      </Badge>
    );
  }
  if (state === "error") {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />{label}
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-xs opacity-60">{label}</Badge>;
}

export default BennyVoicePrewarm;
