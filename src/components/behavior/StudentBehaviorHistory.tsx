import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BehaviorRecord } from "@/hooks/useBehaviorRecords";

interface StudentBehaviorHistoryProps {
  studentId: string;
  classroomId: string;
}

export const StudentBehaviorHistory = ({ studentId, classroomId }: StudentBehaviorHistoryProps) => {
  const { data: records, isLoading } = useQuery({
    queryKey: ['student-behavior-history', studentId, classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavior_records')
        .select(`
          *,
          category:behavior_categories(*)
        `)
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as BehaviorRecord[];
    },
  });

  if (isLoading) {
    return <Card className="p-4">Loading behavior history...</Card>;
  }

  if (!records || records.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No behavior records yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4">Behavior History</h3>
      <div className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{record.category?.icon}</span>
              <div>
                <p className="font-medium text-foreground">{record.category?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
                </p>
                {record.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                )}
              </div>
            </div>
            <span className={`text-lg font-bold ${record.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {record.points > 0 ? '+' : ''}{record.points}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
