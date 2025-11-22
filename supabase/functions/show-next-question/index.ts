import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { showNextQuestionSchema, validateInput } from '../_shared/validation.ts';

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

    // SECURITY: Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();

    // Validate input with Zod
    const validation = validateInput(showNextQuestionSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { match_id } = validation.data;

    console.log('Showing next question for match:', match_id, 'user:', user.id);

    // Get match state and verify user is a player in this match
    const { data: matchState, error: stateError } = await supabase
      .from('match_state')
      .select('*, matches!inner(tournament_id, player_a, player_b, classrooms:tournaments!inner(classroom_id))')
      .eq('match_id', match_id)
      .single();

    if (stateError) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Verify user is a player in this tournament
    const { data: isPlayer } = await supabase
      .rpc('is_tournament_player', { 
        _user_id: user.id, 
        _tournament_id: matchState.matches.tournament_id 
      });

    if (!isPlayer) {
      return new Response(JSON.stringify({ error: 'Not authorized - must be a player in this tournament' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const next_seq = matchState.current_seq + 1;

    // Get the next question from match_events (pre-populated questions)
    const { data: matchEvent, error: eventError } = await supabase
      .from('match_events')
      .select('*, questions(*)')
      .eq('match_id', match_id)
      .eq('seq', next_seq)
      .single();

    if (eventError || !matchEvent) {
      return new Response(JSON.stringify({ error: 'No more questions available' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update match event with shown timestamp
    await supabase
      .from('match_events')
      .update({
        shown_at: new Date().toISOString()
      })
      .eq('id', matchEvent.id);

    // Update match state to accept buzzes
    await supabase
      .from('match_state')
      .update({
        current_seq: next_seq,
        accepting_buzz: true
      })
      .eq('match_id', match_id);

    console.log('Question shown:', { match_id, seq: next_seq, question_id: matchEvent.question_id });

    // SECURITY: Filter out sensitive fields before returning to client
    // Students should NOT see answer_text or explanation until after they submit
    const safeQuestion = matchEvent.questions ? {
      id: matchEvent.questions.id,
      question_text: matchEvent.questions.question_text,
      question_type: matchEvent.questions.question_type,
      options: matchEvent.questions.options,
      image_url: matchEvent.questions.image_url,
      difficulty: matchEvent.questions.difficulty,
      // NEVER include: answer_text, explanation
    } : null;

    const safeMatchEvent = {
      ...matchEvent,
      questions: safeQuestion
    };

    return new Response(JSON.stringify({ match_event: safeMatchEvent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in show-next-question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
