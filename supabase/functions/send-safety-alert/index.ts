import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParentInfo {
  email: string;
  full_name: string;
  user_id: string;
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

    const { alertId } = await req.json();

    if (!alertId) {
      throw new Error("Alert ID is required");
    }

    console.log("=== SAFETY ALERT PROCESSING START ===");
    console.log("Alert ID:", alertId);

    // Fetch alert details including district_id and school_id for scoping
    const { data: alert, error: alertError } = await supabaseClient
      .from("safety_alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      console.error("Alert fetch error:", alertError);
      throw new Error("Alert not found");
    }

    console.log("Alert details:", {
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      district_id: alert.district_id,
      school_id: alert.school_id || "ALL SCHOOLS",
    });

    let parents: ParentInfo[] = [];

    if (!alert.district_id) {
      console.error("CRITICAL: Alert has no district_id - cannot scope notifications!");
      throw new Error("Alert must have a district_id to send notifications");
    }

    // Step 1: Get all approved parent-student links with parent info
    console.log("Step 1: Fetching all approved parent-student links...");
    const { data: parentLinks, error: linksError } = await supabaseClient
      .from("parent_student_links")
      .select(`
        parent_id,
        student_id,
        parent_accounts!inner(id, email, full_name, user_id)
      `)
      .eq("approved", true);

    if (linksError) {
      console.error("Parent links fetch error:", linksError);
      throw new Error("Failed to fetch parent-student links");
    }

    console.log(`Found ${parentLinks?.length || 0} approved parent-student links`);

    if (!parentLinks || parentLinks.length === 0) {
      console.log("No approved parent-student links found");
      return new Response(
        JSON.stringify({ success: true, message: "No parents to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get unique student IDs
    const studentIds = [...new Set(parentLinks.map(link => link.student_id))];
    console.log(`Step 2: Found ${studentIds.length} unique students with linked parents`);

    // Step 3: Find students enrolled in classrooms taught by teachers in the target district
    console.log("Step 3: Finding classrooms in district:", alert.district_id);
    
    // Get students from classroom_students
    const { data: classroomStudents, error: csError } = await supabaseClient
      .from("classroom_students")
      .select("student_id, classroom_id")
      .in("student_id", studentIds);

    if (csError) {
      console.error("Classroom students fetch error:", csError);
      throw new Error("Failed to fetch classroom students");
    }

    console.log(`Found ${classroomStudents?.length || 0} classroom enrollments for linked students`);

    if (!classroomStudents || classroomStudents.length === 0) {
      console.log("No students enrolled in classrooms");
      return new Response(
        JSON.stringify({ success: true, message: "No students in classrooms to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Get classrooms and their teachers
    const classroomIds = [...new Set(classroomStudents.map(cs => cs.classroom_id))];
    console.log(`Step 4: Checking ${classroomIds.length} classrooms for district match...`);

    const { data: classrooms, error: classroomError } = await supabaseClient
      .from("classrooms")
      .select("id, teacher_id")
      .in("id", classroomIds);

    if (classroomError) {
      console.error("Classrooms fetch error:", classroomError);
      throw new Error("Failed to fetch classrooms");
    }

    // Step 5: Get teachers and check their district (and optionally school)
    const teacherIds = [...new Set(classrooms?.map(c => c.teacher_id) || [])];
    console.log(`Step 5: Checking ${teacherIds.length} teachers for district match...`);

    let teacherQuery = supabaseClient
      .from("profiles")
      .select("id, district_id, school_id")
      .in("id", teacherIds)
      .eq("district_id", alert.district_id);

    // If alert has school_id, also filter by school
    if (alert.school_id) {
      teacherQuery = teacherQuery.eq("school_id", alert.school_id);
      console.log(`Filtering by school_id: ${alert.school_id}`);
    }

    const { data: teachersInDistrict, error: teacherError } = await teacherQuery;

    if (teacherError) {
      console.error("Teachers fetch error:", teacherError);
      throw new Error("Failed to fetch teachers");
    }

    console.log(`Found ${teachersInDistrict?.length || 0} teachers in target district/school`);

    if (!teachersInDistrict || teachersInDistrict.length === 0) {
      console.log("No teachers found in target district/school");
      return new Response(
        JSON.stringify({ success: true, message: "No teachers in district to notify parents" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 6: Build set of valid classroom IDs (those with teachers in district)
    const validTeacherIds = new Set(teachersInDistrict.map(t => t.id));
    const validClassroomIds = new Set(
      classrooms?.filter(c => validTeacherIds.has(c.teacher_id)).map(c => c.id) || []
    );
    console.log(`Step 6: ${validClassroomIds.size} classrooms have teachers in district`);

    // Step 7: Find students in valid classrooms
    const validStudentIds = new Set(
      classroomStudents
        .filter(cs => validClassroomIds.has(cs.classroom_id))
        .map(cs => cs.student_id)
    );
    console.log(`Step 7: ${validStudentIds.size} students in district classrooms`);

    // Step 8: Get parents of valid students
    const parentMap = new Map<string, ParentInfo>();
    
    for (const link of parentLinks) {
      if (validStudentIds.has(link.student_id)) {
        const parentAccount = link.parent_accounts as any;
        // Use parent's user_id as key to dedupe
        if (parentAccount && parentAccount.user_id && !parentMap.has(parentAccount.user_id)) {
          parentMap.set(parentAccount.user_id, {
            email: parentAccount.email,
            full_name: parentAccount.full_name,
            user_id: parentAccount.user_id,
          });
        }
      }
    }

    parents = Array.from(parentMap.values());
    console.log(`Step 8: Found ${parents.length} unique parents to notify`);

    if (parents.length === 0) {
      console.log("No parents found for students in this district/school");
      return new Response(
        JSON.stringify({ success: true, message: "No parents to notify in this district" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log parent emails (masked for privacy)
    console.log("Parents to notify:", parents.map(p => ({
      email: p.email.replace(/^(.{2}).*(@.*)$/, "$1***$2"),
      user_id: p.user_id.substring(0, 8) + "..."
    })));

    // Send email notifications using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailsSent = 0;
    let emailsFailed = 0;
    
    if (resendApiKey) {
      console.log("=== SENDING EMAILS ===");
      const emailPromises = parents.map(async (parent) => {
        try {
          const emailBody = {
            from: "ImpressMe Kids <onboarding@resend.dev>",
            to: parent.email,
            subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: ${
                  alert.severity === "critical" ? "#dc2626" :
                  alert.severity === "warning" ? "#ea580c" : "#3b82f6"
                }; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">Safety Alert</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Severity: ${alert.severity.toUpperCase()}</p>
                </div>
                <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                  <h2 style="color: #1f2937; margin-top: 0;">${alert.title}</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${alert.message}</p>
                  ${alert.affects_attendance ? 
                    '<p style="color: #dc2626; font-weight: bold; margin-top: 20px;">⚠️ This alert affects school attendance</p>' 
                    : ''}
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                      This is an automated safety notification from ImpressMe Kids.<br>
                      For questions, please contact your school administration.
                    </p>
                  </div>
                </div>
              </div>
            `,
          };

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify(emailBody),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✓ Email sent to ${parent.email.replace(/^(.{2}).*(@.*)$/, "$1***$2")} - ID: ${result.id}`);
            return { success: true, email: parent.email };
          } else {
            const errorText = await response.text();
            console.error(`✗ Email failed to ${parent.email}: ${response.status} - ${errorText}`);
            return { success: false, email: parent.email, error: errorText };
          }
        } catch (err: any) {
          console.error(`✗ Email exception for ${parent.email}:`, err.message);
          return { success: false, email: parent.email, error: err.message };
        }
      });

      const emailResults = await Promise.allSettled(emailPromises);
      emailsSent = emailResults.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      emailsFailed = parents.length - emailsSent;
      console.log(`Email results: ${emailsSent} sent, ${emailsFailed} failed`);
    } else {
      console.warn("RESEND_API_KEY not configured - skipping email notifications");
    }

    // Send push notifications directly (bypass the other edge function to avoid auth issues)
    console.log("=== SENDING PUSH NOTIFICATIONS ===");
    let pushSent = 0;
    let pushFailed = 0;
    
    // Import web-push configuration
    const VAPID_PUBLIC_KEY = 'BBOQmeU-GndAJbPRu4b5Dt7mmnIjOH3AxacLwY5oznBCrF4JBVzLRkeJr_w_qoDmqu2o3gRlEjjkD7gP9snuJoI';
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

    if (VAPID_PRIVATE_KEY) {
      // Dynamically import web-push
      const webpush = await import("https://esm.sh/web-push@3.6.6");
      
      webpush.default.setVapidDetails(
        'mailto:support@impressmekids.com',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );

      for (const parent of parents) {
        if (!parent.user_id) continue;

        try {
          // Get subscriptions for this parent
          const { data: subscriptions, error: subError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', parent.user_id);

          if (subError) {
            console.error(`Failed to get subscriptions for ${parent.user_id}:`, subError);
            continue;
          }

          if (!subscriptions || subscriptions.length === 0) {
            console.log(`No push subscriptions for parent ${parent.user_id.substring(0, 8)}...`);
            continue;
          }

          console.log(`Found ${subscriptions.length} subscription(s) for parent ${parent.user_id.substring(0, 8)}...`);

          const pushPayload = JSON.stringify({
            title: `🚨 ${alert.severity.toUpperCase()} Safety Alert`,
            body: alert.title,
            icon: '/android-chrome-192x192.png',
            badge: '/favicon-32x32.png',
            tag: `safety-alert-${alertId}`,
            data: {
              type: 'safety_alert',
              alertId: alertId,
              severity: alert.severity,
            },
          });

          for (const subscription of subscriptions) {
            try {
              const subscriptionObject = {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              };

              await webpush.default.sendNotification(subscriptionObject, pushPayload);
              console.log(`✓ Push sent to subscription ${subscription.id.substring(0, 8)}...`);
              pushSent++;
            } catch (pushErr: any) {
              console.error(`✗ Push failed for subscription ${subscription.id}:`, pushErr.message);
              
              // Delete invalid subscriptions
              if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                await supabaseClient
                  .from('push_subscriptions')
                  .delete()
                  .eq('id', subscription.id);
                console.log(`Deleted invalid subscription ${subscription.id}`);
              }
              pushFailed++;
            }
          }
        } catch (parentPushErr: any) {
          console.error(`Push notification error for parent ${parent.user_id}:`, parentPushErr.message);
          pushFailed++;
        }
      }

      console.log(`Push results: ${pushSent} sent, ${pushFailed} failed`);
    } else {
      console.warn("VAPID_PRIVATE_KEY not configured - skipping push notifications");
    }

    console.log("=== SAFETY ALERT PROCESSING COMPLETE ===");
    console.log(`Summary: ${parents.length} parents, ${emailsSent} emails, ${pushSent} push notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alert sent to ${parents.length} parents`,
        details: {
          parentsNotified: parents.length,
          emailsSent,
          emailsFailed,
          pushSent,
          pushFailed,
          districtId: alert.district_id,
          schoolId: alert.school_id || null,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("=== SAFETY ALERT ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
