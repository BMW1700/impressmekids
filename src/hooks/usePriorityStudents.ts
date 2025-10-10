import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateRiskScore, extractFeatures } from "@/lib/riskScoring";

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

      // For each student, calculate risk score
      const studentsWithRisk = await Promise.all(
        students.map(async (student) => {
          // Fetch AURA records
          const { data: auraRecords } = await supabase
            .from('aura_records')
            .select('*')
            .eq('profile_id', student.student_id)
            .order('created_at', { ascending: false })
            .limit(10);

          // Fetch skill vector
          const { data: skillVector } = await supabase
            .from('student_skill_vectors')
            .select('*')
            .eq('student_id', student.student_id)
            .maybeSingle();

          // Fetch student profile
          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('user_id', student.student_id)
            .maybeSingle();

          if (!auraRecords || auraRecords.length === 0) {
            return null; // Skip students with no data
          }

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
        })
      );

      // Filter and categorize
      const validStudents = studentsWithRisk.filter(s => s !== null);
      const urgent = validStudents.filter(s => s!.riskScore >= 75);
      const monitor = validStudents.filter(s => s!.riskScore >= 50 && s!.riskScore < 75);

      // Sort by risk score (highest first)
      urgent.sort((a, b) => b!.riskScore - a!.riskScore);
      monitor.sort((a, b) => b!.riskScore - a!.riskScore);

      return {
        urgent: urgent.slice(0, 10), // Top 10 urgent
        monitor: monitor.slice(0, 10), // Top 10 monitor
      };
    },
  });

  return {
    urgentStudents: data?.urgent || [],
    monitorStudents: data?.monitor || [],
    isLoading,
  };
};
