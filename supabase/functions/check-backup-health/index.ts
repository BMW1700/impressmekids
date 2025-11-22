import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get latest backup
    const { data: latestBackup } = await supabaseAdmin
      .from('cold_storage_backups')
      .select('*')
      .order('backup_timestamp', { ascending: false })
      .limit(1)
      .single();

    // Get total backup count
    const { count: totalBackups } = await supabaseAdmin
      .from('cold_storage_backups')
      .select('*', { count: 'exact', head: true });

    // Get recent audit logs
    const { data: recentLogs } = await supabaseAdmin
      .from('backup_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check if backup is overdue (more than 25 hours since last backup)
    const now = new Date();
    const lastBackupTime = latestBackup ? new Date(latestBackup.backup_timestamp) : null;
    const hoursSinceLastBackup = lastBackupTime 
      ? (now.getTime() - lastBackupTime.getTime()) / (1000 * 60 * 60)
      : null;
    
    const isHealthy = hoursSinceLastBackup !== null && hoursSinceLastBackup < 25;

    // Count failed operations
    const failedOps = recentLogs?.filter(log => log.status === 'error').length || 0;

    console.log(`🏥 Backup health check: ${isHealthy ? 'HEALTHY' : 'WARNING'}`);

    return new Response(
      JSON.stringify({
        success: true,
        health_status: isHealthy ? 'healthy' : 'warning',
        latest_backup: latestBackup,
        total_backups: totalBackups,
        hours_since_last_backup: hoursSinceLastBackup,
        recent_failed_operations: failedOps,
        recent_audit_logs: recentLogs,
        recommendations: !isHealthy ? [
          'Last backup is overdue (>24 hours)',
          'Consider running a manual backup immediately',
        ] : [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
