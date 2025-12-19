import { supabase } from "@/integrations/supabase/client";

export type SafetyEventType = 
  | "drill_started"
  | "drill_ended"
  | "student_checked_in"
  | "student_marked_present"
  | "student_marked_missing"
  | "escalation_triggered"
  | "escalation_acknowledged"
  | "parent_notified"
  | "all_clear_issued"
  | "manual_override"
  | "system_error";

interface LogSafetyEventParams {
  eventType: SafetyEventType;
  drillSessionId?: string;
  studentId?: string;
  classroomId?: string;
  actorId?: string;
  actorRole?: string;
  eventData?: Record<string, any>;
}

export const useSafetyAuditLog = () => {
  const logSafetyEvent = async ({
    eventType,
    drillSessionId,
    studentId,
    classroomId,
    actorId,
    actorRole,
    eventData = {}
  }: LogSafetyEventParams): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get current user if actorId not provided
      let finalActorId = actorId;
      let finalActorRole = actorRole;
      
      if (!finalActorId) {
        const { data: { user } } = await supabase.auth.getUser();
        finalActorId = user?.id;
        
        if (user && !finalActorRole) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          finalActorRole = profile?.role || "unknown";
        }
      }

      const { error } = await supabase
        .from("safety_verification_log" as any)
        .insert({
          event_type: eventType,
          drill_session_id: drillSessionId,
          student_id: studentId,
          classroom_id: classroomId,
          actor_id: finalActorId,
          actor_role: finalActorRole,
          event_data: eventData
        });

      if (error) {
        console.error("[SafetyAuditLog] Error logging event:", error);
        return { success: false, error: error.message };
      }

      console.log(`[SafetyAuditLog] Logged ${eventType} event`);
      return { success: true };
    } catch (err: any) {
      console.error("[SafetyAuditLog] Exception:", err);
      return { success: false, error: err.message };
    }
  };

  return { logSafetyEvent };
};
