import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY BLOCK: Direct restoration has been disabled
  console.log('🚫 Direct restoration blocked - redirecting to request system');
  
  // Log the blocked attempt
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        // Log the blocked attempt to backup_audit_log
        await supabase.from('backup_audit_log').insert({
          action_type: 'RESTORE_BACKUP_BLOCKED',
          performed_by: user.id,
          status: 'blocked',
          error_message: 'Direct restoration has been disabled for security. Use Request Restoration instead.',
          action_details: {
            timestamp: new Date().toISOString(),
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error logging blocked attempt:', error);
  }

  return new Response(
    JSON.stringify({
      error: 'Direct backup restoration has been disabled for security',
      message: 'For the security of your student data, direct backup viewing and restoration is no longer available. Please submit a restoration request through the admin dashboard.',
      action_required: 'Use the "Request Restoration" button in the Backup Management section',
      support_email: 'support@impressmekids.com',
      next_steps: [
        '1. Click "Request Restoration" button next to the backup',
        '2. Fill out the restoration request form with reason and contact info',
        '3. Our team will review your request within 24-48 hours',
        '4. We will contact you at your provided email to complete the restoration'
      ],
    }),
    { 
      status: 403, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
