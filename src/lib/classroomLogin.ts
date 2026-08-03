/**
 * Classroom login: class code + username + 6-digit PIN.
 *
 * The edge function verifies the PIN server-side AND redeems the one-time
 * magic-link token server-side, handing back a ready-made session. That keeps
 * every hosted-Auth call off the school's public IP, so a full class can sign
 * in at once without tripping a per-IP Auth throttle.
 *
 * If the server could not complete the exchange it falls back to returning a
 * token hash, and we redeem it here the old way.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClassroomLoginResult {
  success: boolean;
  error?: string;
  locked?: boolean;
  attemptsRemaining?: number;
  mustResetPin?: boolean;
}

export const isValidClassCode = (v: string) => /^[A-Z0-9]{6}$/.test(v.trim().toUpperCase());
export const isValidPin = (v: string) => /^\d{6}$/.test(v.trim());
export const isValidUsername = (v: string) => /^[a-z0-9._-]{2,32}$/.test(v.trim().toLowerCase());

const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Exponential backoff with jitter so a whole class never retries in lockstep. */
const backoffDelay = (attempt: number) =>
  Math.round(500 * 2 ** attempt + Math.random() * 1500);

interface InvokeOutcome {
  data?: {
    session?: { access_token: string; refresh_token: string } | null;
    token_hash?: string;
    must_reset_pin?: boolean;
    error?: string;
  };
  failure?: {
    error: string;
    locked?: boolean;
    attemptsRemaining?: number;
    retryable?: boolean;
  };
}

async function invokeLogin(body: Record<string, string>): Promise<InvokeOutcome> {
  const { data, error } = await supabase.functions.invoke("classroom-login", { body });

  if (!error) return { data: (data ?? {}) as InvokeOutcome["data"] };

  // Non-2xx responses come back as an error with the body in context.
  let details: any = null;
  let status: number | undefined;
  try {
    status = (error as any)?.context?.status;
    const raw = await (error as any)?.context?.text?.();
    details = raw ? JSON.parse(raw) : null;
  } catch {
    /* ignore parse issues */
  }

  return {
    failure: {
      error: details?.error ?? "We couldn't sign you in. Try again.",
      locked: !!details?.locked,
      attemptsRemaining: details?.attempts_remaining,
      // A student lockout is also a 429, but it must never be retried.
      retryable: !details?.locked && (details?.retryable === true || status === 429),
    },
  };
}

export async function classroomLogin(
  classCode: string,
  username: string,
  pin: string,
): Promise<ClassroomLoginResult> {
  const code = classCode.trim().toUpperCase();
  const user = username.trim().toLowerCase();
  const cleanPin = pin.trim();

  if (!isValidClassCode(code)) return { success: false, error: "Class code is 6 characters." };
  if (!isValidUsername(user)) return { success: false, error: "Enter your username." };
  if (!isValidPin(cleanPin)) return { success: false, error: "Your PIN is 6 numbers." };

  const body = { class_code: code, username: user, pin: cleanPin };

  try {
    let outcome: InvokeOutcome | null = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      outcome = await invokeLogin(body);
      if (!outcome.failure?.retryable) break;
      if (attempt < MAX_ATTEMPTS - 1) await sleep(backoffDelay(attempt));
    }

    if (!outcome || outcome.failure) {
      return {
        success: false,
        error: outcome?.failure?.error ?? "We couldn't sign you in. Try again.",
        locked: outcome?.failure?.locked,
        attemptsRemaining: outcome?.failure?.attemptsRemaining,
      };
    }

    const result = outcome.data ?? {};

    // Preferred path — session already minted by the backend.
    if (result.session?.access_token && result.session?.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
      if (sessionError) {
        return { success: false, error: "We couldn't start your session. Try again." };
      }
      return { success: true, mustResetPin: !!result.must_reset_pin };
    }

    // Fallback path — redeem the one-time token from the browser.
    if (result.token_hash) {
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: result.token_hash,
        type: "email",
      });
      if (otpError) {
        return { success: false, error: "We couldn't start your session. Try again." };
      }
      return { success: true, mustResetPin: !!result.must_reset_pin };
    }

    return { success: false, error: result.error ?? "We couldn't sign you in. Try again." };
  } catch (e) {
    return { success: false, error: (e as Error).message || "Network problem. Try again." };
  }
}
