import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  classroom_id: string;
  student_id: string;
  date: string;
  status: "Present" | "Tardy" | "Absent";
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export const useClassroomAttendance = (classroomId: string, date: string) => {
  return useQuery({
    queryKey: ["attendance", classroomId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("classroom_id", classroomId)
        .eq("date", date);

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!classroomId && !!date,
  });
};

export const useStudentAttendanceHistory = (
  classroomId: string,
  studentId: string
) => {
  return useQuery({
    queryKey: ["attendance-history", classroomId, studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("classroom_id", classroomId)
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!classroomId && !!studentId,
  });
};

export const useStudentAttendanceAverage = (
  classroomId: string,
  studentId: string
) => {
  return useQuery({
    queryKey: ["attendance-average", classroomId, studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("classroom_id", classroomId)
        .eq("student_id", studentId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          average: null,
          totalDays: 0,
          present: 0,
          tardy: 0,
          absent: 0,
        };
      }

      const present = data.filter((r) => r.status === "Present").length;
      const tardy = data.filter((r) => r.status === "Tardy").length;
      const absent = data.filter((r) => r.status === "Absent").length;
      const total = present + tardy + absent;

      const points = present * 100 + tardy * 100 + absent * 0;
      const average = total > 0 ? points / total : null;

      return {
        average,
        totalDays: total,
        present,
        tardy,
        absent,
      };
    },
    enabled: !!classroomId && !!studentId,
  });
};

export const useSaveAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      studentId,
      date,
      status,
    }: {
      classroomId: string;
      studentId: string;
      date: string;
      status: "Present" | "Tardy" | "Absent";
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("attendance_records")
        .upsert(
          {
            classroom_id: classroomId,
            student_id: studentId,
            date,
            status,
            recorded_by: userData.user.id,
          },
          {
            onConflict: "classroom_id,student_id,date",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", variables.classroomId, variables.date],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance-history", variables.classroomId, variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance-average", variables.classroomId, variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-gradebook"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-classroom-trends"],
      });
    },
    onError: (error) => {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    },
  });
};
