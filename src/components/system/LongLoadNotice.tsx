import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LongLoadNoticeProps {
  /** Seconds before showing the recovery UI */
  afterSeconds?: number;
  title?: string;
  description?: string;
  onRetry?: () => void;
  showSignIn?: boolean;
}

export function LongLoadNotice({
  afterSeconds = 10,
  title = "Still loading…",
  description = "This is taking longer than expected. You can retry or sign in again.",
  onRetry,
  showSignIn = true,
}: LongLoadNoticeProps) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), afterSeconds * 1000);
    return () => window.clearTimeout(t);
  }, [afterSeconds]);

  const actions = useMemo(
    () => ({
      retry: () => {
        if (onRetry) onRetry();
        else window.location.reload();
      },
      signIn: () => navigate("/auth"),
    }),
    [navigate, onRetry]
  );

  if (!show) return null;

  return (
    <div className="mt-6 w-full max-w-md rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={actions.retry}>
          Retry
        </Button>
        {showSignIn && (
          <Button size="sm" variant="outline" onClick={actions.signIn}>
            Sign in again
          </Button>
        )}
      </div>
    </div>
  );
}
