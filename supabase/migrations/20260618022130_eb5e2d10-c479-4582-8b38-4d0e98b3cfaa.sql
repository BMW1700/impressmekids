
-- v4 Pre-K Audio Overlay Editor schema
-- 1) Per-level audio settings + nominal video durations for editor layout
ALTER TABLE public.prek_levels
  ADD COLUMN IF NOT EXISTS audio_master_volume numeric(4,2) NOT NULL DEFAULT 1.0
    CHECK (audio_master_volume >= 0 AND audio_master_volume <= 2),
  ADD COLUMN IF NOT EXISTS mute_source_video_audio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opening_video_duration_seconds numeric(7,2),
  ADD COLUMN IF NOT EXISTS closing_video_duration_seconds numeric(7,2);

-- 2) Per-word nominal hold time (editor only) + video durations
ALTER TABLE public.prek_level_words
  ADD COLUMN IF NOT EXISTS word_hold_seconds numeric(5,2) NOT NULL DEFAULT 3.0
    CHECK (word_hold_seconds >= 0.5 AND word_hold_seconds <= 60),
  ADD COLUMN IF NOT EXISTS first_video_duration_seconds numeric(7,2),
  ADD COLUMN IF NOT EXISTS second_video_duration_seconds numeric(7,2);

-- 3) Tracks table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prek_level_audio_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.prek_levels(id) ON DELETE CASCADE,
  track_index int NOT NULL,
  name text NOT NULL DEFAULT 'Track',
  volume numeric(4,2) NOT NULL DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 2),
  muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level_id, track_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_level_audio_tracks TO authenticated;
GRANT ALL ON public.prek_level_audio_tracks TO service_role;

ALTER TABLE public.prek_level_audio_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads tracks for published levels"
  ON public.prek_level_audio_tracks
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.prek_levels l
      WHERE l.id = prek_level_audio_tracks.level_id AND l.is_published = true
    )
  );

CREATE POLICY "Super admins manage audio tracks"
  ON public.prek_level_audio_tracks
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 4) Clips table ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prek_level_audio_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.prek_levels(id) ON DELETE CASCADE,
  track_index int NOT NULL,
  sort_order int NOT NULL DEFAULT 0,

  storage_path text NOT NULL,
  display_name text NOT NULL DEFAULT 'Audio Clip',
  duration_seconds numeric(7,2),

  -- Anchor (start point for all modes)
  anchor_scene_key text NOT NULL,
  anchor_edge text NOT NULL DEFAULT 'start'
    CHECK (anchor_edge IN ('start','end')),
  anchor_offset_seconds numeric(7,2) NOT NULL DEFAULT 0,

  -- Mode
  duration_mode text NOT NULL DEFAULT 'fixed'
    CHECK (duration_mode IN ('fixed','fill-scene','fill-level','span-videos')),

  -- Span-videos end anchor (NULL except for span-videos mode)
  end_anchor_scene_key text,
  end_anchor_edge text CHECK (end_anchor_edge IN ('start','end')),
  end_anchor_offset_seconds numeric(7,2),

  -- Mix
  volume numeric(4,2) NOT NULL DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 2),
  fade_in_seconds numeric(4,2) NOT NULL DEFAULT 0 CHECK (fade_in_seconds >= 0),
  fade_out_seconds numeric(4,2) NOT NULL DEFAULT 0 CHECK (fade_out_seconds >= 0),
  loop_clip boolean NOT NULL DEFAULT false,
  pause_on_word_card boolean NOT NULL DEFAULT true,

  -- Trim
  trim_start_seconds numeric(7,2) NOT NULL DEFAULT 0 CHECK (trim_start_seconds >= 0),
  trim_end_seconds numeric(7,2),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT span_videos_requires_end_anchor CHECK (
    duration_mode <> 'span-videos'
    OR (end_anchor_scene_key IS NOT NULL
        AND end_anchor_edge IS NOT NULL
        AND end_anchor_offset_seconds IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS prek_level_audio_clips_level_idx
  ON public.prek_level_audio_clips(level_id, track_index, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_level_audio_clips TO authenticated;
GRANT ALL ON public.prek_level_audio_clips TO service_role;

ALTER TABLE public.prek_level_audio_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads clips for published levels"
  ON public.prek_level_audio_clips
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.prek_levels l
      WHERE l.id = prek_level_audio_clips.level_id AND l.is_published = true
    )
  );

CREATE POLICY "Super admins manage audio clips"
  ON public.prek_level_audio_clips
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 5) updated_at triggers
CREATE OR REPLACE FUNCTION public.prek_audio_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prek_audio_tracks_updated_at ON public.prek_level_audio_tracks;
CREATE TRIGGER trg_prek_audio_tracks_updated_at
  BEFORE UPDATE ON public.prek_level_audio_tracks
  FOR EACH ROW EXECUTE FUNCTION public.prek_audio_touch_updated_at();

DROP TRIGGER IF EXISTS trg_prek_audio_clips_updated_at ON public.prek_level_audio_clips;
CREATE TRIGGER trg_prek_audio_clips_updated_at
  BEFORE UPDATE ON public.prek_level_audio_clips
  FOR EACH ROW EXECUTE FUNCTION public.prek_audio_touch_updated_at();
