import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useStudentBehaviorStats } from "@/hooks/useBehaviorStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BehaviorRecord } from "@/hooks/useBehaviorRecords";
import { format, subWeeks } from "date-fns";

interface ParentBehaviorSummaryProps {
  studentId: string;
  classroomId: string;
}

export const ParentBehaviorSummary = ({ studentId, classroomId }: ParentBehaviorSummaryProps) => {
  const { data: stats } = useStudentBehaviorStats(studentId, classroomId);

  const { data: recentRecords } = useQuery({
    queryKey: ['parent-behavior-recent', studentId, classroomId],
    queryFn: async () => {
      const oneWeekAgo = subWeeks(new Date(), 1);
      const { data, error } = await supabase
        .from('behavior_records')
        .select(`
          *,
          category:behavior_categories(*)
        `)
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BehaviorRecord[];
    },
  });

  if (!stats) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No behavior data available</p>
      </Card>
    );
  }

  const positiveCount = recentRecords?.filter(r => r.points > 0).length || 0;
  const negativeCount = recentRecords?.filter(r => r.points < 0).length || 0;
  const trend = stats.weekly_points > 0 ? 'positive' : stats.weekly_points < 0 ? 'negative' : 'neutral';

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-purple-500/20">
            <Trophy className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Weekly Behavior Summary</h3>
            <p className="text-sm text-muted-foreground">
              {format(subWeeks(new Date(), 1), 'MMM d')} - {format(new Date(), 'MMM d')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.weekly_points}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{positiveCount}</p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{negativeCount}</p>
            <p className="text-xs text-muted-foreground">Negative</p>
          </div>
        </div>

        {trend !== 'neutral' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${trend === 'positive' ? 'bg-green-50' : 'bg-red-50'}`}>
            {trend === 'positive' ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${trend === 'positive' ? 'text-green-800' : 'text-red-800'}`}>
              {trend === 'positive' ? 'Great week!' : 'Needs improvement'}
            </p>
          </div>
        )}

        {recentRecords && recentRecords.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Recent Events</h4>
            <div className="space-y-2">
              {recentRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{record.category?.icon}</span>
                    <span className="text-muted-foreground">{record.category?.name}</span>
                  </div>
                  <span className={record.points > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {record.points > 0 ? '+' : ''}{record.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
