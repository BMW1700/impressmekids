import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  CHALLENGE_LEVELS,
  ChallengeLevel,
  DEFAULT_CHALLENGE_LEVEL,
  getChallengeThresholds,
} from '@/lib/challengeMeter';

export interface ChallengeSettingsRow {
  student_id: string;
  level: ChallengeLevel;
  overridden_by_teacher: boolean;
  set_by_role: string | null;
  updated_at: string;
  lock_enabled: boolean;
  lock_pin_hash: string | null;
  lock_set_by: string | null;
}

/** SHA-256 hex hash for a PIN, computed in the browser. */
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Loads the Challenge Meter setting for a student.
 * Falls back to level 3 (Standard) if no row exists.
 */
export function useChallengeSettings(studentId: string | null | undefined) {
  const [row, setRow] = useState<ChallengeSettingsRow | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    const { data } = await supabase
      .from('challenge_settings')
      .select(
        'student_id, level, overridden_by_teacher, set_by_role, updated_at, lock_enabled, lock_pin_hash, lock_set_by',
      )
      .eq('student_id', studentId)
      .maybeSingle();
    setRow((data as ChallengeSettingsRow) ?? null);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime: react to parent/teacher edits without a refresh
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`challenge_settings:${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenge_settings', filter: `student_id=eq.${studentId}` },
        (payload) => {
          const next = (payload.new ?? null) as ChallengeSettingsRow | null;
          if (next) setRow(next);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const setLevel = useCallback(
    async (level: ChallengeLevel, opts?: { asTeacherOverride?: boolean; role?: string }) => {
      if (!studentId) return;
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const payload = {
        student_id: studentId,
        level,
        set_by: uid ?? null,
        set_by_role: opts?.role ?? null,
        overridden_by_teacher: opts?.asTeacherOverride ?? false,
        teacher_override_by: opts?.asTeacherOverride ? uid ?? null : null,
        teacher_override_at: opts?.asTeacherOverride ? new Date().toISOString() : null,
      };
      await supabase.from('challenge_settings').upsert(payload, { onConflict: 'student_id' });
      await refresh();
    },
    [studentId, refresh],
  );

  /** Parent PIN lock: sets a hashed PIN so the popover requires it before editing. */
  const setLock = useCallback(
    async (pin: string) => {
      if (!studentId || !pin) return;
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const lock_pin_hash = await hashPin(pin);
      await supabase.from('challenge_settings').upsert(
        {
          student_id: studentId,
          // Preserve current level; upsert requires level to exist. Fall back to default if none.
          level: (row?.level ?? DEFAULT_CHALLENGE_LEVEL) as ChallengeLevel,
          lock_enabled: true,
          lock_pin_hash,
          lock_set_by: uid,
        },
        { onConflict: 'student_id' },
      );
      await refresh();
    },
    [studentId, row?.level, refresh],
  );

  /** Remove the PIN lock. Requires current PIN unless there is no lock. */
  const clearLock = useCallback(async () => {
    if (!studentId) return;
    await supabase
      .from('challenge_settings')
      .update({ lock_enabled: false, lock_pin_hash: null, lock_set_by: null })
      .eq('student_id', studentId);
    await refresh();
  }, [studentId, refresh]);

  /** Client-side PIN check against the stored hash. */
  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!row?.lock_enabled || !row?.lock_pin_hash) return true;
      const h = await hashPin(pin);
      return h === row.lock_pin_hash;
    },
    [row?.lock_enabled, row?.lock_pin_hash],
  );

  const level = (row?.level ?? DEFAULT_CHALLENGE_LEVEL) as ChallengeLevel;
  return {
    row,
    level,
    thresholds: getChallengeThresholds(level),
    label: CHALLENGE_LEVELS[level].label,
    loading,
    lockEnabled: !!row?.lock_enabled,
    setLevel,
    setLock,
    clearLock,
    verifyPin,
    refresh,
  };
}
