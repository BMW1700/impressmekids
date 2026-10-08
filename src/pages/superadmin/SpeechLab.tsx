import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Speech Lab — isolated test room. Compares the browser's built-in speech
 * recognition against an on-device model (Whisper tiny, runs locally, cached
 * after first load) whose output is snapped to the words on screen.
 * Nothing here touches the live game.
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

const clean = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Snap a raw transcript onto the allowed word list (on-screen words only). */
function snap(raw: string, allowed: string[]) {
  const spoken = raw.split(/\s+/).map(clean).filter(Boolean);
  let best = { word: "", score: 0 };
  for (const s of spoken)
    for (const w of allowed) {
      const score = 1 - lev(s, w) / Math.max(s.length, w.length);
      if (score > best.score) best = { word: w, score };
    }
  return best.score >= 0.5 ? best : { word: "", score: best.score };
}

async function toMono16k(blob: Blob) {
  const ctx = new AudioContext({ sampleRate: 16000 });
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  const data = buf.getChannelData(0).slice();
  ctx.close();
  return data;
}

type Row = { target: string; webSpeech: string; model: string; snapped: string; ms: number };

export default function SpeechLab() {
  const [wordsText, setWordsText] = useState("cat, ship, jump, frog, sit");
  const words = wordsText.split(/[,\s]+/).map(clean).filter(Boolean);
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
  const t0 = useRef(0);

  useEffect(() => {
    const t = performance.now();
    loadModel(setLoadPct)
      .then(() => { setReady(true); console.log("[SpeechLab] model ready in", Math.round(performance.now() - t), "ms"); })
      .catch((e) => setLoadErr(String(e?.message ?? e)));
  }, []);

  const start = async () => {
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
        t0.current = performance.now();
        const out = await pipe(audio);
        const ms = Math.round(performance.now() - t0.current);
        const raw = String(out?.text ?? "").trim();
        await new Promise((r) => setTimeout(r, 300)); // let web speech finalize
        const s = snap(raw, words);
        setRows((r) => [{ target: words[target], webSpeech: webTextRef.current || "—", model: raw || "—", snapped: s.word || "no match", ms }, ...r]);
        setTarget((i) => (i + 1) % Math.max(words.length, 1));
      } finally { setBusy(false); }
    };
    // Run the browser's built-in recognizer side-by-side for comparison
    webTextRef.current = "";
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (Ctor) {
      const w = new Ctor();
      w.lang = "en-US"; w.interimResults = false; w.continuous = true;
      w.onresult = (e: any) => { for (let i = e.resultIndex; i < e.results.length; i++) webTextRef.current += " " + e.results[i][0].transcript; };
      try { w.start(); webRef.current = w; } catch { /* ignore */ }
    }
    mr.start();
    recRef.current = mr;
    setRecording(true);
  };

  const stop = () => { recRef.current?.stop(); setRecording(false); };

  const hit = (r: Row, v: string) => clean(v.split(/\s+/).find((x) => clean(x) === r.target) ?? "") === r.target;
  const webScore = rows.filter((r) => hit(r, r.webSpeech)).length;
  const modelScore = rows.filter((r) => r.snapped === r.target).length;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Speech Lab</h1>
          <p className="text-muted-foreground">Test room only. Read the big word, then compare both engines.</p>
        </div>

        <Card className="p-4 space-y-2">
          <label className="text-sm font-medium">Words on screen</label>
          <Input value={wordsText} onChange={(e) => { setWordsText(e.target.value); setTarget(0); }} />
          <p className="text-sm text-muted-foreground">
            {loadErr ? `Model failed to load: ${loadErr}` : ready ? "On-device model ready (cached for next time)." : `Loading on-device model… ${Math.round(loadPct)}%`}
          </p>
        </Card>

        <Card className="p-10 flex flex-col items-center gap-6">
          <div className="text-7xl font-bold lowercase">{words[target] ?? "—"}</div>
          {recording ? (
            <Button size="lg" variant="destructive" onClick={stop}><Square className="mr-2 h-5 w-5" />Stop</Button>
          ) : (
            <Button size="lg" onClick={start} disabled={busy || words.length === 0}>
              {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mic className="mr-2 h-5 w-5" />}
              {busy ? "Checking…" : "Hold to read — tap to start"}
            </Button>
          )}
        </Card>

        {rows.length > 0 && (
          <Card className="p-4 space-y-3">
            <div className="flex gap-6 text-sm font-medium">
              <span>Browser built-in: {webScore}/{rows.length}</span>
              <span>On-device + snapped: {modelScore}/{rows.length}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-left">
                <tr><th>Target</th><th>Browser heard</th><th>Model heard</th><th>Snapped</th><th>Time</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1 font-medium">{r.target}</td>
                    <td className={hit(r, r.webSpeech) ? "text-primary" : "text-destructive"}>{r.webSpeech}</td>
                    <td>{r.model}</td>
                    <td className={r.snapped === r.target ? "text-primary" : "text-destructive"}>{r.snapped}</td>
                    <td>{r.ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
