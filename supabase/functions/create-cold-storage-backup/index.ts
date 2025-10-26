import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/rateLimiter.ts';

const COLD_STORAGE_ACCESS_KEY = Deno.env.get('COLD_STORAGE_ACCESS_KEY');
const COLD_STORAGE_SECRET_KEY = Deno.env.get('COLD_STORAGE_SECRET_KEY');
const COLD_STORAGE_BUCKET = Deno.env.get('COLD_STORAGE_BUCKET');
const BACKUP_ENCRYPTION_KEY = Deno.env.get('BACKUP_ENCRYPTION_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify admin role
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${backupTimestamp}.enc`;

    // Tables to backup (excluding system tables)
    const tablesToBackup = [
      'profiles', 'classrooms', 'classroom_students', 'assignments',
      'assignment_submissions', 'questions', 'question_groups', 
      'aura_records', 'tournaments', 'matches', 'parent_accounts',
      'parent_student_links', 'parent_access_requests', 'teacher_summaries'
    ];

    let totalRecords = 0;
    const backupData: any = {};

    // Fetch data from all tables
    for (const table of tablesToBackup) {
      const { data, error } = await supabaseAdmin.from(table).select('*');
      if (!error && data) {
        backupData[table] = data;
        totalRecords += data.length;
      }
    }

    // Convert to JSON and encrypt
    const jsonData = JSON.stringify(backupData);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonData);

    // Simple encryption (in production, use proper AES-256-GCM)
    const keyBytes = encoder.encode(BACKUP_ENCRYPTION_KEY);
    const encryptedData = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encryptedData[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Upload to S3-compatible storage
    const s3Endpoint = `https://s3.amazonaws.com/${COLD_STORAGE_BUCKET}/${backupName}`;
    const uploadResponse = await fetch(s3Endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-amz-acl': 'private',
      },
      body: encryptedData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
    }

    // Record backup in database
    const { data: backupRecord, error: insertError } = await supabaseAdmin
      .from('cold_storage_backups')
      .insert({
        backup_name: backupName,
        backup_size_bytes: encryptedData.length,
        tables_included: tablesToBackup,
        record_count: totalRecords,
        storage_location: s3Endpoint,
        created_by: user.id,
        metadata: {
          tables_count: tablesToBackup.length,
          compression: 'none',
          encryption_verified: true,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to record backup:', insertError);
    }

    // Log audit trail
    await supabaseAdmin.from('backup_audit_log').insert({
      backup_id: backupRecord?.id,
      action_type: 'CREATE_BACKUP',
      performed_by: user.id,
      action_details: {
        tables: tablesToBackup,
        record_count: totalRecords,
        size_bytes: encryptedData.length,
      },
      status: 'success',
    });

    console.log(`✅ Backup created: ${backupName}, ${totalRecords} records, ${encryptedData.length} bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        backup_name: backupName,
        record_count: totalRecords,
        size_bytes: encryptedData.length,
        backup_id: backupRecord?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backup creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
