import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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

    const { match_id } = await req.json();

    console.log('🏆 Determining winner for match:', match_id);

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .single();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine winner by score
    let winnerId: string;
    let loserId: string;

    if (match.score_a > match.score_b) {
      winnerId = match.player_a;
      loserId = match.player_b;
    } else if (match.score_b > match.score_a) {
      winnerId = match.player_b;
      loserId = match.player_a;
    } else {
      // Tie - check who answered first correctly
      const { data: events } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', match_id)
        .eq('correct', true)
        .order('resolved_at', { ascending: true })
        .limit(1);

      if (events && events.length > 0) {
        winnerId = events[0].answered_by_tournament_player_id;
        loserId = winnerId === match.player_a ? match.player_b : match.player_a;
      } else {
        // No correct answers, random winner
        winnerId = Math.random() > 0.5 ? match.player_a : match.player_b;
        loserId = winnerId === match.player_a ? match.player_b : match.player_a;
      }
    }

    console.log('✅ Winner determined:', winnerId, 'Loser:', loserId);

    // Update match
    await supabase
      .from('matches')
      .update({ 
        status: 'completed',
        winner_tournament_player_id: winnerId,
        ended_at: new Date().toISOString()
      })
      .eq('id', match_id);

    // Mark loser as eliminated
    await supabase
      .from('tournament_players')
      .update({ status: 'eliminated' })
      .eq('id', loserId);

    return new Response(JSON.stringify({ 
      success: true,
      winner_id: winnerId,
      loser_id: loserId,
      match_completed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] determine-match-winner exception:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
