import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertTriangle, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DrillSession {
  id: string;
  drill_type: string;
  status: string;
  started_at: string;
  is_real_emergency: boolean;
  classroom_id: string | null;
}

interface StudentAttendance {
  id: string;
  student_id: string;
  student_name: string;
  status: string;
  student_checked_in: boolean;
  student_checkin_at: string | null;
  marked_by: string | null;
  marked_at: string | null;
}

interface TeacherDrillAttendanceProps {
  classroomId: string;
  students: { id: string; full_name: string }[];
}

export function TeacherDrillAttendance({ classroomId, students }: TeacherDrillAttendanceProps) {
  const { toast } = useToast();
  const [activeDrill, setActiveDrill] = useState<DrillSession | null>(null);
  const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    fetchDrillData();

    // Real-time updates for drill and attendance
    const channel = supabase
      .channel("teacher-drill-attendance")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drill_sessions",
        },
        () => fetchDrillData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drill_attendance",
        },
        () => fetchDrillData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId]);

  const fetchDrillData = async () => {
    setIsLoading(true);

    // Check for active drill in this classroom
    const { data: classroomDrill } = await supabase
      .from("drill_sessions")
      .select("*")
      .eq("classroom_id", classroomId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    // Also check for school-wide drills
    let schoolWideDrill = null;
    if (!classroomDrill) {
      const { data: schoolDrill } = await supabase
        .from("drill_sessions")
        .select("*")
        .is("classroom_id", null)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      schoolWideDrill = schoolDrill;
    }

    const activeDrillData = classroomDrill || schoolWideDrill;
    setActiveDrill(activeDrillData || null);

    if (activeDrillData) {
      // Fetch attendance for all students
      const { data: attendance } = await supabase
        .from("drill_attendance")
        .select("*")
        .eq("drill_session_id", activeDrillData.id)
        .eq("classroom_id", classroomId);

      // Map attendance to students
      const attendanceMap = new Map(attendance?.map((a) => [a.student_id, a]) || []);

      const studentAttendance: StudentAttendance[] = students.map((student) => {
        const att = attendanceMap.get(student.id);
        return {
          id: att?.id || "",
          student_id: student.id,
          student_name: student.full_name,
          status: att?.status || "unaccounted",
          student_checked_in: att?.student_checked_in || false,
          student_checkin_at: att?.student_checkin_at || null,
          marked_by: att?.marked_by || null,
          marked_at: att?.marked_at || null,
        };
      });

      setAttendanceList(studentAttendance);
    } else {
      setAttendanceList([]);
    }

    setIsLoading(false);
  };

  const markStudentPresent = async (studentId: string) => {
    if (!activeDrill) return;

    setMarkingStudentId(studentId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const existingAttendance = attendanceList.find((a) => a.student_id === studentId);

      if (existingAttendance?.id) {
        // Update existing record
        const { error } = await supabase
          .from("drill_attendance")
          .update({
            status: "present",
            marked_by: session.user.id,
            marked_at: new Date().toISOString(),
          })
          .eq("id", existingAttendance.id);

        if (error) throw error;
      } else {
        // Create new attendance record
        const { error } = await supabase.from("drill_attendance").insert({
          drill_session_id: activeDrill.id,
          student_id: studentId,
          classroom_id: classroomId,
          status: "present",
          marked_by: session.user.id,
          marked_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Send parent notification - same as student check-in
      await supabase.functions.invoke("send-drill-notification", {
        body: {
          type: "student_checkin",
          drillSessionId: activeDrill.id,
          studentId: studentId,
          markedByTeacher: true,
        },
      });

      toast({
        title: "Student Marked Safe",
        description: "Parents have been notified that their child is safe.",
      });

      fetchDrillData();
    } catch (error) {
      console.error("Error marking student present:", error);
      toast({
        title: "Error",
        description: "Failed to mark student as present. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingStudentId(null);
    }
  };

  const markAllPresent = async () => {
    if (!activeDrill) return;

    const unaccountedStudents = attendanceList.filter(
      (a) => a.status !== "present" && !a.student_checked_in
    );

    if (unaccountedStudents.length === 0) {
      toast({
        title: "All Students Accounted For",
        description: "All students are already marked as present.",
      });
      return;
    }

    setIsMarkingAll(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Mark all unaccounted students as present
      for (const student of unaccountedStudents) {
        if (student.id) {
          await supabase
            .from("drill_attendance")
            .update({
              status: "present",
              marked_by: session.user.id,
              marked_at: new Date().toISOString(),
            })
            .eq("id", student.id);
        } else {
          await supabase.from("drill_attendance").insert({
            drill_session_id: activeDrill.id,
            student_id: student.student_id,
            classroom_id: classroomId,
            status: "present",
            marked_by: session.user.id,
            marked_at: new Date().toISOString(),
          });
        }

        // Send parent notification for each student
        await supabase.functions.invoke("send-drill-notification", {
          body: {
            type: "student_checkin",
            drillSessionId: activeDrill.id,
            studentId: student.student_id,
            markedByTeacher: true,
          },
        });
      }

      toast({
        title: "All Students Marked Safe",
        description: `${unaccountedStudents.length} students marked as present. Parents have been notified.`,
      });

      fetchDrillData();
    } catch (error) {
      console.error("Error marking all students:", error);
      toast({
        title: "Error",
        description: "Failed to mark all students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getDrillTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Don't render if no active drill
  if (!activeDrill) return null;

  const presentCount = attendanceList.filter(
    (a) => a.status === "present" || a.student_checked_in
  ).length;
  const totalCount = students.length;
  const allPresent = presentCount === totalCount;

  return (
    <Card
      className={`border-2 ${
        activeDrill.is_real_emergency
          ? "border-red-600 bg-red-600/10"
          : "border-orange-500 bg-orange-500/5"
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                activeDrill.is_real_emergency ? "bg-red-600" : "bg-orange-500"
              }`}
            >
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {activeDrill.is_real_emergency && (
                  <span className="text-red-600">🚨 EMERGENCY:</span>
                )}
                {getDrillTypeLabel(activeDrill.drill_type)}
                {!activeDrill.is_real_emergency && " Drill"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Started at {format(new Date(activeDrill.started_at), "h:mm a")}
              </p>
            </div>
          </div>
          
          {/* Attendance Summary */}
          <div
            className={`px-4 py-2 rounded-lg font-bold text-lg ${
              allPresent
                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                : "bg-orange-500/20 text-orange-700 dark:text-orange-400"
            }`}
          >
            {presentCount}/{totalCount} Present
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* All Present Banner */}
        {allPresent && (
          <div className="p-4 bg-green-500/20 border-2 border-green-500 rounded-xl flex items-center justify-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-green-700 dark:text-green-400">
              100% IN ATTENDANCE - All Students Safe!
            </span>
          </div>
        )}

        {/* Mark All Button */}
        {!allPresent && (
          <Button
            variant="outline"
            className="w-full h-12 border-green-500 text-green-700 hover:bg-green-500/10"
            onClick={markAllPresent}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Marking All Students...
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                Mark All Students Present
              </>
            )}
          </Button>
        )}

        {/* Student Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attendanceList.map((student) => {
              const isPresent = student.status === "present" || student.student_checked_in;
              const selfChecked = student.student_checked_in;
              const teacherMarked = student.marked_by && !student.student_checked_in;

              return (
                <div
                  key={student.student_id}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isPresent
                      ? "bg-green-500/10 border-green-500"
                      : "bg-red-500/10 border-red-500 animate-pulse"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isPresent ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 animate-pulse" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{student.student_name}</p>
                        {isPresent && (
                          <p className="text-xs text-muted-foreground">
                            {selfChecked
                              ? `Self checked at ${format(new Date(student.student_checkin_at!), "h:mm a")}`
                              : teacherMarked
                              ? `Marked by teacher at ${format(new Date(student.marked_at!), "h:mm a")}`
                              : "Present"}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isPresent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-700 hover:bg-green-500/20 flex-shrink-0"
                        onClick={() => markStudentPresent(student.student_id)}
                        disabled={markingStudentId === student.student_id}
                      >
                        {markingStudentId === student.student_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Present/Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>Unaccounted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
