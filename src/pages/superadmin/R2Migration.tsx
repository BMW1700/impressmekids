import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, RefreshCw, Play, Search, Zap } from "lucide-react";

interface ScanStatus {
  state: string;
  last_error?: string | null;
  discovered?: number;
}
interface Stats {
  total: number;
  counts: Record<string, number>;
  scan?: ScanStatus;
}

export default function R2Migration() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastBatch, setLastBatch] = useState<string>("");
  const [repatching, setRepatching] = useState(false);
  const [repatchStatus, setRepatchStatus] = useState<string>("");
  const [failed, setFailed] = useState<
    Array<{ bucket: string; path: string; error: string | null }>
  >([]);


  const call = async (action: string, body: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("migrate-to-r2", {
      body: { action, ...body },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const s = await call("stats");
      setStats({ total: s.total, counts: s.counts, scan: s.scan });
      const { data: fails } = await supabase
        .from("r2_migration_log")
        .select("bucket, path, error")
        .eq("status", "failed")
        .limit(50);
      setFailed((fails ?? []) as any);
      return s as Stats;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const scan = async () => {
    setScanning(true);
    try {
      await call("scan");
      toast.info("Scan started — this runs in the background");
      // Poll every 2s until state !== 'scanning'
      while (true) {
        await new Promise((r) => setTimeout(r, 2000));
        const s = await loadStats();
        if (!s || s.scan?.state !== "scanning") {
          if (s?.scan?.state === "failed") {
            toast.error(s.scan.last_error || "Scan failed");
          } else if (s) {
            toast.success(`Scan finished — ${s.scan?.discovered ?? 0} files discovered`);
          }
          break;
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setScanning(false);
    }
  };


  const runOnce = async () => {
    const r = await call("batch", { size: 25 });
    setLastBatch(`attempted ${r.attempted}, ok ${r.ok}, failed ${r.failed}`);
    return r;
  };

  const runUntilDone = async () => {
    setRunning(true);
    try {
      // Loop batches until no more pending
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const r = await runOnce();
        await loadStats();
        if (!r.attempted) break;
      }
      toast.success("Migration finished");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const repatchHeaders = async () => {
    setRepatching(true);
    setRepatchStatus("");
    try {
      let cursor: string | null = null;
      let totalOk = 0;
      let totalFailed = 0;
      let totalAttempted = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const r: any = await call("repatch-headers", { size: 150, cursor });
        totalOk += r.ok || 0;
        totalFailed += r.failed || 0;
        totalAttempted += r.attempted || 0;
        setRepatchStatus(`Re-patched ${totalOk} / attempted ${totalAttempted} (failed ${totalFailed})`);
        if (!r.attempted || !r.nextCursor) break;
        cursor = r.nextCursor;
      }
      toast.success(`Cache headers re-patched on ${totalOk} files`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRepatching(false);
    }
  };


  const pending = stats?.counts.pending ?? 0;
  const copied = stats?.counts.copied ?? 0;
  const failedCount = stats?.counts.failed ?? 0;
  const total = stats?.total ?? 0;
  const pct = total > 0 ? Math.round((copied / total) * 100) : 0;

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">R2 Migration</h1>
        <p className="text-muted-foreground">
          Copy Supabase Storage → Cloudflare R2 (cdn.yubilearn.com). Zero egress after cutover.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-2xl font-semibold">{copied} / {total} copied ({pct}%)</div>
          </div>
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <Progress value={pct} />
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Pending:</span> <b>{pending}</b></div>
          <div><span className="text-muted-foreground">Copied:</span> <b className="text-green-600">{copied}</b></div>
          <div><span className="text-muted-foreground">Failed:</span> <b className="text-red-600">{failedCount}</b></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Steps</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={scan} disabled={scanning || running}>
            {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            1. Scan Storage
          </Button>
          <Button onClick={runUntilDone} disabled={running || scanning || pending === 0}>
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            2. Run migration
          </Button>
          <Button variant="secondary" onClick={repatchHeaders} disabled={repatching || running || scanning || copied === 0}>
            {repatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            3. Re-patch cache headers
          </Button>
        </div>
        {lastBatch && <div className="text-xs text-muted-foreground">Last batch: {lastBatch}</div>}
        {repatchStatus && <div className="text-xs text-muted-foreground">{repatchStatus}</div>}

        </div>
        {lastBatch && <div className="text-xs text-muted-foreground">Last batch: {lastBatch}</div>}
      </Card>

      {failed.length > 0 && (
        <Card className="p-6 space-y-2">
          <h2 className="font-semibold text-red-600">Failed files ({failed.length})</h2>
          <div className="max-h-96 overflow-y-auto text-xs space-y-1 font-mono">
            {failed.map((f, i) => (
              <div key={i} className="border-b py-1">
                <div><b>{f.bucket}</b>/{f.path}</div>
                <div className="text-red-600">{f.error}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
