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
