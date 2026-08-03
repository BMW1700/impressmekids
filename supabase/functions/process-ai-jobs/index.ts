// Durable AI evaluation worker.
//
// Claims a small batch of queued jobs atomically (SKIP LOCKED, max 3 at a
// time), runs the underlying evaluation function, and records the result.
// Transient failures are rescheduled with exponential backoff + jitter up
// to max_attempts; the student's submission always stays in the row.
//
// Safe to call repeatedly (from enqueue, from a poll, or from cron).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { backoffDelay, opLog } from '../_shared/retry.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const HANDLERS: Record<string, string> = {
  aura_reading: 'analyze-aura',
};

const CONCURRENCY = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  try {
    const { data: jobs, error: claimErr } = await admin
      .rpc('claim_ai_evaluation_jobs', { _limit: CONCURRENCY });

    if (claimErr) {
      opLog('ai_worker.claim_failed', { message: claimErr.message });
      return json({ error: 'Could not claim jobs' }, 500);
    }

    const claimed = (jobs ?? []) as Array<{
      id: string; job_type: string; payload: Record<string, unknown>;
      attempts: number; max_attempts: number; user_id: string;
    }>;

    if (claimed.length === 0) return json({ processed: 0 });

    const results = await Promise.all(claimed.map(async (job) => {
      const startedAt = Date.now();
      const target = HANDLERS[job.job_type];

      if (!target) {
        await admin.from('ai_evaluation_jobs').update({
          status: 'failed', error: `No handler for ${job.job_type}`, completed_at: new Date().toISOString(),
        }).eq('id', job.id);
        return { id: job.id, status: 'failed' };
      }

      try {
        const { data, error } = await admin.functions.invoke(target, {
          body: { ...job.payload, _actingUserId: job.user_id },
        });
        if (error) throw new Error(error.message || 'Evaluation function error');

        await admin.from('ai_evaluation_jobs').update({
          status: 'completed',
          result: data ?? {},
          error: null,
          locked_at: null,
          completed_at: new Date().toISOString(),
        }).eq('id', job.id);

        opLog('ai_job.completed', {
          job_id: job.id, job_type: job.job_type, duration_ms: Date.now() - startedAt, attempts: job.attempts,
        });
        return { id: job.id, status: 'completed' };
      } catch (e) {
        const message = (e as Error).message ?? 'Unknown error';
        const exhausted = job.attempts >= job.max_attempts;

        if (exhausted) {
          await admin.from('ai_evaluation_jobs').update({
            status: 'failed', error: message, locked_at: null, completed_at: new Date().toISOString(),
          }).eq('id', job.id);
          opLog('ai_job.failed', { job_id: job.id, attempts: job.attempts, message });
          return { id: job.id, status: 'failed' };
        }

        const delayMs = Math.max(2_000, backoffDelay(job.attempts, 2_000, 120_000));
        await admin.from('ai_evaluation_jobs').update({
          status: 'queued',
          error: message,
          locked_at: null,
          next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
        }).eq('id', job.id);

        opLog('ai_job.retry_scheduled', {
          job_id: job.id, attempts: job.attempts, delay_ms: delayMs, message,
        });
        return { id: job.id, status: 'retry' };
      }
    }));

    return json({ processed: results.length, results });
  } catch (e) {
    opLog('ai_worker.fatal', { message: (e as Error).message });
    return json({ error: 'Internal server error' }, 500);
  }
});
