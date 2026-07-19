// RedubRegionRescueDialog — pick a region on the source-video audio and
// route it into ANY target scene as its new redub. Fixes cases where the
// automated redub grabbed the wrong phrase from a multi-phrase source.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Play, Pause, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RedubSceneInput } from "@/hooks/useBennyRedub";

const VIDEO_BUCKET = "prek-level-videos";
const WIDTH = 560;
const HEIGHT = 72;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fromScene: RedubSceneInput;
  allScenes: RedubSceneInput[];
  onSubmit: (args: {
    targetSceneKey: string;
    sourceVideoStoragePath: string;
    regionStartSeconds: number;
    regionEndSeconds: number;
  }) => Promise<boolean>;
}

export function RedubRegionRescueDialog({
  open,
  onOpenChange,
  fromScene,
  allScenes,
  onSubmit,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [selStart, setSelStart] = useState<number>(0);
  const [selEnd, setSelEnd] = useState<number>(0);
  const [targetSceneKey, setTargetSceneKey] = useState<string>(fromScene.sceneKey);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTargetSceneKey(fromScene.sceneKey);
    setPeaks(null);
    setDuration(0);
    setSelStart(0);
    setSelEnd(0);
    (async () => {
      const { data, error } = await supabase.storage
        .from(VIDEO_BUCKET)
        .createSignedUrl(fromScene.sourceStoragePath, 60 * 60);
      if (error || !data?.signedUrl || cancelled) return;
      setSignedUrl(data.signedUrl);
      try {
        const res = await fetch(data.signedUrl);
        const buf = await res.arrayBuffer();
        const AC = window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const audioBuf = await ctx.decodeAudioData(buf.slice(0));
        void ctx.close();
        if (cancelled) return;
        const ch = audioBuf.getChannelData(0);
        const bins = 800;
        const step = Math.max(1, Math.floor(ch.length / bins));
        const p = new Float32Array(bins);
        for (let i = 0; i < bins; i++) {
          let max = 0;
          const s = i * step;
          const e = Math.min(ch.length, s + step);
          for (let j = s; j < e; j++) {
            const v = Math.abs(ch[j]);
            if (v > max) max = v;
          }
          p[i] = max;
        }
        setPeaks(p);
        setDuration(audioBuf.duration);
        setSelStart(0);
        setSelEnd(audioBuf.duration);
      } catch (e) {
        console.warn("[RegionRescue] decode failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [open, fromScene.sourceStoragePath, fromScene.sceneKey]);

  // Paint waveform + selection.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = WIDTH * dpr;
    c.height = HEIGHT * dpr;
    const g = c.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, WIDTH, HEIGHT);
    const mid = HEIGHT / 2;
    // waveform
    g.fillStyle = "rgba(168, 85, 247, 0.8)";
    if (peaks && peaks.length) {
      let max = 0;
      for (const v of peaks) if (v > max) max = v;
      const scale = max > 0 ? 1 / max : 1;
      for (let x = 0; x < WIDTH; x++) {
        const idx = Math.min(peaks.length - 1, Math.floor((x / WIDTH) * peaks.length));
        const barH = Math.max(1, Math.min(1, peaks[idx] * scale) * (HEIGHT - 4));
        g.fillRect(x, mid - barH / 2, 1, barH);
      }
    } else {
      g.fillRect(0, mid - 0.5, WIDTH, 1);
    }
    // selection overlay
    if (duration > 0 && selEnd > selStart) {
      const x1 = (selStart / duration) * WIDTH;
      const x2 = (selEnd / duration) * WIDTH;
      g.fillStyle = "rgba(52, 211, 153, 0.25)";
      g.fillRect(x1, 0, x2 - x1, HEIGHT);
      g.fillStyle = "rgb(52, 211, 153)";
      g.fillRect(x1, 0, 2, HEIGHT);
      g.fillRect(x2 - 2, 0, 2, HEIGHT);
    }
  }, [peaks, selStart, selEnd, duration]);

  // Drag-select handlers.
  const dragRef = useRef<{ x0: number } | null>(null);
  const xToSec = (x: number) => duration > 0 ? Math.max(0, Math.min(duration, (x / WIDTH) * duration)) : 0;
  const onDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    (ev.currentTarget as HTMLCanvasElement).setPointerCapture(ev.pointerId);
    const rect = (ev.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const x = ev.clientX - rect.left;
    dragRef.current = { x0: x };
    const s = xToSec(x);
    setSelStart(s);
    setSelEnd(s);
  };
  const onMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const rect = (ev.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const a = xToSec(dragRef.current.x0);
    const b = xToSec(x);
    setSelStart(Math.min(a, b));
    setSelEnd(Math.max(a, b));
  };
  const onUp = () => { dragRef.current = null; };

  const previewRegion = () => {
    if (!signedUrl || selEnd <= selStart) return;
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* noop */ }
    }
    const a = new Audio(signedUrl);
    audioRef.current = a;
    a.currentTime = selStart;
    setPlaying(true);
    const onT = () => {
      if (a.currentTime >= selEnd) {
        try { a.pause(); } catch { /* noop */ }
        a.removeEventListener("timeupdate", onT);
        setPlaying(false);
      }
    };
    a.addEventListener("timeupdate", onT);
    a.addEventListener("ended", () => setPlaying(false));
    a.play().catch(() => setPlaying(false));
  };
  const stopPreview = () => {
    if (audioRef.current) { try { audioRef.current.pause(); } catch { /* noop */ } }
    setPlaying(false);
  };
  useEffect(() => () => { try { audioRef.current?.pause(); } catch { /* noop */ } }, []);

  const targetLabel = useMemo(
    () => allScenes.find((s) => s.sceneKey === targetSceneKey)?.label ?? targetSceneKey,
    [targetSceneKey, allScenes],
  );

  const canSubmit = duration > 0 && selEnd - selStart >= 0.2 && !busy;

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const ok = await onSubmit({
        targetSceneKey,
        sourceVideoStoragePath: fromScene.sourceStoragePath,
        regionStartSeconds: selStart,
        regionEndSeconds: selEnd,
      });
      if (ok) {
        toast.success(`Redubbed ${targetLabel} from ${selStart.toFixed(2)}s–${selEnd.toFixed(2)}s of ${fromScene.label}`);
        onOpenChange(false);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-4 w-4" /> Region Rescue — redub from a highlighted piece of source
          </DialogTitle>
          <DialogDescription>
            Drag on the waveform to highlight the exact phrase, then pick which scene to write the redub into.
            Sampling from <span className="font-mono text-xs">{fromScene.label}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border bg-background/60 p-2">
            <canvas
              ref={canvasRef}
              style={{ width: WIDTH, height: HEIGHT, touchAction: "none", cursor: "crosshair" }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
            {!peaks && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Decoding source audio…
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>0.00s</span>
              <span className="font-mono">
                {selStart.toFixed(2)}s → {selEnd.toFixed(2)}s ({Math.max(0, selEnd - selStart).toFixed(2)}s)
              </span>
              <span>{duration.toFixed(2)}s</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={playing ? stopPreview : previewRegion} disabled={selEnd - selStart < 0.05}>
              {playing ? <><Pause className="h-3 w-3 mr-1" /> Stop</> : <><Play className="h-3 w-3 mr-1" /> Preview region</>}
            </Button>
            <div className="flex-1" />
            <Label className="text-xs">Redub into:</Label>
            <Select value={targetSceneKey} onValueChange={setTargetSceneKey}>
              <SelectTrigger className="w-[240px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allScenes.map((s) => (
                  <SelectItem key={s.sceneKey} value={s.sceneKey} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {busy ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Redubbing…</> : <><Scissors className="h-3 w-3 mr-1" /> Redub region into "{targetLabel}"</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
