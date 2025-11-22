import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPreference {
  id: string;
  parent_id: string;
  notify_assignments: boolean;
  notify_tests: boolean;
  notify_events: boolean;
  notification_days_before: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

interface UpcomingItem {
  id: string;
  type: "assignment" | "event" | "school_event";
  title: string;
  description: string | null;
  date: string;
  classroom_id?: string;
  classroom_name?: string;
  student_id: string;
  event_category?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting calendar notification check...");

    // Get current date and calculate notification date range
    const today = new Date();
    const maxDaysAhead = 7; // Check up to 7 days ahead

    // Get all parent notification preferences
    const { data: preferences, error: prefsError } = await supabaseClient
      .from("parent_notification_preferences")
      .select("*");

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
      throw prefsError;
    }

    console.log(`Found ${preferences?.length || 0} parent preferences`);

    for (const pref of preferences || []) {
      try {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + pref.notification_days_before);
        const targetDateStr = targetDate.toISOString().split("T")[0];

        console.log(`Processing notifications for parent ${pref.parent_id}, target date: ${targetDateStr}`);

        // Get parent's approved children
        const { data: children, error: childrenError } = await supabaseClient
          .from("parent_student_links")
          .select("student_id")
          .eq("parent_id", pref.parent_id)
          .eq("approved", true);

        if (childrenError || !children || children.length === 0) {
          console.log(`No approved children for parent ${pref.parent_id}`);
          continue;
        }

        const studentIds = children.map((c) => c.student_id);

        // Get classrooms for these students
        const { data: classroomStudents } = await supabaseClient
          .from("classroom_students")
          .select("classroom_id, classrooms(id, name)")
          .in("student_id", studentIds);

        if (!classroomStudents || classroomStudents.length === 0) {
          console.log(`No classrooms found for children of parent ${pref.parent_id}`);
          continue;
        }

        const classroomIds = classroomStudents.map((cs) => cs.classroom_id);
        const upcomingItems: UpcomingItem[] = [];

        // Check for assignments if enabled
        if (pref.notify_assignments || pref.notify_tests) {
          const { data: assignments } = await supabaseClient
            .from("assignments")
            .select("id, title, description, due_date, assignment_type, classroom_id, classrooms!inner(name)")
            .in("classroom_id", classroomIds)
            .eq("status", "published")
            .eq("is_posted", true)
            .gte("due_date", targetDateStr)
            .lte("due_date", targetDateStr);

          for (const assignment of assignments || []) {
            const isTest = ["quiz", "test"].includes(assignment.assignment_type?.toLowerCase() || "");
            
            if ((isTest && pref.notify_tests) || (!isTest && pref.notify_assignments)) {
              // Check which students from our list are in this classroom
              const studentsInClassroom = classroomStudents
                .filter((cs) => cs.classroom_id === assignment.classroom_id)
                .map((cs) => {
                  const studentId = studentIds.find((sid) => 
                    classroomStudents.some((cs2) => cs2.classroom_id === assignment.classroom_id)
                  );
                  return studentId;
                })
                .filter(Boolean);

              for (const studentId of studentsInClassroom) {
                upcomingItems.push({
                  id: assignment.id,
                  type: "assignment",
                  title: assignment.title,
                  description: assignment.description,
                  date: assignment.due_date,
                  classroom_id: assignment.classroom_id,
                  classroom_name: (assignment.classrooms as any)?.name || "",
                  student_id: studentId!,
                  event_category: isTest ? "test" : "assignment",
                });
              }
            }
          }
        }

        // Check for events if enabled
        if (pref.notify_events) {
          const { data: events } = await supabaseClient
            .from("classroom_events")
            .select("id, title, description, event_date, event_category, classroom_id, classrooms!inner(name)")
            .in("classroom_id", classroomIds)
            .eq("is_posted", true)
            .gte("event_date", targetDateStr)
            .lte("event_date", targetDateStr);

          for (const event of events || []) {
            const studentsInClassroom = classroomStudents
              .filter((cs) => cs.classroom_id === event.classroom_id)
              .map((cs) => {
                const studentId = studentIds.find((sid) => 
                  classroomStudents.some((cs2) => cs2.classroom_id === event.classroom_id)
                );
                return studentId;
              })
              .filter(Boolean);

            for (const studentId of studentsInClassroom) {
              upcomingItems.push({
                id: event.id,
                type: "event",
                title: event.title,
                description: event.description,
                date: event.event_date,
                classroom_id: event.classroom_id,
                classroom_name: (event.classrooms as any)?.name || "",
                student_id: studentId!,
                event_category: event.event_category,
              });
            }
          }

          // Check for school-wide events
          const { data: schoolEvents } = await supabaseClient
            .from("school_events")
            .select("id, title, description, event_date")
            .gte("event_date", targetDateStr)
            .lte("event_date", targetDateStr);

          for (const event of schoolEvents || []) {
            for (const studentId of studentIds) {
              upcomingItems.push({
                id: event.id,
                type: "school_event",
                title: event.title,
                description: event.description,
                date: event.event_date,
                student_id: studentId,
              });
            }
          }
        }

        console.log(`Found ${upcomingItems.length} upcoming items for parent ${pref.parent_id}`);

        // Create in-app notifications if enabled
        if (pref.in_app_enabled && upcomingItems.length > 0) {
          for (const item of upcomingItems) {
            // Check if notification already exists
            const { data: existing } = await supabaseClient
              .from("parent_notifications")
              .select("id")
              .eq("parent_id", pref.parent_id)
              .eq("item_id", item.id)
              .eq("item_type", item.type)
              .single();

            if (!existing) {
              await supabaseClient.from("parent_notifications").insert({
                parent_id: pref.parent_id,
                child_id: item.student_id,
                item_type: item.type,
                item_id: item.id,
                item_title: item.title,
                item_description: item.description,
                event_date: item.date,
                classroom_name: item.classroom_name,
              });
            }
          }
        }

        // TODO: Send email notifications if enabled
        // This would require email service integration (e.g., Resend)
        if (pref.email_enabled && upcomingItems.length > 0) {
          console.log(`Email notifications would be sent for parent ${pref.parent_id}`);
          // Implementation would go here
        }

      } catch (error) {
        console.error(`Error processing notifications for parent ${pref.parent_id}:`, error);
      }
    }

    console.log("Calendar notification check completed");

    return new Response(
      JSON.stringify({ success: true, message: "Notifications processed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
