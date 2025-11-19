import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, AlertCircle } from "lucide-react";
import { useDueToday } from "@/hooks/useDueToday";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface TodaySectionProps {
  studentId: string;
}

export const TodaySection = ({ studentId }: TodaySectionProps) => {
  const { data, isLoading } = useDueToday(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Today's Tasks</h1>

      {/* Due Today */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Due Today</CardTitle>
            <Badge variant="secondary">{data?.dueToday.length || 0}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data?.dueToday && data.dueToday.length > 0 ? (
            <div className="space-y-3">
              {data.dueToday.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {assignment.classrooms?.name} • Due {format(new Date(assignment.due_date), "h:mm a")}
                    </p>
                  </div>
                  <Link to={`/student/assignments/${assignment.id}`}>
                    <Button>Start</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No assignments due today. Great job staying on top of your work!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Past Due */}
      {data?.pastDue && data.pastDue.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Past Due</CardTitle>
              <Badge variant="destructive">{data.pastDue.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pastDue.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg hover:bg-destructive/5 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {assignment.classrooms?.name} • Was due {format(new Date(assignment.due_date), "MMM d")}
                    </p>
                  </div>
                  <Link to={`/student/assignments/${assignment.id}`}>
                    <Button variant="destructive">Complete Now</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
