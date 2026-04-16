/**
 * Helpers for classroom join codes.
 *
 * - `peekClassJoinCode`: pre-validates a code BEFORE signup so K-5 students
 *   get clear visual confirmation ("Join Ms. Smith's Grade 3 Reading?")
 *   instead of a silent toast after the fact.
 * - `redeemClassJoinCode`: SECURITY DEFINER RPC that enrolls the student
 *   immediately after Student ID signup using their own auth session.
 */

import { supabase } from "@/integrations/supabase/client";

export interface RedeemResult {
  success: boolean;
  classroomId?: string;
  error?: string;
}

export interface PeekResult {
  valid: boolean;
  classroomName?: string;
  teacherName?: string;
  subject?: string;
  grade?: number;
  error?: string;
}

/** Validate format only (does not hit the DB). */
export const isValidClassJoinCode = (code: string): boolean =>
  /^[A-Z0-9]{6}$/i.test(code.trim());

/** Pre-validate a class code without enrolling. Safe to call before signup. */
export const peekClassJoinCode = async (
  joinCode: string,
): Promise<PeekResult> => {
  if (!isValidClassJoinCode(joinCode)) {
    return { valid: false, error: "Code must be 6 characters" };
  }
  const { data, error } = await supabase.rpc("peek_classroom_join_code", {
    p_join_code: joinCode,
  });
  if (error) {
    return { valid: false, error: error.message };
  }
  const result = data as {
    valid: boolean;
    classroom_name?: string;
    teacher_name?: string;
    subject?: string;
    grade?: number;
    error?: string;
  };
  return {
    valid: !!result?.valid,
    classroomName: result?.classroom_name,
    teacherName: result?.teacher_name,
    subject: result?.subject,
    grade: result?.grade,
    error: result?.error,
  };
};

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
