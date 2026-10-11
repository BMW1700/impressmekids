import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Speech Lab — isolated test room. Compares the browser's built-in speech
 * recognition against an on-device model (Whisper tiny, runs locally, cached
 * after first load). Both run at the SAME time, exactly like the planned
 * hybrid in the RPG reader, so this also tests whether a device (iPad) can
 * run both at once. Nothing here touches the live game.
 */

const MODEL_ID = "onnx-community/whisper-tiny.en";
let pipePromise: Promise<any> | null = null;

function loadModel(onProgress: (p: number) => void) {
  if (!pipePromise) {
    pipePromise = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("automatic-speech-recognition", MODEL_ID, {
        dtype: "q8",
        progress_callback: (e: any) => {
          if (e?.status === "progress" && typeof e.progress === "number") onProgress(e.progress);
        },
      } as any),
    );
    pipePromise.catch(() => (pipePromise = null));
  }
  return pipePromise;
}

const clean = (s: string) => s.toLowerCase().replace(/[^a-z']/g, "").replace(/'/g, "");

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const sim = (a: string, b: string) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);
const tokens = (s: string) => s.split(/\s+/).map(clean).filter(Boolean);

/** Which target words did a transcript cover? exact = browser rule, fuzzy = model rule. */
function covered(targets: string[], transcript: string, fuzzy: boolean) {
  const spoken = tokens(transcript);
  const used = new Set<number>();
  return targets.map((t) => {
    const idx = spoken.findIndex((s, i) => !used.has(i) && (fuzzy ? sim(s, t) >= 0.75 : s === t));
    if (idx >= 0) used.add(idx);
    return idx >= 0;
  });
}

async function toMono16k(blob: Blob) {
  const ctx = new AudioContext({ sampleRate: 16000 });
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  const data = buf.getChannelData(0).slice();
  ctx.close();
  return data;
}

type Row = {
  target: string;
  webSpeech: string;
  webError: string;
  model: string;
  webHits: boolean[];
  modelHits: boolean[];
  ms: number;
};

export default function SpeechLab() {
  const [mode, setMode] = useState<"sentence" | "word">("sentence");
  const [sentencesText, setSentencesText] = useState(
    "The cat sat on the mat.\nA big dog ran up the hill.\nThe ship is in the fog.\nI can jump and hop.",
  );
  const [wordsText, setWordsText] = useState("cat, ship, jump, frog, sit");
  const items =
    mode === "sentence"
      ? sentencesText.split("\n").map((s) => s.trim()).filter(Boolean)
      : wordsText.split(/[,\s]+/).map(clean).filter(Boolean);
  const [target, setTarget] = useState(0);
  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const recRef = useRef<MediaRecorder | null>(null);
  const webRef = useRef<any>(null);
  const webTextRef = useRef("");
  const webErrRef = useRef("");

  useEffect(() => {
    const t = performance.now();
    loadModel(setLoadPct)
      .then(() => { setReady(true); console.log("[SpeechLab] model ready in", Math.round(performance.now() - t), "ms"); })
      .catch((e) => setLoadErr(String(e?.message ?? e)));
  }, []);

  const current = items[target % Math.max(items.length, 1)] ?? "";

  const start = async () => {
    const targetText = current;
    const targetWords = tokens(targetText);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const chunks: Blob[] = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      try { webRef.current?.stop(); } catch { /* ignore */ }
      setBusy(true);
      try {
        const pipe = await loadModel(setLoadPct);
        const audio = await toMono16k(new Blob(chunks, { type: mr.mimeType }));
        const t0 = performance.now();
        const out = await pipe(audio);
        const ms = Math.round(performance.now() - t0);
        const raw = String(out?.text ?? "").trim();
        await new Promise((r) => setTimeout(r, 300)); // let web speech finalize
        setRows((r) => [{
          target: targetText,
          webSpeech: webTextRef.current.trim() || "—",
          webError: webErrRef.current,
          model: raw || "—",
          webHits: covered(targetWords, webTextRef.current, false),
          modelHits: covered(targetWords, raw, true),
          ms,
        }, ...r]);
        setTarget((i) => (i + 1) % Math.max(items.length, 1));
      } finally { setBusy(false); }
    };
    // Browser's built-in recognizer runs at the same time (same as the planned hybrid).
    webTextRef.current = "";
    webErrRef.current = "";
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (Ctor) {
      const w = new Ctor();
      w.lang = "en-US"; w.interimResults = false; w.continuous = true;
      w.onresult = (e: any) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) webTextRef.current += " " + e.results[i][0].transcript; };
      w.onerror = (e: any) => { webErrRef.current = String(e?.error ?? "error"); };
      try { w.start(); webRef.current = w; } catch (err: any) { webErrRef.current = String(err?.message ?? "could not start"); }
    } else {
      webErrRef.current = "not supported on this browser";
    }
    mr.start();
    recRef.current = mr;
    setRecording(true);
  };

  const stop = () => { recRef.current?.stop(); setRecording(false); };

  const total = rows.reduce((n, r) => n + r.webHits.length, 0);
  const webScore = rows.reduce((n, r) => n + r.webHits.filter(Boolean).length, 0);
  const hybridScore = rows.reduce((n, r) => n + r.webHits.filter((h, i) => h || r.modelHits[i]).length, 0);
  const rescued = hybridScore - webScore;
  const browserFailures = rows.filter((r) => r.webError || r.webSpeech === "—").length;
  const avgMs = rows.length ? Math.round(rows.reduce((n, r) => n + r.ms, 0) / rows.length) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Speech Lab</h1>
          <p className="text-muted-foreground">
            Test room only. Read the sentence out loud like a student would, then tap Stop.
          </p>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "sentence" ? "default" : "outline"} onClick={() => { setMode("sentence"); setTarget(0); }}>Sentences (like RPG)</Button>
            <Button size="sm" variant={mode === "word" ? "default" : "outline"} onClick={() => { setMode("word"); setTarget(0); }}>Single words</Button>
          </div>
          {mode === "sentence" ? (
            <Textarea rows={4} value={sentencesText} onChange={(e) => { setSentencesText(e.target.value); setTarget(0); }} placeholder="One sentence per line" />
          ) : (
            <Input value={wordsText} onChange={(e) => { setWordsText(e.target.value); setTarget(0); }} />
          )}
          <p className="text-sm text-muted-foreground">
            {loadErr ? `Model failed to load: ${loadErr}` : ready ? "On-device model ready (saved on this device for next time)." : `Loading on-device model… ${Math.round(loadPct)}%`}
          </p>
        </Card>

        <Card className="p-10 flex flex-col items-center gap-6">
          <div className={`${mode === "sentence" ? "text-4xl" : "text-7xl"} font-bold lowercase text-center`}>{current || "—"}</div>
          {recording ? (
            <Button size="lg" variant="destructive" onClick={stop}><Square className="mr-2 h-5 w-5" />Stop</Button>
          ) : (
            <Button size="lg" onClick={start} disabled={busy || items.length === 0}>
              {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mic className="mr-2 h-5 w-5" />}
              {busy ? "Checking…" : "Tap to start reading"}
            </Button>
          )}
        </Card>

        {rows.length > 0 && (
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><div className="text-muted-foreground">Today's mic</div><div className="text-xl font-bold">{webScore}/{total}</div></div>
              <div><div className="text-muted-foreground">With rescue</div><div className="text-xl font-bold">{hybridScore}/{total}</div></div>
              <div><div className="text-muted-foreground">Words rescued</div><div className="text-xl font-bold text-primary">{rescued}</div></div>
              <div><div className="text-muted-foreground">Avg check time</div><div className="text-xl font-bold">{avgMs}ms</div></div>
            </div>
            {browserFailures > 0 && (
              <p className="text-sm text-destructive">
                Today's mic heard nothing or errored on {browserFailures} of {rows.length} tries. On an iPad, that means both listeners can't run at the same time on this device.
              </p>
            )}
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="border-t border-border pt-3 text-sm space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {tokens(r.target).map((w, j) => {
                      const web = r.webHits[j], mod = r.modelHits[j];
                      const cls = web ? "bg-primary/15 text-primary" : mod ? "bg-accent text-accent-foreground ring-1 ring-primary" : "bg-destructive/15 text-destructive";
                      return <span key={j} className={`px-2 py-0.5 rounded ${cls}`}>{w}{!web && mod ? " ✓ rescued" : ""}</span>;
                    })}
                  </div>
                  <div className="text-muted-foreground">Today's mic heard: {r.webSpeech}{r.webError ? ` (error: ${r.webError})` : ""}</div>
                  <div className="text-muted-foreground">On-device heard: {r.model} · {r.ms}ms</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
