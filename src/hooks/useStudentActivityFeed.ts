import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  id: string;
  type: "assignment" | "grade" | "announcement" | "event" | "achievement";
  title: string;
  description: string;
  time: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  badge?: string;
  link: string;
  classroomName?: string;
}

export const useStudentActivityFeed = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["student-activity-feed", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const activities: ActivityItem[] = [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // First, fetch student's classroom IDs
      const { data: classroomData } = await supabase
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", studentId);

      const classroomIds = classroomData?.map(c => c.classroom_id) || [];

      if (classroomIds.length === 0) {
        return []; // Student not enrolled in any classrooms
      }

      // Fetch recent assignments (posted in last 7 days)
      const { data: assignments } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          description,
          due_date,
          created_at,
          category,
          classroom_id,
          classrooms(name)
        `)
        .eq("is_posted", true)
        .gte("created_at", sevenDaysAgo.toISOString())
        .in("classroom_id", classroomIds);

      assignments?.forEach((assignment: any) => {
        const createdAt = new Date(assignment.created_at);
        const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
        const isNew = now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000;
        
        let badge = isNew ? "New" : undefined;
        if (dueDate) {
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue <= 2 && daysUntilDue > 0) {
            badge = `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;
          } else if (daysUntilDue === 0) {
            badge = "Due today";
          }
        }

        activities.push({
          id: assignment.id,
          type: "assignment",
          title: `New ${assignment.category}`,
          description: assignment.title,
          time: formatDistanceToNow(createdAt, { addSuffix: true }),
          timestamp: createdAt,
          icon: null,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-600/10",
          badge,
          link: `/classrooms/${assignment.classroom_id}`,
          classroomName: assignment.classrooms?.name,
        });
      });

      // Fetch recent grades (graded in last 7 days)
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select(`
          id,
          grade,
          graded_at,
          assignment_id,
          assignments(title, classroom_id, classrooms(name))
        `)
        .eq("student_id", studentId)
        .eq("status", "graded")
        .gte("graded_at", sevenDaysAgo.toISOString())
        .order("graded_at", { ascending: false });

      submissions?.forEach((submission: any) => {
        const gradedAt = new Date(submission.graded_at);
        const isNew = now.getTime() - gradedAt.getTime() < 24 * 60 * 60 * 1000;
        const grade = submission.grade ? Math.round(submission.grade) : 0;
        
        activities.push({
          id: submission.id,
          type: "grade",
          title: "Grade Posted",
          description: `${submission.assignments.title} - ${grade}%`,
          time: formatDistanceToNow(gradedAt, { addSuffix: true }),
          timestamp: gradedAt,
          icon: null,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-600/10",
          badge: isNew ? "New" : undefined,
          link: `/student/dashboard`,
          classroomName: submission.assignments.classrooms?.name,
        });
      });

      // Fetch recent announcements (posted in last 7 days)
      const { data: announcements } = await supabase
        .from("classroom_announcements")
        .select(`
          id,
          title,
          content,
          created_at,
          classroom_id,
          classrooms(name)
        `)
        .gte("created_at", sevenDaysAgo.toISOString())
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false });

      announcements?.forEach((announcement: any) => {
        const createdAt = new Date(announcement.created_at);
        const isNew = now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000;

        activities.push({
          id: announcement.id,
          type: "announcement",
          title: "New Announcement",
          description: announcement.title,
          time: formatDistanceToNow(createdAt, { addSuffix: true }),
          timestamp: createdAt,
          icon: null,
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-600/10",
          badge: isNew ? "New" : undefined,
          link: `/classrooms/${announcement.classroom_id}`,
          classroomName: announcement.classrooms?.name,
        });
      });

      // Fetch upcoming events (next 7 days)
      const { data: events } = await supabase
        .from("events")
        .select(`
          id,
          title,
          description,
          event_date,
          start_time,
          classroom_id,
          classrooms(name)
        `)
        .eq("is_posted", true)
        .gte("event_date", now.toISOString().split('T')[0])
        .lte("event_date", sevenDaysFromNow.toISOString().split('T')[0])
        .in("classroom_id", classroomIds)
        .order("event_date", { ascending: true });

      events?.forEach((event: any) => {
        const eventDate = new Date(event.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDateOnly = new Date(eventDate);
        eventDateOnly.setHours(0, 0, 0, 0);
        
        const daysUntil = Math.ceil((eventDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let badge = undefined;
        if (daysUntil === 0) {
          badge = "Today";
        } else if (daysUntil === 1) {
          badge = "Tomorrow";
        } else if (daysUntil <= 7) {
          badge = `In ${daysUntil} days`;
        }

        activities.push({
          id: event.id,
          type: "event",
          title: "Upcoming Event",
          description: event.title,
          time: formatDistanceToNow(eventDate, { addSuffix: true }),
          timestamp: eventDate,
          icon: null,
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-600/10",
          badge,
          link: `/student/calendar`,
          classroomName: event.classrooms?.name,
        });
      });

      // Fetch recent AURA achievements (last 7 days with notable improvements)
      const { data: auraRecords } = await supabase
        .from("aura_records")
        .select("id, clarity, confidence, wpm, created_at")
        .eq("profile_id", studentId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      // Find significant improvements
      if (auraRecords && auraRecords.length > 1) {
        const recentRecord = auraRecords[0];
        const previousAvg = auraRecords.slice(1).reduce((sum, r) => sum + r.clarity, 0) / (auraRecords.length - 1);
        
        if (recentRecord.clarity > previousAvg + 10) {
          activities.push({
            id: recentRecord.id,
            type: "achievement",
            title: "AURA Achievement",
            description: `Reading clarity improved by ${Math.round(recentRecord.clarity - previousAvg)}%!`,
            time: formatDistanceToNow(new Date(recentRecord.created_at), { addSuffix: true }),
            timestamp: new Date(recentRecord.created_at),
            icon: null,
            color: "text-pink-600 dark:text-pink-400",
            bgColor: "bg-pink-600/10",
            badge: "Achievement",
            link: `/student/aura-practice`,
          });
        }
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return activities;
    },
    enabled: !!studentId,
  });
};
