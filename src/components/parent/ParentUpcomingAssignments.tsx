import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudentClassroomIds } from "@/hooks/useStudentClassroomIds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Clock, 
  AlertTriangle,
  BookOpen,
  FileText,
  Mic
} from "lucide-react";
import { format, differenceInDays, isPast, isToday } from "date-fns";

interface ParentUpcomingAssignmentsProps {
  studentId: string;
}

export const ParentUpcomingAssignments = ({ studentId }: ParentUpcomingAssignmentsProps) => {
  // Use shared hook to get classroom IDs (cached across components)
  const { data: classroomIds = [], isLoading: classroomsLoading } = useStudentClassroomIds(studentId);

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["parent-upcoming-assignments", studentId, classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return [];

      const { data, error } = await supabase
        .from("assignments")
        .select(`
          id, title, description, due_date, assignment_type, category,
          classrooms ( name ),
          assignment_submissions ( id, status, submitted_at )
        `)
        .in("classroom_id", classroomIds)
        .eq("is_posted", true)
        .gte("due_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("due_date", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data?.map((a: any) => ({
        ...a,
        submission: a.assignment_submissions?.find((s: any) => s) || null,
      }));
    },
    enabled: classroomIds.length > 0,
    staleTime: 30000,
  });

  const isLoading = classroomsLoading || assignmentsLoading;

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case "reading": return <Mic className="h-4 w-4 text-white" />;
      case "multi_question": return <FileText className="h-4 w-4 text-white" />;
      default: return <BookOpen className="h-4 w-4 text-white" />;
    }
  };

  const getStatusBadge = (assignment: any) => {
    const dueDate = new Date(assignment.due_date);
    const submission = assignment.submission;
    
    if (submission?.submitted_at) return <Badge variant="green">Submitted</Badge>;
    if (isPast(dueDate) && !isToday(dueDate)) return <Badge variant="red">Past Due</Badge>;
    if (isToday(dueDate)) return <Badge variant="gold">Due Today</Badge>;
    
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil <= 2) return <Badge variant="orange">Due Soon</Badge>;
    return <Badge variant="secondary">{daysUntil} days</Badge>;
  };

  const getUrgencyClass = (assignment: any) => {
    const dueDate = new Date(assignment.due_date);
    const submission = assignment.submission;
    
    if (submission?.submitted_at) return "";
    if (isPast(dueDate) && !isToday(dueDate)) return "border-l-4 border-l-red-500";
    if (isToday(dueDate)) return "border-l-4 border-l-yellow-500";
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil <= 2) return "border-l-4 border-l-orange-500";
    return "";
  };

  if (isLoading) {
    return (
      <Card variant="glass" className="border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="icon-circle icon-circle-sm icon-circle-orange">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Upcoming Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pastDue = assignments?.filter((a: any) => isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) && !a.submission?.submitted_at) || [];
  const dueToday = assignments?.filter((a: any) => isToday(new Date(a.due_date)) && !a.submission?.submitted_at) || [];
  const upcoming = assignments?.filter((a: any) => !isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) && !a.submission?.submitted_at) || [];
  const submitted = assignments?.filter((a: any) => a.submission?.submitted_at) || [];

  return (
    <Card variant="glass" className="border-0 bg-gradient-to-br from-orange-500/[0.04] to-secondary/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="icon-circle icon-circle-sm icon-circle-orange">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          Assignments
          {pastDue.length > 0 && (
            <Badge variant="red" className="ml-auto gap-1">
              <AlertTriangle className="h-3 w-3" />
              {pastDue.length} overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {pastDue.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Past Due
                </h4>
                {pastDue.map((a: any) => (
                  <AssignmentItem key={a.id} assignment={a} getAssignmentIcon={getAssignmentIcon} getStatusBadge={getStatusBadge} getUrgencyClass={getUrgencyClass} />
                ))}
              </div>
            )}
            {dueToday.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-yellow-600 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Due Today
                </h4>
                {dueToday.map((a: any) => (
                  <AssignmentItem key={a.id} assignment={a} getAssignmentIcon={getAssignmentIcon} getStatusBadge={getStatusBadge} getUrgencyClass={getUrgencyClass} />
                ))}
              </div>
            )}
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Upcoming</h4>
                {upcoming.slice(0, 5).map((a: any) => (
                  <AssignmentItem key={a.id} assignment={a} getAssignmentIcon={getAssignmentIcon} getStatusBadge={getStatusBadge} getUrgencyClass={getUrgencyClass} />
                ))}
              </div>
            )}
            {submitted.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-green-600">Recently Submitted</h4>
                {submitted.slice(0, 3).map((a: any) => (
                  <AssignmentItem key={a.id} assignment={a} getAssignmentIcon={getAssignmentIcon} getStatusBadge={getStatusBadge} getUrgencyClass={getUrgencyClass} />
                ))}
              </div>
            )}
            {(!assignments || assignments.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="icon-circle icon-circle-lg mx-auto mb-4 bg-muted">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p>No upcoming assignments</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const AssignmentItem = ({ assignment, getAssignmentIcon, getStatusBadge, getUrgencyClass }: any) => {
  const dueDate = new Date(assignment.due_date);
  return (
    <div className={`flex gap-3 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 hover:scale-[1.01] ${getUrgencyClass(assignment)}`}>
      <div className="icon-circle icon-circle-sm icon-circle-blue">
        {getAssignmentIcon(assignment.assignment_type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{assignment.title}</p>
            <p className="text-xs text-muted-foreground">{assignment.classrooms?.name}</p>
          </div>
          {getStatusBadge(assignment)}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(dueDate, "MMM d, h:mm a")}
          <Badge variant="outline" className="text-xs py-0 h-5">{assignment.category}</Badge>
        </div>
      </div>
    </div>
  );
};