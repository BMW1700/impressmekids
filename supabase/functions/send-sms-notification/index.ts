import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  drill_session_id: string;
  message_type: "drill_started" | "student_status" | "all_clear" | "emergency";
  recipient_type?: "parent" | "teacher" | "admin" | "all";
  student_id?: string;
  custom_message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.log("Twilio credentials not configured - SMS disabled");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SMS service not configured",
          message: "Twilio credentials are not set up. SMS notifications are disabled."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: SMSRequest = await req.json();
    const { drill_session_id, message_type, recipient_type = "all", student_id, custom_message } = request;

    // Get drill session details
    const { data: drill } = await supabase
      .from("drill_sessions")
      .select("*, districts(*)")
      .eq("id", drill_session_id)
      .single();

    if (!drill) {
      return new Response(
        JSON.stringify({ success: false, error: "Drill session not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const schoolName = drill.districts?.name || "Your School";
    const drillType = drill.drill_type.charAt(0).toUpperCase() + drill.drill_type.slice(1);

    // Build message based on type
    let messageTemplate = "";
    switch (message_type) {
      case "drill_started":
        messageTemplate = `🚨 ${drillType} Drill Started at ${schoolName}. Please check the app for your child's status.`;
        break;
      case "student_status":
        messageTemplate = custom_message || `Your child has been marked as accounted for during the ${drillType} drill at ${schoolName}.`;
        break;
      case "all_clear":
        messageTemplate = `✅ All Clear: The ${drillType} drill at ${schoolName} has concluded. All students have been accounted for.`;
        break;
      case "emergency":
        messageTemplate = `⚠️ EMERGENCY: ${custom_message || `An emergency situation is in progress at ${schoolName}. Please check the app for updates.`}`;
        break;
    }

    // Get recipients based on type
    let recipients: { id: string; phone: string; name: string; type: string }[] = [];

    if (recipient_type === "parent" || recipient_type === "all") {
      // Get parents with phone numbers from linked students
      const { data: parentLinks } = await supabase
        .from("parent_student_links")
        .select(`
          parent_id,
          student_id,
          parent_accounts!inner(id, user_id, full_name),
          profiles!parent_student_links_student_id_fkey(id, full_name, phone_number)
        `)
        .eq("approved", true);

      // Get emergency contacts
      const { data: emergencyContacts } = await supabase
        .from("emergency_contacts")
        .select("*");

      if (emergencyContacts) {
        emergencyContacts.forEach((ec) => {
          if (ec.phone_number) {
            recipients.push({
              id: ec.id,
              phone: ec.phone_number,
              name: ec.name,
              type: "emergency_contact",
            });
          }
        });
      }
    }

    // Send SMS via Twilio
    const sentMessages: { phone: string; status: string; sid?: string }[] = [];
    
    for (const recipient of recipients) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append("To", recipient.phone);
        formData.append("From", TWILIO_PHONE_NUMBER);
        formData.append("Body", messageTemplate);

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          // Log successful send
          await supabase.from("sms_notification_logs").insert({
            drill_session_id,
            recipient_id: recipient.id,
            recipient_type: recipient.type as "parent" | "teacher" | "admin" | "emergency_contact",
            phone_number: recipient.phone,
            message_type,
            message_content: messageTemplate,
            twilio_sid: result.sid,
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          sentMessages.push({ phone: recipient.phone, status: "sent", sid: result.sid });
        } else {
          // Log failed send
          await supabase.from("sms_notification_logs").insert({
            drill_session_id,
            recipient_id: recipient.id,
            recipient_type: recipient.type as "parent" | "teacher" | "admin" | "emergency_contact",
            phone_number: recipient.phone,
            message_type,
            message_content: messageTemplate,
            status: "failed",
            error_message: result.message || "Unknown error",
          });

          sentMessages.push({ phone: recipient.phone, status: "failed" });
        }
      } catch (error) {
        console.error(`Error sending SMS to ${recipient.phone}:`, error);
        sentMessages.push({ phone: recipient.phone, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_recipients: recipients.length,
        sent: sentMessages.filter((m) => m.status === "sent").length,
        failed: sentMessages.filter((m) => m.status !== "sent").length,
        details: sentMessages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-sms-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
