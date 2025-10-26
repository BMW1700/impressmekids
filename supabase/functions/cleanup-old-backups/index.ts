import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { S3Client, DeleteObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.515.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      console.error('Role check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting cleanup of old backups (>90 days)...');

    // Initialize S3 client
    const s3Client = new S3Client({
      region: Deno.env.get('COLD_STORAGE_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: Deno.env.get('COLD_STORAGE_ACCESS_KEY')!,
        secretAccessKey: Deno.env.get('COLD_STORAGE_SECRET_KEY')!,
      },
    });

    const bucketName = Deno.env.get('COLD_STORAGE_BUCKET')!;

    // Calculate cutoff date (90 days ago)
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    console.log('Cutoff date for cleanup:', cutoffDate.toISOString());

    // Find backups older than 90 days
    const { data: oldBackups, error: fetchError } = await supabase
      .from('cold_storage_backups')
      .select('*')
      .lt('backup_timestamp', cutoffDate.toISOString());

    if (fetchError) {
      console.error('Error fetching old backups:', fetchError);
      throw new Error(`Failed to fetch old backups: ${fetchError.message}`);
    }

    if (!oldBackups || oldBackups.length === 0) {
      console.log('No backups older than 90 days found');
      
      // Log the cleanup action
      await supabase.from('backup_audit_log').insert({
        user_id: user.id,
        action_type: 'cleanup',
        status: 'success',
        action_details: {
          deleted_count: 0,
          freed_space_bytes: 0,
          cutoff_date: cutoffDate.toISOString(),
        },
      });

      return new Response(JSON.stringify({
        success: true,
        deleted_count: 0,
        freed_space_bytes: 0,
        message: 'No backups older than 90 days found',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${oldBackups.length} backups to delete`);

    let deletedCount = 0;
    let freedSpaceBytes = 0;
    const errors = [];

    // Delete each old backup from S3 and database
    for (const backup of oldBackups) {
      try {
        console.log(`Deleting backup: ${backup.backup_name}`);

        // Delete from S3
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: backup.s3_key,
        });

        await s3Client.send(deleteCommand);
        console.log(`Deleted from S3: ${backup.s3_key}`);

        // Delete from database
        const { error: deleteError } = await supabase
          .from('cold_storage_backups')
          .delete()
          .eq('id', backup.id);

        if (deleteError) {
          console.error(`Failed to delete backup from DB: ${backup.id}`, deleteError);
          errors.push({
            backup_id: backup.id,
            backup_name: backup.backup_name,
            error: deleteError.message,
          });
          continue;
        }

        deletedCount++;
        freedSpaceBytes += backup.backup_size_bytes || 0;
        console.log(`Successfully deleted backup: ${backup.backup_name}`);

      } catch (error) {
        console.error(`Error deleting backup ${backup.backup_name}:`, error);
        errors.push({
          backup_id: backup.id,
          backup_name: backup.backup_name,
          error: error.message,
        });
      }
    }

    console.log(`Cleanup completed. Deleted ${deletedCount} backups, freed ${freedSpaceBytes} bytes`);

    // Log the cleanup action
    await supabase.from('backup_audit_log').insert({
      user_id: user.id,
      action_type: 'cleanup',
      status: errors.length > 0 ? 'partial_success' : 'success',
      action_details: {
        deleted_count: deletedCount,
        freed_space_bytes: freedSpaceBytes,
        cutoff_date: cutoffDate.toISOString(),
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      deleted_count: deletedCount,
      freed_space_bytes: freedSpaceBytes,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deleted ${deletedCount} old backups, freed ${(freedSpaceBytes / (1024 * 1024)).toFixed(2)} MB`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Failed to cleanup old backups',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
