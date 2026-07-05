import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Info } from "lucide-react";

// Known-good file we confirmed serves 200 OK from the R2 CDN. If this ever
// stops loading, the CDN itself is down — full-stop signal.
const HEALTH_CHECK_URL =
  "https://cdn.yubilearn.com/prek-level-videos/f327e823-1538-4db6-86c2-23de36501469/cdc3169e-fc59-4e4b-ba07-c419d05c3ab8/opening-1781287571352.mov";

// We can't HEAD cdn.yubilearn.com from the browser — CORS blocks it. Instead
// we let the browser attempt to load a range of the file via a <video preload>
// element and treat a successful "loadedmetadata" as green. This matches how
// real user traffic exercises the CDN.
type Status = "checking" | "ok" | "fail";

export function CdnHealthWidget() {
  const [status, setStatus] = useState<Status>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const ref = useRef<HTMLVideoElement | null>(null);

  const check = () => {
    setStatus("checking");
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    const done = (ok: boolean) => {
      window.clearTimeout(timeout);
      v.removeAttribute("src");
      v.load();
      setStatus(ok ? "ok" : "fail");
      setCheckedAt(new Date());
    };
    const timeout = window.setTimeout(() => done(false), 5000);
    v.onloadedmetadata = () => done(true);
    v.onerror = () => done(false);
    v.src = HEALTH_CHECK_URL;
    ref.current = v;
  };

  useEffect(() => {
    check();
    return () => {
      if (ref.current) {
        ref.current.removeAttribute("src");
        ref.current.load();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {status === "checking" && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          {status === "ok" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {status === "fail" && <XCircle className="w-5 h-5 text-red-600" />}
          <div>
            <div className="font-semibold">
              cdn.yubilearn.com —{" "}
              {status === "checking" && <span className="text-muted-foreground">checking…</span>}
              {status === "ok" && <span className="text-green-600">healthy</span>}
              {status === "fail" && <span className="text-red-600">unreachable</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {checkedAt ? `Last checked ${checkedAt.toLocaleTimeString()}` : "Probing known-good Pre-K video…"}
            </div>
          </div>
        </div>
        <button
          onClick={check}
          className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Re-check
        </button>
      </div>
    </Card>
  );
}

export function R2FolderListingNote() {
  return (
    <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
      <div className="flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <div className="font-semibold text-blue-900 dark:text-blue-100">
            R2 does not serve folder listings — that's not a bug
          </div>
          <div className="text-blue-800 dark:text-blue-200">
            Hitting <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">cdn.yubilearn.com/prek-level-videos/</code>{" "}
            will always return "Object not found". To test the CDN, always use a full file path (e.g.{" "}
            <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">/prek-level-videos/&lt;world&gt;/&lt;level&gt;/opening.mov</code>).
            The health widget above pings a real file, which is the only meaningful signal.
          </div>
        </div>
      </div>
    </Card>
  );
}
