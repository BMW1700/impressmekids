import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

import { corsHeaders } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/resendClient.ts';

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

    // Get admin details for the email
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const adminName = adminProfile?.full_name || 'Unknown Admin';
    const adminEmail = adminProfile?.email || 'Unknown';

    // Format urgency with color coding for email
    const urgencyColors = {
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#F59E0B',
      low: '#10B981'
    };

    const urgencyColor = urgencyColors[requestData.urgency];

    // Send email notification via bulletproof shared client
    try {
      const emailResult = await sendEmail({
        from: 'NabuLearn Backups <backups@nabulearn.com>',
        to: 'admin@nabulearn.com',
        subject: `🚨 Data Restoration Request - ${requestData.urgency.toUpperCase()} Priority`,
        functionName: 'request-data-restoration',
        payloadSummary: { request_id: request.id, urgency: requestData.urgency },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1F2937;">🔄 Data Restoration Request Received</h2>
            
            <div style="background-color: ${urgencyColor}; color: white; padding: 12px; border-radius: 6px; margin: 16px 0;">
              <strong>Urgency Level: ${requestData.urgency.toUpperCase()}</strong>
            </div>

            <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0;">Request Details</h3>
              <p><strong>Request ID:</strong> ${request.id}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Backup Name:</strong> ${backup.backup_name}</p>
              <p><strong>Backup Date:</strong> ${new Date(backup.backup_timestamp).toLocaleString()}</p>
            </div>

            <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0;">Requester Information</h3>
              <p><strong>Admin Name:</strong> ${adminName}</p>
              <p><strong>Admin Email:</strong> ${adminEmail}</p>
              ${requestData.school_name ? `<p><strong>School:</strong> ${requestData.school_name}</p>` : ''}
              <p><strong>Contact Email:</strong> ${requestData.contact_email}</p>
              ${requestData.contact_phone ? `<p><strong>Contact Phone:</strong> ${requestData.contact_phone}</p>` : ''}
            </div>

            <div style="background-color: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0;">Reason for Restoration</h3>
              <p style="white-space: pre-wrap;">${requestData.reason}</p>
            </div>

            <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0;">Tables Requested</h3>
              <ul>
                ${(requestData.tables_requested || backup.tables_included).map((table: string) => 
                  `<li>${table}</li>`
                ).join('')}
              </ul>
            </div>

            <div style="margin-top: 24px; padding: 16px; background-color: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #1E40AF;">⚡ Action Required</h3>
              <p>Please review this restoration request and contact the requester within the expected timeframe based on urgency:</p>
              <ul>
                <li><strong>Critical:</strong> Within 4 hours</li>
                <li><strong>High:</strong> Within 24 hours</li>
                <li><strong>Medium:</strong> Within 48 hours</li>
                <li><strong>Low:</strong> Within 72 hours</li>
              </ul>
              <p>To process this request, access the admin dashboard and update the request status.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
            
            <p style="color: #6B7280; font-size: 12px;">
              This is an automated notification from the NabuLearn backup system.<br>
              Request ID: ${request.id}<br>
              Timestamp: ${new Date().toISOString()}
            </p>
          </div>
        `,
      });

      if (!emailResult.success) {
        console.error('❌ Failed to send email notification:', emailResult.error);
      } else {
        console.log('✅ Email notification sent to admin@meapphq.com (id:', emailResult.id, ')');
      }
    } catch (emailSendError) {
      console.error('❌ Exception sending email:', emailSendError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data restoration request submitted successfully',
        request_id: request.id,
        status: 'pending',
        next_steps: 'Our team has been notified and will review your request based on urgency level. You will be contacted at the provided email.',
        contact_info: {
          email: 'admin@nabulearn.com',
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
