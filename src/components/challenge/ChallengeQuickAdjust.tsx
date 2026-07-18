import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChallengeSettings } from "@/hooks/useChallengeSettings";
import { CHALLENGE_LEVELS, type ChallengeLevel } from "@/lib/challengeMeter";

interface Props {
  className?: string;
  /** Optional visual variant. Defaults to a compact yellow chip like the GameHeader. */
  variant?: "yellow" | "amber";
}

/**
 * Shared Challenge Meter chip + inline quick-adjust popover.
 * - Parent / teacher: can move the slider and save (teacher writes flagged as override).
 * - Student: read-only view with "Ask a grown-up to change this" note.
 * Writes propagate live via the challenge_settings realtime subscription in useChallengeSettings.
 */
export function ChallengeQuickAdjust({ className, variant = "yellow" }: Props) {
  const { user, profile } = useAuth();
  const studentId = user?.id ?? null;
  const { level, setLevel, row, loading } = useChallengeSettings(studentId);
  const [pending, setPending] = useState<ChallengeLevel>(level);
  const [open, setOpen] = useState(false);

  useEffect(() => setPending(level), [level]);

  if (!studentId) return null;

  const role = profile?.role ?? "student";
  const isTeacher = role === "teacher" || role === "admin" || role === "district_admin";
  const isParent = role === "parent";
  const canEdit = isTeacher || isParent;

  const thresholds = CHALLENGE_LEVELS[pending];

  const chipClasses =
    variant === "amber"
      ? "border-amber-300/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
      : "border-yellow-400/30 bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Challenge Level ${level} — ${CHALLENGE_LEVELS[level].label}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chipClasses} ${className ?? ""}`}
        >
          <Gauge className="w-3.5 h-3.5" />
          L{level}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Challenge Level</div>
              <div className="text-xs text-muted-foreground">
                L{pending} — {thresholds.label}
              </div>
            </div>
            {row?.overridden_by_teacher && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                Teacher set
              </span>
            )}
          </div>

          {!canEdit ? (
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Ask a grown-up to change this. Parents and teachers can adjust how strict reading is.</span>
            </div>
          ) : (
            <>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[pending]}
                onValueChange={(v) => setPending(v[0] as ChallengeLevel)}
              />
              <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-muted-foreground">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className={n === pending ? "font-semibold text-foreground" : ""}>
                    L{n}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{thresholds.description}</p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={loading || pending === level}
                  onClick={async () => {
                    await setLevel(pending, {
                      role: isTeacher ? "teacher" : "parent",
                      asTeacherOverride: isTeacher,
                    });
                    toast({
                      title: "Challenge level updated",
                      description: `Now Level ${pending} — ${thresholds.label}. Applies live.`,
                    });
                    setOpen(false);
                  }}
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPending(level)}>
                  Reset
                </Button>
              </div>
            </>
          )}

          {isParent && (
            <Link
              to="/parent/challenge-settings"
              className="block text-center text-[11px] text-muted-foreground underline hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Manage in parent settings →
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ChallengeQuickAdjust;
