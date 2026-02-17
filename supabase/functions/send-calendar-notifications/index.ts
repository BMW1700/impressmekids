import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { corsHeaders } from '../_shared/cors.ts';

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
  student_name?: string;
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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

        // Get parent account info
        const { data: parentAccount } = await supabaseClient
          .from("parent_accounts")
          .select("email, full_name")
          .eq("id", pref.parent_id)
          .single();

        if (!parentAccount) continue;

        // Get parent's approved children
        const { data: children, error: childrenError } = await supabaseClient
          .from("parent_student_links")
          .select("student_id, profiles!inner(full_name)")
          .eq("parent_id", pref.parent_id)
          .eq("approved", true);

        if (childrenError || !children || children.length === 0) {
          console.log(`No approved children for parent ${pref.parent_id}`);
          continue;
        }

        const studentIds = children.map((c) => c.student_id);
        const studentNames = new Map(
          children.map((c) => [c.student_id, (c.profiles as any).full_name])
        );

        // Get classrooms for these students
        const { data: classroomStudents } = await supabaseClient
          .from("classroom_students")
          .select("classroom_id, student_id, classrooms(id, name)")
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
            .select("id, title, description, due_date, category, classroom_id, classrooms!inner(name)")
            .in("classroom_id", classroomIds)
            .eq("status", "published")
            .eq("is_posted", true)
            .gte("due_date", targetDateStr)
            .lte("due_date", targetDateStr);

          for (const assignment of assignments || []) {
            const isTest = assignment.category === "Test";
            
            if ((isTest && pref.notify_tests) || (!isTest && pref.notify_assignments)) {
              // Get students in this classroom
              const studentsInClassroom = classroomStudents
                .filter((cs) => cs.classroom_id === assignment.classroom_id)
                .map((cs) => cs.student_id);

              for (const studentId of studentsInClassroom) {
                upcomingItems.push({
                  id: assignment.id,
                  type: "assignment",
                  title: assignment.title,
                  description: assignment.description,
                  date: assignment.due_date,
                  classroom_id: assignment.classroom_id,
                  classroom_name: (assignment.classrooms as any)?.name || "",
                  student_id: studentId,
                  student_name: studentNames.get(studentId),
                  event_category: assignment.category,
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
              .map((cs) => cs.student_id);

            for (const studentId of studentsInClassroom) {
              upcomingItems.push({
                id: event.id,
                type: "event",
                title: event.title,
                description: event.description,
                date: event.event_date,
                classroom_id: event.classroom_id,
                classroom_name: (event.classrooms as any)?.name || "",
                student_id: studentId,
                student_name: studentNames.get(studentId),
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
                student_name: studentNames.get(studentId),
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

        // Send email notifications if enabled
        if (pref.email_enabled && upcomingItems.length > 0) {
          const daysText = pref.notification_days_before === 1 ? "tomorrow" : `in ${pref.notification_days_before} days`;
          
          // Group items by student
          const itemsByStudent = new Map<string, UpcomingItem[]>();
          for (const item of upcomingItems) {
            const items = itemsByStudent.get(item.student_id) || [];
            items.push(item);
            itemsByStudent.set(item.student_id, items);
          }

          // Create email HTML
          let itemsHtml = '';
          for (const [studentId, items] of itemsByStudent) {
            const studentName = studentNames.get(studentId) || 'Your child';
            itemsHtml += `<h3 style="color: #1f2937; margin-top: 20px;">${studentName}</h3>`;
            
            for (const item of items) {
              const typeColor = item.type === 'assignment' ? '#8b5cf6' : '#10b981';
              const typeLabel = item.event_category || item.type;
              
              itemsHtml += `
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${typeColor};">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                      <span style="display: inline-block; background: ${typeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-bottom: 5px;">${typeLabel}</span>
                      <h4 style="margin: 5px 0; color: #111827;">${item.title}</h4>
                      ${item.classroom_name ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📚 ${item.classroom_name}</p>` : ''}
                      ${item.description ? `<p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${item.description}</p>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }
          }

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">📅 Upcoming Calendar Reminders</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Here's what's happening ${daysText}</p>
              </div>
              <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
                ${itemsHtml}
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    This is an automated reminder from ImpressMe Kids.<br>
                    You can manage your notification preferences in your account settings.
                  </p>
                </div>
              </div>
            </div>
          `;

          try {
            await resend.emails.send({
              from: "ImpressMe Kids <notifications@impressmekids.com>",
              to: [parentAccount.email],
              subject: `📅 ${upcomingItems.length} upcoming ${upcomingItems.length === 1 ? 'item' : 'items'} ${daysText}`,
              html: emailHtml,
            });
            console.log(`Email sent to ${parentAccount.email} for parent ${pref.parent_id}`);
          } catch (emailError) {
            console.error(`Failed to send email to ${parentAccount.email}:`, emailError);
          }
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