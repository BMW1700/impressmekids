import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { endRoundSchema, validateInput } from '../_shared/validation.ts';

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

    const requestData = await req.json();

    // Validate input with Zod
    const validation = validateInput(endRoundSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { tournament_id, round_number } = validation.data;

    console.log('Ending round and computing winners:', { tournament_id, round_number });

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
      .select('*')
      .eq('tournament_id', tournament_id)
      .eq('round', round_number)
      .eq('status', 'in_progress');

    if (matchesError || !matches || matches.length === 0) {
      return new Response(JSON.stringify({ error: 'No matches to end' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const winners = [];

    // Compute winner for each match
    for (const match of matches) {
      let winner_id = null;

      if (match.score_a > match.score_b) {
        winner_id = match.player_a;
      } else if (match.score_b > match.score_a) {
        winner_id = match.player_b;
      } else {
        // Tie - random winner
        winner_id = Math.random() < 0.5 ? match.player_a : match.player_b;
      }

      // Update match
      await supabase
        .from('matches')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          winner_tournament_player_id: winner_id
        })
        .eq('id', match.id);

      // Mark loser as eliminated
      const loser_id = winner_id === match.player_a ? match.player_b : match.player_a;
      
      await supabase
        .from('tournament_players')
        .update({ eliminated: true })
        .eq('id', loser_id);

      winners.push(winner_id);

      console.log('Match', match.id, 'winner:', winner_id);
    }

    // Check if tournament is complete (only 1 winner left)
    const { data: remainingPlayers } = await supabase
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('eliminated', false);

    if (remainingPlayers && remainingPlayers.length === 1) {
      // Tournament complete
      await supabase
        .from('tournaments')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', tournament_id);

      console.log('Tournament completed');
    } else if (remainingPlayers && remainingPlayers.length > 1) {
      // Create next round matches
      const nextRound = round_number + 1;
      const nextMatches = [];

      for (let i = 0; i < remainingPlayers.length; i += 2) {
        if (i + 1 < remainingPlayers.length) {
          const { data: nextMatch } = await supabase
            .from('matches')
            .insert({
              tournament_id,
              round: nextRound,
              player_a: remainingPlayers[i].id,
              player_b: remainingPlayers[i + 1].id,
              status: 'waiting'
            })
            .select()
            .single();

          if (nextMatch) {
            // Create match state
            await supabase
              .from('match_state')
              .insert({
                match_id: nextMatch.id,
                current_seq: 0,
                accepting_buzz: false
              });

            nextMatches.push(nextMatch);
          }
        }
      }

      console.log('Created', nextMatches.length, 'matches for round', nextRound);
    }

    return new Response(JSON.stringify({ 
      winners: winners.length,
      remaining_players: remainingPlayers?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] end-round-and-compute-winners exception:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
