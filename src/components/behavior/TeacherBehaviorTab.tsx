import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Download } from "lucide-react";
import { useBehaviorRecords } from "@/hooks/useBehaviorRecords";
import { useBehaviorStats } from "@/hooks/useBehaviorStats";
import { BehaviorQuickButtons } from "./BehaviorQuickButtons";
import { format } from "date-fns";

interface TeacherBehaviorTabProps {
  classroomId: string;
  students: Array<{ id: string; full_name: string }>;
}

export const TeacherBehaviorTab = ({ classroomId, students }: TeacherBehaviorTabProps) => {
  const { categories, records, seedCategories } = useBehaviorRecords(classroomId);
  const { data: allStats } = useBehaviorStats(undefined, classroomId);

  const getStudentStats = (studentId: string) => {
    return allStats?.find(s => s.student_id === studentId);
  };

  const handleExport = () => {
    // Simple CSV export
    const csvData = students.map(student => {
      const stats = getStudentStats(student.id);
      return `${student.full_name},${stats?.total_points || 0},${stats?.weekly_points || 0},${stats?.current_streak || 0}`;
    }).join('\n');

    const csv = 'Student,Total Points,Weekly Points,Current Streak\n' + csvData;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavior-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (!categories || categories.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-lg">No Behavior Categories</h3>
          <p className="text-muted-foreground">Add default categories to start tracking behavior.</p>
          <Button onClick={() => seedCategories.mutate()}>
            Add Default Categories
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Behavior Tracking</h3>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {students.map((student) => {
          const stats = getStudentStats(student.id);
          return (
            <Card key={student.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{student.full_name}</h4>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Total: <span className="font-semibold text-foreground">{stats?.total_points || 0}</span></span>
                    <span>Week: <span className="font-semibold text-foreground">{stats?.weekly_points || 0}</span></span>
                    <span>Streak: <span className="font-semibold text-foreground">{stats?.current_streak || 0} days</span></span>
                  </div>
                </div>
                <BehaviorQuickButtons studentId={student.id} classroomId={classroomId} />
              </div>
            </Card>
          );
        })}
      </div>

      {records && records.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {records.slice(0, 10).map((record) => {
              const student = students.find(s => s.id === record.student_id);
              return (
                <div key={record.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{student?.full_name}</span>
                    <span className="text-muted-foreground ml-2">• {record.category?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={record.points > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {record.points > 0 ? '+' : ''}{record.points}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(record.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
