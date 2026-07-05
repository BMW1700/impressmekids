import { sendEmail } from "../_shared/resendClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const to = "Matthew.ross433@gmail.com";
    const result = await sendEmail({
      from: "YubiLearn Test <noreply@yubilearn.com>",
      to,
      subject: "YubiLearn Resend Test ✅",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">Resend Test Successful 🎉</h1>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            This is a test email sent from the YubiLearn platform via the Resend integration.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you're reading this, your Resend API key is working correctly and emails
            are flowing through the hardened <code>resendClient.ts</code> wrapper
            (token-bucket throttle + retry + failure logging).
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
      text: "Resend Test Successful. Your YubiLearn Resend integration is working.",
      functionName: "send-test-email",
      payloadSummary: { test: true, triggered_by: "manual" },
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.success ? 200 : 500,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
