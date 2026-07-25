import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Swords, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_SEASON } from '@/lib/rpgSeasonPass';
import { Badge } from '@/components/ui/badge';

interface Row {
  user_id: string;
  rank_points: number;
  tier: string;
  wins: number;
  losses: number;
  active_title: string | null;
  display_name: string;
}

interface Props {
  classroomIds: string[];
}

const tierColor: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-400 text-slate-900',
  gold: 'bg-yellow-500 text-slate-900',
  platinum: 'bg-cyan-400 text-slate-900',
  diamond: 'bg-indigo-400 text-white',
  master: 'bg-fuchsia-500 text-white',
};

/**
 * Teacher-facing snapshot of student engagement in RPG mode this season.
 * Non-instructional (engagement only), placed alongside the reading metrics.
 */
export const TeacherRPGReport = ({ classroomIds }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (classroomIds.length === 0) { setRows([]); setLoading(false); return; }

      // Resolve student IDs from classroom rosters
      const { data: rosters } = await supabase
        .from('classroom_students')
        .select('student_id')
        .in('classroom_id', classroomIds);
      const studentIds = Array.from(new Set((rosters ?? []).map((r) => r.student_id).filter(Boolean)));
      if (studentIds.length === 0) { setRows([]); setLoading(false); return; }

      const { data: ranks } = await supabase
        .from('rpg_player_ranks')
        .select('user_id, rank_points, tier, wins, losses, active_title')
        .eq('season_id', CURRENT_SEASON.id)
        .in('user_id', studentIds)
        .order('rank_points', { ascending: false })
        .limit(25);

      const ids = (ranks ?? []).map((r) => r.user_id);
      let names: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .in('id', ids);
        names = Object.fromEntries((profs ?? []).map((p: { id: string; display_name: string | null }) =>
          [p.id, p.display_name ?? 'Student']));
      }
      setRows((ranks ?? []).map((r) => ({
        ...r,
        active_title: r.active_title ?? null,
        display_name: names[r.user_id] ?? 'Student',
      })));
      setLoading(false);
    })();
  }, [classroomIds.join(',')]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          RPG Engagement · {CURRENT_SEASON.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No students have started RPG battles this season yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {rows.map((r, i) => (
              <div
                key={r.user_id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground w-6 tabular-nums">#{i + 1}</span>
                  <span className="font-medium truncate">{r.display_name}</span>
                  {r.active_title && (
                    <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                      <Sparkles className="h-3 w-3 mr-1" /> {r.active_title}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-[10px] uppercase ${tierColor[r.tier] ?? tierColor.bronze}`}>
                    {r.tier}
                  </Badge>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    <Swords className="h-3 w-3 inline mr-0.5" />
                    {r.wins}W · {r.losses}L
                  </span>
                  <span className="tabular-nums font-bold text-sm w-12 text-right">
                    {r.rank_points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherRPGReport;
