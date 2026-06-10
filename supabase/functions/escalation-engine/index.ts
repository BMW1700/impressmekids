import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from '../_shared/cors.ts';

interface EscalationRule {
  id: string;
  escalation_level: number;
  role_target: string;
  sla_seconds: number;
  notification_channels: string[];
  message_template: string;
}

interface MissingStudent {
  attendance_id: string;
  student_id: string;
  student_name: string;
  classroom_id: string;
  classroom_name: string;
  teacher_name: string;
  status: string;
  escalation_level: number;
  escalation_started_at: string | null;
  time_missing_seconds: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- AuthN/AuthZ: only teachers or admins may invoke this function ---
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: callerId, _role: "admin" });
    const { data: isTeacher } = await userClient.rpc("has_role", { _user_id: callerId, _role: "teacher" });
    if (!isAdmin && !isTeacher) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { drill_session_id, action } = await req.json();
    console.log(`[Escalation Engine] Action: ${action}, Drill: ${drill_session_id}, Caller: ${callerId}`);

    if (action === "check_escalations") {
      // Get active drill session
      const { data: drillSession, error: drillError } = await supabase
        .from("drill_sessions")
        .select("*")
        .eq("id", drill_session_id)
        .eq("status", "active")
        .single();

      if (drillError || !drillSession) {
        console.log("[Escalation Engine] No active drill found");
        return new Response(
          JSON.stringify({ success: false, error: "No active drill session" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get escalation rules
      const { data: rules, error: rulesError } = await supabase
        .from("escalation_rules")
        .select("*")
        .eq("is_active", true)
        .order("escalation_level", { ascending: true });

      if (rulesError) {
        console.error("[Escalation Engine] Error fetching rules:", rulesError);
        throw rulesError;
      }

      // Get missing students using the RPC function
      const { data: missingStudents, error: missingError } = await supabase
        .rpc("get_missing_students_with_escalation", { p_drill_session_id: drill_session_id });

      if (missingError) {
        console.error("[Escalation Engine] Error fetching missing students:", missingError);
        throw missingError;
      }

      console.log(`[Escalation Engine] Found ${missingStudents?.length || 0} missing students`);

      const escalationsTriggered: any[] = [];

      // Process each missing student
      for (const student of (missingStudents || []) as MissingStudent[]) {
        const timeMissingSeconds = student.time_missing_seconds;
        const currentEscalationLevel = student.escalation_level || 0;

        // Find the appropriate escalation level based on time missing
        let targetLevel = 0;
        for (const rule of (rules || []) as EscalationRule[]) {
          if (timeMissingSeconds >= rule.sla_seconds) {
            targetLevel = rule.escalation_level;
          }
        }

        // If we need to escalate
        if (targetLevel > currentEscalationLevel) {
          console.log(`[Escalation Engine] Escalating ${student.student_name} from level ${currentEscalationLevel} to ${targetLevel}`);

          // Update attendance record
          const { error: updateError } = await supabase
            .from("drill_attendance")
            .update({
              escalation_level: targetLevel,
              escalation_started_at: student.escalation_started_at || new Date().toISOString(),
              status: "missing"
            })
            .eq("id", student.attendance_id);

          if (updateError) {
            console.error("[Escalation Engine] Error updating attendance:", updateError);
            continue;
          }

          // Get the rule for this level
          const rule = (rules as EscalationRule[]).find(r => r.escalation_level === targetLevel);
          if (!rule) continue;

          // Create notification message
          const message = rule.message_template
            .replace("{student_name}", student.student_name)
            .replace("{classroom_name}", student.classroom_name)
            .replace("{teacher_name}", student.teacher_name)
            .replace("{time_missing}", Math.floor(timeMissingSeconds / 60).toString());

          // Get target users based on role
          let targetUsers: { id: string }[] = [];
          if (rule.role_target === "teacher") {
            // Get the classroom teacher
            const { data: classroom } = await supabase
              .from("classrooms")
              .select("teacher_id")
              .eq("id", student.classroom_id)
              .single();
            if (classroom) {
              targetUsers = [{ id: classroom.teacher_id }];
            }
          } else if (rule.role_target === "admin") {
            // Get all admins
            const { data: admins } = await supabase
              .rpc("get_all_admins");
            targetUsers = admins || [];
          }

          // Create notifications for each channel and target
          for (const channel of rule.notification_channels) {
            for (const target of targetUsers) {
              const { error: notifError } = await supabase
                .from("escalation_notifications")
                .insert({
                  drill_attendance_id: student.attendance_id,
                  drill_session_id: drill_session_id,
                  student_id: student.student_id,
                  escalation_level: targetLevel,
                  target_user_id: target.id,
                  target_role: rule.role_target,
                  notification_channel: channel,
                  message: message
                });

              if (notifError) {
                console.error("[Escalation Engine] Error creating notification:", notifError);
              }
            }
          }

          // Log to immutable audit trail
          await supabase.from("safety_verification_log").insert({
            event_type: "escalation_triggered",
            drill_session_id: drill_session_id,
            student_id: student.student_id,
            classroom_id: student.classroom_id,
            actor_id: null,
            actor_role: "system",
            event_data: {
              from_level: currentEscalationLevel,
              to_level: targetLevel,
              time_missing_seconds: timeMissingSeconds,
              rule_id: rule.id
            }
          });

          escalationsTriggered.push({
            student_id: student.student_id,
            student_name: student.student_name,
            from_level: currentEscalationLevel,
            to_level: targetLevel,
            time_missing_seconds: timeMissingSeconds
          });
        }
      }

      console.log(`[Escalation Engine] Triggered ${escalationsTriggered.length} escalations`);

      return new Response(
        JSON.stringify({
          success: true,
          escalations_triggered: escalationsTriggered.length,
          details: escalationsTriggered
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "acknowledge_escalation") {
      const { notification_id, user_id, notes } = await req.json();

      // Update the notification
      const { error: ackError } = await supabase
        .from("escalation_notifications")
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user_id,
          response_notes: notes
        })
        .eq("id", notification_id);

      if (ackError) {
        throw ackError;
      }

      // Get notification details for logging
      const { data: notification } = await supabase
        .from("escalation_notifications")
        .select("*, drill_attendance!inner(classroom_id)")
        .eq("id", notification_id)
        .single();

      // Log to audit trail
      await supabase.from("safety_verification_log").insert({
        event_type: "escalation_acknowledged",
        drill_session_id: notification?.drill_session_id,
        student_id: notification?.student_id,
        classroom_id: notification?.drill_attendance?.classroom_id,
        actor_id: user_id,
        actor_role: notification?.target_role,
        event_data: {
          notification_id,
          escalation_level: notification?.escalation_level,
          response_notes: notes
        }
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "resolve_missing_student") {
      const { attendance_id, user_id, resolution_notes, resolved_status } = await req.json();

      // Update attendance record
      const { data: attendance, error: updateError } = await supabase
        .from("drill_attendance")
        .update({
          status: resolved_status || "accounted",
          resolution_notes,
          resolved_at: new Date().toISOString(),
          escalation_acknowledged_by: user_id,
          escalation_acknowledged_at: new Date().toISOString()
        })
        .eq("id", attendance_id)
        .select("*, drill_sessions!inner(id)")
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log to audit trail
      await supabase.from("safety_verification_log").insert({
        event_type: "manual_override",
        drill_session_id: attendance?.drill_session_id,
        student_id: attendance?.student_id,
        classroom_id: attendance?.classroom_id,
        actor_id: user_id,
        actor_role: "manual_resolution",
        event_data: {
          attendance_id,
          resolution_notes,
          resolved_status,
          previous_escalation_level: attendance?.escalation_level
        }
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Escalation Engine] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
