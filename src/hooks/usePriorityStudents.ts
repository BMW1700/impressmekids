import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateRiskScore, extractFeatures } from "@/lib/ml/riskScoringML";

export const usePriorityStudents = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['priority-students'],
    queryFn: async () => {
      // Get current user's classrooms
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { urgent: [], monitor: [] };

      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', user.id);

      if (!classrooms || classrooms.length === 0) {
        return { urgent: [], monitor: [] };
      }

      const classroomIds = classrooms.map(c => c.id);

      // Get all students in teacher's classrooms
      const { data: students } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          classroom_id,
          profiles!student_id (
            id,
            full_name
          ),
          classrooms!classroom_id (
            id,
            name
          )
        `)
        .in('classroom_id', classroomIds);

      if (!students || students.length === 0) {
        return { urgent: [], monitor: [] };
      }

      // Batch-fetch all per-student data in 3 queries instead of N*3.
      // For a class of 30 students this collapses ~90 sequential queries → 3.
      const studentIds = Array.from(new Set(students.map((s) => s.student_id)));

      const [auraRes, skillRes, profileRes] = await Promise.all([
        supabase
          .from('aura_records')
          .select('*')
          .in('profile_id', studentIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('student_skill_vectors')
          .select('*')
          .in('student_id', studentIds),
        supabase
          .from('student_profiles')
          .select('*')
          .in('user_id', studentIds),
      ]);

      // Index by student_id for O(1) lookup.
      const auraByStudent = new Map<string, any[]>();
      for (const rec of auraRes.data ?? []) {
        const arr = auraByStudent.get(rec.profile_id) ?? [];
        if (arr.length < 10) arr.push(rec); // already ordered DESC, keep latest 10
        auraByStudent.set(rec.profile_id, arr);
      }
      const skillByStudent = new Map<string, any>(
        (skillRes.data ?? []).map((s: any) => [s.student_id, s])
      );
      const profileByStudent = new Map<string, any>(
        (profileRes.data ?? []).map((p: any) => [p.user_id, p])
      );

      const studentsWithRisk = students.map((student) => {
        const auraRecords = auraByStudent.get(student.student_id) ?? [];
        if (auraRecords.length === 0) return null;

        const skillVector = skillByStudent.get(student.student_id) ?? null;
        const studentProfile = profileByStudent.get(student.student_id) ?? null;

        const features = extractFeatures(auraRecords, skillVector, studentProfile);
        const riskScore = calculateRiskScore(features);

        return {
          studentId: student.student_id,
          studentName: student.profiles?.full_name || 'Unknown',
          classroomId: student.classroom_id,
          classroomName: student.classrooms?.name || 'Unknown',
          riskScore,
          lastActivity: auraRecords[0]?.created_at,
        };
      });

      // Filter and categorize
      const validStudents = studentsWithRisk.filter((s) => s !== null);
      const urgent = validStudents.filter((s) => s!.riskScore >= 75);
      const monitor = validStudents.filter((s) => s!.riskScore >= 50 && s!.riskScore < 75);

      // Sort by risk score (highest first)
      urgent.sort((a, b) => b!.riskScore - a!.riskScore);
      monitor.sort((a, b) => b!.riskScore - a!.riskScore);

      return {
        urgent: urgent.slice(0, 10),
        monitor: monitor.slice(0, 10),
      };
    },
  });


  return {
    urgentStudents: data?.urgent || [],
    monitorStudents: data?.monitor || [],
    isLoading,
  };
};
