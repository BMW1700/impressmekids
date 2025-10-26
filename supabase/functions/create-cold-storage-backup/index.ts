import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COLD_STORAGE_ACCESS_KEY = Deno.env.get('COLD_STORAGE_ACCESS_KEY');
const COLD_STORAGE_SECRET_KEY = Deno.env.get('COLD_STORAGE_SECRET_KEY');
const COLD_STORAGE_BUCKET = Deno.env.get('COLD_STORAGE_BUCKET');
const COLD_STORAGE_REGION = Deno.env.get('COLD_STORAGE_REGION') || 'us-east-1';
const BACKUP_ENCRYPTION_KEY = Deno.env.get('BACKUP_ENCRYPTION_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize S3 client
const s3Client = new S3Client({
  region: COLD_STORAGE_REGION,
  credentials: {
    accessKeyId: COLD_STORAGE_ACCESS_KEY!,
    secretAccessKey: COLD_STORAGE_SECRET_KEY!,
  },
});

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

    // Convert to JSON
    const jsonData = JSON.stringify(backupData);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonData);

    // Proper AES-256-GCM encryption
    const encryptionKeyMaterial = encoder.encode(BACKUP_ENCRYPTION_KEY!);
    
    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encryptionKeyMaterial.slice(0, 32), // Use first 32 bytes for AES-256
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBytes
    );

    // Combine IV + encrypted data for storage
    const encryptedData = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    encryptedData.set(iv, 0);
    encryptedData.set(new Uint8Array(encryptedBuffer), iv.length);

    // Upload to S3 using AWS SDK
    const uploadCommand = new PutObjectCommand({
      Bucket: COLD_STORAGE_BUCKET!,
      Key: backupName,
      Body: encryptedData,
      ContentType: 'application/octet-stream',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'encryption-method': 'AES-256-GCM',
        'iv-length': '12',
        'created-at': new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);
    
    const s3Location = `s3://${COLD_STORAGE_BUCKET}/${backupName}`;

    // Record backup in database
    const { data: backupRecord, error: insertError } = await supabaseAdmin
      .from('cold_storage_backups')
      .insert({
        backup_name: backupName,
        backup_size_bytes: encryptedData.length,
        tables_included: tablesToBackup,
        record_count: totalRecords,
        storage_location: s3Location,
        created_by: user.id,
        metadata: {
          tables_count: tablesToBackup.length,
          compression: 'none',
          encryption: 'AES-256-GCM',
          iv_length: 12,
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
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
