import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

interface GroupedAnnouncements {
  today: any[];
  lastSevenDays: any[];
  other: any[];
}

export const useAnnouncementHistory = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["announcement-history", studentId],
    queryFn: async (): Promise<GroupedAnnouncements> => {
      if (!studentId) throw new Error("Student ID required");

      // Get student's classrooms
      const { data: classroomData, error: classroomError } = await supabase
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", studentId);

      if (classroomError) throw classroomError;

      const classroomIds = classroomData.map((c) => c.classroom_id);

      // Get all announcements from student's classrooms
      const { data: announcements, error: announcementsError } = await supabase
        .from("classroom_announcements")
        .select(`
          *,
          classrooms (
            name
          ),
          profiles (
            full_name
          )
        `)
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false });

      if (announcementsError) throw announcementsError;

      const now = new Date();
      const todayStart = startOfDay(now);
      const sevenDaysAgo = startOfDay(subDays(now, 7));

      const grouped: GroupedAnnouncements = {
        today: [],
        lastSevenDays: [],
        other: [],
      };

      announcements?.forEach((announcement) => {
        const createdAt = new Date(announcement.created_at);
        
        if (createdAt >= todayStart) {
          grouped.today.push(announcement);
        } else if (createdAt >= sevenDaysAgo) {
          grouped.lastSevenDays.push(announcement);
        } else {
          grouped.other.push(announcement);
        }
      });

      return grouped;
    },
    enabled: !!studentId,
  });
};
