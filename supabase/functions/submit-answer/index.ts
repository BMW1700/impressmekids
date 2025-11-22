import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { validateInput, submitAnswerSchema } from "../_shared/validation.ts";
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

    // SECURITY: Zod input validation
    const validation = validateInput(submitAnswerSchema, requestData);
    if (!validation.success) {
      console.error('[VALIDATION] Invalid input:', validation.error);
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { match_id, seq, tournament_player_id, answer_text } = validation.data;

    console.log('Submit answer:', { match_id, seq, tournament_player_id });

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

    const rateLimitResult = await checkRateLimit(user.id, 'submit-answer', RATE_LIMITS.TOURNAMENT);
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
      console.error('[SECURITY] Unauthorized answer submission:', { user_id: user.id, tournament_player_id });
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call atomic submit answer RPC
    const { data: result, error: rpcError } = await supabase
      .rpc('submit_answer_tx', {
        p_match_id: match_id,
        p_seq: seq,
        p_tournament_player_id: tournament_player_id,
        p_answer_text: answer_text
      });

    if (rpcError) {
      console.error('[ERROR] Answer submission RPC failed:', rpcError);
      return new Response(JSON.stringify({ error: 'Answer submission failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Answer result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] submit-answer exception:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
