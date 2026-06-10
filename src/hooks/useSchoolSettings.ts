import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SchoolSettings {
  school_mode_enabled: boolean;
  pseudonymize_ai_requests: boolean;
  audio_retention_days: number;
  data_retention_months: number;
  disable_session_replay_for_students: boolean;
}

const DEFAULTS: SchoolSettings = {
  school_mode_enabled: true,
  pseudonymize_ai_requests: true,
  audio_retention_days: 90,
  data_retention_months: 24,
  disable_session_replay_for_students: true,
};

/**
 * Read the singleton `school_settings` row. Used to drive school-mode
 * guards across the app (e.g. extra child-safety toggles, AI behavior,
 * audio retention windows).
 */
export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("school_settings")
        .select(
          "school_mode_enabled, pseudonymize_ai_requests, audio_retention_days, data_retention_months, disable_session_replay_for_students",
        )
        .maybeSingle();
      if (cancelled) return;
      if (data) setSettings({ ...DEFAULTS, ...data });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
