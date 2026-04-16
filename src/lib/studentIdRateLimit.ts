/**
 * Student ID sign-in rate limiting helpers.
 *
 * FERPA/COPPA-aligned: this module collects ZERO personal information.
 * - No IP address (handled server-side, and even there we pass a constant)
 * - No localStorage device identifier
 * - No browser fingerprint
 *
 * The only rate-limit signal is the 8-digit Student ID itself (5 failed
 * attempts / 5 minutes), enforced by the `check-student-signin-rate`
 * edge function. If the edge function is unreachable we fail open —
 * better than locking real students out.
 */

import { supabase } from "@/integrations/supabase/client";

export interface RateCheckResult {
  allowed: boolean;
  error?: string;
}

/** Call BEFORE signInWithPassword for a Student ID account. */
export const checkStudentIdSigninRate = async (
  studentId: string,
): Promise<RateCheckResult> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "check-student-signin-rate",
      { body: { student_id: studentId } },
    );
    if (error) {
      console.warn("[rate-limit] edge fn error, failing open:", error);
      return { allowed: true };
    }
    const result = (data ?? {}) as { allowed?: boolean; error?: string };
    return { allowed: result.allowed !== false, error: result.error };
  } catch (e) {
    console.warn("[rate-limit] edge fn threw, failing open:", e);
    return { allowed: true };
  }
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
    if (error) console.warn("[rate-limit] success-record edge fn failed:", error);
  } catch (e) {
    console.warn("[rate-limit] success-record edge fn threw:", e);
  }
};
