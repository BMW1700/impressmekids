import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrendDataPoint {
  date: string;
  overallGrade: number;
  assignmentGrade: number | null;
  auraScore: number | null;
  activityType: 'assignment' | 'aura' | 'both';
}

export const useStudentClassroomTrends = (classroomId: string | undefined, studentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-classroom-trends', classroomId, studentId],
    queryFn: async () => {
      if (!classroomId || !studentId) throw new Error('Missing required parameters');

      // Fetch assignment submissions for this classroom
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignment_submissions')
        .select(`
          grade,
          submitted_at,
          assignment_id,
          assignments!inner(classroom_id)
        `)
        .eq('student_id', studentId)
        .eq('assignments.classroom_id', classroomId)
        .not('grade', 'is', null)
        .order('submitted_at', { ascending: true });

      if (assignmentError) throw assignmentError;

      // Fetch AURA records for this classroom
      const { data: auraData, error: auraError } = await supabase
        .from('aura_records')
        .select(`
          grade,
          created_at,
          reading_assignment_id,
          question_id
        `)
        .eq('profile_id', studentId)
        .not('grade', 'is', null)
        .order('created_at', { ascending: true });

      if (auraError) throw auraError;

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('date, status')
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)
        .order('date', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Filter AURA records to only include those related to this classroom
      const classroomAuraData = [];
      
      if (auraData) {
        for (const record of auraData) {
          let isClassroomRelated = false;
          
          // Check if linked to classroom assignment
          if (record.reading_assignment_id) {
            const { data: assignmentCheck } = await supabase
              .from('assignments')
              .select('classroom_id')
              .eq('id', record.reading_assignment_id)
              .eq('classroom_id', classroomId)
              .single();
            
            if (assignmentCheck) isClassroomRelated = true;
          }
          
          // Check if linked to classroom question
          if (!isClassroomRelated && record.question_id) {
            const { data: questionCheck } = await supabase
              .from('questions')
              .select('classroom_id')
              .eq('id', record.question_id)
              .eq('classroom_id', classroomId)
              .single();
            
            if (questionCheck) isClassroomRelated = true;
          }
          
          if (isClassroomRelated) {
            classroomAuraData.push(record);
          }
        }
      }

      // Combine and organize data by date
      const dateMap = new Map<string, TrendDataPoint>();

      // Process assignment submissions
      assignmentData?.forEach(item => {
        const date = new Date(item.submitted_at).toISOString().split('T')[0];
        const existing = dateMap.get(date);
        
        if (existing) {
          existing.assignmentGrade = item.grade;
          existing.activityType = existing.auraScore ? 'both' : 'assignment';
          existing.overallGrade = (existing.assignmentGrade + (existing.auraScore || 0)) / (existing.auraScore ? 2 : 1);
        } else {
          dateMap.set(date, {
            date,
            assignmentGrade: item.grade,
            auraScore: null,
            overallGrade: item.grade || 0,
            activityType: 'assignment'
          });
        }
      });

      // Process AURA records
      classroomAuraData.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        const existing = dateMap.get(date);
        
        if (existing) {
          existing.auraScore = item.grade;
          existing.activityType = existing.assignmentGrade ? 'both' : 'aura';
          existing.overallGrade = ((existing.assignmentGrade || 0) + (existing.auraScore || 0)) / (existing.assignmentGrade ? 2 : 1);
        } else {
          dateMap.set(date, {
            date,
            assignmentGrade: null,
            auraScore: item.grade,
            overallGrade: item.grade || 0,
            activityType: 'aura'
          });
        }
      });

      // Add attendance data to the dateMap
      attendanceData?.forEach(record => {
        const date = record.date;
        const attendanceGrade = record.status === 'Absent' ? 0 : 100;
        
        const existing = dateMap.get(date);
        if (existing) {
          // Include attendance in overall grade calculation
          const grades = [existing.assignmentGrade, existing.auraScore, attendanceGrade].filter(g => g !== null) as number[];
          existing.overallGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
        } else {
          dateMap.set(date, {
            date,
            assignmentGrade: null,
            auraScore: null,
            overallGrade: attendanceGrade,
            activityType: 'assignment'
          });
        }
      });

      // Convert map to sorted array
      const trendData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Recalculate overallGrade as cumulative running average
      const allGrades: Array<{ date: string; grade: number; type: 'assignment' | 'aura' | 'attendance' }> = [];

      // Collect all individual grades from assignment submissions
      assignmentData?.forEach(item => {
        if (item.grade !== null) {
          allGrades.push({
            date: new Date(item.submitted_at).toISOString().split('T')[0],
            grade: item.grade,
            type: 'assignment'
          });
        }
      });

      // Collect all individual grades from AURA records
      classroomAuraData.forEach(item => {
        if (item.grade !== null) {
          allGrades.push({
            date: new Date(item.created_at).toISOString().split('T')[0],
            grade: item.grade,
            type: 'aura'
          });
        }
      });

      // Collect all individual grades from attendance
      attendanceData?.forEach(record => {
        const attendanceGrade = record.status === 'Absent' ? 0 : 100;
        allGrades.push({
          date: record.date,
          grade: attendanceGrade,
          type: 'attendance'
        });
      });

      // Sort all grades by date
      allGrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // For each trend data point, calculate cumulative average up to that date
      trendData.forEach((point) => {
        const pointDate = new Date(point.date);
        
        // Get all grades up to and including this date
        const gradesUpToDate = allGrades.filter(g => 
          new Date(g.date) <= pointDate
        );
        
        if (gradesUpToDate.length > 0) {
          const sum = gradesUpToDate.reduce((acc, g) => acc + g.grade, 0);
          point.overallGrade = sum / gradesUpToDate.length;
        }
        
        // Also calculate cumulative averages for assignmentGrade and auraScore
        const assignmentGradesUpToDate = gradesUpToDate.filter(g => g.type === 'assignment');
        if (assignmentGradesUpToDate.length > 0) {
          const assignmentSum = assignmentGradesUpToDate.reduce((acc, g) => acc + g.grade, 0);
          point.assignmentGrade = assignmentSum / assignmentGradesUpToDate.length;
        } else {
          point.assignmentGrade = null;
        }
        
        const auraGradesUpToDate = gradesUpToDate.filter(g => g.type === 'aura');
        if (auraGradesUpToDate.length > 0) {
          const auraSum = auraGradesUpToDate.reduce((acc, g) => acc + g.grade, 0);
          point.auraScore = auraSum / auraGradesUpToDate.length;
        } else {
          point.auraScore = null;
        }
      });

      // Calculate summary statistics
      const last30Days = trendData.filter(point => {
        const pointDate = new Date(point.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return pointDate >= thirtyDaysAgo;
      });

      const last60Days = trendData.filter(point => {
        const pointDate = new Date(point.date);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return pointDate >= sixtyDaysAgo && pointDate < thirtyDaysAgo;
      });

      const avgLast30 = last30Days.length > 0
        ? last30Days.reduce((sum, p) => sum + p.overallGrade, 0) / last30Days.length
        : 0;

      const avgLast60 = last60Days.length > 0
        ? last60Days.reduce((sum, p) => sum + p.overallGrade, 0) / last60Days.length
        : 0;

      const improvement = avgLast60 > 0 
        ? ((avgLast30 - avgLast60) / avgLast60) * 100
        : 0;

      // Calculate streak (consecutive days with activity)
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (dateMap.has(dateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        trendData,
        summary: {
          avgLast30: Math.round(avgLast30 * 10) / 10,
          avgLast60: Math.round(avgLast60 * 10) / 10,
          improvement: Math.round(improvement * 10) / 10,
          totalActivities: trendData.length,
          currentStreak
        }
      };
    },
    enabled: !!classroomId && !!studentId,
  });
};
