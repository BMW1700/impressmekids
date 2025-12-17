import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface DrillSession {
  id: string;
  drill_type: string;
  status: string;
  started_at: string;
  is_real_emergency: boolean;
  classroom_id: string;
}

interface DrillAttendance {
  id: string;
  student_checked_in: boolean;
  student_checkin_at: string | null;
  marked_by: string | null;
  marked_at: string | null;
  status: string;
}

export function DrillAlertOverlay() {
  const { t } = useLanguage();
  const [activeDrill, setActiveDrill] = useState<DrillSession | null>(null);
  const [attendance, setAttendance] = useState<DrillAttendance | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkForActiveDrill();

    // Listen for drill changes
    const channel = supabase
      .channel("drill-overlay-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drill_sessions",
        },
        () => {
          checkForActiveDrill();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drill_attendance",
        },
        () => {
          checkForActiveDrill();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForActiveDrill = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setStudentId(session.user.id);

    // Get student's classrooms
    const { data: classrooms } = await supabase
      .from("classroom_students")
      .select("classroom_id")
      .eq("student_id", session.user.id);

    if (!classrooms || classrooms.length === 0) {
      setActiveDrill(null);
      return;
    }

    const classroomIds = classrooms.map((c) => c.classroom_id);

    // Check for active drill in any classroom
    const { data: drillData } = await supabase
      .from("drill_sessions")
      .select("*")
      .in("classroom_id", classroomIds)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    // Also check for school-wide drills
    let schoolWideDrill = null;
    if (!drillData) {
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

    const activeDrillData = drillData || schoolWideDrill;
    setActiveDrill(activeDrillData || null);

    // Check attendance status if there's an active drill
    if (activeDrillData) {
      const { data: attendanceData } = await supabase
        .from("drill_attendance")
        .select("*")
        .eq("drill_session_id", activeDrillData.id)
        .eq("student_id", session.user.id)
        .single();

      setAttendance(attendanceData || null);
    } else {
      setAttendance(null);
    }
  };

  const handleCheckIn = async () => {
    if (!activeDrill || !studentId) return;

    setIsCheckingIn(true);

    try {
      // If no attendance record exists, create one
      if (!attendance) {
        const { data: classroomData } = await supabase
          .from("classroom_students")
          .select("classroom_id")
          .eq("student_id", studentId)
          .limit(1)
          .single();

        if (classroomData) {
          const { error: insertError } = await supabase
            .from("drill_attendance")
            .insert({
              drill_session_id: activeDrill.id,
              student_id: studentId,
              classroom_id: classroomData.classroom_id,
              student_checked_in: true,
              student_checkin_at: new Date().toISOString(),
              status: "present",
            });

          if (insertError) throw insertError;
        }
      } else {
        // Update existing attendance record
        const { error } = await supabase
          .from("drill_attendance")
          .update({
            student_checked_in: true,
            student_checkin_at: new Date().toISOString(),
            status: "present",
          })
          .eq("id", attendance.id);

        if (error) throw error;
      }

      // Notify parents
      await supabase.functions.invoke("send-drill-notification", {
        body: {
          type: "student_checkin",
          drillSessionId: activeDrill.id,
          studentId: studentId,
        },
      });

      toast({
        title: t("student.safety.checkedInTitle"),
        description: t("student.safety.checkedInDesc"),
      });

      checkForActiveDrill();
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: t("student.safety.checkInFailed"),
        description: t("student.safety.checkInFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getDrillTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getDrillInstructions = (type: string, isEmergency: boolean = false) => {
    const instructions: Record<string, string> = {
      fire_drill: "Follow your teacher's instructions to evacuate the building calmly and quickly.",
      lockdown_drill: "Remain quiet and stay in your designated safe location until the all-clear is given.",
      earthquake_drill: "Drop, cover, and hold on. Stay under cover until shaking stops.",
      tornado_drill: "Move to your designated shelter area and protect your head and neck.",
      evacuation_drill: "Follow evacuation routes to the designated assembly point.",
    };

    const prefix = isEmergency ? "🚨 REAL EMERGENCY - THIS IS NOT A DRILL. " : "";
    return prefix + (instructions[type] || "Follow your teacher's instructions carefully.");
  };

  // Don't show if no active drill
  if (!activeDrill) return null;

  // Check if already checked in (by student or teacher)
  const isCheckedIn = attendance?.student_checked_in || attendance?.status === "present";
  const wasMarkedByTeacher = attendance?.marked_by && !attendance?.student_checked_in;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl mx-4 rounded-2xl border-4 shadow-2xl ${
          activeDrill.is_real_emergency
            ? "border-red-600 bg-red-950/95"
            : "border-orange-500 bg-background"
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 rounded-t-xl ${
            activeDrill.is_real_emergency
              ? "bg-red-600"
              : "bg-orange-500"
          }`}
        >
          <div className="flex items-center justify-center gap-4">
            <AlertTriangle className="h-12 w-12 text-white animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
              {activeDrill.is_real_emergency ? "🚨 EMERGENCY 🚨" : "⚠️ DRILL IN PROGRESS ⚠️"}
            </h1>
            <AlertTriangle className="h-12 w-12 text-white animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Drill Type */}
          <div className="text-center">
            <h2
              className={`text-2xl md:text-3xl font-bold ${
                activeDrill.is_real_emergency ? "text-red-400" : "text-orange-600"
              }`}
            >
              {getDrillTypeLabel(activeDrill.drill_type)}
              {!activeDrill.is_real_emergency && " Drill"}
            </h2>
            <p className="text-muted-foreground mt-2">
              Started at {format(new Date(activeDrill.started_at), "h:mm a")}
            </p>
          </div>

          {/* Instructions */}
          <div
            className={`p-4 rounded-xl border-2 ${
              activeDrill.is_real_emergency
                ? "bg-red-900/50 border-red-600 text-red-100"
                : "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/30 dark:text-orange-200"
            }`}
          >
            <p className="text-lg text-center font-medium">
              {getDrillInstructions(activeDrill.drill_type, activeDrill.is_real_emergency)}
            </p>
          </div>

          {/* Check-in Section */}
          {isCheckedIn ? (
            <div className="p-6 bg-green-500/20 border-2 border-green-500 rounded-xl">
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {t("student.safety.markedSafe")}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {wasMarkedByTeacher
                      ? "Your teacher marked you as safe. Your parents have been notified."
                      : t("student.safety.parentsNotifiedAt").replace(
                          "{time}",
                          format(new Date(attendance!.student_checkin_at!), "h:mm a")
                        )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-lg text-muted-foreground">
                When you are safely back in the classroom, click the button below to let your parents know you're safe.
              </p>
              <Button
                size="lg"
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="w-full h-20 text-2xl bg-green-600 hover:bg-green-700 transition-all hover:scale-[1.02]"
              >
                <CheckCircle2 className="mr-3 h-8 w-8" />
                {isCheckingIn ? "Checking In..." : "I'm Back in Class - Tell My Parents!"}
              </Button>
            </div>
          )}

          {/* Safety Reminder */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t text-muted-foreground">
            <Shield className="h-5 w-5" />
            <p className="text-sm">
              Stay calm and follow all instructions from your teacher.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
