import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Fetch alert details including district_id for scoping
    const { data: alert, error: alertError } = await supabaseClient
      .from("safety_alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      console.error("Alert fetch error:", alertError);
      throw new Error("Alert not found");
    }

    console.log("Processing alert:", alertId, "for district:", alert.district_id);

    let parents: { email: string; full_name: string; user_id: string }[] = [];

    if (alert.district_id) {
      // Fetch parents whose children are in classrooms within this district
      // Join: parent_accounts -> parent_student_links -> profiles (students) -> classroom_students -> classrooms -> profiles (teachers with district)
      const { data: scopedParents, error: parentsError } = await supabaseClient
        .from("parent_accounts")
        .select(`
          email, 
          full_name,
          user_id,
          parent_student_links!inner(
            student_id,
            approved
          )
        `)
        .eq("parent_student_links.approved", true);

      if (parentsError) {
        console.error("Parent fetch error:", parentsError);
        throw new Error("Failed to fetch parent contacts");
      }

      // Now filter parents whose students are in classrooms with teachers in this district
      const parentUserIds = scopedParents?.map(p => p.user_id) || [];
      const studentIds = scopedParents?.flatMap(p => 
        p.parent_student_links?.map((link: any) => link.student_id) || []
      ) || [];

      if (studentIds.length > 0) {
        // Get classrooms these students are in
        const { data: studentClassrooms } = await supabaseClient
          .from("classroom_students")
          .select("student_id, classroom_id")
          .in("student_id", studentIds);

        // Get teachers of these classrooms who are in the alert's district
        const classroomIds = [...new Set(studentClassrooms?.map(sc => sc.classroom_id) || [])];
        
        if (classroomIds.length > 0) {
          const { data: classroomsInDistrict } = await supabaseClient
            .from("classrooms")
            .select("id, teacher_id, profiles!inner(district_id)")
            .in("id", classroomIds)
            .eq("profiles.district_id", alert.district_id);

          const validClassroomIds = new Set(classroomsInDistrict?.map(c => c.id) || []);
          
          // Find students in valid classrooms
          const validStudentIds = new Set(
            studentClassrooms
              ?.filter(sc => validClassroomIds.has(sc.classroom_id))
              .map(sc => sc.student_id) || []
          );

          // Filter parents to only those with children in this district's classrooms
          parents = (scopedParents || [])
            .filter(p => 
              p.parent_student_links?.some((link: any) => validStudentIds.has(link.student_id))
            )
            .map(p => ({ email: p.email, full_name: p.full_name, user_id: p.user_id }));
        }
      }

      console.log(`Found ${parents.length} parents in district ${alert.district_id}`);
    } else {
      // No district specified - this is a system-wide alert (should be rare)
      console.warn("No district_id on alert - sending to all parents (not recommended)");
      const { data: allParents, error: parentsError } = await supabaseClient
        .from("parent_accounts")
        .select("email, full_name, user_id");

      if (parentsError) {
        throw new Error("Failed to fetch parent contacts");
      }
      parents = allParents || [];
    }

    // Send email notifications using Resend (if configured)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey && parents && parents.length > 0) {
      console.log(`Sending emails to ${parents.length} parents`);
      const emailPromises = parents.map(async (parent) => {
        const emailBody = {
          from: "ImpressMe Kids <onboarding@resend.dev>",
          to: parent.email,
          subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <div style="background-color: ${
                 alert.severity === "critical" ? "#dc2626" :
                 alert.severity === "warning" ? "#ea580c" :
                 alert.severity === "info" ? "#3b82f6" : "#3b82f6"
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

        if (!response.ok) {
          console.error(`Failed to send email to ${parent.email}`);
        }

        return response.ok;
      });

      await Promise.allSettled(emailPromises);
    }

    // Log the alert distribution
    console.log(`Safety alert ${alertId} distributed to ${parents?.length || 0} parents`);

    // Send push notifications to scoped parents
    if (parents && parents.length > 0) {
      console.log(`Sending push notifications to ${parents.length} parents`);
      for (const parent of parents) {
        if (parent.user_id) {
          try {
            await supabaseClient.functions.invoke('send-push-notification', {
              body: {
                userId: parent.user_id,
                title: `🚨 ${alert.severity.toUpperCase()} Safety Alert`,
                body: alert.title,
                icon: '/android-chrome-192x192.png',
                tag: `safety-alert-${alertId}`,
                data: {
                  type: 'safety_alert',
                  alertId: alertId,
                  severity: alert.severity,
                },
              },
            });
          } catch (pushError) {
            console.error(`Failed to send push notification to ${parent.email}:`, pushError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alert sent to ${parents?.length || 0} parents`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending safety alert:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
