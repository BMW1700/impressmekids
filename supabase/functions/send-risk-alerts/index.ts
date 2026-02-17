import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { corsHeaders } from '../_shared/cors.ts';

interface RiskAlert {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherEmail: string;
  teacherName: string;
  riskScore: number;
  riskLevel: "urgent" | "monitor";
  factors: string[];
  recommendations: string[];
  classroomId: string;
  classroomName: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization header exists
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client for auth user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    // Verify the calling user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for role checks and database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if caller is a teacher or admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'teacher']);

    if (!roleData || roleData.length === 0) {
      console.warn(`Unauthorized risk alert attempt by user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - teacher or admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { alerts, sendToParents = false } = await req.json() as { 
      alerts: RiskAlert[]; 
      sendToParents?: boolean;
    };

    if (!Array.isArray(alerts) || alerts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No alerts provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the teacher is authorized to send alerts for these students
    for (const alert of alerts) {
      // Check if the calling user is the teacher of the classroom
      const { data: classroom } = await supabaseAdmin
        .from('classrooms')
        .select('teacher_id')
        .eq('id', alert.classroomId)
        .single();

      const isAdmin = roleData.some(r => r.role === 'admin');
      const isClassroomTeacher = classroom?.teacher_id === user.id;

      if (!isAdmin && !isClassroomTeacher) {
        console.warn(`User ${user.id} not authorized for classroom ${alert.classroomId}`);
        return new Response(
          JSON.stringify({ error: 'Forbidden - not authorized for this classroom' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`User ${user.id} sending ${alerts.length} risk alerts`);

    const results = [];

    for (const alert of alerts) {
      // Send teacher email
      const teacherEmailResult = await sendTeacherEmail(alert, resend);
      results.push(teacherEmailResult);

      // Log notification in database
      await supabaseAdmin.from("risk_alert_notifications").insert({
        student_id: alert.studentId,
        teacher_id: alert.teacherId,
        notification_type: alert.riskLevel === "urgent" ? "urgent_teacher" : "monitor_teacher",
        risk_score: alert.riskScore,
        email_status: teacherEmailResult.success ? "sent" : "failed",
      });

      // Record risk history
      await supabaseAdmin.from("student_risk_history").insert({
        student_id: alert.studentId,
        classroom_id: alert.classroomId,
        risk_score: alert.riskScore,
        risk_level: alert.riskLevel,
        factors: alert.factors,
      });

      // Send parent email if requested
      if (sendToParents) {
        const { data: parentLinks } = await supabaseAdmin
          .from("parent_student_links")
          .select(`
            parent_id,
            parent_accounts!inner(user_id, email, full_name)
          `)
          .eq("student_id", alert.studentId)
          .eq("approved", true);

        if (parentLinks && parentLinks.length > 0) {
          for (const link of parentLinks) {
            const parentEmail = (link as any).parent_accounts.email;
            const parentName = (link as any).parent_accounts.full_name;
            const parentId = (link as any).parent_accounts.id;
            const parentUserId = (link as any).parent_accounts.user_id;

            const parentEmailResult = await sendParentEmail(
              alert,
              parentEmail,
              parentName,
              resend
            );
            results.push(parentEmailResult);

            await supabaseAdmin.from("risk_alert_notifications").insert({
              student_id: alert.studentId,
              teacher_id: alert.teacherId,
              parent_id: parentId,
              notification_type: "parent_alert",
              risk_score: alert.riskScore,
              email_status: parentEmailResult.success ? "sent" : "failed",
            });

            // Send push notification (service-to-service, uses admin client)
            try {
              const { data: subscriptions } = await supabaseAdmin
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', parentUserId);

              if (subscriptions && subscriptions.length > 0) {
                console.log(`Would send push notification to parent ${parentUserId}`);
              }
            } catch (pushError) {
              console.error(`Failed to send push notification to parent ${parentEmail}:`, pushError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        count: results.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-risk-alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

async function sendTeacherEmail(alert: RiskAlert, resend: any) {
  const urgencyIcon = alert.riskLevel === "urgent" ? "🔴" : "🟡";
  const urgencyText = alert.riskLevel === "urgent" ? "URGENT" : "MONITOR";
  
  try {
    await resend.emails.send({
      from: "ImpressMe Kids Alerts <alerts@impressmekids.com>",
      to: [alert.teacherEmail],
      subject: `${urgencyIcon} ${urgencyText}: ${alert.studentName} needs attention (Risk Score: ${alert.riskScore})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${alert.riskLevel === "urgent" ? "#dc2626" : "#f59e0b"};">
            ${urgencyIcon} Student At-Risk Alert
          </h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Student: ${alert.studentName}</h3>
            <p><strong>Classroom:</strong> ${alert.classroomName}</p>
            <p><strong>Risk Score:</strong> ${alert.riskScore}/100</p>
            <p><strong>Risk Level:</strong> ${urgencyText}</p>
          </div>

          <h3>Risk Factors Identified:</h3>
          <ul>
            ${alert.factors.map(factor => `<li>${factor}</li>`).join("")}
          </ul>

          <h3>Recommended Actions:</h3>
          <ol>
            ${alert.recommendations.map(rec => `<li style="color: #2563eb;">${rec}</li>`).join("")}
          </ol>

          <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-left: 4px solid #2563eb;">
            <p style="margin: 0;">
              <strong>💡 Tip:</strong> Early intervention can prevent long-term struggles. 
              View detailed analytics in the ImpressMe Kids dashboard.
            </p>
          </div>

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            This alert was generated by ImpressMe Kids predictive analytics system.
          </p>
        </div>
      `,
    });

    return { success: true, recipient: alert.teacherEmail };
  } catch (error: any) {
    console.error(`Failed to send teacher email to ${alert.teacherEmail}:`, error);
    return { success: false, recipient: alert.teacherEmail, error: error.message };
  }
}

async function sendParentEmail(
  alert: RiskAlert,
  parentEmail: string,
  parentName: string,
  resend: any
) {
  try {
    await resend.emails.send({
      from: "ImpressMe Kids Alerts <alerts@impressmekids.com>",
      to: [parentEmail],
      subject: `📚 ${alert.studentName} needs extra practice this week`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Hi ${parentName},</h2>
          
          <p>
            We wanted to let you know that <strong>${alert.studentName}</strong> would benefit 
            from some extra practice this week in ${alert.classroomName}.
          </p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">How You Can Help:</h3>
            <ul style="color: #1e3a8a;">
              ${alert.recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join("")}
            </ul>
          </div>

          <p>
            Your support at home makes a huge difference! Even 10-15 minutes of practice 
            each day can help ${alert.studentName} build confidence and master these skills.
          </p>

          <p style="margin-top: 30px;">
            If you have any questions, please reach out to ${alert.teacherName}.
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This message was sent by ${alert.teacherName} via ImpressMe Kids.
          </p>
        </div>
      `,
    });

    return { success: true, recipient: parentEmail };
  } catch (error: any) {
    console.error(`Failed to send parent email to ${parentEmail}:`, error);
    return { success: false, recipient: parentEmail, error: error.message };
  }
}
