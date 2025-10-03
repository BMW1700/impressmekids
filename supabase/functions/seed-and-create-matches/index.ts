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

    const { tournament_id } = await req.json();

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

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, classrooms!inner(teacher_id)')
      .eq('id', tournament_id)
      .single();

    if (tournamentError || tournament.classrooms.teacher_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get students in classroom
    const { data: students, error: studentsError } = await supabase
      .from('classroom_students')
      .select('student_id, profiles!inner(id, full_name)')
      .eq('classroom_id', tournament.classroom_id);

    if (studentsError || !students || students.length < 2) {
      return new Response(JSON.stringify({ error: 'Not enough students (need at least 2)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Shuffle and seed students
    const shuffled = students.sort(() => Math.random() - 0.5);
    const tournamentPlayers = [];

    for (let i = 0; i < shuffled.length; i++) {
      const { data: player, error: playerError } = await supabase
        .from('tournament_players')
        .insert({
          tournament_id,
          profile_id: shuffled[i].student_id,
          seed: i + 1
        })
        .select()
        .single();

      if (!playerError) {
        tournamentPlayers.push(player);
      }
    }

    console.log('Created tournament players:', tournamentPlayers.length);

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
      .update({ status: 'waiting' })
      .eq('id', tournament_id);

    return new Response(JSON.stringify({ 
      tournament_players: tournamentPlayers.length,
      matches_created: matches.length,
      questions_assigned: questionIndex
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in seed-and-create-matches:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
