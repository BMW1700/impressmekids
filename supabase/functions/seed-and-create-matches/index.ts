import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { seedMatchesSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rateLimiter.ts';

import { corsHeaders } from '../_shared/cors.ts';

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
    const validation = validateInput(seedMatchesSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { tournament_id } = validation.data;

    console.log('Seeding and creating matches for tournament:', tournament_id);

    // Get tournament and verify ownership
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rateLimitResult = await checkRateLimit(user.id, 'seed-matches', RATE_LIMITS.TOURNAMENT);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', resetAt: rateLimitResult.resetAt }), {
        status: 429,
        headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimitResult, RATE_LIMITS.TOURNAMENT), 'Content-Type': 'application/json' },
      });
    }

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, classrooms!inner(teacher_id)')
      .eq('id', tournament_id)
      .single();

    if (tournamentError || !tournament || tournament.classrooms.teacher_id !== user.id) {
      console.error('[SECURITY] Unauthorized match creation:', { user_id: user.id, tournament_id });
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get players who have already joined
    const { data: existingPlayers, error: playersError } = await supabase
      .from('tournament_players')
      .select('*')
      .eq('tournament_id', tournament_id);

    if (playersError || !existingPlayers || existingPlayers.length === 0) {
      return new Response(JSON.stringify({ error: 'No players have joined yet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Shuffle and reassign seeds
    const shuffled = existingPlayers.sort(() => Math.random() - 0.5);
    const tournamentPlayers = [];

    for (let i = 0; i < shuffled.length; i++) {
      const { data: player, error: playerError } = await supabase
        .from('tournament_players')
        .update({ seed: i + 1 })
        .eq('id', shuffled[i].id)
        .select()
        .single();

      if (!playerError && player) {
        tournamentPlayers.push(player);
      }
    }

    console.log('Seeded tournament players:', tournamentPlayers.length);

    // Create first round matches (bracket style)
    const matches = [];
    for (let i = 0; i < tournamentPlayers.length; i += 2) {
      if (i + 1 < tournamentPlayers.length) {
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .insert({
            tournament_id,
            round: 1,
            player_a: tournamentPlayers[i].id,
            player_b: tournamentPlayers[i + 1].id,
            status: 'waiting'
          })
          .select()
          .single();

        if (!matchError) {
          matches.push(match);
          
          // Create match_state for each match
          await supabase
            .from('match_state')
            .insert({
              match_id: match.id,
              current_seq: 0,
              accepting_buzz: false
            });
        }
      }
    }

    console.log('Created matches:', matches.length);

    // Get tournament questions to populate match events
    const { data: tournamentQuestions, error: questionsError } = await supabase
      .from('tournament_questions')
      .select('question_id, sequence')
      .eq('tournament_id', tournament_id)
      .order('sequence');

    if (questionsError || !tournamentQuestions || tournamentQuestions.length === 0) {
      // Clean up created matches if no questions
      for (const match of matches) {
        await supabase.from('matches').delete().eq('id', match.id);
      }
      return new Response(JSON.stringify({ error: 'No questions assigned to tournament' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Distribute questions across matches and create match_events
    const questionsPerMatch = Math.floor(tournamentQuestions.length / matches.length);
    let questionIndex = 0;

    for (const match of matches) {
      // Create match_events for this match
      for (let seq = 1; seq <= questionsPerMatch && questionIndex < tournamentQuestions.length; seq++) {
        await supabase
          .from('match_events')
          .insert({
            match_id: match.id,
            seq: seq,
            question_id: tournamentQuestions[questionIndex].question_id
          });
        questionIndex++;
      }
    }

    console.log('Created match events with', questionIndex, 'questions distributed');

    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournament_id);

    return new Response(JSON.stringify({ 
      tournament_players: tournamentPlayers.length,
      matches_created: matches.length,
      questions_assigned: questionIndex
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] seed-and-create-matches exception:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
