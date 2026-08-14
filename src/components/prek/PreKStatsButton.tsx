import { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGameReadingSummary } from "@/hooks/useGameReadingSummary";

interface PreKStatsButtonProps {
  studentId?: string;
}

/**
 * Small "Stats" button shown in Pre-K mode chrome. Opens a modal with
 * overall reading stats pulled from useGameReadingSummary.
 */
export const PreKStatsButton = ({ studentId }: PreKStatsButtonProps) => {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGameReadingSummary(studentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1.5 text-amber-100 hover:bg-amber-500/20 hover:text-amber-50"
          aria-label="View Sir Bookears' overall stats"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Stats
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="border-amber-300/30 bg-[hsl(270_45%_10%)] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-200">
            Sir Bookears' overall stats
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Your reading journey so far.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-white/60">
            Loading…
          </div>
        ) : !data || !data.hasEnoughData ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-white/70">
              Read a few stories to start tracking stats!
            </p>
            <p className="text-xs text-white/45">
              Sessions so far: {data?.totalSessions ?? 0}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-2">
            <StatTile label="Total words read" value={data.totalWordsRead.toLocaleString()} />
            <StatTile label="Reading sessions" value={String(data.totalSessions)} />
            <StatTile label="Accuracy" value={`${data.avgAccuracy}%`} />
            <StatTile label="Words / min" value={String(data.avgWpm)} />
            <div className="col-span-2 mt-1 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                Fluency level
              </div>
              <div className="mt-1 text-lg font-bold text-amber-200">
                {data.fluencyLabel}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
      {label}
    </div>
    <div className="mt-1 text-xl font-bold text-white">{value}</div>
  </div>
);
