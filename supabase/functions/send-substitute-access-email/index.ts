import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { corsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SubstituteAccessEmailRequest {
  substituteName: string;
  substituteEmail: string;
  accessCode: string;
  classroomName: string;
  teacherName: string;
  accessEnd: string;
  appUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      substituteName, 
      substituteEmail, 
      accessCode, 
      classroomName, 
      teacherName,
      accessEnd,
      appUrl
    }: SubstituteAccessEmailRequest = await req.json();

    // Validate required fields
    if (!substituteName || !substituteEmail || !accessCode || !classroomName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format the access end date
    const endDate = new Date(accessEnd);
    const formattedEndDate = endDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedEndTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const loginUrl = appUrl || Deno.env.get("APP_URL") || "https://impressmekids.com";

    const emailResponse = await resend.emails.send({
      from: "ImpressMe Kids <noreply@impressmekids.com>",
      to: [substituteEmail],
      subject: `Substitute Access Code for ${classroomName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Substitute Teacher Access</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        🎓 Substitute Teacher Access
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Hello <strong>${substituteName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                        ${teacherName || 'A teacher'} has granted you temporary access to <strong>${classroomName}</strong> on ImpressMe Kids.
                      </p>
                      
                      <!-- Access Code Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                              Your Access Code
                            </p>
                            <p style="margin: 0; color: #78350f; font-size: 36px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 4px;">
                              ${accessCode}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        <strong>Access expires:</strong> ${formattedEndDate} at ${formattedEndTime}
                      </p>
                      
                      <!-- How to Access -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 12px; color: #374151; font-size: 14px; font-weight: 600;">
                              How to access the classroom:
                            </p>
                            <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                              <li>Go to <a href="${loginUrl}/auth" style="color: #7c3aed; text-decoration: none;">${loginUrl}/auth</a></li>
                              <li>Click "I am a Substitute Teacher"</li>
                              <li>Enter your email: <strong>${substituteEmail}</strong></li>
                              <li>Enter the access code above</li>
                            </ol>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${loginUrl}/auth" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                              Access Classroom Now
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                        This is an automated message from ImpressMe Kids.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        If you did not expect this email, please disregard it.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Substitute access email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending substitute access email:", error);
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
