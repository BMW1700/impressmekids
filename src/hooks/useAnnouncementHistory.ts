import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

interface GroupedAnnouncements {
  today: any[];
  lastFourteenDays: any[];
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

      const now = new Date();
      const todayStart = startOfDay(now);
      const fourteenDaysAgo = startOfDay(subDays(now, 14));

      // Fetch only announcements from the last 14 days
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
        .gte("created_at", fourteenDaysAgo.toISOString())
        .limit(100)
        .order("created_at", { ascending: false });

      if (announcementsError) throw announcementsError;

      const grouped: GroupedAnnouncements = {
        today: [],
        lastFourteenDays: [],
      };

      announcements?.forEach((announcement) => {
        const createdAt = new Date(announcement.created_at);
        
        if (createdAt >= todayStart) {
          grouped.today.push(announcement);
        } else {
          grouped.lastFourteenDays.push(announcement);
        }
      });

      return grouped;
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
