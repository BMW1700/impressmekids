import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PhonemeReportRequest {
  studentId: string;
  parentId: string;
  classroomId: string;
  phonemeData: { symbol: string; label: string; score: number | null }[];
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-phoneme-report function");

    // Get auth token from request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { studentId, parentId, classroomId, phonemeData, message }: PhonemeReportRequest = await req.json();
    console.log("Request data:", { studentId, parentId, classroomId, phonemeCount: phonemeData.length });

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (teacherError) {
      console.error("Teacher fetch error:", teacherError);
      throw new Error("Failed to fetch teacher info");
    }

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", studentId)
      .single();

    if (studentError) {
      console.error("Student fetch error:", studentError);
      throw new Error("Failed to fetch student info");
    }

    // Get classroom info
    const { data: classroom, error: classroomError } = await supabase
      .from("classrooms")
      .select("name")
      .eq("id", classroomId)
      .single();

    if (classroomError) {
      console.error("Classroom fetch error:", classroomError);
      throw new Error("Failed to fetch classroom info");
    }

    // Get parent info
    const { data: parent, error: parentError } = await supabase
      .from("parent_accounts")
      .select("email, full_name")
      .eq("id", parentId)
      .single();

    if (parentError || !parent) {
      console.error("Parent fetch error:", parentError);
      throw new Error("Failed to fetch parent info");
    }

    console.log("Fetched all info:", { 
      teacher: teacher.full_name, 
      student: student.full_name, 
      classroom: classroom.name,
      parentEmail: parent.email 
    });

    // Store the report in the database
    const { data: reportData, error: insertError } = await supabase
      .from("parent_phoneme_reports")
      .insert({
        teacher_id: user.id,
        student_id: studentId,
        parent_id: parentId,
        classroom_id: classroomId,
        phoneme_data: phonemeData,
        message: message || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save report");
    }

    // Create a notification for the parent dashboard
    const { error: notifyError } = await supabase
      .from("parent_notifications")
      .insert({
        parent_id: parentId,
        child_id: studentId,
        item_type: "phoneme_report",
        item_id: reportData.id,
        item_title: `Sound Accuracy Report from ${teacher.full_name}`,
        item_description: message || `New phoneme report for ${student.full_name} covering ${phonemeData.length} sounds`,
        classroom_name: classroom.name,
        read: false,
      });

    if (notifyError) {
      console.error("Notification insert error:", notifyError);
      // Don't throw - email is more important, notification is secondary
    } else {
      console.log("Parent notification created successfully");
    }

    // Build phoneme table HTML
    const phonemeRows = phonemeData.map(p => {
      const scoreColor = p.score === null ? '#6b7280' 
        : p.score >= 90 ? '#22c55e' 
        : p.score >= 70 ? '#eab308' 
        : '#ef4444';
      const scoreText = p.score !== null ? `${p.score}%` : 'No data';
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${p.label}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="background-color: ${scoreColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 14px;">${scoreText}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Send email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Phoneme Progress Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">📊 Sound Accuracy Report</h1>
            <p style="color: #6b7280; margin-top: 8px;">Phoneme Progress Update for ${student.full_name}</p>
          </div>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #374151;"><strong>Class:</strong> ${classroom.name}</p>
            <p style="margin: 8px 0 0 0; color: #374151;"><strong>Teacher:</strong> ${teacher.full_name}</p>
          </div>
          
          ${message ? `
            <div style="background-color: #ede9fe; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              <p style="margin: 0; color: #5b21b6; font-style: italic;">"${message}"</p>
              <p style="margin: 8px 0 0 0; color: #7c3aed; font-size: 14px;">— ${teacher.full_name}</p>
            </div>
          ` : ''}
          
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 16px;">Sound Accuracy Scores</h2>
          
          <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background-color: #7c3aed; color: white;">
                <th style="padding: 12px; text-align: left;">Sound</th>
                <th style="padding: 12px; text-align: center;">Score</th>
              </tr>
            </thead>
            <tbody>
              ${phonemeRows}
            </tbody>
          </table>
          
          <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Legend:</strong><br>
              🟢 90%+ = Mastered<br>
              🟡 70-89% = Developing<br>
              🔴 Below 70% = Needs Practice
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px; text-align: center;">
            This report was sent from ImpressMe Kids. Log in to your parent dashboard for more details.
          </p>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", parent.email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ImpressMe Kids <onboarding@resend.dev>",
        to: [parent.email],
        subject: `📊 Sound Accuracy Report for ${student.full_name} - ${classroom.name}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Email send error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-phoneme-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);