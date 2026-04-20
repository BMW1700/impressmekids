import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, Circle, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { phonicsScopeAndSequence } from '@/data/phonicsScopeAndSequence';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  full_name: string | null;
}

interface ProgressRow {
  student_id: string;
  stage_id: string;
  accuracy_percent: number;
  mastered_at: string;
}

interface Props {
  students: Student[];
}

/**
 * Teacher-facing classroom widget that visualizes which phonics stage
 * each student has mastered (World 0: Phonics Foundations).
 *
 * Reads from `phonics_foundations_progress`. RLS already permits teachers
 * to see progress for students in their classrooms.
 */
export const TeacherPhonicsLadderWidget = ({ students }: Props) => {
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (studentIds.length === 0) {
        setProgress([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('phonics_foundations_progress')
        .select('student_id, stage_id, accuracy_percent, mastered_at')
        .in('student_id', studentIds);
      if (!cancelled) {
        if (!error && data) setProgress(data as ProgressRow[]);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [studentIds]);

  // Map: student_id -> Set of mastered stage_ids
  const masteryMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const row of progress) {
      if (!m.has(row.student_id)) m.set(row.student_id, new Set());
      m.get(row.student_id)!.add(row.stage_id);
    }
    return m;
  }, [progress]);

  const totalStages = phonicsScopeAndSequence.length;

  // Class-wide summary
  const classSummary = useMemo(() => {
    if (students.length === 0) return { masteredAvg: 0, started: 0, completed: 0 };
    let totalMastered = 0;
    let started = 0;
    let completed = 0;
    for (const s of students) {
      const set = masteryMap.get(s.id);
      const count = set?.size ?? 0;
      totalMastered += count;
      if (count > 0) started++;
      if (count >= totalStages) completed++;
    }
    return {
      masteredAvg: Math.round((totalMastered / (students.length * totalStages)) * 100),
      started,
      completed,
    };
  }, [students, masteryMap, totalStages]);

  return (
    <Card className="border-2 border-primary/10 shadow-elegant">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <GraduationCap className="h-5 w-5 text-primary" />
              Phonics Foundations Progress
            </CardTitle>
            <CardDescription>
              World 0 mastery across the {totalStages}-stage Common Core phonics
              progression (CVC → multisyllabic). Each stage is unlocked by reading
              5 practice words aloud.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/scope-and-sequence">
              <ExternalLink className="mr-2 h-4 w-4" />
              View scope &amp; sequence
            </Link>
          </Button>
        </div>

        {/* Class-wide summary chips */}
        {students.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">
              Class average: {classSummary.masteredAvg}% mastered
            </Badge>
            <Badge variant="secondary">
              {classSummary.started} of {students.length} started
            </Badge>
            <Badge variant="secondary">
              {classSummary.completed} fully complete
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading phonics progress…
          </div>
        ) : students.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No students enrolled yet — share your join code to start tracking
            phonics progress.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Stage header row */}
            <div className="hidden md:grid md:grid-cols-[minmax(180px,1fr)_repeat(6,minmax(0,1fr))] gap-2 px-2 pb-2 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Student</div>
              {phonicsScopeAndSequence.map((stage) => (
                <div key={stage.id} className="text-center">
                  <div>S{stage.stageNumber}</div>
                  <div className="font-normal normal-case text-[10px] text-muted-foreground/70">
                    {stage.shortLabel}
                  </div>
                </div>
              ))}
            </div>

            {/* Student rows */}
            <ol className="space-y-2">
              {students.map((student) => {
                const masteredSet = masteryMap.get(student.id) ?? new Set();
                const masteredCount = masteredSet.size;
                const isComplete = masteredCount >= totalStages;
                return (
                  <li
                    key={student.id}
                    className={cn(
                      'rounded-lg border border-border bg-muted/20 p-3',
                      isComplete && 'border-primary/40 bg-primary/5',
                    )}
                  >
                    {/* Desktop: grid */}
                    <div className="hidden md:grid md:grid-cols-[minmax(180px,1fr)_repeat(6,minmax(0,1fr))] gap-2 items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">
                          {student.full_name || 'Student'}
                        </span>
                        {isComplete && (
                          <Badge variant="secondary" className="shrink-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                      {phonicsScopeAndSequence.map((stage) => {
                        const mastered = masteredSet.has(stage.id);
                        return (
                          <div
                            key={stage.id}
                            className="flex items-center justify-center"
                            title={`${stage.title}${mastered ? ' — mastered' : ' — not yet'}`}
                          >
                            {mastered ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground/30" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile: stacked */}
                    <div className="md:hidden">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">
                          {student.full_name || 'Student'}
                        </span>
                        <Badge variant={isComplete ? 'default' : 'outline'}>
                          {masteredCount}/{totalStages}
                        </Badge>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {phonicsScopeAndSequence.map((stage) => {
                          const mastered = masteredSet.has(stage.id);
                          return (
                            <span
                              key={stage.id}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
                                mastered
                                  ? 'border-primary/40 bg-primary/10 text-foreground'
                                  : 'border-border bg-muted/40 text-muted-foreground',
                              )}
                            >
                              {mastered ? (
                                <CheckCircle2 className="h-3 w-3 text-primary" />
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                              {stage.shortLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
