import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { buzzInSchema, validateInput } from '../_shared/validation.ts';
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
    const validation = validateInput(buzzInSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { match_id, seq, tournament_player_id } = validation.data;

    console.log('Buzz in attempt:', { match_id, seq, tournament_player_id });

    // Verify user authorization
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rateLimitResult = await checkRateLimit(user.id, 'buzz-in', RATE_LIMITS.TOURNAMENT);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', resetAt: rateLimitResult.resetAt }), {
        status: 429,
        headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimitResult, RATE_LIMITS.TOURNAMENT), 'Content-Type': 'application/json' },
      });
    }

    // Verify player is in this match
    const { data: player, error: playerError } = await supabase
      .from('tournament_players')
      .select('id, profile_id')
      .eq('id', tournament_player_id)
      .single();

    if (playerError || !player || player.profile_id !== user.id) {
      console.error('[SECURITY] Unauthorized buzz attempt:', { user_id: user.id, tournament_player_id });
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call atomic buzz RPC
    const { data: result, error: rpcError } = await supabase
      .rpc('attempt_buzz', {
        p_match_id: match_id,
        p_seq: seq,
        p_tournament_player_id: tournament_player_id
      });

    if (rpcError) {
      console.error('[ERROR] Buzz RPC failed:', rpcError);
      return new Response(JSON.stringify({ error: 'Buzz failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Buzz result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] buzz-in exception:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
