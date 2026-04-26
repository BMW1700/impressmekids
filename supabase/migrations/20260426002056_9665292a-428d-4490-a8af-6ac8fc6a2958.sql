
-- ============================================================
-- Server-authoritative online PvP
-- ============================================================

-- 1. Event log for animations and audit
CREATE TABLE IF NOT EXISTS public.pvp_room_events (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  rev INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,             -- 'host' | 'guest' | 'system'
  target TEXT,                     -- 'host' | 'guest' | null
  damage INTEGER,
  ability_id TEXT,
  message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pvp_room_events_room_idx
  ON public.pvp_room_events(room_id, id);

ALTER TABLE public.pvp_room_events ENABLE ROW LEVEL SECURITY;

-- Allow both participants to read their room's events
DROP POLICY IF EXISTS "Room participants can read pvp events" ON public.pvp_room_events;
CREATE POLICY "Room participants can read pvp events"
  ON public.pvp_room_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.multiplayer_rooms mr
      WHERE mr.id = pvp_room_events.room_id
        AND (mr.host_id = auth.uid() OR mr.guest_id = auth.uid())
    )
  );

-- No client can write directly; only the SECURITY DEFINER function does.
-- (No INSERT/UPDATE/DELETE policies = denied for normal users.)

-- Realtime
ALTER TABLE public.pvp_room_events REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pvp_room_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_room_events;
  END IF;
END $$;

-- 2. Server-authoritative action function
CREATE OR REPLACE FUNCTION public.submit_pvp_action(
  p_room_id UUID,
  p_expected_rev INTEGER,
  p_action TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  game_state JSONB,
  status TEXT,
  updated_at TIMESTAMPTZ,
  applied BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room RECORD;
  v_actor TEXT;          -- 'host' | 'guest'
  v_gs JSONB;
  v_new JSONB;
  v_rev INT;
  v_phase TEXT;
  v_turn TEXT;
  v_host_hp INT;
  v_guest_hp INT;
  v_host_correct INT;
  v_guest_correct INT;
  v_host_streak INT;
  v_guest_streak INT;
  v_longest_streak INT;
  v_total_damage INT;
  v_words_read INT;
  v_word_index INT;
  v_batch_progress INT;
  v_turn_count INT;
  v_cooldowns JSONB;
  v_pending_ability JSONB;
  v_pending_read_word TEXT;
  v_active_minigame TEXT;
  v_status TEXT;
  v_evt_type TEXT;
  v_evt_actor TEXT;
  v_evt_target TEXT;
  v_evt_damage INT;
  v_evt_ability TEXT;
  v_evt_message TEXT;
  v_correct BOOLEAN;
  v_words_in_batch INT;
  v_damage INT;
  v_ability JSONB;
  v_completed INT;
  v_failed INT;
  v_kid_damage INT;
  v_bonus_damage INT;
  v_dec_cd JSONB;
  v_key TEXT;
  v_val INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Lock the room row
  SELECT mr.id, mr.host_id, mr.guest_id, mr.game_state, mr.status
  INTO v_room
  FROM public.multiplayer_rooms mr
  WHERE mr.id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_user_id = v_room.host_id THEN
    v_actor := 'host';
  ELSIF v_user_id = v_room.guest_id THEN
    v_actor := 'guest';
  ELSE
    RAISE EXCEPTION 'Not a participant of this room';
  END IF;

  v_gs := COALESCE(v_room.game_state, '{}'::jsonb);
  v_rev            := COALESCE((v_gs->>'rev')::int, 0);
  v_phase          := COALESCE(v_gs->>'phase', 'kid_turn');
  v_turn           := COALESCE(v_gs->>'turn', 'host');
  v_host_hp        := COALESCE((v_gs->>'hostHp')::int, 100);
  v_guest_hp       := COALESCE((v_gs->>'guestHp')::int, 100);
  v_host_correct   := COALESCE((v_gs->>'hostCorrect')::int, 0);
  v_guest_correct  := COALESCE((v_gs->>'guestCorrect')::int, 0);
  v_host_streak    := COALESCE((v_gs->>'hostStreak')::int, 0);
  v_guest_streak   := COALESCE((v_gs->>'guestStreak')::int, 0);
  v_longest_streak := COALESCE((v_gs->>'longestStreak')::int, 0);
  v_total_damage   := COALESCE((v_gs->>'totalDamage')::int, 0);
  v_words_read     := COALESCE((v_gs->>'wordsRead')::int, 0);
  v_word_index     := COALESCE((v_gs->>'wordIndex')::int, 0);
  v_batch_progress := COALESCE((v_gs->>'batchProgress')::int, 0);
  v_turn_count     := COALESCE((v_gs->>'turnCount')::int, 0);
  v_cooldowns      := COALESCE(v_gs->'cooldowns', '{}'::jsonb);
  v_pending_ability:= v_gs->'pendingAbility';
  v_pending_read_word := v_gs->>'pendingReadWord';
  v_active_minigame := v_gs->>'activeMiniGame';
  v_status := COALESCE(v_room.status, 'active');

  -- Stale rev: do not apply, return canonical state so caller can resync
  IF p_expected_rev IS NOT NULL AND p_expected_rev < v_rev THEN
    RETURN QUERY SELECT v_gs, v_status, now(), false, 'stale_rev';
    RETURN;
  END IF;

  -- Battle already over
  IF v_phase IN ('host_wins', 'guest_wins') THEN
    RETURN QUERY SELECT v_gs, v_status, now(), false, 'battle_over';
    RETURN;
  END IF;

  v_evt_type := NULL;
  v_evt_actor := v_actor;
  v_evt_target := NULL;
  v_evt_damage := NULL;
  v_evt_ability := NULL;
  v_evt_message := NULL;

  -- ============ ACTION DISPATCH ============
  IF p_action = 'student_word_result' THEN
    IF v_actor <> 'host' OR v_phase <> 'kid_turn' OR v_turn <> 'host' THEN
      RETURN QUERY SELECT v_gs, v_status, now(), false, 'wrong_phase';
      RETURN;
    END IF;

    v_correct := COALESCE((p_payload->>'correct')::boolean, false);
    v_words_in_batch := GREATEST(1, LEAST(5, COALESCE((p_payload->>'batchSize')::int, 5)));
    v_words_read := v_words_read + 1;
    v_batch_progress := v_batch_progress + 1;

    IF v_correct THEN
      v_host_correct := v_host_correct + 1;
      v_host_streak := v_host_streak + 1;
      IF v_host_streak > v_longest_streak THEN v_longest_streak := v_host_streak; END IF;

      v_damage := 8 + LEAST(v_host_streak, 5) * 2;
      v_total_damage := v_total_damage + v_damage;
      v_guest_hp := GREATEST(0, v_guest_hp - v_damage);
      v_evt_type := 'attack';
      v_evt_target := 'guest';
      v_evt_damage := v_damage;
      v_evt_message := 'Student attack hits for ' || v_damage || ' damage';

      IF v_guest_hp <= 0 THEN
        v_phase := 'host_wins';
        v_status := 'completed';
      END IF;
    ELSE
      v_host_streak := 0;
      v_damage := 8; -- STUDENT_MISS_DAMAGE
      v_host_hp := GREATEST(0, v_host_hp - v_damage);
      v_evt_type := 'mistake';
      v_evt_target := 'host';
      v_evt_damage := v_damage;
      v_evt_message := 'Student missed the word and took ' || v_damage || ' damage';

      IF v_host_hp <= 0 THEN
        v_phase := 'guest_wins';
        v_status := 'completed';
      END IF;
    END IF;

    -- End of 5-word batch -> parent's turn
    IF v_phase = 'kid_turn' AND v_batch_progress >= v_words_in_batch THEN
      -- Decrement cooldowns
      v_dec_cd := '{}'::jsonb;
      FOR v_key, v_val IN SELECT key, (value)::text::int FROM jsonb_each_text(v_cooldowns) LOOP
        IF v_val > 1 THEN
          v_dec_cd := v_dec_cd || jsonb_build_object(v_key, v_val - 1);
        END IF;
      END LOOP;
      v_cooldowns := v_dec_cd;
      v_turn := 'guest';
      v_phase := 'parent_turn';
      v_word_index := v_word_index + v_words_in_batch;
      v_batch_progress := 0;
      v_turn_count := v_turn_count + 1;
      v_evt_type := COALESCE(v_evt_type, 'turn_switch');
      v_evt_message := COALESCE(v_evt_message, '') || ' — Parent''s turn';
    END IF;

  ELSIF p_action = 'parent_select_ability' THEN
    IF v_actor <> 'guest' OR v_phase <> 'parent_turn' OR v_turn <> 'guest' THEN
      RETURN QUERY SELECT v_gs, v_status, now(), false, 'wrong_phase';
      RETURN;
    END IF;

    v_ability := p_payload->'ability';
    IF v_ability IS NULL THEN
      RETURN QUERY SELECT v_gs, v_status, now(), false, 'missing_ability';
      RETURN;
    END IF;
    v_evt_ability := v_ability->>'id';

    -- Cooldown check
    IF (v_cooldowns ? v_evt_ability) AND (v_cooldowns->>v_evt_ability)::int > 0 THEN
      RETURN QUERY SELECT v_gs, v_status, now(), false, 'on_cooldown';
      RETURN;
    END IF;

    IF (v_ability->>'type') = 'minigame' THEN
      v_active_minigame := v_ability->>'miniGame';
      v_phase := 'mini_game';
      v_evt_type := 'ability';
      v_evt_message := 'Parent triggered ' || COALESCE(v_ability->>'name', 'mini-game');
      IF COALESCE((v_ability->>'cooldown')::int, 0) > 0 THEN
        v_cooldowns := v_cooldowns || jsonb_build_object(v_evt_ability, (v_ability->>'cooldown')::int);
      END IF;
    ELSIF COALESCE((v_ability->>'requiresReading')::boolean, false) THEN
      v_pending_ability := v_ability;
      v_pending_read_word := COALESCE(p_payload->>'readWord', v_ability->>'name');
      v_phase := 'parent_reading';
      v_evt_type := 'ability';
      v_evt_message := 'Parent must read a word for bonus damage';
    ELSE
      v_damage := COALESCE((v_ability->>'damage')::int, 0);
      v_total_damage := v_total_damage + v_damage;
      v_host_hp := GREATEST(0, v_host_hp - v_damage);
      v_evt_type := 'ability';
      v_evt_target := 'host';
      v_evt_damage := v_damage;
      v_evt_message := 'Parent uses ' || COALESCE(v_ability->>'name', 'ability') || ' for ' || v_damage || ' damage';
      IF COALESCE((v_ability->>'cooldown')::int, 0) > 0 THEN
        v_cooldowns := v_cooldowns || jsonb_build_object(v_evt_ability, (v_ability->>'cooldown')::int);
      END IF;
      IF v_host_hp <= 0 THEN
        v_phase := 'guest_wins';
        v_status := 'completed';
      ELSE
        v_turn := 'host';
        v_phase := 'kid_turn';
        v_batch_progress := 0;
        v_turn_count := v_turn_count + 1;
      END IF;
    END IF;

  ELSIF p_action = 'parent_read_result' THEN
    IF v_actor <> 'guest' OR v_phase <> 'parent_reading' THEN
      RETURN QUERY SELECT v_gs, v_status, now(), false, 'wrong_phase';
      RETURN;
    END IF;
    IF v_pending_ability IS NULL THEN
      RETURN QUERY SELECT v_gs, v_status, now(), false, 'no_pending_ability';
      RETURN;
    END IF;

    v_correct := COALESCE((p_payload->>'correct')::boolean, false);
    v_damage := COALESCE((v_pending_ability->>'damage')::int, 0);
    IF v_correct THEN v_damage := v_damage + 5; END IF;
    v_evt_ability := v_pending_ability->>'id';
    v_total_damage := v_total_damage + v_damage;
    v_host_hp := GREATEST(0, v_host_hp - v_damage);
    v_evt_type := 'ability';
    v_evt_target := 'host';
    v_evt_damage := v_damage;
    v_evt_message := 'Parent ' || COALESCE(v_pending_ability->>'name', 'ability') ||
                     CASE WHEN v_correct THEN ' + reading bonus = ' ELSE ' for ' END ||
                     v_damage || ' damage';

    IF COALESCE((v_pending_ability->>'cooldown')::int, 0) > 0 THEN
      v_cooldowns := v_cooldowns || jsonb_build_object(v_evt_ability, (v_pending_ability->>'cooldown')::int);
    END IF;
    v_pending_ability := NULL;
    v_pending_read_word := NULL;

    IF v_host_hp <= 0 THEN
      v_phase := 'guest_wins';
      v_status := 'completed';
    ELSE
      v_turn := 'host';
      v_phase := 'kid_turn';
      v_batch_progress := 0;
      v_turn_count := v_turn_count + 1;
    END IF;

  ELSIF p_action = 'mini_game_complete' THEN
    IF v_actor <> 'guest' OR v_phase <> 'mini_game' THEN
      RETURN QUERY SELECT v_gs, v_status, now(), false, 'wrong_phase';
      RETURN;
    END IF;
    v_completed := COALESCE((p_payload->>'completed')::int, 0);
    v_failed := COALESCE((p_payload->>'failed')::int, 0);
    v_kid_damage := v_failed * 5;
    v_bonus_damage := v_completed * 3;
    IF v_kid_damage > 0 THEN
      v_host_hp := GREATEST(0, v_host_hp - v_kid_damage);
      v_total_damage := v_total_damage + v_kid_damage;
    END IF;
    IF v_bonus_damage > 0 THEN
      v_guest_hp := GREATEST(0, v_guest_hp - v_bonus_damage);
    END IF;
    v_evt_ability := v_active_minigame;
    v_active_minigame := NULL;
    v_evt_type := 'ability';
    v_evt_target := 'host';
    v_evt_damage := v_kid_damage;
    v_evt_message := 'Mini-game done — ' || v_completed || ' caught, ' || v_failed || ' missed';

    IF v_host_hp <= 0 THEN
      v_phase := 'guest_wins'; v_status := 'completed';
    ELSIF v_guest_hp <= 0 THEN
      v_phase := 'host_wins'; v_status := 'completed';
    ELSE
      v_turn := 'host';
      v_phase := 'kid_turn';
      v_batch_progress := 0;
      v_turn_count := v_turn_count + 1;
    END IF;

  ELSIF p_action = 'resync' THEN
    -- Just return canonical state
    RETURN QUERY SELECT v_gs, v_status, now(), true, 'resync';
    RETURN;

  ELSE
    RETURN QUERY SELECT v_gs, v_status, now(), false, 'unknown_action';
    RETURN;
  END IF;

  -- Build new game_state
  v_rev := v_rev + 1;
  v_new := jsonb_build_object(
    'rev', v_rev,
    'phase', v_phase,
    'turn', v_turn,
    'hostHp', v_host_hp,
    'guestHp', v_guest_hp,
    'hostCorrect', v_host_correct,
    'guestCorrect', v_guest_correct,
    'hostStreak', v_host_streak,
    'guestStreak', v_guest_streak,
    'longestStreak', v_longest_streak,
    'totalDamage', v_total_damage,
    'wordsRead', v_words_read,
    'wordIndex', v_word_index,
    'batchProgress', v_batch_progress,
    'turnCount', v_turn_count,
    'cooldowns', v_cooldowns,
    'pendingAbility', v_pending_ability,
    'pendingReadWord', v_pending_read_word,
    'activeMiniGame', v_active_minigame,
    'lastEvent', jsonb_build_object(
      'type', v_evt_type,
      'by', v_evt_actor,
      'target', v_evt_target,
      'damage', v_evt_damage,
      'abilityId', v_evt_ability,
      'message', v_evt_message,
      'rev', v_rev,
      'timestamp', extract(epoch from now()) * 1000
    )
  );

  UPDATE public.multiplayer_rooms
  SET game_state = v_new,
      status = v_status,
      updated_at = now()
  WHERE id = p_room_id;

  -- Log event
  INSERT INTO public.pvp_room_events (
    room_id, rev, event_type, actor, target, damage, ability_id, message, payload
  ) VALUES (
    p_room_id, v_rev, COALESCE(v_evt_type, 'state'), v_evt_actor,
    v_evt_target, v_evt_damage, v_evt_ability, v_evt_message, p_payload
  );

  RETURN QUERY SELECT v_new, v_status, now(), true, 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_pvp_action(UUID, INTEGER, TEXT, JSONB) TO authenticated;
