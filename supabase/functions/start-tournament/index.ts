import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { startTournamentSchema, validateInput } from '../_shared/validation.ts';

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
    const validation = validateInput(startTournamentSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { classroom_id, name = 'New Tournament', game_type = 'jeopardy_duel' } = validation.data;

    console.log('Creating tournament:', { classroom_id, name, game_type });

    // Verify user has permission (is teacher of classroom)
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Verify using security definer function
    const { data: isTeacher, error: authCheckError } = await supabase.rpc('is_classroom_teacher', {
      _user_id: user.id,
      _classroom_id: classroom_id
    });

    if (authCheckError || !isTeacher) {
      console.error('[SECURITY] Unauthorized tournament creation:', { user_id: user.id, classroom_id });
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        classroom_id,
        name,
        created_by: user.id,
        status: 'waiting',
        game_type
      })
      .select()
      .single();

    if (tournamentError) {
      console.error('[ERROR] Tournament creation failed:', tournamentError);
      return new Response(JSON.stringify({ error: 'Failed to create tournament' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Tournament created:', tournament.id);

    return new Response(JSON.stringify({ tournament }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] start-tournament exception:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
