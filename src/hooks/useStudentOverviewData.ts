import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

interface ClassroomSummary {
  id: string;
  name: string;
  teacherName: string;
  finalGrade: number | null;
  upcomingCount: number;
}

interface StudentOverviewData {
  classrooms: ClassroomSummary[];
  dueTodayCount: number;
  pastDueCount: number;
  completedCount: number;
  auraSessionCount: number;
  auraStats: {
    avgWpm: number;
    avgClarity: number;
    avgConfidence: number;
    wpmImprovement: number;
    latestSession: string | null;
  } | null;
  behaviorStats: {
    totalPoints: number;
    weeklyPoints: number;
    streak: number;
  };
  overallGrade: number | null;
}

export const useStudentOverviewData = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["student-overview-data", studentId],
    queryFn: async (): Promise<StudentOverviewData> => {
      if (!studentId) throw new Error("Student ID required");

      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(today).toISOString();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Step 1: Get classroom IDs first (lightweight)
      const { data: classroomsData, error: classroomsError } = await supabase
        .from("classroom_students")
        .select(`
          classroom_id,
          classrooms (
            id,
            name,
            profiles:teacher_id (full_name)
          )
        `)
        .eq("student_id", studentId);

      if (classroomsError) throw classroomsError;
      
      const classrooms = classroomsData || [];
      const classroomIds = classrooms.map((c: any) => c.classroom_id);

      // Step 2: Use COUNT queries instead of fetching full rows
      const [
        dueTodayCountResult,
        pastDueCountResult,
        completedCountResult,
        auraCountResult,
        auraStatsResult,
        behaviorResult,
        upcomingResult,
        gradesResult,
      ] = await Promise.all([
        // Due today count (HEAD request - no row data)
        classroomIds.length > 0 
          ? supabase
              .from("assignments")
              .select("id", { count: 'exact', head: true })
              .in("classroom_id", classroomIds)
              .gte("due_date", startDate)
              .lte("due_date", endDate)
              .eq("is_posted", true)
          : Promise.resolve({ count: 0, error: null }),

        // Past due count (last 14 days only, HEAD request)
        classroomIds.length > 0
          ? supabase
              .from("assignments")
              .select("id", { count: 'exact', head: true })
              .in("classroom_id", classroomIds)
              .lt("due_date", startDate)
              .gte("due_date", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
              .eq("is_posted", true)
          : Promise.resolve({ count: 0, error: null }),

        // Completed submissions count (HEAD request)
        supabase
          .from("assignment_submissions")
          .select("id", { count: 'exact', head: true })
          .eq("student_id", studentId)
          .in("status", ["graded", "submitted"]),

        // AURA session count (HEAD request)
        supabase
          .from("aura_records")
          .select("id", { count: 'exact', head: true })
          .eq("profile_id", studentId)
          .gte("created_at", thirtyDaysAgo.toISOString()),

        // AURA stats - minimal columns, last 20 only
        supabase
          .from("aura_records")
          .select("wpm, clarity, confidence, created_at")
          .eq("profile_id", studentId)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(20),

        // Behavior stats (single row per student expected)
        supabase
          .from("student_behavior_stats")
          .select("total_points, weekly_points, current_streak")
          .eq("student_id", studentId)
          .limit(1),

        // Upcoming assignments count per classroom (minimal fetch)
        classroomIds.length > 0
          ? supabase
              .from("assignments")
              .select("classroom_id")
              .in("classroom_id", classroomIds)
              .eq("is_posted", true)
              .gte("due_date", new Date().toISOString())
              .limit(100)
          : Promise.resolve({ data: [], error: null }),

        // Recent grades for grade calculation (minimal)
        classroomIds.length > 0
          ? supabase
              .from("assignment_submissions")
              .select("grade, assignments!inner(classroom_id)")
              .eq("student_id", studentId)
              .in("assignments.classroom_id", classroomIds)
              .not("grade", "is", null)
              .limit(50)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Calculate grades per classroom from recent submissions
      const classroomGrades: Record<string, number[]> = {};
      (gradesResult.data || []).forEach((sub: any) => {
        const cid = sub.assignments?.classroom_id;
        if (cid && sub.grade !== null) {
          if (!classroomGrades[cid]) classroomGrades[cid] = [];
          classroomGrades[cid].push(sub.grade);
        }
      });

      // Upcoming counts per classroom
      const upcomingCounts: Record<string, number> = {};
      (upcomingResult.data || []).forEach((a: any) => {
        upcomingCounts[a.classroom_id] = (upcomingCounts[a.classroom_id] || 0) + 1;
      });

      // Build classroom summaries
      const classroomSummaries: ClassroomSummary[] = classrooms.map((c: any) => {
        const grades = classroomGrades[c.classroom_id] || [];
        const avgGrade = grades.length > 0 
          ? grades.reduce((a, b) => a + b, 0) / grades.length 
          : null;
        
        return {
          id: c.classroom_id,
          name: c.classrooms?.name || "Unknown",
          teacherName: (c.classrooms?.profiles as any)?.full_name || "Teacher",
          finalGrade: avgGrade,
          upcomingCount: upcomingCounts[c.classroom_id] || 0,
        };
      });

      // Overall grade
      const gradesWithValues = classroomSummaries.filter(c => c.finalGrade !== null);
      const overallGrade = gradesWithValues.length > 0
        ? gradesWithValues.reduce((sum, c) => sum + (c.finalGrade || 0), 0) / gradesWithValues.length
        : null;

      // Process AURA stats
      const auraData = auraStatsResult.data || [];
      let auraStats = null;
      if (auraData.length > 0) {
        const avgWpm = auraData.reduce((sum, r) => sum + r.wpm, 0) / auraData.length;
        const avgClarity = auraData.reduce((sum, r) => sum + r.clarity, 0) / auraData.length;
        const avgConfidence = auraData.reduce((sum, r) => sum + r.confidence, 0) / auraData.length;
        const wpmImprovement = auraData.length > 1 
          ? auraData[0].wpm - auraData[auraData.length - 1].wpm 
          : 0;

        auraStats = {
          avgWpm: Math.round(avgWpm),
          avgClarity: Math.round(avgClarity),
          avgConfidence: Math.round(avgConfidence),
          wpmImprovement: Math.round(wpmImprovement),
          latestSession: auraData[0].created_at,
        };
      }

      // Process behavior stats
      const behaviorData = behaviorResult.data || [];
      const behaviorStats = {
        totalPoints: behaviorData[0]?.total_points || 0,
        weeklyPoints: behaviorData[0]?.weekly_points || 0,
        streak: behaviorData[0]?.current_streak || 0,
      };

      return {
        classrooms: classroomSummaries,
        dueTodayCount: dueTodayCountResult.count || 0,
        pastDueCount: pastDueCountResult.count || 0,
        completedCount: completedCountResult.count || 0,
        auraSessionCount: auraCountResult.count || 0,
        auraStats,
        behaviorStats,
        overallGrade,
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
