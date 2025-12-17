import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConsentEmailRequest {
  parentEmail: string;
  parentName: string;
  studentEmail: string;
  consentToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parentEmail, parentName, studentEmail, consentToken }: ConsentEmailRequest = await req.json();

    if (!parentEmail || !parentName || !studentEmail || !consentToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Construct verification URL using APP_URL for the frontend domain
    const verificationUrl = `${Deno.env.get("APP_URL") || "https://impressmekids.com"}/consent/${consentToken}`;

    const emailResponse = await resend.emails.send({
      from: "ImpressMe Kids <onboarding@resend.dev>",
      to: [parentEmail],
      subject: "Parental Consent Required - ImpressMe Kids",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">🛡️ Parental Consent Required</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Dear ${parentName},</p>
              
              <p style="font-size: 14px; line-height: 1.8;">
                A student account is being created on <strong>ImpressMe Kids</strong> using the email address 
                <strong>${studentEmail}</strong>.
              </p>
              
              <p style="font-size: 14px; line-height: 1.8;">
                Because the student indicated they are under 13 years old, we need your consent as the parent or 
                legal guardian to comply with the Children's Online Privacy Protection Act (COPPA).
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #667eea;">What We Collect:</h3>
                <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px;">
                  <li>Student's name and email address</li>
                  <li>Assignment submissions and grades</li>
                  <li>Reading analytics and progress data</li>
                  <li>Educational activity data</li>
                </ul>
                
                <h3 style="color: #667eea;">How It's Used:</h3>
                <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px;">
                  <li>Provide educational services and personalized learning</li>
                  <li>Track student progress and performance</li>
                  <li>Communicate with teachers and parents</li>
                </ul>
                
                <h3 style="color: #667eea;">Your Rights:</h3>
                <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px;">
                  <li>Review your child's information at any time</li>
                  <li>Request deletion of your child's data</li>
                  <li>Revoke consent at any time</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block; 
                          font-weight: bold;
                          font-size: 16px;">
                  ✓ Verify Consent
                </a>
              </div>
              
              <p style="font-size: 13px; color: #666; text-align: center; margin-top: 20px;">
                This link expires in 48 hours.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 13px; color: #666; text-align: center;">
                If you did not request this, please ignore this email or contact 
                <a href="mailto:support@impressmekids.com" style="color: #667eea;">support@impressmekids.com</a>
              </p>
              
              <p style="font-size: 13px; color: #666; text-align: center; margin-top: 20px;">
                <strong>ImpressMe Kids</strong><br>
                Empowering Students Through AI-Powered Learning
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Parental consent email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-parent-consent-email function:", error);
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
