import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tournament_id, round_number } = await req.json();

    console.log('Starting round:', { tournament_id, round_number });

    // Verify authorization
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all matches for this round
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('round', round_number)
      .eq('status', 'waiting');

    if (matchesError || !matches || matches.length === 0) {
      return new Response(JSON.stringify({ error: 'No matches to start' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get server timestamp for synchronization
    const { data: timestampResult } = await supabase
      .rpc('now' as any);

    const round_starts_at = new Date().toISOString();
    const round_ends_at = new Date(Date.now() + 60000).toISOString(); // 60 seconds

    console.log('Round timing:', { round_starts_at, round_ends_at });

    // Update all match states simultaneously with same timestamps
    for (const match of matches) {
      await supabase
        .from('match_state')
        .update({
          round_starts_at,
          round_ends_at,
          current_seq: 0,
          accepting_buzz: false
        })
        .eq('match_id', match.id);

      await supabase
        .from('matches')
        .update({ status: 'in_progress', started_at: round_starts_at })
        .eq('id', match.id);
    }

    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournament_id);

    console.log('Round started for', matches.length, 'matches');

    return new Response(JSON.stringify({ 
      matches: matches.length,
      round_starts_at,
      round_ends_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in start-round:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
