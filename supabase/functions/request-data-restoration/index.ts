import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestorationRequest {
  backup_id: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  tables_requested?: string[];
  school_name?: string;
  contact_email: string;
  contact_phone?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      console.error('User is not admin:', user.id);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: RestorationRequest = await req.json();

    console.log('📋 Processing restoration request:', {
      backup_id: requestData.backup_id,
      user_id: user.id,
      urgency: requestData.urgency,
    });

    // Validate required fields
    if (!requestData.backup_id || !requestData.reason || !requestData.urgency || !requestData.contact_email) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: backup_id, reason, urgency, contact_email' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate reason length
    if (requestData.reason.trim().length < 20) {
      return new Response(JSON.stringify({ 
        error: 'Reason must be at least 20 characters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch backup metadata to include in request
    const { data: backup, error: backupError } = await supabase
      .from('cold_storage_backups')
      .select('backup_name, backup_timestamp, tables_included')
      .eq('id', requestData.backup_id)
      .single();

    if (backupError || !backup) {
      console.error('Backup not found:', backupError);
      return new Response(JSON.stringify({ error: 'Backup not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create restoration request
    const { data: request, error: insertError } = await supabase
      .from('data_restoration_requests')
      .insert({
        backup_id: requestData.backup_id,
        requested_by: user.id,
        backup_name: backup.backup_name,
        backup_timestamp: backup.backup_timestamp,
        reason: requestData.reason,
        urgency: requestData.urgency,
        tables_requested: requestData.tables_requested || backup.tables_included,
        school_name: requestData.school_name,
        contact_email: requestData.contact_email,
        contact_phone: requestData.contact_phone,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating restoration request:', insertError);
      throw insertError;
    }

    console.log('✅ Restoration request created successfully:', {
      request_id: request.id,
      backup_name: backup.backup_name,
      urgency: requestData.urgency,
      contact: requestData.contact_email,
    });

    // TODO: Send email notification to Impress Me Kids support
    // Future enhancement: Integrate with Resend or SendGrid
    console.log('📧 Email notification would be sent to: support@impressmekids.com');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data restoration request submitted successfully',
        request_id: request.id,
        status: 'pending',
        next_steps: 'Our team will review your request within 24-48 hours and contact you at the provided email.',
        contact_info: {
          email: 'support@impressmekids.com',
          expected_response: '24-48 hours',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Request restoration error:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        details: 'An error occurred while processing your restoration request. Please try again or contact support.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
