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
      .select('student_id, level, overridden_by_teacher, set_by_role, updated_at')
      .eq('student_id', studentId)
      .maybeSingle();
    setRow((data as ChallengeSettingsRow) ?? null);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  const level = (row?.level ?? DEFAULT_CHALLENGE_LEVEL) as ChallengeLevel;
  return {
    row,
    level,
    thresholds: getChallengeThresholds(level),
    label: CHALLENGE_LEVELS[level].label,
    loading,
    setLevel,
    refresh,
  };
}
