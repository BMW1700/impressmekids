import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, AlertCircle } from "lucide-react";
import { useDueToday } from "@/hooks/useDueToday";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface TodaySectionProps {
  studentId: string;
}

export const TodaySection = ({ studentId }: TodaySectionProps) => {
  const { t } = useLanguage();
  const { data, isLoading } = useDueToday(studentId);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Test":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
      case "Quiz":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "Homework":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{t("student.today.title")}</h1>

      {/* Due Today */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>{t("student.today.dueToday")}</CardTitle>
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
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                      {assignment.category && (
                        <Badge variant="outline" className={getCategoryColor(assignment.category)}>
                          {assignment.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignment.classrooms?.name} •{" "}
                      {t("student.today.dueAt").replace(
                        "{time}",
                        format(new Date(assignment.due_date), "h:mm a")
                      )}
                    </p>
                  </div>
                  <Link to={`/student/assignment/${assignment.id}`}>
                    <Button>{t("student.today.start")}</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t("student.today.noDueToday")}
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
              <CardTitle className="text-destructive">{t("student.today.pastDue")}</CardTitle>
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
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                      {assignment.category && (
                        <Badge variant="outline" className={getCategoryColor(assignment.category)}>
                          {assignment.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignment.classrooms?.name} •{" "}
                      {t("student.today.wasDue").replace(
                        "{date}",
                        format(new Date(assignment.due_date), "MMM d")
                      )}
                    </p>
                  </div>
                  <Link to={`/student/assignment/${assignment.id}`}>
                    <Button variant="destructive">{t("student.today.completeNow")}</Button>
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
