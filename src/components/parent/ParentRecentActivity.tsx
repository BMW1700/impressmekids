import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  BookOpen, 
  CheckCircle2, 
  Mic, 
  Trophy, 
  MessageSquare,
  Clock,
  Star
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ParentRecentActivityProps {
  studentId: string;
}

interface ActivityItem {
  id: string;
  type: "assignment" | "reading" | "behavior" | "announcement";
  title: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

export const ParentRecentActivity = ({ studentId }: ParentRecentActivityProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["parent-student-activity", studentId],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activities: ActivityItem[] = [];

      // Get recent submissions
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select(`
          id,
          status,
          grade,
          submitted_at,
          graded_at,
          teacher_feedback,
          assignments (
            title
          )
        `)
        .eq("student_id", studentId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      submissions?.forEach((sub: any) => {
        if (sub.graded_at) {
          activities.push({
            id: `grade-${sub.id}`,
            type: "assignment",
            title: `Grade received: ${sub.assignments?.title || "Assignment"}`,
            description: `Scored ${sub.grade}%${sub.teacher_feedback ? " - " + sub.teacher_feedback.slice(0, 50) + "..." : ""}`,
            timestamp: new Date(sub.graded_at),
            metadata: { grade: sub.grade },
          });
        } else if (sub.submitted_at) {
          activities.push({
            id: `submit-${sub.id}`,
            type: "assignment",
            title: `Submitted: ${sub.assignments?.title || "Assignment"}`,
            description: "Waiting for teacher review",
            timestamp: new Date(sub.submitted_at),
          });
        }
      });

      // Get recent reading sessions
      const { data: readings } = await supabase
        .from("aura_records")
        .select("id, created_at, wpm, clarity, confidence, grade")
        .eq("profile_id", studentId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      readings?.forEach((reading) => {
        activities.push({
          id: `reading-${reading.id}`,
          type: "reading",
          title: "Reading session completed",
          description: `${reading.wpm} WPM • ${reading.clarity}% clarity`,
          timestamp: new Date(reading.created_at),
          metadata: { wpm: reading.wpm, clarity: reading.clarity },
        });
      });

      // Get recent behavior events
      const { data: behaviors } = await supabase
        .from("behavior_records")
        .select(`
          id,
          points,
          notes,
          created_at,
          behavior_categories (
            name,
            category_type
          )
        `)
        .eq("student_id", studentId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      behaviors?.forEach((behavior: any) => {
        activities.push({
          id: `behavior-${behavior.id}`,
          type: "behavior",
          title: behavior.behavior_categories?.name || "Behavior recorded",
          description: `${behavior.points > 0 ? "+" : ""}${behavior.points} points${behavior.notes ? " - " + behavior.notes : ""}`,
          timestamp: new Date(behavior.created_at),
          metadata: { 
            points: behavior.points, 
            isPositive: behavior.behavior_categories?.category_type === "positive"
          },
        });
      });

      // Get classrooms for announcements
      const { data: classroomData } = await supabase
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", studentId);

      const classroomIds = classroomData?.map((c) => c.classroom_id) || [];

      if (classroomIds.length > 0) {
        const { data: announcements } = await supabase
          .from("classroom_announcements")
          .select(`
            id,
            title,
            content,
            created_at,
            classrooms (
              name
            )
          `)
          .in("classroom_id", classroomIds)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        announcements?.forEach((ann: any) => {
          activities.push({
            id: `announcement-${ann.id}`,
            type: "announcement",
            title: ann.title,
            description: `${ann.classrooms?.name}: ${ann.content.slice(0, 60)}...`,
            timestamp: new Date(ann.created_at),
          });
        });
      }

      // Sort by timestamp
      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    enabled: !!studentId,
  });

  const getActivityIcon = (type: string, metadata?: any) => {
    switch (type) {
      case "assignment":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "reading":
        return <Mic className="h-4 w-4 text-purple-600" />;
      case "behavior":
        return metadata?.isPositive 
          ? <Star className="h-4 w-4 text-yellow-500" />
          : <Trophy className="h-4 w-4 text-orange-500" />;
      case "announcement":
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: string, metadata?: any) => {
    if (type === "assignment" && metadata?.grade !== undefined) {
      const grade = metadata.grade;
      if (grade >= 90) return <Badge className="bg-green-500/10 text-green-700 border-0 text-xs">{grade}%</Badge>;
      if (grade >= 80) return <Badge className="bg-blue-500/10 text-blue-700 border-0 text-xs">{grade}%</Badge>;
      if (grade >= 70) return <Badge className="bg-yellow-500/10 text-yellow-700 border-0 text-xs">{grade}%</Badge>;
      return <Badge className="bg-red-500/10 text-red-700 border-0 text-xs">{grade}%</Badge>;
    }
    if (type === "behavior" && metadata?.points !== undefined) {
      return (
        <Badge className={`${metadata.points > 0 ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"} border-0 text-xs`}>
          {metadata.points > 0 ? "+" : ""}{metadata.points}
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-glass-md)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-glass-md)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Recent Activity
          {activities && activities.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              Last 7 days
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                    {getActivityIcon(activity.type, activity.metadata)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      {getActivityBadge(activity.type, activity.metadata)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
