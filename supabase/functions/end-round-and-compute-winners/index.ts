import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { endRoundSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rateLimiter.ts';

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

    console.log('🏁 Ending round and computing winners:', { tournament_id, round_number });

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
        .update({ status: 'eliminated' })
        .eq('id', loser_id);

      winners.push(winner_id);

      console.log('✅ Match', match.id, 'winner:', winner_id, 'loser:', loser_id);
    }

    // Check if tournament is complete (only 1 winner left)
    const { data: remainingPlayers } = await supabase
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournament_id)
      .neq('status', 'eliminated');

    if (remainingPlayers && remainingPlayers.length === 1) {
      // Tournament complete
      await supabase
        .from('tournaments')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', tournament_id);

      console.log('🏆 Tournament completed! Winner:', remainingPlayers[0].id);
    } else if (remainingPlayers && remainingPlayers.length > 1) {
      // Create next round matches
      const nextRound = round_number + 1;
      const nextMatches = [];

      // Get question pool from first match of previous round
      const { data: sampleMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('tournament_id', tournament_id)
        .eq('round', round_number)
        .limit(1)
        .single();

      let questionIds: string[] = [];
      if (sampleMatch) {
        const { data: events } = await supabase
          .from('match_events')
          .select('question_id')
          .eq('match_id', sampleMatch.id)
          .order('seq');
        
        if (events) {
          questionIds = events.map(e => e.question_id);
        }
      }

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

            // Copy questions to new match
            if (questionIds.length > 0) {
              const events = questionIds.map((qid, idx) => ({
                match_id: nextMatch.id,
                question_id: qid,
                seq: idx + 1
              }));

              await supabase
                .from('match_events')
                .insert(events);
            }

            nextMatches.push(nextMatch);
          }
        }
      }

      console.log('📋 Created', nextMatches.length, 'matches for round', nextRound);

      // AUTO-START next round immediately!
      if (nextMatches.length > 0) {
        console.log('🚀 Auto-starting next round...');
        
        const round_starts_at = new Date().toISOString();
        const round_ends_at = new Date(Date.now() + 30000).toISOString(); // 30 seconds
        
        for (const match of nextMatches) {
          // Update match state to start
          await supabase
            .from('match_state')
            .update({
              round_starts_at,
              round_ends_at,
              current_seq: 1,
              accepting_buzz: true
            })
            .eq('match_id', match.id);
          
          // Set match status to in_progress
          await supabase
            .from('matches')
            .update({ status: 'in_progress', started_at: round_starts_at })
            .eq('id', match.id);
          
          // Show first question
          await supabase
            .from('match_events')
            .update({ shown_at: round_starts_at })
            .eq('match_id', match.id)
            .eq('seq', 1);
        }
        
        console.log('✅ Next round auto-started!');
      }

      return new Response(JSON.stringify({ 
        success: true,
        winners: winners.length,
        remaining_players: remainingPlayers?.length || 0,
        winner_id: winners.length === 1 ? winners[0] : null,
        tournament_complete: false,
        next_round_started: nextMatches.length > 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback response
    return new Response(JSON.stringify({ 
      success: true,
      winners: winners.length,
      remaining_players: remainingPlayers?.length || 0,
      winner_id: null,
      tournament_complete: true
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
