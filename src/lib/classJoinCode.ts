/**
 * Helper to redeem a classroom join code immediately after Student ID signup.
 * Uses the SECURITY DEFINER RPC `redeem_classroom_join_code` so the student's
 * own session is enough to safely insert into `classroom_students`.
 */

import { supabase } from "@/integrations/supabase/client";

export interface RedeemResult {
  success: boolean;
  classroomId?: string;
  error?: string;
}

/** Validate format only (does not hit the DB). */
export const isValidClassJoinCode = (code: string): boolean =>
  /^[A-Z0-9]{6}$/i.test(code.trim());

export const redeemClassJoinCode = async (
  studentId: string,
  joinCode: string,
): Promise<RedeemResult> => {
  if (!isValidClassJoinCode(joinCode)) {
    return { success: false, error: "Class code must be 6 characters" };
  }
  const { data, error } = await supabase.rpc("redeem_classroom_join_code", {
    p_student_id: studentId,
    p_join_code: joinCode,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const result = data as { success: boolean; classroom_id?: string; error?: string };
  return {
    success: !!result?.success,
    classroomId: result?.classroom_id,
    error: result?.error,
  };
};
