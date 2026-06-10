import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from '../_shared/cors.ts';
import { sendBulkEmails } from '../_shared/resendClient.ts';

interface UserInfo {
  email: string;
  full_name: string;
  user_id: string;
  role?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AuthN/AuthZ: only admins may broadcast safety alerts ---
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: authData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      school_id: alert.school_id || "ALL SCHOOLS IN DISTRICT",
    });

    if (!alert.district_id) {
      console.error("CRITICAL: Alert has no district_id - cannot scope notifications!");
      throw new Error("Alert must have a district_id to send notifications");
    }

    const usersToNotify: UserInfo[] = [];
    const userMap = new Map<string, UserInfo>();

    // ============================================
    // STEP 1: Get all staff/students from profiles table in the district/school
    // ============================================
    console.log("Step 1: Fetching all users (teachers, admins, students) in district...");
    
    let profilesQuery = supabaseClient
      .from("profiles")
      .select("id, email, full_name, role, district_id, school_id")
      .eq("district_id", alert.district_id);

    // If a specific school is selected, filter by school_id
    if (alert.school_id) {
      profilesQuery = profilesQuery.eq("school_id", alert.school_id);
      console.log(`Filtering by specific school: ${alert.school_id}`);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
      throw new Error("Failed to fetch profiles");
    }

    console.log(`Found ${profiles?.length || 0} users in district/school`);

    // Add all users from profiles to the notification list
    for (const profile of profiles || []) {
      if (profile.id && profile.email && !userMap.has(profile.id)) {
        userMap.set(profile.id, {
          email: profile.email,
          full_name: profile.full_name || profile.email,
          user_id: profile.id,
          role: profile.role,
        });
      }
    }

    console.log(`Added ${userMap.size} staff/students to notification list`);

    // ============================================
    // STEP 2: Get all parents with students in the district/school
    // ============================================
    console.log("Step 2: Fetching parents with students in district...");

    // Get all student IDs from the profiles we just fetched (students only)
    const studentIds = (profiles || [])
      .filter(p => p.role === 'student')
      .map(p => p.id);

    console.log(`Found ${studentIds.length} students in district/school`);

    if (studentIds.length > 0) {
      // Get parent-student links for these students
      const { data: parentLinks, error: linksError } = await supabaseClient
        .from("parent_student_links")
        .select(`
          parent_id,
          student_id,
          parent_accounts!inner(id, email, full_name, user_id)
        `)
        .eq("approved", true)
        .in("student_id", studentIds);

      if (linksError) {
        console.error("Parent links fetch error:", linksError);
        // Continue without parents rather than failing completely
      } else {
        console.log(`Found ${parentLinks?.length || 0} approved parent-student links`);

        // Add parents to the notification list
        for (const link of parentLinks || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parentAccount = (link.parent_accounts as any);
          if (parentAccount && parentAccount.user_id && !userMap.has(parentAccount.user_id)) {
            userMap.set(parentAccount.user_id, {
              email: parentAccount.email,
              full_name: parentAccount.full_name,
              user_id: parentAccount.user_id,
              role: 'parent',
            });
          }
        }

        console.log(`Total users after adding parents: ${userMap.size}`);
      }
    }

    // Convert map to array
    const allUsers = Array.from(userMap.values());

    if (allUsers.length === 0) {
      console.log("No users found in this district/school to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No users to notify in this district/school" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log summary by role
    const roleBreakdown = allUsers.reduce((acc, user) => {
      const role = user.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log("Users to notify by role:", roleBreakdown);

    // Log user emails (masked for privacy)
    console.log("Sample users to notify:", allUsers.slice(0, 5).map(u => ({
      email: u.email.replace(/^(.{2}).*(@.*)$/, "$1***$2"),
      role: u.role,
      user_id: u.user_id.substring(0, 8) + "..."
    })));

    // ============================================
    // STEP 3: Send email notifications via shared bulk-batched Resend client
    // ============================================
    let emailsSent = 0;
    let emailsFailed = 0;

    const severityBg =
      alert.severity === "critical" ? "#dc2626" :
      alert.severity === "warning" ? "#ea580c" : "#3b82f6";

    const sharedHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityBg}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
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
              This is an automated safety notification from NabuLearn.<br>
              For questions, please contact your school administration.
            </p>
          </div>
        </div>
      </div>
    `;

    console.log("=== SENDING EMAILS (bulk-batched) ===");
    const bulkResult = await sendBulkEmails({
      from: "NabuLearn Safety <safety@nabulearn.com>",
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      html: sharedHtml,
      recipients: allUsers.map((u) => ({ to: u.email })),
      functionName: "send-safety-alert",
      payloadSummary: { alertId, severity: alert.severity, district_id: alert.district_id },
    });
    emailsSent = bulkResult.sent;
    emailsFailed = bulkResult.failed;
    console.log(
      `Email results: ${emailsSent}/${bulkResult.totalRecipients} sent across ${bulkResult.batches} batch(es), ${emailsFailed} failed`,
    );

    // ============================================
    // STEP 4: Send push notifications
    // ============================================
    console.log("=== SENDING PUSH NOTIFICATIONS ===");
    let pushSent = 0;
    let pushFailed = 0;
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (SUPABASE_URL) {
      for (const user of allUsers) {
        if (!user.user_id) continue;

        try {
          // Call the send-push-notification edge function using service role for server-to-server
          const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              userId: user.user_id,
              title: `${alert.severity === 'critical' ? '🚨 CRITICAL' : alert.severity === 'warning' ? '⚠️ Warning' : 'ℹ️'} Safety Alert`,
              body: alert.title,
              icon: '/android-chrome-192x192.png',
              badge: '/favicon-32x32.png',
              tag: `safety-alert-${alertId}`,
              data: {
                type: 'safety_alert',
                alertId,
                severity: alert.severity,
              },
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✓ Push notification sent for ${user.role} ${user.user_id.substring(0, 8)}... - ${result.successCount || 0} subscriptions`);
            pushSent++;
          } else {
            const errorText = await response.text();
            console.error(`✗ Push failed for ${user.role} ${user.user_id.substring(0, 8)}...: ${response.status} - ${errorText}`);
            pushFailed++;
          }
        } catch (pushErr: unknown) {
          const error = pushErr as Error;
          console.error(`Push notification error for ${user.user_id}:`, error.message);
          pushFailed++;
        }
      }

      console.log(`Push results: ${pushSent} sent, ${pushFailed} failed`);
    } else {
      console.warn("SUPABASE_URL not configured - skipping push notifications");
    }

    console.log("=== SAFETY ALERT PROCESSING COMPLETE ===");
    console.log(`Summary: ${allUsers.length} users (${JSON.stringify(roleBreakdown)}), ${emailsSent} emails, ${pushSent} push notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alert sent to ${allUsers.length} users`,
        details: {
          usersNotified: allUsers.length,
          breakdown: roleBreakdown,
          emailsSent,
          emailsFailed,
          pushSent,
          pushFailed,
          schoolScope: alert.school_id ? 'specific school' : 'all schools in district',
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in send-safety-alert:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
