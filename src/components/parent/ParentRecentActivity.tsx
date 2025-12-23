import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudentClassroomIds } from "@/hooks/useStudentClassroomIds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  CheckCircle2, 
  Mic, 
  Star, 
  MessageSquare,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  // Use shared hook for classroom IDs (cached across components)
  const { data: classroomIds = [], isLoading: classroomsLoading } = useStudentClassroomIds(studentId);

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["parent-student-activity", studentId, classroomIds],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      // Fetch ALL data in PARALLEL (classroomIds already available from shared hook)
      const [submissionsResult, readingsResult, behaviorsResult, announcementsResult] = await Promise.all([
        supabase
          .from("assignment_submissions")
          .select(`
            id,
            status,
            grade,
            submitted_at,
            graded_at,
            teacher_feedback,
            assignments (title)
          `)
          .eq("student_id", studentId)
          .gte("created_at", sevenDaysAgoISO)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("aura_records")
          .select("id, created_at, wpm, clarity, confidence, grade")
          .eq("profile_id", studentId)
          .gte("created_at", sevenDaysAgoISO)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("behavior_records")
          .select(`
            id,
            points,
            notes,
            created_at,
            behavior_categories (name, category_type)
          `)
          .eq("student_id", studentId)
          .gte("created_at", sevenDaysAgoISO)
          .order("created_at", { ascending: false })
          .limit(10),
        classroomIds.length > 0
          ? supabase
              .from("classroom_announcements")
              .select(`id, title, content, created_at, classrooms (name)`)
              .in("classroom_id", classroomIds)
              .gte("created_at", sevenDaysAgoISO)
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] })
      ]);

      const activities: ActivityItem[] = [];

      // Process submissions
      submissionsResult.data?.forEach((sub: any) => {
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

      // Process readings
      readingsResult.data?.forEach((reading) => {
        activities.push({
          id: `reading-${reading.id}`,
          type: "reading",
          title: "Reading session completed",
          description: `${reading.wpm} WPM • ${Math.round(reading.clarity)}% clarity`,
          timestamp: new Date(reading.created_at),
          metadata: { wpm: reading.wpm, clarity: reading.clarity },
        });
      });

      // Process behaviors
      behaviorsResult.data?.forEach((behavior: any) => {
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

      // Process announcements
      announcementsResult.data?.forEach((ann: any) => {
        activities.push({
          id: `announcement-${ann.id}`,
          type: "announcement",
          title: ann.title,
          description: `${ann.classrooms?.name}: ${ann.content.slice(0, 60)}...`,
          timestamp: new Date(ann.created_at),
        });
      });

      // Sort by timestamp
      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    enabled: !!studentId,
    staleTime: 30000,
  });

  const isLoading = classroomsLoading || activitiesLoading;

  const getActivityIconClass = (type: string, metadata?: any) => {
    switch (type) {
      case "assignment":
        return "icon-circle icon-circle-sm icon-circle-blue";
      case "reading":
        return "icon-circle icon-circle-sm icon-circle-purple";
      case "behavior":
        return metadata?.isPositive
          ? "icon-circle icon-circle-sm icon-circle-gold"
          : "icon-circle icon-circle-sm icon-circle-orange";
      case "announcement":
        return "icon-circle icon-circle-sm icon-circle-green";
      default:
        return "icon-circle icon-circle-sm bg-muted";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <CheckCircle2 className="h-4 w-4 text-white" />;
      case "reading":
        return <Mic className="h-4 w-4 text-white" />;
      case "behavior":
        return <Star className="h-4 w-4 text-white" />;
      case "announcement":
        return <MessageSquare className="h-4 w-4 text-white" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: string, metadata?: any) => {
    if (type === "assignment" && metadata?.grade !== undefined) {
      const grade = metadata.grade;
      if (grade >= 90) return <Badge variant="green">{grade}%</Badge>;
      if (grade >= 80) return <Badge variant="blue">{grade}%</Badge>;
      if (grade >= 70) return <Badge variant="gold">{grade}%</Badge>;
      return <Badge variant="red">{grade}%</Badge>;
    }
    if (type === "behavior" && metadata?.points !== undefined) {
      return (
        <Badge variant={metadata.points > 0 ? "green" : "red"}>
          {metadata.points > 0 ? "+" : ""}{metadata.points}
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card variant="glass" className="border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="icon-circle icon-circle-sm icon-circle-blue">
              <Activity className="h-4 w-4 text-white" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer h-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="border-0 bg-gradient-to-br from-blue-500/[0.04] to-primary/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="icon-circle icon-circle-sm icon-circle-blue">
            <Activity className="h-4 w-4 text-white" />
          </div>
          Recent Activity
          {activities && activities.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              Last 7 days
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="icon-circle icon-circle-lg mx-auto mb-4 bg-muted">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p>No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className={getActivityIconClass(activity.type, activity.metadata)}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{activity.title}</p>
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
