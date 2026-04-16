/**
 * Student ID sign-in rate limiting helpers.
 *
 * PRIMARY path: call the `check-student-signin-rate` edge function which
 * reads the REAL client IP from `x-forwarded-for` and hashes it with a
 * server-side salt. This is the only meaningful per-IP defense against
 * brute-force across the 100M Student-ID space.
 *
 * FALLBACK: if the edge function is unreachable, fall back to the previous
 * device-id-derived hash + direct DB RPC. This is bypassable but keeps the
 * per-Student-ID limit (5/5min) active so attackers can't pound a single ID.
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

/** Stable hash representing this device for the current UTC day (fallback only). */
const getFallbackHash = async (): Promise<string> => {
  const day = new Date().toISOString().slice(0, 10);
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
  // Primary: real-IP edge function
  try {
    const { data, error } = await supabase.functions.invoke(
      "check-student-signin-rate",
      { body: { student_id: studentId } },
    );
    if (!error && data) {
      const result = data as { allowed: boolean; error?: string };
      return { allowed: !!result.allowed, error: result.error };
    }
    console.warn("[rate-limit] edge fn unavailable, falling back:", error);
  } catch (e) {
    console.warn("[rate-limit] edge fn threw, falling back:", e);
  }

  // Fallback: device-id hash + direct DB RPC (still enforces per-ID limit)
  const ipHash = await getFallbackHash();
  const { data, error } = await supabase.rpc("check_student_id_signin_rate", {
    p_ip_hash: ipHash,
    p_student_id_attempt: studentId,
  });
  if (error) {
    console.warn("[rate-limit] fallback RPC failed:", error);
    return { allowed: true }; // fail-open
  }
  const result = data as { allowed: boolean; error?: string };
  return { allowed: !!result?.allowed, error: result?.error };
};

/** Call AFTER a successful Student ID sign-in to clear the failed-attempt mark. */
export const recordStudentIdSigninSuccess = async (
  studentId: string,
): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke(
      "record-student-signin-success",
      { body: { student_id: studentId } },
    );
    if (!error) return;
    console.warn("[rate-limit] success-record edge fn failed:", error);
  } catch (e) {
    console.warn("[rate-limit] success-record edge fn threw:", e);
  }

  // Fallback to device-hash path so the local row gets cleared too
  const ipHash = await getFallbackHash();
  const { error } = await supabase.rpc("record_student_id_signin_success", {
    p_ip_hash: ipHash,
    p_student_id_attempt: studentId,
  });
  if (error) console.warn("[rate-limit] fallback success-record failed:", error);
};
