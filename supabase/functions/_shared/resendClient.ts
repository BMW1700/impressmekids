/**
 * Bulletproof Resend client wrapper for YubiLearn transactional emails.
 *
 * Features:
 *  - Token-bucket throttle capping outbound at Resend's hard limit (2 req/sec).
 *  - Automatic 429 retry honoring `Retry-After`, plus 5xx retry with exponential backoff.
 *  - Bulk batching via Resend's /emails/batch endpoint (100 messages per call,
 *    each batch counts as 1 token-bucket request).
 *  - Failure logging to `email_failures` (admin-only) so failed sends never vanish.
 *
 * Public surface:
 *  - sendEmail({ ... })        -> single recipient
 *  - sendBulkEmails({ ... })   -> many recipients, auto-batched
 *
 * Look for log lines tagged `[resendClient]` in production.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";

// Resend Free plan: 2 requests / second.
const TOKEN_BUCKET_CAPACITY = 2;
const TOKEN_REFILL_INTERVAL_MS = 1000;

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500; // 500ms -> 1s -> 2s

const BATCH_SIZE = 100; // Resend /emails/batch max payload

// ---------------------------------------------------------------------------
// Token bucket (module-scope; survives within a warm edge function instance)
// ---------------------------------------------------------------------------
let availableTokens = TOKEN_BUCKET_CAPACITY;
let lastRefill = Date.now();

function refill() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  if (elapsed >= TOKEN_REFILL_INTERVAL_MS) {
    availableTokens = TOKEN_BUCKET_CAPACITY;
    lastRefill = now;
  }
}

async function acquireToken(): Promise<void> {
  // Loop until we get a token. Each wait honors the refill interval.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    refill();
    if (availableTokens > 0) {
      availableTokens -= 1;
      return;
    }
    const waitMs = Math.max(50, TOKEN_REFILL_INTERVAL_MS - (Date.now() - lastRefill));
    await sleep(waitMs);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Service-role Supabase client (lazy) for failure logging
// ---------------------------------------------------------------------------
let _serviceClient: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient | null {
  if (_serviceClient) return _serviceClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  _serviceClient = createClient(url, key);
  return _serviceClient;
}

interface FailureLogInput {
  recipient_email: string;
  subject?: string;
  from_address?: string;
  error_code?: string;
  error_message?: string;
  retry_count: number;
  function_name?: string;
  payload_summary?: Record<string, unknown>;
}

async function logFailure(input: FailureLogInput): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) {
    console.warn("[resendClient] Cannot log failure - service role client unavailable");
    return;
  }
  try {
    const { error } = await supabase.from("email_failures").insert({
      recipient_email: input.recipient_email,
      subject: input.subject ?? null,
      from_address: input.from_address ?? null,
      error_code: input.error_code ?? null,
      error_message: input.error_message ?? null,
      retry_count: input.retry_count,
      function_name: input.function_name ?? null,
      payload_summary: input.payload_summary ?? null,
    });
    if (error) {
      console.error("[resendClient] Failed to insert email_failures row:", error.message);
    }
  } catch (err) {
    console.error("[resendClient] Exception logging failure:", (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  /** Name of the calling edge function, for failure logs. */
  functionName?: string;
  /** Optional small object stored on failure for debugging. */
  payloadSummary?: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  errorCode?: string;
  attempts: number;
}

/**
 * Send a single transactional email through Resend with throttle, retry,
 * and failure logging.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("[resendClient] RESEND_API_KEY missing");
    return { success: false, error: "RESEND_API_KEY not configured", attempts: 0 };
  }

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const primaryRecipient = recipients[0] ?? "unknown";

  const body: Record<string, unknown> = {
    from: params.from,
    to: recipients,
    subject: params.subject,
  };
  if (params.html) body.html = params.html;
  if (params.text) body.text = params.text;
  if (params.replyTo) body.reply_to = params.replyTo;
  if (params.cc) body.cc = params.cc;
  if (params.bcc) body.bcc = params.bcc;

  let attempt = 0;
  let lastError = "unknown";
  let lastErrorCode = "unknown";

  while (attempt < MAX_RETRIES) {
    attempt += 1;
    await acquireToken();

    let response: Response;
    try {
      response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastError = (err as Error).message;
      lastErrorCode = "network";
      console.error(
        `[resendClient] Network error attempt ${attempt}/${MAX_RETRIES} for ${primaryRecipient}: ${lastError}`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
        continue;
      }
      break;
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log(
        `[resendClient] Sent OK to ${primaryRecipient} (attempt ${attempt}, id=${(data as Record<string, unknown>).id ?? "?"})`,
      );
      return { success: true, id: (data as Record<string, string>).id, attempts: attempt };
    }

    // Error path
    const errorText = await response.text().catch(() => "");
    lastError = errorText || response.statusText;
    lastErrorCode = String(response.status);

    if (response.status === 429) {
      const retryAfter = parseRetryAfter(response.headers.get("retry-after")) ??
        BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[resendClient] 429 for ${primaryRecipient} attempt ${attempt}/${MAX_RETRIES}, waiting ${retryAfter}ms`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(retryAfter);
        continue;
      }
    } else if (response.status >= 500) {
      console.warn(
        `[resendClient] 5xx (${response.status}) for ${primaryRecipient} attempt ${attempt}/${MAX_RETRIES}`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
        continue;
      }
    } else {
      // 4xx (other than 429) - not retryable
      console.error(
        `[resendClient] Non-retryable ${response.status} for ${primaryRecipient}: ${lastError}`,
      );
      break;
    }
  }

  // Exhausted retries or hit non-retryable error
  await logFailure({
    recipient_email: primaryRecipient,
    subject: params.subject,
    from_address: params.from,
    error_code: lastErrorCode,
    error_message: lastError.slice(0, 1000),
    retry_count: attempt,
    function_name: params.functionName,
    payload_summary: params.payloadSummary,
  });

  return {
    success: false,
    error: lastError,
    errorCode: lastErrorCode,
    attempts: attempt,
  };
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (!isNaN(seconds)) return Math.ceil(seconds * 1000);
  const date = Date.parse(header);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

// ---------------------------------------------------------------------------
// Bulk send
// ---------------------------------------------------------------------------
export interface BulkRecipient {
  to: string;
  /** Optional per-recipient overrides if you need personalization. */
  subject?: string;
  html?: string;
  text?: string;
}

export interface SendBulkParams {
  from: string;
  /** Default subject used when a recipient does not override. */
  subject: string;
  /** Default HTML used when a recipient does not override. */
  html?: string;
  /** Default text used when a recipient does not override. */
  text?: string;
  recipients: BulkRecipient[];
  functionName?: string;
  payloadSummary?: Record<string, unknown>;
}

export interface SendBulkResult {
  totalRecipients: number;
  sent: number;
  failed: number;
  batches: number;
}

/**
 * Send a transactional email to many recipients efficiently using Resend's
 * /emails/batch endpoint. Each batch (up to 100 messages) consumes ONE
 * token-bucket request, so 500 recipients = 5 batches = ~2.5 seconds.
 */
export async function sendBulkEmails(params: SendBulkParams): Promise<SendBulkResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("[resendClient] RESEND_API_KEY missing for bulk send");
    return { totalRecipients: params.recipients.length, sent: 0, failed: params.recipients.length, batches: 0 };
  }

  const total = params.recipients.length;
  if (total === 0) {
    return { totalRecipients: 0, sent: 0, failed: 0, batches: 0 };
  }

  let sent = 0;
  let failed = 0;
  let batches = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const slice = params.recipients.slice(i, i + BATCH_SIZE);
    const batchPayload = slice.map((r) => {
      const item: Record<string, unknown> = {
        from: params.from,
        to: [r.to],
        subject: r.subject ?? params.subject,
      };
      const html = r.html ?? params.html;
      const text = r.text ?? params.text;
      if (html) item.html = html;
      if (text) item.text = text;
      return item;
    });

    const result = await sendBatchWithRetry(apiKey, batchPayload, params.functionName, params.payloadSummary);
    batches += 1;
    if (result.success) {
      sent += slice.length;
    } else {
      failed += slice.length;
      // Log one failure row per recipient so admins can grep by email.
      for (const r of slice) {
        await logFailure({
          recipient_email: r.to,
          subject: r.subject ?? params.subject,
          from_address: params.from,
          error_code: result.errorCode ?? "batch_error",
          error_message: (result.error ?? "batch failed").slice(0, 1000),
          retry_count: result.attempts,
          function_name: params.functionName,
          payload_summary: params.payloadSummary,
        });
      }
    }
  }

  console.log(
    `[resendClient] Bulk send complete: ${sent}/${total} sent across ${batches} batch(es), ${failed} failed`,
  );

  return { totalRecipients: total, sent, failed, batches };
}

async function sendBatchWithRetry(
  apiKey: string,
  payload: Record<string, unknown>[],
  functionName?: string,
  _payloadSummary?: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; errorCode?: string; attempts: number }> {
  let attempt = 0;
  let lastError = "unknown";
  let lastErrorCode = "unknown";

  while (attempt < MAX_RETRIES) {
    attempt += 1;
    await acquireToken();

    let response: Response;
    try {
      response = await fetch(RESEND_BATCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      lastError = (err as Error).message;
      lastErrorCode = "network";
      console.error(
        `[resendClient] Bulk network error attempt ${attempt}/${MAX_RETRIES} (${functionName ?? "unknown"}): ${lastError}`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
        continue;
      }
      break;
    }

    if (response.ok) {
      console.log(
        `[resendClient] Batch OK (${payload.length} msgs) attempt ${attempt} for ${functionName ?? "unknown"}`,
      );
      return { success: true, attempts: attempt };
    }

    const errorText = await response.text().catch(() => "");
    lastError = errorText || response.statusText;
    lastErrorCode = String(response.status);

    if (response.status === 429) {
      const retryAfter = parseRetryAfter(response.headers.get("retry-after")) ??
        BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[resendClient] Batch 429 attempt ${attempt}/${MAX_RETRIES}, waiting ${retryAfter}ms`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(retryAfter);
        continue;
      }
    } else if (response.status >= 500) {
      console.warn(
        `[resendClient] Batch 5xx (${response.status}) attempt ${attempt}/${MAX_RETRIES}`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
        continue;
      }
    } else {
      console.error(
        `[resendClient] Batch non-retryable ${response.status}: ${lastError.slice(0, 200)}`,
      );
      break;
    }
  }

  return { success: false, error: lastError, errorCode: lastErrorCode, attempts: attempt };
}
