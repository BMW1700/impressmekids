import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useChallengeSettings } from '@/hooks/useChallengeSettings';
import { CHALLENGE_LEVELS, ChallengeLevel } from '@/lib/challengeMeter';

/**
 * Teacher-facing Challenge Meter override. Writes with `overridden_by_teacher: true`
 * so the parent portal shows the amber "teacher set this" banner.
 */
export default function StudentChallengeOverride({ studentId }: { studentId: string }) {
  const { level, setLevel, row, loading } = useChallengeSettings(studentId);
  const [pending, setPending] = useState<ChallengeLevel>(level);

  useEffect(() => setPending(level), [level]);

  const thresholds = CHALLENGE_LEVELS[pending];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Challenge Level</span>
          <Badge variant="secondary">Level {pending} — {thresholds.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Slider
          min={1}
          max={5}
          step={1}
          value={[pending]}
          onValueChange={(v) => setPending(v[0] as ChallengeLevel)}
        />
        <div className="grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={n === pending ? 'font-semibold text-foreground' : ''}>
              {CHALLENGE_LEVELS[n as ChallengeLevel].label}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{thresholds.description}</p>

        {row?.set_by_role === 'parent' && !row.overridden_by_teacher && (
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Parent-set. Overriding will flag this as a teacher override.
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={async () => {
              await setLevel(pending, { asTeacherOverride: true, role: 'teacher' });
              toast({ title: 'Challenge level updated', description: 'Applies live to the student.' });
            }}
            disabled={loading || pending === level}
          >
            Save override
          </Button>
          <Button variant="outline" onClick={() => setPending(level)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
