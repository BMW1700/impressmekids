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

    const { match_id } = await req.json();

    console.log('Showing next question for match:', match_id);

    // Get match state
    const { data: matchState, error: stateError } = await supabase
      .from('match_state')
      .select('*, matches!inner(tournament_id, classrooms:tournaments!inner(classroom_id))')
      .eq('match_id', match_id)
      .single();

    if (stateError) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const next_seq = matchState.current_seq + 1;

    // Get a random approved question from the classroom
    const classroom_id = matchState.matches.tournaments.classroom_id;
    
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('classroom_id', classroom_id)
      .eq('approved', true)
      .limit(10);

    if (questionsError || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pick random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    // Create match event
    const { data: matchEvent, error: eventError } = await supabase
      .from('match_events')
      .insert({
        match_id,
        seq: next_seq,
        question_id: randomQuestion.id,
        shown_at: new Date().toISOString()
      })
      .select('*, questions(*)')
      .single();

    if (eventError) {
      console.error('Error creating match event:', eventError);
      return new Response(JSON.stringify({ error: eventError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update match state to accept buzzes
    await supabase
      .from('match_state')
      .update({
        current_seq: next_seq,
        accepting_buzz: true
      })
      .eq('match_id', match_id);

    console.log('Question shown:', { match_id, seq: next_seq, question_id: randomQuestion.id });

    return new Response(JSON.stringify({ match_event: matchEvent }), {
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
