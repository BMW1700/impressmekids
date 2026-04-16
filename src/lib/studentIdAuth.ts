/**
 * Student ID Authentication Helpers
 * 
 * Maps 8-digit Student IDs to synthetic emails for Supabase Auth.
 * Students never see the synthetic email — it's purely internal.
 * This ensures FERPA/COPPA compliance by not collecting student PII (email).
 */

export const STUDENT_INTERNAL_DOMAIN = 'student.nabulearn.internal';

/** Check if input looks like a Student ID (8 digits) */
export const isStudentId = (input: string): boolean => /^\d{8}$/.test(input.trim());

/** Convert a Student ID to a synthetic internal email for Supabase Auth */
export const toSyntheticEmail = (studentId: string): string =>
  `${studentId.trim()}@${STUDENT_INTERNAL_DOMAIN}`;

/** Check if an email is a synthetic student email */
export const isSyntheticStudentEmail = (email: string): boolean =>
  email.endsWith(`@${STUDENT_INTERNAL_DOMAIN}`);

/** Extract Student ID from a synthetic email (returns null if not synthetic) */
export const extractStudentIdFromEmail = (email: string): string | null => {
  if (!isSyntheticStudentEmail(email)) return null;
  return email.split('@')[0] || null;
};
