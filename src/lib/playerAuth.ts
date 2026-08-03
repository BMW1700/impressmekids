/**
 * Player auth for the main portal, routed through our own edge function.
 *
 * Hosted Auth throttles per public IP (~30 sign-ups + sign-ins per 5 minutes).
 * A classroom of 30 kids is a single IP, so calling hosted Auth from the
 * browser puts the whole class in one bucket. `player-auth` performs the call
 * server-side and hands back a ready-made session, which we apply here with
 * setSession(). The school network never touches hosted Auth.
 *
 * If the function is unreachable we fall back to the direct browser call so
 * nothing breaks mid-deploy.
 */

import { supabase } from "@/integrations/supabase/client";
import { withAuthBurstRetry } from "@/lib/authBurstRetry";

export interface PlayerAuthResult {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
  joinedClass?: boolean;
  /** True when the account exists but no session was issued — ask them to sign in. */
  signInRequired?: boolean;
}

interface EdgeResponse {
  success?: boolean;
  error?: string;
  retryable?: boolean;
  account_created?: boolean;
  joined_class?: boolean;
  needs_email_confirmation?: boolean;
  session?: { access_token: string; refresh_token: string } | null;
}

interface EdgeOutcome {
  data?: EdgeResponse;
  failure?: { error: string; retryable: boolean; status?: number };
}

async function invoke(body: Record<string, unknown>): Promise<EdgeOutcome> {
  const { data, error } = await supabase.functions.invoke("player-auth", { body });
  if (!error) return { data: (data ?? {}) as EdgeResponse };

  let details: EdgeResponse | null = null;
  let status: number | undefined;
  try {
    status = (error as any)?.context?.status;
    const raw = await (error as any)?.context?.text?.();
    details = raw ? JSON.parse(raw) : null;
  } catch {
    /* ignore */
  }

  if (!details && !status) {
    // Network / function unreachable — the caller should fall back.
    return { failure: { error: "unreachable", retryable: false } };
  }

  return {
    failure: {
      error: details?.error ?? "We couldn't sign you in. Try again.",
      retryable: details?.retryable === true || status === 429,
      status,
    },
  };
}

const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Jittered backoff so a whole class never retries in lockstep. */
const backoff = (attempt: number) => Math.round(600 * 2 ** attempt + Math.random() * 1500);

async function invokeWithRetry(body: Record<string, unknown>): Promise<EdgeOutcome> {
  let outcome = await invoke(body);
  for (let attempt = 0; attempt < MAX_ATTEMPTS - 1; attempt++) {
    if (!outcome.failure?.retryable) return outcome;
    await sleep(backoff(attempt));
    outcome = await invoke(body);
  }
  return outcome;
}

async function applySession(session: { access_token: string; refresh_token: string }) {
  const { error } = await supabase.auth.setSession(session);
  return !error;
}

/** True when the edge function itself could not be reached at all. */
const isUnreachable = (o: EdgeOutcome) => o.failure?.error === "unreachable";

export interface SignUpArgs {
  mode: "email" | "studentId";
  email?: string;
  studentId?: string;
  password: string;
  fullName: string;
  role?: "game_player" | "student";
  joinCode?: string;
  redirectTo?: string;
  /** Direct hosted-Auth call used only if the edge function is unreachable. */
  fallback: () => Promise<PlayerAuthResult>;
}

export async function playerSignUp(args: SignUpArgs): Promise<PlayerAuthResult> {
  const outcome = await invokeWithRetry({
    action: "signup",
    mode: args.mode,
    email: args.email,
    student_id: args.studentId,
    password: args.password,
    full_name: args.fullName,
    role: args.role ?? "game_player",
    join_code: args.joinCode,
    redirect_to: args.redirectTo,
  });

  if (isUnreachable(outcome)) return args.fallback();

  const data = outcome.data;
  if (outcome.failure || !data) {
    if (outcome.failure?.status === 202 || data?.account_created) {
      return { success: false, signInRequired: true, error: outcome.failure?.error };
    }
    return { success: false, error: outcome.failure?.error ?? "Sign up failed." };
  }

  if (data.account_created && !data.session) {
    return { success: false, signInRequired: true, error: data.error };
  }

  if (data.session) {
    if (!(await applySession(data.session))) {
      return { success: false, error: "We couldn't start your session. Try signing in." };
    }
  }

  return {
    success: true,
    needsEmailConfirmation: !!data.needs_email_confirmation,
    joinedClass: data.joined_class,
  };
}

export interface LoginArgs {
  mode: "email" | "studentId";
  email?: string;
  studentId?: string;
  password: string;
  fallback: () => Promise<PlayerAuthResult>;
}

export async function playerLogin(args: LoginArgs): Promise<PlayerAuthResult> {
  const outcome = await invokeWithRetry({
    action: "login",
    mode: args.mode,
    email: args.email,
    student_id: args.studentId,
    password: args.password,
  });

  if (isUnreachable(outcome)) return args.fallback();

  const data = outcome.data;
  if (outcome.failure || !data?.session) {
    return { success: false, error: outcome.failure?.error ?? "Wrong details. Please try again." };
  }

  if (!(await applySession(data.session))) {
    return { success: false, error: "We couldn't start your session. Try again." };
  }
  return { success: true };
}

/** Direct browser signup, kept only as the unreachable-function fallback. */
export async function directSignUpFallback(
  email: string,
  password: string,
  metadata: Record<string, unknown>,
  redirectTo?: string,
): Promise<PlayerAuthResult> {
  const { data, error } = await withAuthBurstRetry(() =>
    supabase.auth.signUp({ email, password, options: { data: metadata, emailRedirectTo: redirectTo } }),
  );
  if (error) return { success: false, error: error.message };
  return { success: true, needsEmailConfirmation: !!data.user && !data.session };
}

/** Direct browser login, kept only as the unreachable-function fallback. */
export async function directLoginFallback(
  email: string,
  password: string,
): Promise<PlayerAuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
