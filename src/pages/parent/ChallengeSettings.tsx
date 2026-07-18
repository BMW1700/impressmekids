import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChallengeSettings } from '@/hooks/useChallengeSettings';
import { CHALLENGE_LEVELS, ChallengeLevel } from '@/lib/challengeMeter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface LinkedChild {
  student_id: string;
  full_name: string | null;
}

export default function ParentChallengeSettings() {
  const { user } = useAuth();
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('parent_student_links')
        .select('student_id, profiles:student_id ( full_name )')
        .eq('parent_id', user.id)
        .eq('approved', true);
      const rows: LinkedChild[] = (data ?? []).map((r: any) => ({
        student_id: r.student_id,
        full_name: r.profiles?.full_name ?? null,
      }));
      setChildren(rows);
      if (rows[0]) setSelected(rows[0].student_id);
    })();
  }, [user]);

  const { level, setLevel, row, loading } = useChallengeSettings(selected);
  const [pendingLevel, setPendingLevel] = useState<ChallengeLevel>(level);
  useEffect(() => setPendingLevel(level), [level]);

  const thresholds = CHALLENGE_LEVELS[pendingLevel];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Challenge Meter</h1>
        <p className="mt-2 text-muted-foreground">
          Tune how strict speech recognition is when your child reads aloud. If words keep getting rejected,
          lower the level. If your child is breezing through, raise it.
        </p>
      </div>

      {children.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No children linked to your account yet.
          </CardContent>
        </Card>
      )}

      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <Button
              key={c.student_id}
              variant={selected === c.student_id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelected(c.student_id)}
            >
              {c.full_name ?? 'Student'}
            </Button>
          ))}
        </div>
      )}

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Difficulty Level</span>
              <Badge variant="secondary">Level {pendingLevel} — {thresholds.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Slider
              min={1}
              max={5}
              step={1}
              value={[pendingLevel]}
              onValueChange={(v) => setPendingLevel(v[0] as ChallengeLevel)}
            />
            <div className="grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={n === pendingLevel ? 'font-semibold text-foreground' : ''}>
                  {CHALLENGE_LEVELS[n as ChallengeLevel].label}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{thresholds.description}</p>

            {row?.overridden_by_teacher && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                Your child's teacher has set this level for classroom work. You can still adjust it for home practice.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await setLevel(pendingLevel, { role: 'parent' });
                  toast({ title: 'Challenge level updated' });
                }}
                disabled={loading || pendingLevel === level}
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setPendingLevel(level)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
