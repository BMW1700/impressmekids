import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { S3Client, GetObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Initialize S3 client (lazy initialization to avoid boot-time fs access)
    const s3Client = new S3Client({
      region: Deno.env.get('COLD_STORAGE_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: Deno.env.get('COLD_STORAGE_ACCESS_KEY')!,
        secretAccessKey: Deno.env.get('COLD_STORAGE_SECRET_KEY')!,
      },
    });

    const { backup_id, execute_restore = false, tables = [] } = await req.json();

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

    // Download from S3 using AWS SDK
    const s3Key = backup.backup_name;
    const getCommand = new GetObjectCommand({
      Bucket: Deno.env.get('COLD_STORAGE_BUCKET')!,
      Key: s3Key,
    });

    const s3Response = await s3Client.send(getCommand);
    const encryptedDataArray = await s3Response.Body?.transformToByteArray();
    
    if (!encryptedDataArray) {
      throw new Error('Failed to download backup data from S3');
    }

    // Decrypt using AES-256-GCM
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const encryptionKeyMaterial = encoder.encode(BACKUP_ENCRYPTION_KEY!);
    
    // Import decryption key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encryptionKeyMaterial.slice(0, 32),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Extract IV (first 12 bytes) and encrypted data
    const iv = encryptedDataArray.slice(0, 12);
    const encryptedContent = encryptedDataArray.slice(12);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedContent
    );

    const backupData = JSON.parse(decoder.decode(decryptedBuffer));

    // If not executing restore, just return the data for viewing
    if (!execute_restore) {
      // Log view action
      await supabaseAdmin.from('backup_audit_log').insert({
        backup_id: backup.id,
        action_type: 'VIEW_BACKUP',
        performed_by: user.id,
        action_details: {
          tables: Object.keys(backupData),
          record_count: backup.record_count,
        },
        status: 'success',
      });

      console.log(`👁️ Backup viewed: ${backup.backup_name}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Backup data retrieved for viewing',
          tables: Object.keys(backupData),
          record_count: backup.record_count,
          backup_data: backupData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute actual restore
    const tablesToRestore = tables.length > 0 ? tables : Object.keys(backupData);
    const restoredTables: string[] = [];
    let totalRecordsRestored = 0;

    for (const tableName of tablesToRestore) {
      if (!backupData[tableName]) continue;

      const records = backupData[tableName];
      let recordsRestored = 0;

      try {
        // Insert records (will skip duplicates if ID exists)
        for (const record of records) {
          const { error: insertError } = await supabaseAdmin
            .from(tableName)
            .upsert(record, { onConflict: 'id', ignoreDuplicates: false });

          if (!insertError) {
            recordsRestored++;
          }
        }

        restoredTables.push(tableName);
        totalRecordsRestored += recordsRestored;
        console.log(`✅ Restored ${recordsRestored} records to ${tableName}`);
      } catch (error) {
        console.error(`❌ Error restoring ${tableName}:`, error);
      }
    }

    // Log restore action
    await supabaseAdmin.from('backup_audit_log').insert({
      backup_id: backup.id,
      action_type: 'RESTORE_BACKUP',
      performed_by: user.id,
      action_details: {
        tables: restoredTables,
        record_count: totalRecordsRestored,
      },
      status: 'success',
    });

    console.log(`✅ Backup restored: ${backup.backup_name}, ${totalRecordsRestored} records across ${restoredTables.length} tables`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup restored successfully',
        restored_tables: restoredTables,
        total_records: totalRecordsRestored,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Restore backup error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
