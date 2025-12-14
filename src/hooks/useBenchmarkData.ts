import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  calculateBenchmarkStatus, 
  calculateFluencyLevel, 
  getCurrentScreeningPeriod,
  getCurrentSchoolYear,
  type BenchmarkStatus,
  type FluencyLevel,
  type ScreeningPeriod
} from "@/lib/fluencyBenchmarks";
import { toast } from "sonner";

export interface BenchmarkResult {
  id: string;
  student_id: string;
  classroom_id: string;
  period_id: string | null;
  assessment_date: string;
  wcpm: number;
  accuracy_percentage: number | null;
  prosody_score: number | null;
  fluency_level: FluencyLevel | null;
  benchmark_status: BenchmarkStatus;
  grade_level: number;
  passage_title: string | null;
  passage_difficulty: string | null;
  miscue_count: number;
  self_corrections: number;
  words_read: number | null;
  duration_seconds: number | null;
  audio_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface BenchmarkPeriod {
  id: string;
  classroom_id: string;
  period_name: ScreeningPeriod;
  school_year: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface StudentBenchmarkSummary {
  student_id: string;
  student_name: string;
  grade: number;
  latest_wcpm: number;
  latest_accuracy: number | null;
  latest_benchmark_status: BenchmarkStatus;
  latest_fluency_level: FluencyLevel | null;
  assessment_count: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  wcpm_change: number | null;
}

/**
 * Fetch benchmark results for a specific student
 */
export const useStudentBenchmarkResults = (studentId?: string, classroomId?: string) => {
  return useQuery({
    queryKey: ["student-benchmark-results", studentId, classroomId],
    queryFn: async () => {
      if (!studentId) return [];
      
      let query = supabase
        .from("student_benchmark_results")
        .select("*")
        .eq("student_id", studentId)
        .order("assessment_date", { ascending: false });
      
      if (classroomId) {
        query = query.eq("classroom_id", classroomId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BenchmarkResult[];
    },
    enabled: !!studentId,
  });
};

/**
 * Fetch all benchmark results for a classroom
 */
export const useClassroomBenchmarkResults = (classroomId?: string, periodId?: string) => {
  return useQuery({
    queryKey: ["classroom-benchmark-results", classroomId, periodId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      let query = supabase
        .from("student_benchmark_results")
        .select(`
          *,
          profiles:student_id (
            id,
            full_name
          )
        `)
        .eq("classroom_id", classroomId)
        .order("assessment_date", { ascending: false });
      
      if (periodId) {
        query = query.eq("period_id", periodId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!classroomId,
  });
};

/**
 * Fetch benchmark periods for a classroom
 */
export const useBenchmarkPeriods = (classroomId?: string) => {
  return useQuery({
    queryKey: ["benchmark-periods", classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      const { data, error } = await supabase
        .from("benchmark_assessment_periods")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data as BenchmarkPeriod[];
    },
    enabled: !!classroomId,
  });
};

/**
 * Get the active benchmark period for a classroom
 */
export const useActiveBenchmarkPeriod = (classroomId?: string) => {
  return useQuery({
    queryKey: ["active-benchmark-period", classroomId],
    queryFn: async () => {
      if (!classroomId) return null;
      
      const { data, error } = await supabase
        .from("benchmark_assessment_periods")
        .select("*")
        .eq("classroom_id", classroomId)
        .eq("is_active", true)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as BenchmarkPeriod | null;
    },
    enabled: !!classroomId,
  });
};

/**
 * Create a new benchmark period
 */
export const useCreateBenchmarkPeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      classroomId: string;
      periodName: ScreeningPeriod;
      startDate: string;
      endDate: string;
      schoolYear?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Deactivate any existing active periods
      await supabase
        .from("benchmark_assessment_periods")
        .update({ is_active: false })
        .eq("classroom_id", params.classroomId)
        .eq("is_active", true);
      
      const { data, error } = await supabase
        .from("benchmark_assessment_periods")
        .insert({
          classroom_id: params.classroomId,
          period_name: params.periodName,
          school_year: params.schoolYear || getCurrentSchoolYear(),
          start_date: params.startDate,
          end_date: params.endDate,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["benchmark-periods", variables.classroomId] });
      queryClient.invalidateQueries({ queryKey: ["active-benchmark-period", variables.classroomId] });
      toast.success("Screening period created");
    },
    onError: (error) => {
      toast.error("Failed to create screening period");
      console.error(error);
    },
  });
};

/**
 * Record a new benchmark result
 */
export const useRecordBenchmarkResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      classroomId: string;
      periodId?: string;
      wcpm: number;
      accuracyPercentage?: number;
      prosodyScore?: number;
      gradeLevel: number;
      passageTitle?: string;
      passageDifficulty?: string;
      miscueCount?: number;
      selfCorrections?: number;
      wordsRead?: number;
      durationSeconds?: number;
      audioUrl?: string;
      notes?: string;
    }) => {
      const benchmarkStatus = calculateBenchmarkStatus(
        params.wcpm,
        params.gradeLevel,
        getCurrentScreeningPeriod()
      );
      
      const fluencyLevel = params.accuracyPercentage 
        ? calculateFluencyLevel(params.accuracyPercentage)
        : null;
      
      const { data, error } = await supabase
        .from("student_benchmark_results")
        .insert({
          student_id: params.studentId,
          classroom_id: params.classroomId,
          period_id: params.periodId,
          wcpm: params.wcpm,
          accuracy_percentage: params.accuracyPercentage,
          prosody_score: params.prosodyScore,
          fluency_level: fluencyLevel,
          benchmark_status: benchmarkStatus,
          grade_level: params.gradeLevel,
          passage_title: params.passageTitle,
          passage_difficulty: params.passageDifficulty,
          miscue_count: params.miscueCount || 0,
          self_corrections: params.selfCorrections || 0,
          words_read: params.wordsRead,
          duration_seconds: params.durationSeconds,
          audio_url: params.audioUrl,
          notes: params.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student-benchmark-results", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["classroom-benchmark-results", variables.classroomId] });
      toast.success("Benchmark recorded");
    },
    onError: (error) => {
      toast.error("Failed to record benchmark");
      console.error(error);
    },
  });
};

/**
 * Calculate classroom summary statistics
 */
export const useClassroomBenchmarkSummary = (classroomId?: string) => {
  return useQuery({
    queryKey: ["classroom-benchmark-summary", classroomId],
    queryFn: async () => {
      if (!classroomId) return null;
      
      console.log("🔍 useClassroomBenchmarkSummary: Fetching for classroom", classroomId);
      
      // Get all students in the classroom - use simpler query approach
      const { data: students, error: studentsError } = await supabase
        .from("classroom_students")
        .select("student_id")
        .eq("classroom_id", classroomId);
      
      if (studentsError) {
        console.error("❌ Failed to fetch students:", studentsError);
        throw studentsError;
      }
      
      console.log("✅ Found students:", students?.length);
      
      if (!students || students.length === 0) {
        return {
          students: [],
          tierDistribution: { tier1: 0, tier2: 0, tier3: 0 },
          avgWCPM: 0,
          totalStudents: 0,
          assessedStudents: 0,
        };
      }
      
      // Fetch profiles separately
      const studentIds = students.map(s => s.student_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);
      
      const { data: publicProfiles } = await supabase
        .from("public_profiles")
        .select("id, grade")
        .in("id", studentIds);
      
      // Get all benchmark results for this classroom
      const { data: results, error: resultsError } = await supabase
        .from("student_benchmark_results")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("assessment_date", { ascending: false });
      
      if (resultsError) {
        console.error("❌ Failed to fetch benchmark results:", resultsError);
        throw resultsError;
      }
      
      console.log("✅ Found benchmark results:", results?.length);
      
      // Calculate summary for each student
      const summaries: StudentBenchmarkSummary[] = students.map(s => {
        const studentResults = (results || []).filter(r => r.student_id === s.student_id);
        const latestResult = studentResults[0];
        const previousResult = studentResults[1];
        const profile = profiles?.find(p => p.id === s.student_id);
        const publicProfile = publicProfiles?.find(p => p.id === s.student_id);
        
        let trend: StudentBenchmarkSummary['trend'] = 'insufficient_data';
        let wcpmChange: number | null = null;
        
        if (studentResults.length >= 2 && latestResult && previousResult) {
          wcpmChange = latestResult.wcpm - previousResult.wcpm;
          if (wcpmChange > 5) trend = 'improving';
          else if (wcpmChange < -5) trend = 'declining';
          else trend = 'stable';
        }
        
        return {
          student_id: s.student_id,
          student_name: profile?.full_name || 'Unknown',
          grade: publicProfile?.grade || 0,
          latest_wcpm: latestResult?.wcpm || 0,
          latest_accuracy: latestResult?.accuracy_percentage || null,
          latest_benchmark_status: (latestResult?.benchmark_status as BenchmarkStatus) || 'well_below',
          latest_fluency_level: latestResult?.fluency_level as FluencyLevel || null,
          assessment_count: studentResults.length,
          trend,
          wcpm_change: wcpmChange,
        };
      });
      
      // Calculate tier distribution
      const tierDistribution = {
        tier1: summaries.filter(s => s.latest_benchmark_status === 'at' || s.latest_benchmark_status === 'above').length,
        tier2: summaries.filter(s => s.latest_benchmark_status === 'below').length,
        tier3: summaries.filter(s => s.latest_benchmark_status === 'well_below').length,
      };
      
      // Calculate class averages
      const studentsWithData = summaries.filter(s => s.assessment_count > 0);
      const avgWCPM = studentsWithData.length > 0
        ? Math.round(studentsWithData.reduce((sum, s) => sum + s.latest_wcpm, 0) / studentsWithData.length)
        : 0;
      
      return {
        students: summaries,
        tierDistribution,
        avgWCPM,
        totalStudents: summaries.length,
        assessedStudents: studentsWithData.length,
      };
    },
    enabled: !!classroomId,
  });
};
