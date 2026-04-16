/**
 * Student ID sign-in rate limiting helpers.
 *
 * We don't have access to the real client IP from the browser, so we derive
 * a stable per-device "ip_hash" by combining a persistent device id with the
 * current day. This is a soft control — a determined attacker can rotate
 * device ids — but combined with the per-Student-ID limit (5/5min) it makes
 * brute-forcing 8-digit IDs impractical from a single client.
 *
 * Real per-IP enforcement happens at the Supabase Auth GoTrue layer; this
 * is the additional Student-ID-specific layer.
 */

import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "nl_device_id_v1";

const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // Private mode / no storage — fall back to per-session id
    return "nostorage-" + Math.random().toString(36).slice(2);
  }
};

const sha256Hex = async (input: string): Promise<string> => {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/** Stable hash representing this device for the current UTC day. */
export const getClientRateLimitHash = async (): Promise<string> => {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  return sha256Hex(`${getDeviceId()}|${day}`);
};

export interface RateCheckResult {
  allowed: boolean;
  error?: string;
}

/** Call BEFORE signInWithPassword for a Student ID account. */
export const checkStudentIdSigninRate = async (
  studentId: string,
): Promise<RateCheckResult> => {
  const ipHash = await getClientRateLimitHash();
  const { data, error } = await supabase.rpc("check_student_id_signin_rate", {
    p_ip_hash: ipHash,
    p_student_id_attempt: studentId,
  });
  if (error) {
    // Fail-open: don't lock users out if the RPC errors. Log for monitoring.
    console.warn("[rate-limit] check failed:", error);
    return { allowed: true };
  }
  const result = data as { allowed: boolean; error?: string };
  return { allowed: !!result?.allowed, error: result?.error };
};

/** Call AFTER a successful Student ID sign-in to clear the failed-attempt mark. */
export const recordStudentIdSigninSuccess = async (
  studentId: string,
): Promise<void> => {
  const ipHash = await getClientRateLimitHash();
  const { error } = await supabase.rpc("record_student_id_signin_success", {
    p_ip_hash: ipHash,
    p_student_id_attempt: studentId,
  });
  if (error) console.warn("[rate-limit] success-record failed:", error);
};
