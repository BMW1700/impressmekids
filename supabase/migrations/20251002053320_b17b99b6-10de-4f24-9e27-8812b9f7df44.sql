-- Fix submit_answer_tx function variable declaration issue

CREATE OR REPLACE FUNCTION public.submit_answer_tx(
  p_match_id uuid,
  p_seq smallint,
  p_tournament_player_id uuid,
  p_answer_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_question_id uuid;
  v_answer_deadline timestamptz;
  v_buzz_owner uuid;
  v_canonical_answer text;
  v_question_type text;
  v_correct boolean := false;
  v_points integer := 0;
  v_player_a uuid;
  v_player_b uuid;
  v_other_player uuid;
  v_grading_method text := 'exact';
  v_levenshtein_distance integer;
  v_match_status text;
  v_score_a integer;
  v_score_b integer;
BEGIN
  -- Lock and get match event details
  SELECT me.id, me.question_id, me.answer_deadline, me.buzz_owner_tournament_player_id,
         q.answer_text, q.question_type,
         m.player_a, m.player_b, m.score_a, m.score_b, m.status
  INTO v_event_id, v_question_id, v_answer_deadline, v_buzz_owner,
       v_canonical_answer, v_question_type,
       v_player_a, v_player_b, v_score_a, v_score_b, v_match_status
  FROM match_events me
  JOIN questions q ON q.id = me.question_id
  JOIN matches m ON m.id = me.match_id
  WHERE me.match_id = p_match_id AND me.seq = p_seq
  FOR UPDATE OF me;

  -- Validate deadline
  IF now() > v_answer_deadline THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Answer deadline expired'
    );
  END IF;

  -- Validate player is buzz owner
  IF v_buzz_owner != p_tournament_player_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You did not buzz in'
    );
  END IF;

  -- Grade the answer
  -- 1. Try exact match (case-insensitive)
  IF lower(trim(p_answer_text)) = lower(trim(v_canonical_answer)) THEN
    v_correct := true;
    v_grading_method := 'exact';
  -- 2. Try fuzzy matching (Levenshtein distance <= 2)
  ELSIF v_question_type = 'short' THEN
    v_levenshtein_distance := compute_levenshtein(p_answer_text, v_canonical_answer);
    IF v_levenshtein_distance <= 2 THEN
      v_correct := true;
      v_grading_method := 'fuzzy';
    END IF;
  END IF;

  -- Award points if correct
  IF v_correct THEN
    v_points := 10; -- Default point value
  END IF;

  -- Update match scores
  IF v_correct THEN
    IF p_tournament_player_id = v_player_a THEN
      UPDATE matches
      SET score_a = score_a + v_points
      WHERE id = p_match_id;
    ELSE
      UPDATE matches
      SET score_b = score_b + v_points
      WHERE id = p_match_id;
    END IF;
  END IF;

  -- Update match event
  UPDATE match_events
  SET answered_by_tournament_player_id = p_tournament_player_id,
      answer_text = p_answer_text,
      correct = v_correct,
      resolved_at = now()
  WHERE id = v_event_id;

  -- Insert answer record
  INSERT INTO answers (match_event_id, tournament_player_id, answer_text, correct, points_awarded, grading_method)
  VALUES (v_event_id, p_tournament_player_id, p_answer_text, v_correct, v_points, v_grading_method);

  -- If incorrect, enable opponent fallback
  IF NOT v_correct THEN
    v_other_player := CASE WHEN p_tournament_player_id = v_player_a THEN v_player_b ELSE v_player_a END;
    
    -- Allow opponent to answer by resetting buzz state
    UPDATE match_events
    SET buzz_owner_tournament_player_id = v_other_player,
        buzz_at = now(),
        answer_deadline = now() + interval '10 seconds'
    WHERE id = v_event_id;

    UPDATE match_state
    SET accepting_buzz = true
    WHERE match_id = p_match_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'correct', v_correct,
    'points_awarded', v_points,
    'grading_method', v_grading_method
  );
END;
$$;