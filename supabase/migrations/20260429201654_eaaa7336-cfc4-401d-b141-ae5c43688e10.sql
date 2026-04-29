
-- ============================================================
-- PvP multiplayer hardening v2
-- ============================================================

-- 1. Lock down who can call PvP RPCs (defence-in-depth; functions also check auth.uid()).
REVOKE EXECUTE ON FUNCTION public.submit_pvp_action(uuid, integer, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_multiplayer_room(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_multiplayer_room_state(uuid, jsonb, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_pvp_action(uuid, integer, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_multiplayer_room(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_multiplayer_room_state(uuid, jsonb, text) TO authenticated;

-- 2. Guarantee one event per applied revision per room.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'pvp_room_events_room_rev_uniq'
  ) THEN
    CREATE UNIQUE INDEX pvp_room_events_room_rev_uniq
      ON public.pvp_room_events(room_id, rev);
  END IF;
END $$;

-- 3. Server-side PvP room creation so client never authors canonical game state.
CREATE OR REPLACE FUNCTION public.create_multiplayer_room(
  p_room_code text,
  p_mode text,
  p_story_passage text,
  p_story_title text,
  p_world_number integer,
  p_grade_mode text,
  p_enemy_type text DEFAULT 'guard',
  p_host_name text DEFAULT 'Player 1'
)
RETURNS TABLE(
  id uuid,
  room_code text,
  status text,
  host_id uuid,
  guest_id uuid,
  host_name text,
  guest_name text,
  story_passage text,
  story_title text,
  world_number integer,
  enemy_type text,
  game_state jsonb,
  mode text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_initial_state jsonb;
  v_new_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_mode NOT IN ('pvp', 'coop') THEN
    RAISE EXCEPTION 'Invalid mode';
  END IF;

  IF p_room_code IS NULL OR length(p_room_code) <> 6 THEN
    RAISE EXCEPTION 'Invalid room code';
  END IF;

  IF p_mode = 'pvp' THEN
    v_initial_state := jsonb_build_object(
      'rev', 0,
      'hostHp', 100,
      'guestHp', 100,
      'turn', 'host',
      'phase', 'kid_turn',
      'wordIndex', 0,
      'batchProgress', 0,
      'hostCorrect', 0,
      'guestCorrect', 0,
      'hostStreak', 0,
      'guestStreak', 0,
      'longestStreak', 0,
      'totalDamage', 0,
      'wordsRead', 0,
      'cooldowns', '{}'::jsonb,
      'pendingAbility', NULL,
      'pendingReadWord', NULL,
      'activeMiniGame', NULL,
      'lastEvent', NULL,
      'turnCount', 0
    );
  ELSE
    v_initial_state := jsonb_build_object(
      'hostHp', 100,
      'guestHp', 100,
      'enemyHp', 150,
      'enemyMaxHp', 150,
      'turn', 'host',
      'wordIndex', 0,
      'batchStartIndex', 0,
      'turnWordsRead', 0,
      'hostWords', 0,
      'guestWords', 0,
      'totalCorrect', 0,
      'longestStreak', 0,
      'currentStreak', 0,
      'totalDamage', 0,
      'coopMode', 'continuous',
      'repeatPhase', 1,
      'phase', 'setup',
      'lastEvent', NULL
    );
  END IF;

  INSERT INTO public.multiplayer_rooms (
    room_code, mode, host_id, host_name,
    story_passage, story_title, world_number, grade_mode,
    enemy_type, status, game_state
  ) VALUES (
    p_room_code, p_mode, v_user_id, COALESCE(p_host_name, 'Player 1'),
    COALESCE(p_story_passage, ''), COALESCE(p_story_title, ''),
    COALESCE(p_world_number, 1), COALESCE(p_grade_mode, 'k5'),
    COALESCE(p_enemy_type, 'guard'), 'waiting', v_initial_state
  )
  RETURNING multiplayer_rooms.id INTO v_new_id;

  RETURN QUERY
  SELECT mr.id, mr.room_code, mr.status, mr.host_id, mr.guest_id,
         mr.host_name, mr.guest_name, mr.story_passage, mr.story_title,
         mr.world_number, mr.enemy_type, mr.game_state, mr.mode
  FROM public.multiplayer_rooms mr
  WHERE mr.id = v_new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_multiplayer_room(text, text, text, text, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_multiplayer_room(text, text, text, text, integer, text, text, text) TO authenticated;
