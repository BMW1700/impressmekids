/**
 * Burst guard for browser-side hosted-Auth calls.
 *
 * A room full of people on one school or daycare Wi-Fi shares a single public
 * IP, and hosted Auth throttles signups per IP. When that happens we get a 429
 * (or an "over_email_send_rate_limit" / "too many requests" message). Retrying
 * immediately — and in lockstep with everyone else — makes it worse.
 *
 * This wraps a Supabase auth call and retries only throttle responses, with
 * exponential backoff plus random jitter so clients spread out instead of
 * hammering the same second.
 */

const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 0.8s, 1.6s ... plus up to 1.5s of jitter. */
const backoffDelay = (attempt: number) =>
  Math.round(800 * 2 ** attempt + Math.random() * 1500);

export const isAuthThrottleError = (error: unknown): boolean => {
  if (!error) return false;
  const status = (error as { status?: number })?.status;
  if (status === 429) return true;
  const msg = ((error as { message?: string })?.message ?? "").toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("over_email_send_rate_limit") ||
    msg.includes("over_request_rate_limit")
  );
};

/**
 * Run a Supabase auth call, retrying only when the response is a throttle.
 * Any other error (bad password, duplicate account) is returned immediately.
 */
export async function withAuthBurstRetry<T extends { error: unknown }>(
  call: () => Promise<T>,
  onRetry?: (attempt: number) => void,
): Promise<T> {
  let result = await call();

  for (let attempt = 0; attempt < MAX_ATTEMPTS - 1; attempt++) {
    if (!isAuthThrottleError(result.error)) return result;
    onRetry?.(attempt + 1);
    await sleep(backoffDelay(attempt));
    result = await call();
  }

  return result;
}

export const AUTH_THROTTLE_MESSAGE =
  "Lots of people are signing up right now. Give it a few seconds and try again.";
