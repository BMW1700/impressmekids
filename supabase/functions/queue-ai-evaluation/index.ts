// Durable AI evaluation queue — client entry point.
//
// The student's submission is persisted BEFORE any AI call, so a 429/402/503
// from the model provider can never lose audio, answers, or scores.
// An idempotency key guarantees a submission is scored exactly once.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { opLog } from '../_shared/retry.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const ALLOWED_JOB_TYPES = new Set(['aura_reading']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await caller.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const jobType = String(body?.job_type ?? 'aura_reading');
    const idempotencyKey = String(body?.idempotency_key ?? '').trim();
    const payload = body?.payload ?? {};

    if (!ALLOWED_JOB_TYPES.has(jobType)) return json({ error: 'Unsupported job type' }, 400);
    if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
      return json({ error: 'idempotency_key must be 8-200 characters' }, 400);
    }
    if (typeof payload !== 'object' || Array.isArray(payload)) {
      return json({ error: 'payload must be an object' }, 400);
    }

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });

    // Idempotent enqueue: same key returns the same job, never a second score.
    const { data: existing } = await admin
      .from('ai_evaluation_jobs')
      .select('id, status, result, error')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    let jobId = existing?.id as string | undefined;

    if (!jobId) {
      const { data: inserted, error: insErr } = await admin
        .from('ai_evaluation_jobs')
        .insert({
          idempotency_key: idempotencyKey,
          user_id: user.id,
          job_type: jobType,
          payload,
        })
        .select('id')
        .single();

      if (insErr) {
        // Race: another tab inserted the same key first.
        const { data: raced } = await admin
          .from('ai_evaluation_jobs').select('id').eq('idempotency_key', idempotencyKey).maybeSingle();
        if (!raced) {
          opLog('ai_job.enqueue_failed', { message: insErr.message });
          return json({ error: 'Could not queue evaluation' }, 500);
        }
        jobId = raced.id;
      } else {
        jobId = inserted.id;
      }
      opLog('ai_job.queued', { job_id: jobId, job_type: jobType });
    } else {
      opLog('ai_job.duplicate_prevented', { job_id: jobId, status: existing?.status });
    }

    // Kick the worker without blocking the student.
    admin.functions.invoke('process-ai-jobs', { body: { trigger: 'enqueue' } })
      .then(() => {}, (e) => opLog('ai_job.worker_kick_failed', { message: String(e) }));

    return json({
      job_id: jobId,
      status: existing?.status ?? 'queued',
      result: existing?.status === 'completed' ? existing?.result : null,
    });
  } catch (e) {
    opLog('ai_job.fatal', { message: (e as Error).message });
    return json({ error: 'Internal server error' }, 500);
  }
});
