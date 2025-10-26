import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/rateLimiter.ts';

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

    const { backup_id } = await req.json();

    if (!backup_id) {
      return new Response(JSON.stringify({ error: 'backup_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get backup metadata
    const { data: backup, error: backupError } = await supabaseAdmin
      .from('cold_storage_backups')
      .select('*')
      .eq('id', backup_id)
      .single();

    if (backupError || !backup) {
      return new Response(JSON.stringify({ error: 'Backup not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download encrypted backup from S3
    const downloadResponse = await fetch(backup.storage_location);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download backup: ${downloadResponse.statusText}`);
    }

    const encryptedData = new Uint8Array(await downloadResponse.arrayBuffer());

    // Decrypt data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyBytes = encoder.encode(BACKUP_ENCRYPTION_KEY);
    const decryptedData = new Uint8Array(encryptedData.length);
    
    for (let i = 0; i < encryptedData.length; i++) {
      decryptedData[i] = encryptedData[i] ^ keyBytes[i % keyBytes.length];
    }

    const jsonString = decoder.decode(decryptedData);
    const backupData = JSON.parse(jsonString);

    // Log audit trail
    await supabaseAdmin.from('backup_audit_log').insert({
      backup_id: backup.id,
      action_type: 'RESTORE_BACKUP',
      performed_by: user.id,
      action_details: {
        tables: Object.keys(backupData),
        record_count: backup.record_count,
      },
      status: 'success',
    });

    console.log(`✅ Backup restored: ${backup.backup_name}, ${backup.record_count} records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup data retrieved and decrypted',
        tables: Object.keys(backupData),
        record_count: backup.record_count,
        backup_data: backupData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Restore backup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
