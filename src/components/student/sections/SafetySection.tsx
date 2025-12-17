import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface DrillSession {
  id: string;
  drill_type: string;
  status: string;
  started_at: string;
  scheduled_for: string | null;
  classroom_id: string;
  is_real_emergency: boolean;
}

interface DrillAttendance {
  id: string;
  student_checked_in: boolean;
  student_checkin_at: string | null;
}

export function SafetySection() {
  const { t } = useLanguage();
  const [activeDrill, setActiveDrill] = useState<DrillSession | null>(null);
  const [scheduledDrills, setScheduledDrills] = useState<DrillSession[]>([]);
  const [attendance, setAttendance] = useState<DrillAttendance | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrillData();

    const channel = supabase
      .channel("student-drill-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drill_sessions",
        },
        () => {
          fetchDrillData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDrillData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: classrooms } = await supabase
      .from("classroom_students")
      .select("classroom_id")
      .eq("student_id", session.user.id);

    if (!classrooms || classrooms.length === 0) return;

    const classroomIds = classrooms.map((c) => c.classroom_id);

    const { data: activeDrillData } = await supabase
      .from("drill_sessions")
      .select("*")
      .in("classroom_id", classroomIds)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    setActiveDrill(activeDrillData || null);

    const { data: scheduledData } = await supabase
      .from("drill_sessions")
      .select("*")
      .in("classroom_id", classroomIds)
      .eq("status", "scheduled")
      .order("scheduled_for", { ascending: true });

    setScheduledDrills(scheduledData || []);

    if (activeDrillData) {
      const { data: attendanceData } = await supabase
        .from("drill_attendance")
        .select("*")
        .eq("drill_session_id", activeDrillData.id)
        .eq("student_id", session.user.id)
        .single();

      setAttendance(attendanceData || null);
    }
  };

  const handleCheckIn = async () => {
    if (!activeDrill || !attendance) return;

    setIsCheckingIn(true);

    const { error } = await supabase
      .from("drill_attendance")
      .update({
        student_checked_in: true,
        student_checkin_at: new Date().toISOString(),
        status: "present",
      })
      .eq("id", attendance.id);

    if (error) {
      toast({
        title: t("student.safety.checkInFailed"),
        description: t("student.safety.checkInFailedDesc"),
        variant: "destructive",
      });
      setIsCheckingIn(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke("send-drill-notification", {
          body: {
            type: "student_checkin",
            drillSessionId: activeDrill.id,
            studentId: session.user.id,
          },
        });
      }
    } catch (notifError) {
      console.error("Error sending parent notification:", notifError);
    }

    toast({
      title: t("student.safety.checkedInTitle"),
      description: t("student.safety.checkedInDesc"),
    });

    fetchDrillData();
    setIsCheckingIn(false);
  };

  const getDrillTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getDrillInstructions = (type: string, isEmergency: boolean = false) => {
    const prefix = isEmergency ? t("student.safety.emergencyPrefix") : "";
    const instructions: Record<string, string> = {
      fire_drill: "Follow your teacher's instructions to evacuate the building calmly and quickly.",
      lockdown_drill: "Remain quiet and stay in your designated safe location until the all-clear is given.",
      earthquake_drill: "Drop, cover, and hold on. Stay under cover until shaking stops.",
      tornado_drill: "Move to your designated shelter area and protect your head and neck.",
      evacuation_drill: "Follow evacuation routes to the designated assembly point.",
    };

    // Keep these as-is for now; key goal is UI strings across dashboard.
    return prefix + (instructions[type] || t("student.safety.followTeacher"));
  };

  if (activeDrill) {
    const hasCheckedIn = attendance?.student_checked_in;

    return (
      <div className="space-y-6">
        <Card
          className={`p-6 border-2 ${
            activeDrill.is_real_emergency
              ? "border-red-600 bg-red-600/20 animate-pulse"
              : "border-red-500 bg-red-500/5 animate-pulse"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 ${
                activeDrill.is_real_emergency ? "bg-red-700" : "bg-red-500"
              } rounded-full`}
            >
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2
                className={`text-2xl font-bold mb-2 ${
                  activeDrill.is_real_emergency ? "text-red-800" : "text-red-700"
                }`}
              >
                {activeDrill.is_real_emergency && t("student.safety.emergencyPrefix")}
                {t("student.safety.inProgress").replace(
                  "{type}",
                  getDrillTypeLabel(activeDrill.drill_type)
                )}
                {!activeDrill.is_real_emergency && t("student.safety.drillSuffix")}
              </h2>
              <p
                className={`mb-4 ${
                  activeDrill.is_real_emergency
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {getDrillInstructions(activeDrill.drill_type, activeDrill.is_real_emergency)}
              </p>

              {hasCheckedIn ? (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700">
                      {t("student.safety.markedSafe")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("student.safety.parentsNotifiedAt").replace(
                        "{time}",
                        format(new Date(attendance!.student_checkin_at!), "h:mm a")
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  {isCheckingIn
                    ? t("student.safety.checkingIn")
                    : t("student.safety.imBackInClass")}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{t("student.safety.title")}</h2>
            <p className="text-muted-foreground">{t("student.safety.subtitle")}</p>
          </div>
        </div>

        {scheduledDrills.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t("student.safety.upcomingDrills")}</h3>
            {scheduledDrills.map((drill) => (
              <Card key={drill.id} className="p-4 bg-blue-500/5 border-blue-500">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{getDrillTypeLabel(drill.drill_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("student.safety.scheduledFor").replace(
                        "{datetime}",
                        format(new Date(drill.scheduled_for!), "EEEE, MMMM d, yyyy 'at' h:mm a")
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t("student.safety.noDrills")}</p>
            <p className="text-sm text-muted-foreground mt-2">{t("student.safety.whenActive")}</p>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">{t("student.safety.tips.title")}</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• {t("student.safety.tips.1")}</li>
          <li>• {t("student.safety.tips.2")}</li>
          <li>• {t("student.safety.tips.3")}</li>
          <li>• {t("student.safety.tips.4")}</li>
        </ul>
      </Card>
    </div>
  );
}
