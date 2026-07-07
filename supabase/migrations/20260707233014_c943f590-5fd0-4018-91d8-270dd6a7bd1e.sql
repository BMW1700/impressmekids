
CREATE TABLE public.prek_level_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade_mode text NOT NULL DEFAULT 'k5',
  world_number int NOT NULL,
  level_number int NOT NULL,
  best_stars smallint NOT NULL DEFAULT 0,
  best_score int NOT NULL DEFAULT 0,
  words_read int NOT NULL DEFAULT 0,
  correct_words int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, grade_mode, world_number, level_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_level_completions TO authenticated;
GRANT ALL ON public.prek_level_completions TO service_role;

ALTER TABLE public.prek_level_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own prek completions"
  ON public.prek_level_completions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX prek_level_completions_user_mode_idx
  ON public.prek_level_completions (user_id, grade_mode);

-- Backfill from campaign_progress.world_progress. For each completed story
-- title, look up the matching published prek_level (by world_number +
-- title match) and insert a completion row with a safe 2-star default.
INSERT INTO public.prek_level_completions
  (user_id, grade_mode, world_number, level_number, best_stars, best_score, words_read, correct_words)
SELECT
  cp.student_id,
  cp.grade_mode,
  (wp.key)::int AS world_number,
  pl.level_number,
  2 AS best_stars,
  0, 0, 0
FROM public.campaign_progress cp
CROSS JOIN LATERAL jsonb_each(cp.world_progress) AS wp(key, value)
CROSS JOIN LATERAL jsonb_array_elements_text(wp.value) AS story_title
JOIN public.prek_worlds pw
  ON pw.world_number = (wp.key)::int
JOIN public.prek_levels pl
  ON pl.world_id = pw.id
 AND lower(trim(pl.title)) = lower(trim(story_title))
WHERE cp.grade_mode = 'k5'
  AND jsonb_typeof(wp.value) = 'array'
ON CONFLICT (user_id, grade_mode, world_number, level_number)
DO NOTHING;
