import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Archive expired safety alerts
    const { data: expiredAlerts, error: updateError } = await supabaseClient
      .from('safety_alerts')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())
      .select('id, title, alert_type');

    if (updateError) throw updateError;

    const archivedCount = expiredAlerts?.length || 0;
    console.log(`Archived ${archivedCount} expired safety alerts`);

    // Log to audit
    if (archivedCount > 0) {
      await supabaseClient.from('safety_audit_log').insert({
        event_type: 'alerts_auto_archived',
        event_data: {
          count: archivedCount,
          alerts: expiredAlerts?.map(a => ({ id: a.id, title: a.title, type: a.alert_type }))
        }
      });
    }

    // Also cleanup old drill sessions (mark as completed if still in_progress after 4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data: staleDrills, error: drillError } = await supabaseClient
      .from('drill_sessions')
      .update({ 
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('status', 'in_progress')
      .lt('started_at', fourHoursAgo)
      .select('id, drill_type');

    if (drillError) {
      console.error('Error cleaning up stale drills:', drillError);
    } else if (staleDrills && staleDrills.length > 0) {
      console.log(`Auto-completed ${staleDrills.length} stale drill sessions`);
      
      await supabaseClient.from('safety_audit_log').insert({
        event_type: 'drills_auto_completed',
        event_data: {
          count: staleDrills.length,
          drills: staleDrills.map(d => ({ id: d.id, type: d.drill_type })),
          reason: 'Exceeded 4-hour limit'
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsArchived: archivedCount,
        drillsCompleted: staleDrills?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cleanup-expired-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
