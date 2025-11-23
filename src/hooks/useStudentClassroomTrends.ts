import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrendDataPoint {
  date: string;
  overallGrade: number;
  assignmentGrade: number | null;
  auraScore: number | null;
  classAverage: number | null;
  activityType: 'assignment' | 'aura' | 'both';
}

export const useStudentClassroomTrends = (classroomId: string | undefined, studentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-classroom-trends', classroomId, studentId],
    queryFn: async () => {
      if (!classroomId || !studentId) throw new Error('Missing required parameters');

      // Fetch syllabus weights for this classroom
      const { data: syllabus } = await supabase
        .from("classroom_syllabus")
        .select("grade_weights")
        .eq("classroom_id", classroomId)
        .maybeSingle();

      const weights = syllabus?.grade_weights 
        ? (syllabus.grade_weights as any)
        : { test: 25, quiz: 25, homework: 25, attendance: 25 };

      // Fetch all students in this classroom
      const { data: classroomStudents, error: studentsError } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId);

      if (studentsError) throw studentsError;

      const allStudentIds = classroomStudents?.map(s => s.student_id) || [];

      // Fetch assignment submissions for this classroom
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignment_submissions')
        .select(`
          grade,
          submitted_at,
          assignment_id,
          assignments!inner(classroom_id, category)
        `)
        .eq('student_id', studentId)
        .eq('assignments.classroom_id', classroomId)
        .not('grade', 'is', null)
        .order('submitted_at', { ascending: true });

      if (assignmentError) throw assignmentError;

      // Fetch assignment submissions for ALL students
      const { data: allStudentsAssignmentData, error: allAssignmentsError } = await supabase
        .from('assignment_submissions')
        .select(`
          grade,
          submitted_at,
          student_id,
          assignment_id,
          assignments!inner(classroom_id, category)
        `)
        .in('student_id', allStudentIds)
        .eq('assignments.classroom_id', classroomId)
        .not('grade', 'is', null)
        .order('submitted_at', { ascending: true });

      if (allAssignmentsError) throw allAssignmentsError;

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

      // Fetch AURA records for ALL students
      const { data: allStudentsAuraData, error: allAuraError } = await supabase
        .from('aura_records')
        .select(`
          grade,
          created_at,
          profile_id,
          reading_assignment_id,
          question_id
        `)
        .in('profile_id', allStudentIds)
        .not('grade', 'is', null)
        .order('created_at', { ascending: true });

      if (allAuraError) throw allAuraError;

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('date, status')
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)
        .order('date', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Fetch attendance records for ALL students
      const { data: allStudentsAttendanceData, error: allAttendanceError } = await supabase
        .from('attendance_records')
        .select('date, status, student_id')
        .eq('classroom_id', classroomId)
        .in('student_id', allStudentIds)
        .order('date', { ascending: true });

      if (allAttendanceError) throw allAttendanceError;

      // Optimization: Fetch all assignment and question IDs for this classroom once
      const { data: classroomAssignmentIds } = await supabase
        .from('assignments')
        .select('id')
        .eq('classroom_id', classroomId);

      const { data: classroomQuestionIds } = await supabase
        .from('questions')
        .select('id')
        .eq('classroom_id', classroomId);

      const assignmentIdSet = new Set(classroomAssignmentIds?.map(a => a.id) || []);
      const questionIdSet = new Set(classroomQuestionIds?.map(q => q.id) || []);

      // Filter AURA records efficiently using pre-fetched IDs
      const classroomAuraData = auraData?.filter(record => {
        if (record.reading_assignment_id && assignmentIdSet.has(record.reading_assignment_id)) {
          return true;
        }
        if (record.question_id && questionIdSet.has(record.question_id)) {
          return true;
        }
        return false;
      }) || [];

      // Filter all students' AURA records efficiently
      const allClassroomAuraData = allStudentsAuraData?.filter(record => {
        if (record.reading_assignment_id && assignmentIdSet.has(record.reading_assignment_id)) {
          return true;
        }
        if (record.question_id && questionIdSet.has(record.question_id)) {
          return true;
        }
        return false;
      }) || [];

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
            classAverage: null,
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
            classAverage: null,
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
            classAverage: null,
            activityType: 'assignment'
          });
        }
      });

      // Convert map to sorted array
      const trendData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Recalculate overallGrade as weighted cumulative running average
      interface CategorizedGrade {
        date: string;
        grade: number;
        category: 'test' | 'quiz' | 'homework' | 'attendance';
      }

      const allGrades: CategorizedGrade[] = [];

      // Collect assignment grades WITH CATEGORIES
      assignmentData?.forEach(item => {
        if (item.grade !== null) {
          const category = item.assignments.category;
          let weightCategory: 'test' | 'quiz' | 'homework' | 'attendance';
          
          if (category === "Test") weightCategory = 'test';
          else if (category === "Quiz") weightCategory = 'quiz';
          else if (category === "Homework") weightCategory = 'homework';
          else weightCategory = 'homework';
          
          allGrades.push({
            date: new Date(item.submitted_at).toISOString().split('T')[0],
            grade: item.grade,
            category: weightCategory
          });
        }
      });

      // Collect AURA grades (treat as homework)
      classroomAuraData.forEach(item => {
        if (item.grade !== null) {
          allGrades.push({
            date: new Date(item.created_at).toISOString().split('T')[0],
            grade: item.grade,
            category: 'homework'
          });
        }
      });

      // Collect attendance grades
      attendanceData?.forEach(record => {
        const attendanceGrade = record.status === 'Absent' ? 0 : 100;
        allGrades.push({
          date: record.date,
          grade: attendanceGrade,
          category: 'attendance'
        });
      });

      // Sort by date
      allGrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Helper function to calculate weighted cumulative grade for any student up to a date
      interface CategorizedGrade {
        date: string;
        grade: number;
        category: 'test' | 'quiz' | 'homework' | 'attendance';
      }

      const calculateStudentGradeUpToDate = (
        studentId: string,
        upToDate: Date,
        allAssignments: any[],
        allAura: any[],
        allAttendance: any[]
      ): number | null => {
        const studentGrades: CategorizedGrade[] = [];

        // Collect assignment grades for this student
        allAssignments
          ?.filter(item => item.student_id === studentId && item.grade !== null)
          .forEach(item => {
            const itemDate = new Date(item.submitted_at);
            if (itemDate <= upToDate) {
              const category = item.assignments.category;
              let weightCategory: 'test' | 'quiz' | 'homework' | 'attendance';
              
              if (category === "Test") weightCategory = 'test';
              else if (category === "Quiz") weightCategory = 'quiz';
              else if (category === "Homework") weightCategory = 'homework';
              else weightCategory = 'homework';
              
              studentGrades.push({
                date: new Date(item.submitted_at).toISOString().split('T')[0],
                grade: item.grade,
                category: weightCategory
              });
            }
          });

        // Collect AURA grades for this student
        allAura
          ?.filter(item => item.profile_id === studentId && item.grade !== null)
          .forEach(item => {
            const itemDate = new Date(item.created_at);
            if (itemDate <= upToDate) {
              studentGrades.push({
                date: new Date(item.created_at).toISOString().split('T')[0],
                grade: item.grade,
                category: 'homework'
              });
            }
          });

        // Collect attendance grades for this student
        allAttendance
          ?.filter(record => record.student_id === studentId)
          .forEach(record => {
            const itemDate = new Date(record.date);
            if (itemDate <= upToDate) {
              const attendanceGrade = record.status === 'Absent' ? 0 : 100;
              studentGrades.push({
                date: record.date,
                grade: attendanceGrade,
                category: 'attendance'
              });
            }
          });

        if (studentGrades.length === 0) return null;

        // Calculate weighted average
        const testGrades = studentGrades.filter(g => g.category === 'test');
        const quizGrades = studentGrades.filter(g => g.category === 'quiz');
        const homeworkGrades = studentGrades.filter(g => g.category === 'homework');
        const attendanceGrades = studentGrades.filter(g => g.category === 'attendance');
        
        const testAvg = testGrades.length > 0 
          ? testGrades.reduce((sum, g) => sum + g.grade, 0) / testGrades.length 
          : 0;
        const quizAvg = quizGrades.length > 0 
          ? quizGrades.reduce((sum, g) => sum + g.grade, 0) / quizGrades.length 
          : 0;
        const homeworkAvg = homeworkGrades.length > 0 
          ? homeworkGrades.reduce((sum, g) => sum + g.grade, 0) / homeworkGrades.length 
          : 0;
        const attendanceAvg = attendanceGrades.length > 0 
          ? attendanceGrades.reduce((sum, g) => sum + g.grade, 0) / attendanceGrades.length 
          : 0;
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        if (testGrades.length > 0) {
          weightedSum += (testAvg * weights.test) / 100;
          totalWeight += weights.test;
        }
        
        if (quizGrades.length > 0) {
          weightedSum += (quizAvg * weights.quiz) / 100;
          totalWeight += weights.quiz;
        }
        
        if (homeworkGrades.length > 0) {
          weightedSum += (homeworkAvg * weights.homework) / 100;
          totalWeight += weights.homework;
        }
        
        if (attendanceGrades.length > 0) {
          weightedSum += (attendanceAvg * weights.attendance) / 100;
          totalWeight += weights.attendance;
        }
        
        return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : null;
      };

      // For each trend data point, calculate WEIGHTED cumulative average
      trendData.forEach((point) => {
        const pointDate = new Date(point.date);
        
        const gradesUpToDate = allGrades.filter(g => 
          new Date(g.date) <= pointDate
        );
        
        if (gradesUpToDate.length > 0) {
          const testGrades = gradesUpToDate.filter(g => g.category === 'test');
          const quizGrades = gradesUpToDate.filter(g => g.category === 'quiz');
          const homeworkGrades = gradesUpToDate.filter(g => g.category === 'homework');
          const attendanceGrades = gradesUpToDate.filter(g => g.category === 'attendance');
          
          const testAvg = testGrades.length > 0 
            ? testGrades.reduce((sum, g) => sum + g.grade, 0) / testGrades.length 
            : 0;
          const quizAvg = quizGrades.length > 0 
            ? quizGrades.reduce((sum, g) => sum + g.grade, 0) / quizGrades.length 
            : 0;
          const homeworkAvg = homeworkGrades.length > 0 
            ? homeworkGrades.reduce((sum, g) => sum + g.grade, 0) / homeworkGrades.length 
            : 0;
          const attendanceAvg = attendanceGrades.length > 0 
            ? attendanceGrades.reduce((sum, g) => sum + g.grade, 0) / attendanceGrades.length 
            : 0;
          
          let weightedSum = 0;
          let totalWeight = 0;
          
          if (testGrades.length > 0) {
            weightedSum += (testAvg * weights.test) / 100;
            totalWeight += weights.test;
          }
          
          if (quizGrades.length > 0) {
            weightedSum += (quizAvg * weights.quiz) / 100;
            totalWeight += weights.quiz;
          }
          
          if (homeworkGrades.length > 0) {
            weightedSum += (homeworkAvg * weights.homework) / 100;
            totalWeight += weights.homework;
          }
          
          if (attendanceGrades.length > 0) {
            weightedSum += (attendanceAvg * weights.attendance) / 100;
            totalWeight += weights.attendance;
          }
          
          point.overallGrade = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
        }
        
        const assignmentGradesUpToDate = gradesUpToDate.filter(g => 
          g.category === 'test' || g.category === 'quiz' || g.category === 'homework'
        );
        if (assignmentGradesUpToDate.length > 0) {
          const assignmentSum = assignmentGradesUpToDate.reduce((acc, g) => acc + g.grade, 0);
          point.assignmentGrade = assignmentSum / assignmentGradesUpToDate.length;
        } else {
          point.assignmentGrade = null;
        }
        
        const auraGradesUpToDate = classroomAuraData
          .filter(item => item.grade !== null && new Date(item.created_at) <= pointDate)
          .map(item => item.grade as number);
        
        if (auraGradesUpToDate.length > 0) {
          const auraSum = auraGradesUpToDate.reduce((acc, g) => acc + g, 0);
          point.auraScore = auraSum / auraGradesUpToDate.length;
        } else {
          point.auraScore = null;
        }
      });

      // Calculate class average for each date point
      trendData.forEach((point) => {
        const pointDate = new Date(point.date);
        
        // Calculate grade for each student in the class up to this date
        const classGrades: number[] = [];
        
        allStudentIds.forEach(studId => {
          const studentGrade = calculateStudentGradeUpToDate(
            studId,
            pointDate,
            allStudentsAssignmentData,
            allClassroomAuraData,
            allStudentsAttendanceData
          );
          
          if (studentGrade !== null) {
            classGrades.push(studentGrade);
          }
        });
        
        // Calculate average of all student grades
        if (classGrades.length > 0) {
          const sum = classGrades.reduce((acc, grade) => acc + grade, 0);
          point.classAverage = sum / classGrades.length;
        } else {
          point.classAverage = null;
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
