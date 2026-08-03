/**
 * Classroom login: class code + username + 6-digit PIN.
 *
 * The edge function verifies the PIN server-side and returns a one-time
 * magic-link token hash. We exchange it for a real session with
 * verifyOtp(), so no password or internal email ever touches the client.
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

  try {
    const { data, error } = await supabase.functions.invoke("classroom-login", {
      body: { class_code: code, username: user, pin: cleanPin },
    });

    // Non-2xx responses come back as an error with the body in context.
    if (error) {
      let details: any = null;
      try {
        const raw = await (error as any)?.context?.text?.();
        details = raw ? JSON.parse(raw) : null;
      } catch {
        /* ignore parse issues */
      }
      return {
        success: false,
        error: details?.error ?? "We couldn't sign you in. Try again.",
        locked: !!details?.locked,
        attemptsRemaining: details?.attempts_remaining,
      };
    }

    const result = (data ?? {}) as {
      token_hash?: string;
      must_reset_pin?: boolean;
      error?: string;
    };

    if (!result.token_hash) {
      return { success: false, error: result.error ?? "We couldn't sign you in. Try again." };
    }

    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: result.token_hash,
      type: "email",
    });

    if (otpError) {
      return { success: false, error: "We couldn't start your session. Try again." };
    }

    return { success: true, mustResetPin: !!result.must_reset_pin };
  } catch (e) {
    return { success: false, error: (e as Error).message || "Network problem. Try again." };
  }
}
