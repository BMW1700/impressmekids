import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the caller
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Create a client with the user's JWT to get their identity
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Authentication failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Create service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { emergencyType, title, description, classroomId } = await req.json();

    // Use the authenticated user's ID as the teacherId - don't trust client-provided teacherId
    const teacherId = user.id;

    if (!emergencyType || !description || !classroomId) {
      throw new Error("Missing required fields: emergencyType, description, classroomId");
    }

    // Verify the caller is the teacher of this classroom and get classroom details
    const { data: classroomData, error: classroomCheckError } = await supabaseClient
      .from("classrooms")
      .select("id, teacher_id, name, location")
      .eq("id", classroomId)
      .eq("teacher_id", teacherId)
      .single();

    if (classroomCheckError || !classroomData) {
      console.error("Authorization failed: User is not the teacher of this classroom");
      return new Response(
        JSON.stringify({ success: false, error: "You are not authorized to report emergencies for this classroom" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    console.log(`Emergency report received: ${emergencyType} from teacher ${teacherId} in classroom ${classroomId}`);

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabaseClient
      .from("profiles")
      .select("full_name, email, district_id")
      .eq("id", teacherId)
      .single();

    if (teacherError || !teacher) {
      console.error("Failed to fetch teacher info:", teacherError);
      throw new Error("Failed to fetch teacher information");
    }

    const roomNumber = classroomData.location || classroomData.name || "Unknown Location";

    // Get district admins for this teacher's district
    let adminEmails: string[] = [];
    
    if (teacher.district_id) {
      // First get admins from district_admins table
      const { data: districtAdmins } = await supabaseClient
        .from("district_admins")
        .select("email, full_name")
        .eq("district_name", teacher.district_id);

      if (districtAdmins && districtAdmins.length > 0) {
        adminEmails = districtAdmins.map(a => a.email);
      }

      // Also get admins from profiles with admin role in same district
      const { data: adminProfiles } = await supabaseClient
        .from("profiles")
        .select("email, full_name, id")
        .eq("district_id", teacher.district_id)
        .eq("role", "admin");

      if (adminProfiles && adminProfiles.length > 0) {
        adminEmails = [...new Set([...adminEmails, ...adminProfiles.map(a => a.email)])];
      }
    }

    // Fallback: get all admins if no district-specific admins found
    if (adminEmails.length === 0) {
      const { data: allAdmins } = await supabaseClient
        .from("profiles")
        .select("email, full_name")
        .eq("role", "admin");

      if (allAdmins && allAdmins.length > 0) {
        adminEmails = allAdmins.map(a => a.email);
      }
    }

    console.log(`Found ${adminEmails.length} admin(s) to notify`);

    // Format emergency type for display
    const emergencyTypeDisplay = emergencyType === "other" ? (title || "Other Emergency") : emergencyType;

    // Send email notifications using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey && adminEmails.length > 0) {
      const emailPromises = adminEmails.map(async (adminEmail) => {
        const emailBody = {
          from: "NabuLearn Emergencies <emergencies@nabulearn.com>",
          to: adminEmail,
          subject: `🚨 EMERGENCY REPORT: ${emergencyTypeDisplay}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">🚨 Emergency Report</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Immediate Attention Required</p>
              </div>
              <div style="background-color: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #dc2626;">
                <h2 style="color: #991b1b; margin-top: 0;">${emergencyTypeDisplay}</h2>
                
                <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                    <strong>Description:</strong><br/>
                    ${description}
                  </p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="background-color: white; padding: 15px; border-radius: 8px;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Reported By</p>
                    <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0;">${teacher.full_name}</p>
                  </div>
                  <div style="background-color: white; padding: 15px; border-radius: 8px;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Room / Location</p>
                    <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0;">${roomNumber}</p>
                  </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                  <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: bold;">
                    ⚠️ This report was submitted at ${new Date().toLocaleString()}
                  </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    This is an automated emergency notification from NabuLearn.
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
          console.error(`Failed to send email to ${adminEmail}`);
        }

        return response.ok;
      });

      await Promise.allSettled(emailPromises);
    }

    // Send push notifications to admins
    if (teacher.district_id) {
      const { data: adminProfiles } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("district_id", teacher.district_id)
        .eq("role", "admin");

      if (adminProfiles && adminProfiles.length > 0) {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        for (const admin of adminProfiles) {
          try {
            // Use direct fetch with service role key for server-to-server calls
            const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                userId: admin.id,
                title: `🚨 EMERGENCY: ${emergencyTypeDisplay}`,
                body: `${teacher.full_name} reported from ${roomNumber}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
                icon: '/android-chrome-192x192.png',
                tag: `emergency-report-${Date.now()}`,
                data: {
                  type: 'emergency_report',
                  emergencyType,
                  classroomId,
                  teacherId,
                },
              }),
            });
            
            if (!response.ok) {
              console.error(`Push notification failed for admin ${admin.id}: ${response.status}`);
            }
          } catch (pushError) {
            console.error(`Failed to send push notification to admin ${admin.id}:`, pushError);
          }
        }
      }
    }

    console.log(`Emergency report sent to ${adminEmails.length} admin(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emergency reported to ${adminEmails.length} administrator(s)`,
        adminsNotified: adminEmails.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error reporting emergency:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
