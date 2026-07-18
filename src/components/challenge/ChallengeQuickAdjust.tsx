import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChallengeSettings } from "@/hooks/useChallengeSettings";
import { CHALLENGE_LEVELS, type ChallengeLevel } from "@/lib/challengeMeter";

interface Props {
  className?: string;
  variant?: "yellow" | "amber";
}

/**
 * Chip + inline popover to change the Challenge Meter.
 * Open to any signed-in user by default. If a parent has set a PIN lock,
 * the popover requires that PIN before enabling Save. Unlock is per-session only.
 */
export function ChallengeQuickAdjust({ className, variant = "yellow" }: Props) {
  const { user, profile } = useAuth();
  const studentId = user?.id ?? null;
  const { level, setLevel, row, loading, lockEnabled, verifyPin } =
    useChallengeSettings(studentId);
  const [pending, setPending] = useState<ChallengeLevel>(level);
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => setPending(level), [level]);
  // Re-lock when the popover closes so a wandering hand can't reuse the unlock.
  useEffect(() => {
    if (!open) {
      setUnlocked(false);
      setPin("");
    }
  }, [open]);

  if (!studentId) return null;

  const role = profile?.role ?? "student";
  const isTeacher = role === "teacher" || role === "admin" || role === "district_admin";
  const isParent = role === "parent";
  const canSave = !lockEnabled || unlocked;
  const thresholds = CHALLENGE_LEVELS[pending];

  const chipClasses =
    variant === "amber"
      ? "border-amber-300/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
      : "border-yellow-400/30 bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20";

  const handleUnlock = async () => {
    const ok = await verifyPin(pin);
    if (ok) {
      setUnlocked(true);
      toast({ title: "Unlocked", description: "You can adjust the level for this session." });
    } else {
      toast({ title: "Incorrect PIN", description: "Try again.", variant: "destructive" });
      setPin("");
    }
  };

  const handleSave = async () => {
    await setLevel(pending, {
      role: isTeacher ? "teacher" : isParent ? "parent" : role,
      asTeacherOverride: isTeacher,
    });
    toast({
      title: "Challenge level updated",
      description: `Now Level ${pending} — ${thresholds.label}.`,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Challenge Level ${level} — ${CHALLENGE_LEVELS[level].label}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chipClasses} ${className ?? ""}`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Challenge: {CHALLENGE_LEVELS[level].label}
          {lockEnabled && <Lock className="w-3 h-3 ml-0.5 opacity-80" />}
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

          <Slider
            min={1}
            max={5}
            step={1}
            value={[pending]}
            onValueChange={(v) => setPending(v[0] as ChallengeLevel)}
            disabled={lockEnabled && !unlocked}
          />
          <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-muted-foreground">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className={n === pending ? "font-semibold text-foreground" : ""}>
                L{n}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{thresholds.description}</p>

          {lockEnabled && !unlocked && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-200">
                <Lock className="w-3.5 h-3.5" /> A parent locked this. Enter PIN to change it.
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pin.length >= 4) void handleUnlock();
                  }}
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={handleUnlock} disabled={pin.length < 4}>
                  Unlock
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={loading || pending === level || !canSave}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPending(level)}>
              Reset
            </Button>
          </div>

          {isParent && (
            <Link
              to="/parent/challenge-settings"
              className="block text-center text-[11px] text-muted-foreground underline hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Manage lock & parent settings →
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ChallengeQuickAdjust;
