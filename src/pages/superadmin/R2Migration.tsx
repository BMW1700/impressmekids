import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RefreshCw, Play, Search, TestTube2, Zap, RotateCcw, Trash2 } from "lucide-react";
import { CdnHealthWidget, R2FolderListingNote } from "@/components/superadmin/CdnHealthWidget";

interface ScanStatus {
  state: string;
  last_error?: string | null;
  discovered?: number;
}
interface Stats {
  total: number;
  counts: { pending: number; copied: number; failed: number; repatch_failed: number };
  byBucket?: Array<{ bucket: string; pending: number; copied: number; failed: number; repatch_failed: number }>;
  scan?: ScanStatus;
}

interface FailedRow {
  bucket: string;
  path: string;
  error: string | null;
  attempts?: number;
}

interface R2PermissionTest {
  ok: boolean;
  bucket: string;
  result: Record<string, { ok: boolean; status?: number; error?: string }>;
}

export default function R2Migration() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastBatch, setLastBatch] = useState<string>("");
  const [repatching, setRepatching] = useState(false);
  const [testingR2, setTestingR2] = useState(false);
  const [repatchStatus, setRepatchStatus] = useState<string>("");
  const [failed, setFailed] = useState<FailedRow[]>([]);
  const [repatchFailedList, setRepatchFailedList] = useState<FailedRow[]>([]);
  const [r2Test, setR2Test] = useState<R2PermissionTest | null>(null);

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
      setStats({ total: s.total, counts: s.counts, byBucket: s.byBucket ?? [], scan: s.scan });
      const list = await call("list-failed", { size: 200 });
      setFailed((list.failed ?? []) as FailedRow[]);
      setRepatchFailedList((list.repatchFailed ?? []) as FailedRow[]);
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
      while (true) {
        const r = await runOnce();
        await loadStats();
        if (!r.attempted) break;
      }
      toast.success("Migration pass finished");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const resetAndRetry = async () => {
    setResetting(true);
    try {
      const r = await call("reset-failed");
      toast.info(`Reset ${r.reset} failed rows → retrying`);
      await loadStats();
      setRunning(true);
      while (true) {
        const b = await runOnce();
        await loadStats();
        if (!b.attempted) break;
      }
      toast.success("Retry pass finished");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResetting(false);
      setRunning(false);
    }
  };

  const repairMissingR2Files = async () => {
    setResetting(true);
    setRepatching(true);
    setRepatchStatus("");
    try {
      const reset = await call("reset-repatch-missing-to-pending");
      const resetCount = Number(reset.reset ?? 0);
      toast.info(`Re-queued ${resetCount} missing R2 files for a fresh copy`);
      await loadStats();

      setRunning(true);
      while (true) {
        const b = await runOnce();
        await loadStats();
        if (!b.attempted) break;
      }
      setRunning(false);

      let cursor: string | null = null;
      let totalOk = 0;
      let totalFailed = 0;
      let totalAttempted = 0;
      while (true) {
        const r: any = await call("repatch-headers", { size: 150, cursor });
        totalOk += r.ok || 0;
        totalFailed += r.failed || 0;
        totalAttempted += r.attempted || 0;
        setRepatchStatus(`Re-patched ${totalOk} / attempted ${totalAttempted} (failed ${totalFailed})`);
        if (!r.attempted || !r.nextCursor) break;
        cursor = r.nextCursor;
      }
      await loadStats();
      toast.success("Missing R2 files were re-copied and cache headers were checked");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
      setResetting(false);
      setRepatching(false);
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
      while (true) {
        const r: any = await call("repatch-headers", { size: 150, cursor });
        totalOk += r.ok || 0;
        totalFailed += r.failed || 0;
        totalAttempted += r.attempted || 0;
        setRepatchStatus(`Re-patched ${totalOk} / attempted ${totalAttempted} (failed ${totalFailed})`);
        if (!r.attempted || !r.nextCursor) break;
        cursor = r.nextCursor;
      }
      await loadStats();
      toast.success(`Cache headers re-patched on ${totalOk} files`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRepatching(false);
    }
  };

  const testR2Permissions = async () => {
    setTestingR2(true);
    setR2Test(null);
    try {
      const result = await call("test-r2-permissions");
      setR2Test(result as R2PermissionTest);
      if (result.ok) {
        toast.success("R2 write/copy/delete permissions passed");
      } else {
        toast.error("R2 token failed the API write test");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTestingR2(false);
    }
  };

  const clearRepatchFailures = async () => {
    setResetting(true);
    try {
      const r = await call("clear-repatch-failures");
      toast.success(`Cleared ${r.cleared ?? 0} stale repatch failures`);
      await loadStats();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResetting(false);
    }
  };

  const purgeGhostFailures = async () => {
    setResetting(true);
    try {
      const r = await call("purge-orphaned-failed");
      const purged = Number(r.purged ?? 0);
      const kept = Number(r.kept ?? 0);
      if (purged > 0) toast.success(`Removed ${purged} ghost log rows (source files were already deleted from Storage)`);
      if (kept > 0) toast.warning(`${kept} rows kept — source file still exists, needs real retry`);
      if (purged === 0 && kept === 0) toast.info("No ghost rows found");
      await loadStats();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResetting(false);
    }
  };

  const pending = stats?.counts.pending ?? 0;
  const copied = stats?.counts.copied ?? 0;
  const failedCount = stats?.counts.failed ?? 0;
  const repatchFailedCount = stats?.counts.repatch_failed ?? 0;
  const total = stats?.total ?? 0;
  const pct = total > 0 ? Math.round((copied / total) * 100) : 0;

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">R2 Migration</h1>
        <p className="text-muted-foreground">
          Copy Backend Storage → Cloudflare R2 (cdn.yubilearn.com). Zero egress after cutover.
        </p>
      </div>

      <CdnHealthWidget />
      <R2FolderListingNote />

      {(failedCount > 0 || repatchFailedCount > 0 || r2Test?.ok === false) && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <div>
              <div className="font-semibold">CDN health is not the same as R2 write permission.</div>
              <p className="text-xs text-muted-foreground">
                The failures shown here are S3 API permission failures. A green CDN check only proves files can be read from the public domain; it does not prove the R2 token can PUT, COPY, or DELETE objects.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Progress (of known files)</div>
            <div className="text-2xl font-semibold">{copied} / {total} logged copied ({pct}%)</div>
            <div className="text-xs text-muted-foreground mt-1">
              Run "Scan Storage" to refresh the known-file count. Repatch NoSuchKey errors mean the log says copied, but the file is missing from the current R2 bucket.
            </div>
          </div>
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <Progress value={pct} />
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Pending:</span> <b>{pending}</b></div>
          <div><span className="text-muted-foreground">Logged copied:</span> <b className="text-green-600">{copied}</b></div>
          <div><span className="text-muted-foreground">Failed:</span> <b className="text-red-600">{failedCount}</b></div>
          <div><span className="text-muted-foreground">Repatch failed:</span> <b className="text-amber-600">{repatchFailedCount}</b></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">R2 API permission test</h2>
            <p className="text-xs text-muted-foreground">
              This tests direct write, metadata-copy, and delete permissions on the configured R2 bucket.
            </p>
          </div>
          <Button variant="outline" onClick={testR2Permissions} disabled={testingR2 || running || scanning}>
            {testingR2 ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube2 className="w-4 h-4 mr-2" />}
            Test R2 write permissions
          </Button>
        </div>
        {r2Test && (
          <div className="rounded-md border p-3 text-xs space-y-2">
            <div className={r2Test.ok ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
              {r2Test.ok ? "Passed" : "Failed"} — bucket: {r2Test.bucket}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {Object.entries(r2Test.result).map(([op, item]) => (
                <div key={op} className="rounded border p-2">
                  <div className="font-mono uppercase">{op}: {item.ok ? "OK" : "FAILED"}{item.status ? ` (${item.status})` : ""}</div>
                  {item.error && <div className="mt-1 text-red-600 break-words">{item.error}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Steps</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={scan} disabled={scanning || running || resetting}>
            {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            1. Scan Storage
          </Button>
          <Button onClick={runUntilDone} disabled={running || scanning || resetting || pending === 0}>
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            2. Run migration
          </Button>
          <Button
            variant="destructive"
            onClick={resetAndRetry}
            disabled={resetting || running || scanning || failedCount === 0}
          >
            {resetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Reset failed → retry ({failedCount})
          </Button>
          <Button
            variant="default"
            onClick={repairMissingR2Files}
            disabled={resetting || running || scanning || repatching || repatchFailedCount === 0}
          >
            {(resetting || running || repatching) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Fix missing R2 files → re-copy ({repatchFailedCount})
          </Button>
          <Button variant="secondary" onClick={repatchHeaders} disabled={repatching || running || scanning || resetting || copied === 0}>
            {repatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            3. Re-patch cache headers
          </Button>
          <Button variant="outline" onClick={clearRepatchFailures} disabled={resetting || running || scanning || repatchFailedCount === 0}>
            Only clear stale messages ({repatchFailedCount})
          </Button>
        </div>
        {lastBatch && <div className="text-xs text-muted-foreground">Last batch: {lastBatch}</div>}
        {repatchStatus && <div className="text-xs text-muted-foreground">{repatchStatus}</div>}
      </Card>

      {stats?.byBucket && stats.byBucket.some((b) => b.failed > 0 || b.repatch_failed > 0 || b.pending > 0) && (
        <Card className="p-6 space-y-2">
          <h2 className="font-semibold">Bucket breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-left">Bucket</th>
                  <th className="py-2 text-right">Pending</th>
                  <th className="py-2 text-right">Copied</th>
                  <th className="py-2 text-right">Failed</th>
                  <th className="py-2 text-right">Repatch failed</th>
                </tr>
              </thead>
              <tbody>
                {[...stats.byBucket]
                  .sort((a, b) => (b.failed + b.repatch_failed + b.pending) - (a.failed + a.repatch_failed + a.pending))
                  .map((b) => (
                    <tr key={b.bucket} className="border-b last:border-b-0">
                      <td className="py-2 font-mono">{b.bucket}</td>
                      <td className="py-2 text-right">{b.pending}</td>
                      <td className="py-2 text-right text-green-600">{b.copied}</td>
                      <td className="py-2 text-right text-red-600">{b.failed}</td>
                      <td className="py-2 text-right text-amber-600">{b.repatch_failed}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {failed.length > 0 && (
        <Card className="p-6 space-y-2">
          <h2 className="font-semibold text-red-600">Transfer failures ({failedCount})</h2>
          <p className="text-xs text-muted-foreground">
            Showing up to 200. Fix the Cloudflare R2 token so it can write objects to the configured bucket,
            then click "Reset failed → retry".
          </p>
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

      {repatchFailedList.length > 0 && (
        <Card className="p-6 space-y-2">
          <h2 className="font-semibold text-amber-600">Repatch failures ({repatchFailedCount})</h2>
          <p className="text-xs text-muted-foreground">
            NoSuchKey means the migration log says these files were copied, but they are missing from
            the current R2 bucket. Click "Fix missing R2 files → re-copy" to force a fresh copy from storage.
          </p>
          <div className="max-h-96 overflow-y-auto text-xs space-y-1 font-mono">
            {repatchFailedList.map((f, i) => (
              <div key={i} className="border-b py-1">
                <div><b>{f.bucket}</b>/{f.path}</div>
                <div className="text-amber-600">{f.error}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
