-- Modify submit_answer_tx function to add -5 point penalty for wrong answers
CREATE OR REPLACE FUNCTION submit_answer_tx(
  p_match_id UUID,
  p_match_event_id UUID,
  p_tournament_player_id UUID,
  p_answer_text TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct BOOLEAN;
  v_points INT := 0;
  v_match RECORD;
  v_player_a UUID;
  v_player_b UUID;
  v_question_id UUID;
  v_correct_answer TEXT;
BEGIN
  -- Get match data
  SELECT player_a, player_b INTO v_player_a, v_player_b
  FROM matches WHERE id = p_match_id;

  -- Get question and correct answer
  SELECT me.question_id INTO v_question_id
  FROM match_events me WHERE me.id = p_match_event_id;

  SELECT correct_answer INTO v_correct_answer
  FROM questions WHERE id = v_question_id;

  -- Check if answer is correct (case-insensitive)
  v_correct := LOWER(TRIM(p_answer_text)) = LOWER(TRIM(v_correct_answer));

  -- Award or deduct points based on correctness
  IF v_correct THEN
    v_points := 10;  -- Correct answer: +10 points
  ELSE
    v_points := -5;  -- Wrong answer: -5 points (penalty)
  END IF;

  -- Update match score
  IF p_tournament_player_id = v_player_a THEN
    UPDATE matches SET score_a = score_a + v_points WHERE id = p_match_id;
  ELSE
    UPDATE matches SET score_b = score_b + v_points WHERE id = p_match_id;
  END IF;

  -- Update match_event with answer
  UPDATE match_events
  SET 
    answered_by_tournament_player_id = p_tournament_player_id,
    answer_text = p_answer_text,
    correct = v_correct,
    resolved_at = NOW()
  WHERE id = p_match_event_id;

  -- Insert answer record
  INSERT INTO answers (
    match_event_id,
    tournament_player_id,
    answer_text,
    correct,
    grading_method,
    points_awarded
  ) VALUES (
    p_match_event_id,
    p_tournament_player_id,
    p_answer_text,
    v_correct,
    'auto',
    v_points
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'correct', v_correct,
    'points_awarded', v_points
  );
END;
$$;