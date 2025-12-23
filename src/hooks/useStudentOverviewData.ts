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

      // Step 1: Get classroom IDs first
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

      // Step 2: Fetch all other data in parallel
      const [
        dueTodayResult,
        pastDueResult,
        submissionsResult,
        auraResult,
        behaviorResult,
        upcomingResult,
      ] = await Promise.all([
        // Due today assignments (just IDs for counting)
        classroomIds.length > 0 
          ? supabase
              .from("assignments")
              .select("id, classroom_id")
              .in("classroom_id", classroomIds)
              .gte("due_date", startDate)
              .lte("due_date", endDate)
              .eq("is_posted", true)
          : Promise.resolve({ data: [], error: null }),

        // Past due assignments (limit to recent, count only)
        classroomIds.length > 0
          ? supabase
              .from("assignments")
              .select("id, classroom_id")
              .in("classroom_id", classroomIds)
              .lt("due_date", startDate)
              .gte("due_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Only last 30 days
              .eq("is_posted", true)
              .limit(30)
          : Promise.resolve({ data: [], error: null }),

        // Submissions: only recent ones for grade calculation (last 90 days)
        classroomIds.length > 0
          ? supabase
              .from("assignment_submissions")
              .select("assignment_id, grade, status, submitted_at, assignments!inner(classroom_id)")
              .eq("student_id", studentId)
              .in("assignments.classroom_id", classroomIds)
              .gte("submitted_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
              .limit(100)
          : Promise.resolve({ data: [], error: null }),

        // AURA stats - last 30 days only, limit records
        supabase
          .from("aura_records")
          .select("wpm, clarity, confidence, created_at")
          .eq("profile_id", studentId)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(50),

        // Behavior stats
        supabase
          .from("student_behavior_stats")
          .select("total_points, weekly_points, current_streak")
          .eq("student_id", studentId),

        // Upcoming assignments count
        classroomIds.length > 0
          ? supabase
              .from("assignments")
              .select("id, classroom_id")
              .in("classroom_id", classroomIds)
              .eq("is_posted", true)
              .gte("due_date", new Date().toISOString())
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Create submission lookup
      const submissionsByAssignment = new Map<string, { grade: number | null; status: string }>();
      const submissionsByClassroom = new Map<string, number[]>();
      
      (submissionsResult.data || []).forEach((sub: any) => {
        submissionsByAssignment.set(sub.assignment_id, { grade: sub.grade, status: sub.status });
        
        const cid = sub.assignments?.classroom_id;
        if (cid && sub.grade !== null) {
          if (!submissionsByClassroom.has(cid)) submissionsByClassroom.set(cid, []);
          submissionsByClassroom.get(cid)!.push(sub.grade);
        }
      });

      // Filter to incomplete assignments
      const filterIncomplete = (assignments: any[]) =>
        assignments.filter((a) => {
          const sub = submissionsByAssignment.get(a.id);
          return !sub || sub.status === "not_started" || sub.status === "in_progress";
        });

      const dueTodayIncomplete = filterIncomplete(dueTodayResult.data || []);
      const pastDueIncomplete = filterIncomplete(pastDueResult.data || []);
      const completedCount = (submissionsResult.data || []).filter(
        (s: any) => s.status === "graded" || s.status === "submitted"
      ).length;

      // Calculate grades per classroom
      const classroomGrades: Record<string, number | null> = {};
      for (const [cid, grades] of submissionsByClassroom) {
        classroomGrades[cid] = grades.reduce((a, b) => a + b, 0) / grades.length;
      }

      // Upcoming counts per classroom
      const upcomingCounts: Record<string, number> = {};
      (upcomingResult.data || []).forEach((a: any) => {
        upcomingCounts[a.classroom_id] = (upcomingCounts[a.classroom_id] || 0) + 1;
      });

      // Build classroom summaries
      const classroomSummaries: ClassroomSummary[] = classrooms.map((c: any) => ({
        id: c.classroom_id,
        name: c.classrooms?.name || "Unknown",
        teacherName: (c.classrooms?.profiles as any)?.full_name || "Teacher",
        finalGrade: classroomGrades[c.classroom_id] || null,
        upcomingCount: upcomingCounts[c.classroom_id] || 0,
      }));

      // Overall grade
      const gradesWithValues = classroomSummaries.filter(c => c.finalGrade !== null);
      const overallGrade = gradesWithValues.length > 0
        ? gradesWithValues.reduce((sum, c) => sum + (c.finalGrade || 0), 0) / gradesWithValues.length
        : null;

      // Process AURA stats
      const auraData = auraResult.data || [];
      let auraStats = null;
      if (auraData.length > 0) {
        const avgWpm = auraData.reduce((sum, r) => sum + r.wpm, 0) / auraData.length;
        const avgClarity = auraData.reduce((sum, r) => sum + r.clarity, 0) / auraData.length;
        const avgConfidence = auraData.reduce((sum, r) => sum + r.confidence, 0) / auraData.length;
        const wpmImprovement = auraData[0].wpm - auraData[auraData.length - 1].wpm;

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
        totalPoints: behaviorData.reduce((sum, s) => sum + (s.total_points || 0), 0),
        weeklyPoints: behaviorData.reduce((sum, s) => sum + (s.weekly_points || 0), 0),
        streak: behaviorData.length > 0 ? Math.max(...behaviorData.map(s => s.current_streak || 0)) : 0,
      };

      return {
        classrooms: classroomSummaries,
        dueTodayCount: dueTodayIncomplete.length,
        pastDueCount: pastDueIncomplete.length,
        completedCount,
        auraSessionCount: auraData.length,
        auraStats,
        behaviorStats,
        overallGrade,
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes - data doesn't change frequently
  });
};
