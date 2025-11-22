import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { startRoundSchema, validateInput } from '../_shared/validation.ts';
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
    const validation = validateInput(startRoundSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { tournament_id, round_number } = validation.data;

    console.log('Starting round:', { tournament_id, round_number });

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

    const rateLimitResult = await checkRateLimit(user.id, 'start-round', RATE_LIMITS.TOURNAMENT);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', resetAt: rateLimitResult.resetAt }), {
        status: 429,
        headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimitResult, RATE_LIMITS.TOURNAMENT), 'Content-Type': 'application/json' },
      });
    }

    // Get all matches for this round
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('round', round_number)
      .eq('status', 'waiting');

    if (matchesError || !matches || matches.length === 0) {
      return new Response(JSON.stringify({ error: 'No matches to start' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get server timestamp for synchronization
    const { data: timestampResult } = await supabase
      .rpc('now' as any);

    const round_starts_at = new Date().toISOString();
    const round_ends_at = new Date(Date.now() + 60000).toISOString(); // 60 seconds

    console.log('Round timing:', { round_starts_at, round_ends_at });

    // Update all match states simultaneously with same timestamps
    for (const match of matches) {
      await supabase
        .from('match_state')
        .update({
          round_starts_at,
          round_ends_at,
          current_seq: 0,
          accepting_buzz: false
        })
        .eq('match_id', match.id);

      await supabase
        .from('matches')
        .update({ status: 'in_progress', started_at: round_starts_at })
        .eq('id', match.id);
    }

    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournament_id);

    console.log('Round started for', matches.length, 'matches');

    return new Response(JSON.stringify({ 
      matches: matches.length,
      round_starts_at,
      round_ends_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] start-round exception:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
