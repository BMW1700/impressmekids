import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, format, isWithinInterval } from "date-fns";

export type CalendarItemType = "class" | "event" | "assignment" | "school_event";

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  classroomId?: string;
  classroomName?: string;
  teacherName?: string;
  category?: string;
  isSubmitted?: boolean;
  isDraft?: boolean;
  blocksClasses?: boolean;
  attachments?: Array<{ name: string; url: string }>;
  recentlyPosted?: boolean;
}

interface UseCalendarDataProps {
  startDate: Date;
  endDate: Date;
  userId?: string;
  userRole?: "student" | "teacher" | "admin" | "parent";
  childId?: string; // For parent viewing child's calendar
}

export const useCalendarData = ({ startDate, endDate, userId, userRole, childId }: UseCalendarDataProps) => {
  return useQuery({
    queryKey: ["calendar-data", startDate, endDate, userId, userRole, childId],
    queryFn: async () => {
      if (!userId) return [];

      const effectiveUserId = childId || userId;
      const items: CalendarItem[] = [];
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Fetch school settings for year boundaries
      const { data: settings } = await supabase
        .from("school_settings")
        .select("*")
        .single();

      // 1. Fetch classes (only for students and parents viewing child)
      if (userRole === "student" || (userRole === "parent" && childId)) {
        const { data: classrooms } = await supabase
          .from("classroom_students")
          .select(`
            classroom_id,
            classrooms!inner(
              id,
              name,
              meeting_days,
              start_time,
              end_time,
              location,
              schedule_start_date,
              profiles!classrooms_teacher_id_fkey(full_name)
            )
          `)
          .eq("student_id", effectiveUserId);

        // Fetch school events that block classes
        const { data: blockingEvents } = await supabase
          .from("school_events")
          .select("event_date")
          .eq("blocks_classes", true)
          .gte("event_date", format(startDate, "yyyy-MM-dd"))
          .lte("event_date", format(endDate, "yyyy-MM-dd"));

        const blockedDates = new Set(blockingEvents?.map(e => e.event_date) || []);

        // Generate recurring class meetings
        classrooms?.forEach((enrollment: any) => {
          const classroom = enrollment.classrooms;
          if (!classroom.meeting_days || classroom.meeting_days.length === 0) return;

          const scheduleStart = classroom.schedule_start_date 
            ? parseISO(classroom.schedule_start_date)
            : startDate;

          const yearEnd = settings?.school_year_end 
            ? parseISO(settings.school_year_end)
            : endDate;

          let currentDate = new Date(Math.max(startDate.getTime(), scheduleStart.getTime()));
          const finalDate = new Date(Math.min(endDate.getTime(), yearEnd.getTime()));

          while (currentDate <= finalDate) {
            const dayName = format(currentDate, "EEE"); // Mon, Tue, etc
            const dateStr = format(currentDate, "yyyy-MM-dd");

            if (classroom.meeting_days.includes(dayName) && !blockedDates.has(dateStr)) {
              items.push({
                id: `class-${classroom.id}-${dateStr}`,
                type: "class",
                title: classroom.name,
                date: dateStr,
                startTime: classroom.start_time,
                endTime: classroom.end_time,
                location: classroom.location,
                classroomId: classroom.id,
                classroomName: classroom.name,
                teacherName: classroom.profiles?.full_name,
              });
            }
            currentDate = addDays(currentDate, 1);
          }
        });
      }

      // 2. Fetch teacher's classes (for teacher view)
      if (userRole === "teacher") {
        const { data: teacherClassrooms } = await supabase
          .from("classrooms")
          .select("*")
          .eq("teacher_id", userId);

        const { data: blockingEvents } = await supabase
          .from("school_events")
          .select("event_date")
          .eq("blocks_classes", true)
          .gte("event_date", format(startDate, "yyyy-MM-dd"))
          .lte("event_date", format(endDate, "yyyy-MM-dd"));

        const blockedDates = new Set(blockingEvents?.map(e => e.event_date) || []);

        teacherClassrooms?.forEach((classroom: any) => {
          if (!classroom.meeting_days || classroom.meeting_days.length === 0) return;

          const scheduleStart = classroom.schedule_start_date
            ? parseISO(classroom.schedule_start_date)
            : startDate;

          const yearEnd = settings?.school_year_end
            ? parseISO(settings.school_year_end)
            : endDate;

          let currentDate = new Date(Math.max(startDate.getTime(), scheduleStart.getTime()));
          const finalDate = new Date(Math.min(endDate.getTime(), yearEnd.getTime()));

          while (currentDate <= finalDate) {
            const dayName = format(currentDate, "EEE");
            const dateStr = format(currentDate, "yyyy-MM-dd");

            if (classroom.meeting_days.includes(dayName) && !blockedDates.has(dateStr)) {
              items.push({
                id: `class-${classroom.id}-${dateStr}`,
                type: "class",
                title: classroom.name,
                date: dateStr,
                startTime: classroom.start_time,
                endTime: classroom.end_time,
                location: classroom.location,
                classroomId: classroom.id,
                classroomName: classroom.name,
              });
            }
            currentDate = addDays(currentDate, 1);
          }
        });
      }

      // 3. Fetch events
      let eventsQuery = supabase
        .from("events")
        .select(`
          *,
          classrooms!inner(name, profiles!classrooms_teacher_id_fkey(full_name))
        `)
        .gte("event_date", format(startDate, "yyyy-MM-dd"))
        .lte("event_date", format(endDate, "yyyy-MM-dd"));

      // Filter based on role
      if (userRole === "teacher") {
        eventsQuery = eventsQuery.eq("teacher_id", userId);
      } else if (userRole === "student") {
        eventsQuery = eventsQuery.eq("is_posted", true);
      } else if (userRole === "parent" && childId) {
        eventsQuery = eventsQuery.eq("is_posted", true);
      }

      const { data: events } = await eventsQuery;

      events?.forEach((event: any) => {
        const recentlyPosted = event.created_at && new Date(event.created_at) > twoDaysAgo;

        items.push({
          id: event.id,
          type: "event",
          title: event.title,
          description: event.description,
          date: event.event_date,
          startTime: event.start_time,
          endTime: event.end_time,
          location: event.location,
          category: event.category,
          classroomId: event.classroom_id,
          classroomName: event.classrooms?.name,
          teacherName: event.classrooms?.profiles?.full_name,
          isDraft: !event.is_posted,
          attachments: event.attachments,
          recentlyPosted,
        });

        // Generate recurring event instances
        if (event.is_repeating && event.repeat_days && event.repeat_days.length > 0) {
          const eventDate = parseISO(event.event_date);
          const repeatEnd = event.repeat_end_date
            ? parseISO(event.repeat_end_date)
            : (settings?.school_year_end ? parseISO(settings.school_year_end) : endDate);

          let currentDate = addDays(eventDate, 1);

          while (currentDate <= repeatEnd && currentDate <= endDate) {
            const dayName = format(currentDate, "EEE");
            if (event.repeat_days.includes(dayName)) {
              items.push({
                id: `${event.id}-${format(currentDate, "yyyy-MM-dd")}`,
                type: "event",
                title: event.title,
                description: event.description,
                date: format(currentDate, "yyyy-MM-dd"),
                startTime: event.start_time,
                endTime: event.end_time,
                location: event.location,
                category: event.category,
                classroomId: event.classroom_id,
                classroomName: event.classrooms?.name,
                teacherName: event.classrooms?.profiles?.full_name,
                isDraft: !event.is_posted,
                attachments: event.attachments,
              });
            }
            currentDate = addDays(currentDate, 1);
          }
        }
      });

      // 4. Fetch assignments
      let assignmentsQuery = supabase
        .from("assignments")
        .select(`
          *,
          classrooms!inner(name, profiles!classrooms_teacher_id_fkey(full_name))
        `)
        .not("due_date", "is", null)
        .gte("due_date", format(startDate, "yyyy-MM-dd"))
        .lte("due_date", format(endDate, "yyyy-MM-dd"));

      if (userRole === "teacher") {
        assignmentsQuery = assignmentsQuery.eq("teacher_id", userId);
      } else if (userRole === "student") {
        assignmentsQuery = assignmentsQuery
          .eq("status", "published")
          .eq("is_posted", true);
      } else if (userRole === "parent" && childId) {
        assignmentsQuery = assignmentsQuery
          .eq("status", "published")
          .eq("is_posted", true);
      }

      const { data: assignments } = await assignmentsQuery;

      // For students/parents, check submission status
      if ((userRole === "student" || (userRole === "parent" && childId)) && assignments) {
        const assignmentIds = assignments.map(a => a.id);
        const { data: submissions } = await supabase
          .from("assignment_submissions")
          .select("assignment_id, status")
          .eq("student_id", effectiveUserId)
          .in("assignment_id", assignmentIds);

        const submissionMap = new Map(
          submissions?.map(s => [s.assignment_id, s.status === "completed" || s.status === "graded"]) || []
        );

        assignments.forEach((assignment: any) => {
          const recentlyPosted = assignment.created_at && new Date(assignment.created_at) > twoDaysAgo;
          
          items.push({
            id: assignment.id,
            type: "assignment",
            title: assignment.title,
            description: assignment.description,
            date: assignment.due_date,
            classroomId: assignment.classroom_id,
            classroomName: assignment.classrooms?.name,
            teacherName: assignment.classrooms?.profiles?.full_name,
            isSubmitted: submissionMap.get(assignment.id) || false,
            isDraft: !assignment.is_posted || assignment.status !== "published",
            recentlyPosted,
          });
        });
      } else if (userRole === "teacher" && assignments) {
        assignments.forEach((assignment: any) => {
          items.push({
            id: assignment.id,
            type: "assignment",
            title: assignment.title,
            description: assignment.description,
            date: assignment.due_date,
            classroomId: assignment.classroom_id,
            classroomName: assignment.classrooms?.name,
            isDraft: !assignment.is_posted || assignment.status !== "published",
          });
        });
      }

      // 5. Fetch school-wide events
      const { data: schoolEvents } = await supabase
        .from("school_events")
        .select("*")
        .gte("event_date", format(startDate, "yyyy-MM-dd"))
        .lte("event_date", format(endDate, "yyyy-MM-dd"));

      schoolEvents?.forEach((event: any) => {
        items.push({
          id: event.id,
          type: "school_event",
          title: event.title,
          description: event.description,
          date: event.event_date,
          startTime: event.start_time,
          endTime: event.end_time,
          category: event.event_type,
          blocksClasses: event.blocks_classes,
        });
      });

      return items.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });
    },
    enabled: !!userId,
  });
};
