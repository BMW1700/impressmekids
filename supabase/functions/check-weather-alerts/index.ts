import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from '../_shared/cors.ts';

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

    // Get all districts with their coordinates
    const { data: districts, error: districtsError } = await supabaseClient
      .from('districts')
      .select('district_code, name, latitude, longitude');

    if (districtsError) throw districtsError;

    let alertsCreated = 0;
    let districtsProcessed = 0;

    for (const district of districts || []) {
      // Skip districts without coordinates
      if (!district.latitude || !district.longitude) {
        console.log(`Skipping ${district.name}: No coordinates configured`);
        continue;
      }

      const lat = district.latitude;
      const lon = district.longitude;

      // Fetch weather alerts from National Weather Service API
      const nwsUrl = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;
      
      try {
        const response = await fetch(nwsUrl, {
          headers: {
            'User-Agent': '(ImpressMe Kids Emergency Alert System, contact@impressmekids.com)',
            'Accept': 'application/geo+json'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch alerts for ${district.name}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        const alerts = data.features || [];

        // Filter for severe weather only
        const severeAlerts = alerts.filter((alert: any) => {
          const severity = alert.properties.severity;
          const event = alert.properties.event;
          
          return (
            (severity === 'Severe' || severity === 'Extreme') &&
            (event.includes('Tornado') || 
             event.includes('Severe Thunderstorm') ||
             event.includes('Flash Flood') ||
             event.includes('Hurricane') ||
             event.includes('Blizzard') ||
             event.includes('Ice Storm'))
          );
        });

        // Create safety alerts for each severe weather event
        for (const alert of severeAlerts) {
          const props = alert.properties;
          
          // Check if we already have an alert for this event
          const { data: existing } = await supabaseClient
            .from('safety_alerts')
            .select('id')
            .eq('school_id', district.district_code)
            .eq('alert_type', 'weather')
            .eq('title', props.event)
            .eq('is_active', true)
            .single();

          if (existing) {
            console.log(`Alert already exists for ${props.event} in ${district.name}`);
            continue;
          }

          // Get admin user to create alert (use first admin found)
          const { data: admin } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .limit(1)
            .single();

          if (!admin) {
            console.error('No admin found to create weather alert');
            continue;
          }

          // Create the safety alert
          const { data: newAlert, error: insertError } = await supabaseClient
            .from('safety_alerts')
            .insert({
              school_id: district.district_code,
              title: props.event,
              message: props.description || props.instruction || 'Severe weather alert in your area. Please take appropriate precautions.',
              alert_type: 'weather',
              severity: props.severity === 'Extreme' ? 'critical' : 'high',
              authority_verified: true,
              authority_source: 'National Weather Service',
              created_by: admin.id,
              notify_parents: true,
              notify_students: true,
              notify_teachers: true,
              expires_at: props.expires ? new Date(props.expires).toISOString() : null
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`Error creating weather alert for ${district.name}:`, insertError);
          } else {
            alertsCreated++;
            console.log(`Created weather alert for ${district.name}: ${props.event}`);
            
            // Log to safety audit log
            await supabaseClient
              .from('safety_audit_log')
              .insert({
                event_type: 'weather_alert_created',
                alert_id: newAlert?.id,
                event_data: {
                  district_code: district.district_code,
                  district_name: district.name,
                  alert_title: props.event,
                  severity: props.severity,
                  source: 'National Weather Service',
                  nws_id: alert.id
                }
              });
          }
        }
        
        districtsProcessed++;
      } catch (error) {
        console.error(`Error processing weather alerts for ${district.name}:`, error);
      }
    }

    // Also cleanup expired alerts
    await supabaseClient.rpc('cleanup_expired_safety_alerts');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weather alerts checked',
        districtsProcessed,
        alertsCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-weather-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
