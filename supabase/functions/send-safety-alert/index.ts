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

    // Fetch alert details
    const { data: alert, error: alertError } = await supabaseClient
      .from("safety_alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      throw new Error("Alert not found");
    }

    // Fetch all parent emails
    const { data: parents, error: parentsError } = await supabaseClient
      .from("parent_accounts")
      .select("email, full_name");

    if (parentsError) {
      throw new Error("Failed to fetch parent contacts");
    }

    // Send email notifications using Resend (if configured)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey && parents && parents.length > 0) {
      const emailPromises = parents.map(async (parent) => {
        const emailBody = {
          from: "safety@impressmekids.com",
          to: parent.email,
          subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: ${
                alert.severity === "critical" ? "#dc2626" : 
                alert.severity === "high" ? "#ea580c" : 
                alert.severity === "medium" ? "#ca8a04" : "#3b82f6"
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

    // Send push notifications to all parents
    if (parents && parents.length > 0) {
      for (const parent of parents) {
        // Get parent user_id from parent_accounts
        const { data: parentAccount } = await supabaseClient
          .from("parent_accounts")
          .select("user_id")
          .eq("email", parent.email)
          .single();

        if (parentAccount?.user_id) {
          try {
            await supabaseClient.functions.invoke('send-push-notification', {
              body: {
                userId: parentAccount.user_id,
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
