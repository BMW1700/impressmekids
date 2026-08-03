/**
 * Shared retry helper for edge functions.
 *
 * Exponential backoff with randomized jitter for transient failures
 * (429 / 500 / 502 / 503 / 504, network errors, timeouts).
 * Non-retryable errors (400/401/403/404/402) fail fast so we never
 * spin an uncontrolled retry loop or duplicate a write.
 */

export const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export interface RetryOptions {
  attempts?: number;      // total attempts (including the first)
  baseDelayMs?: number;   // first backoff step
  maxDelayMs?: number;    // cap per-attempt delay
  timeoutMs?: number;     // per-attempt request timeout
  label?: string;         // for structured logs
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Full-jitter exponential backoff: random(0, base * 2^n), capped. */
export function backoffDelay(attempt: number, baseDelayMs = 500, maxDelayMs = 20_000): number {
  const ceiling = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  return Math.floor(Math.random() * ceiling);
}

export class RetryableHttpError extends Error {
  constructor(public status: number, public body: string, label: string) {
    super(`${label} failed [${status}]: ${body.slice(0, 500)}`);
    this.name = 'RetryableHttpError';
  }
}

/**
 * fetch() with per-attempt timeout + backoff on retryable failures.
 * Returns the successful Response. Throws on final failure.
 */
export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const {
    attempts = 4,
    baseDelayMs = 500,
    maxDelayMs = 20_000,
    timeoutMs = 60_000,
    label = 'fetch',
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) return response;

      const body = await response.text();

      if (!RETRYABLE_STATUS.has(response.status)) {
        // Terminal: surface the provider status + body unchanged.
        throw new RetryableHttpError(response.status, body, label);
      }

      lastError = new RetryableHttpError(response.status, body, label);
      console.warn(
        JSON.stringify({
          evt: 'retry.http',
          label,
          status: response.status,
          attempt: attempt + 1,
          attempts,
        }),
      );
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof RetryableHttpError && !RETRYABLE_STATUS.has(e.status)) throw e;
      lastError = e;
      console.warn(
        JSON.stringify({
          evt: 'retry.network',
          label,
          attempt: attempt + 1,
          attempts,
          message: (e as Error)?.message,
        }),
      );
    }

    if (attempt < attempts - 1) {
      await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after ${attempts} attempts`);
}

/** Generic async retry for non-fetch operations. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { attempts = 3, baseDelayMs = 300, maxDelayMs = 10_000, label = 'op' } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      console.warn(
        JSON.stringify({ evt: 'retry.op', label, attempt: attempt + 1, message: (e as Error)?.message }),
      );
      if (attempt < attempts - 1) await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs));
    }
  }
  throw lastError;
}

/** Structured one-line operational log. */
export function opLog(evt: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ evt, ts: new Date().toISOString(), ...fields }));
}
