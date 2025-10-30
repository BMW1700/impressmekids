import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CalendarItem {
  id: string;
  type: "class" | "assignment" | "event" | "school_event";
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  category?: string;
  classroomName?: string;
  isDraft?: boolean;
  isSubmitted?: boolean;
  recentlyPosted?: boolean;
}

interface UseParentCalendarDataProps {
  startDate: Date;
  endDate: Date;
  parentId: string;
  childId?: string;
}

export const useParentCalendarData = ({
  startDate,
  endDate,
  parentId,
  childId,
}: UseParentCalendarDataProps) => {
  return useQuery({
    queryKey: ["parent-calendar-data", parentId, childId, startDate, endDate],
    queryFn: async () => {
      const items: CalendarItem[] = [];

      // Get approved children
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_id", parentId)
        .eq("approved", true);

      if (!links || links.length === 0) {
        return [];
      }

      // Fetch student names
      const studentIds = childId
        ? [childId]
        : links.map((link) => link.student_id);

      // Fetch classrooms for students
      const { data: classroomStudents } = await supabase
        .from("classroom_students")
        .select(`
          classroom_id,
          classrooms (
            id,
            name,
            subject,
            schedule
          )
        `)
        .in("student_id", studentIds);

      // Fetch assignments for students' classrooms
      if (classroomStudents && classroomStudents.length > 0) {
        const classroomIds = classroomStudents.map((cs) => cs.classroom_id);

        const { data: assignments } = await supabase
          .from("assignments")
          .select(`
            id,
            title,
            description,
            due_date,
            assignment_type,
            classroom_id,
            classrooms (name)
          `)
          .in("classroom_id", classroomIds)
          .eq("status", "published")
          .eq("is_posted", true)
          .gte("due_date", startDate.toISOString())
          .lte("due_date", endDate.toISOString());

        if (assignments) {
          for (const assignment of assignments) {
            if (assignment.due_date) {
              const dueDate = new Date(assignment.due_date);
              items.push({
                id: assignment.id,
                type: "assignment",
                title: assignment.title,
                description: assignment.description || undefined,
                date: dueDate.toISOString().split("T")[0],
                classroomName: assignment.classrooms?.name,
                category: "academic",
              });
            }
          }
        }

        // Note: If classroom_events table exists in future, add it here
      }

      // Fetch school-wide events
      const { data: schoolEvents } = await supabase
        .from("school_events")
        .select("*")
        .gte("event_date", startDate.toISOString().split("T")[0])
        .lte("event_date", endDate.toISOString().split("T")[0]);

      if (schoolEvents) {
        for (const event of schoolEvents) {
          items.push({
            id: event.id,
            type: "school_event",
            title: event.title,
            description: event.description || undefined,
            date: event.event_date,
            startTime: event.start_time || undefined,
            endTime: event.end_time || undefined,
            category: event.event_type || "other",
          });
        }
      }

      // Sort by date
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return items;
    },
    enabled: !!parentId,
  });
};
