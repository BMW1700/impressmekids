/**
 * Durable AI evaluation jobs (client side).
 *
 * Submissions are persisted server-side before any model call, so a
 * transient 429/402/503 never loses a child's reading. We poll the job
 * row (RLS-scoped to the student) until it completes or fails.
 */

import { supabase } from "@/integrations/supabase/client";

export type AiJobStatus = "queued" | "processing" | "completed" | "failed";

export interface AiJob {
  id: string;
  status: AiJobStatus;
  result: any | null;
  error: string | null;
  attempts: number;
}

export interface SubmitOptions {
  jobType?: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

/** Build a stable idempotency key so retries never double-score. */
export function makeIdempotencyKey(parts: (string | number | undefined | null)[]): string {
  return parts.filter(Boolean).join(":").slice(0, 200);
}

export async function submitAiEvaluation(
  options: SubmitOptions,
): Promise<{ jobId?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke("queue-ai-evaluation", {
    body: {
      job_type: options.jobType ?? "aura_reading",
      idempotency_key: options.idempotencyKey,
      payload: options.payload,
    },
  });

  if (error) return { error: error.message || "Could not queue evaluation" };
  const result = (data ?? {}) as { job_id?: string; error?: string };
  if (!result.job_id) return { error: result.error ?? "Could not queue evaluation" };
  return { jobId: result.job_id };
}

/** Nudge the worker (safe to call repeatedly; it claims with SKIP LOCKED). */
async function kickWorker() {
  try {
    await supabase.functions.invoke("process-ai-jobs", { body: { trigger: "poll" } });
  } catch {
    /* worker kick is best-effort */
  }
}

export async function waitForAiEvaluation(
  jobId: string,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    onStatus?: (status: AiJobStatus, attempts: number) => void;
  } = {},
): Promise<AiJob> {
  const { timeoutMs = 180_000, intervalMs = 2_000, onStatus } = options;
  const deadline = Date.now() + timeoutMs;
  let lastStatus: AiJobStatus = "queued";
  let ticks = 0;

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from("ai_evaluation_jobs")
      .select("id, status, result, error, attempts")
      .eq("id", jobId)
      .maybeSingle();

    if (!error && data) {
      const job = data as unknown as AiJob;
      if (job.status !== lastStatus) {
        lastStatus = job.status;
        onStatus?.(job.status, job.attempts);
      }
      if (job.status === "completed" || job.status === "failed") return job;
    }

    // Re-kick the worker occasionally in case a cold start dropped the trigger.
    ticks += 1;
    if (ticks % 5 === 0) void kickWorker();

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return {
    id: jobId,
    status: "queued",
    result: null,
    error: "Still working. Your reading is saved — results will appear shortly.",
    attempts: 0,
  };
}

/** Submit + wait in one call. The submission is never lost on failure. */
export async function runAiEvaluation(
  options: SubmitOptions & { onStatus?: (s: AiJobStatus, attempts: number) => void },
): Promise<{ result?: any; error?: string; jobId?: string }> {
  const { jobId, error } = await submitAiEvaluation(options);
  if (!jobId) return { error };

  const job = await waitForAiEvaluation(jobId, { onStatus: options.onStatus });
  if (job.status === "completed") return { result: job.result, jobId };
  return { error: job.error ?? "Evaluation failed", jobId };
}
