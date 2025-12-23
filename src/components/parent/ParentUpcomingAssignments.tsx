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

      // Step 1: Fetch ALL posted assignments (no time window for past-due)
      // Include past due (no lower limit) + upcoming (limit to 30 days ahead)
      const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          id, title, description, due_date, assignment_type, category,
          classrooms ( name )
        `)
        .in("classroom_id", classroomIds)
        .eq("is_posted", true)
        .not("due_date", "is", null) // Only assignments with due dates
        .lte("due_date", thirtyDaysAhead) // Up to 30 days in future
        .order("due_date", { ascending: true })
        .limit(50); // Increased limit to capture past due

      if (assignmentsError) throw assignmentsError;
      if (!assignmentsData || assignmentsData.length === 0) return [];

      // Step 2: Fetch ONLY this student's submissions for these assignments
      const assignmentIds = assignmentsData.map(a => a.id);
      const { data: submissionsData } = await supabase
        .from("assignment_submissions")
        .select("id, status, submitted_at, assignment_id")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds);

      // Create lookup map for fast merging
      const submissionsByAssignment = new Map(
        (submissionsData || []).map(s => [s.assignment_id, s])
      );

      return assignmentsData.map((a: any) => ({
        ...a,
        submission: submissionsByAssignment.get(a.id) || null,
      }));
    },
    enabled: classroomIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - assignments don't change frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
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
    // Safe date handling
    if (!assignment.due_date) return <Badge variant="secondary">No due date</Badge>;
    
    const dueDate = new Date(assignment.due_date);
    if (isNaN(dueDate.getTime())) return <Badge variant="secondary">No due date</Badge>;
    
    const submission = assignment.submission;
    
    if (submission?.submitted_at) return <Badge variant="green">Submitted</Badge>;
    if (isPast(dueDate) && !isToday(dueDate)) return <Badge variant="red">Past Due</Badge>;
    if (isToday(dueDate)) return <Badge variant="gold">Due Today</Badge>;
    
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil <= 2) return <Badge variant="orange">Due Soon</Badge>;
    return <Badge variant="secondary">{daysUntil} days</Badge>;
  };

  const getUrgencyClass = (assignment: any) => {
    // Safe date handling
    if (!assignment.due_date) return "";
    
    const dueDate = new Date(assignment.due_date);
    if (isNaN(dueDate.getTime())) return "";
    
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

  // Safe filtering with date validation
  const pastDue = assignments?.filter((a: any) => {
    if (!a.due_date) return false;
    const dueDate = new Date(a.due_date);
    if (isNaN(dueDate.getTime())) return false;
    return isPast(dueDate) && !isToday(dueDate) && !a.submission?.submitted_at;
  }) || [];
  
  const dueToday = assignments?.filter((a: any) => {
    if (!a.due_date) return false;
    const dueDate = new Date(a.due_date);
    if (isNaN(dueDate.getTime())) return false;
    return isToday(dueDate) && !a.submission?.submitted_at;
  }) || [];
  
  const upcoming = assignments?.filter((a: any) => {
    if (!a.due_date) return false;
    const dueDate = new Date(a.due_date);
    if (isNaN(dueDate.getTime())) return false;
    return !isPast(dueDate) && !isToday(dueDate) && !a.submission?.submitted_at;
  }) || [];
  
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
  // Safe date parsing - handle null/invalid dates
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
  const isValidDate = dueDate && !isNaN(dueDate.getTime());
  
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
          {isValidDate ? format(dueDate, "MMM d, h:mm a") : "No due date"}
          <Badge variant="outline" className="text-xs py-0 h-5">{assignment.category}</Badge>
        </div>
      </div>
    </div>
  );
};