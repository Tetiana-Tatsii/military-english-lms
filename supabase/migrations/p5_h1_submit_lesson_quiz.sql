-- =============================================================
-- P5 / H1 — Server-side quiz grading + award
--
-- Was: client writes quiz_results.correct_count, award_quiz_coins trusts it
-- Now: submit_lesson_quiz grades from lms_lessons.content->quiz;
--      award_quiz_coins recomputes from stored answers (no client trust);
--      students lose INSERT/UPDATE on quiz_results (DEFINER only).
--
-- Deploy WITH matching frontend (useCourseLessonPage + quiz/gamification).
-- Run in Supabase Dashboard → SQL Editor.
-- =============================================================

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

-- ── 1. Grade helper (index or option-text answers, mirrors src/lib/quiz.ts) ──
CREATE OR REPLACE FUNCTION private.grade_quiz_answers(
  p_quiz jsonb,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_correct integer := 0;
  v_i integer;
  v_q jsonb;
  v_options jsonb;
  v_opt_len integer;
  v_qid text;
  v_user_ans text;
  v_correct_raw text;
  v_selected_idx integer;
  v_correct_idx integer;
  v_j integer;
  v_score integer;
BEGIN
  IF p_quiz IS NULL OR jsonb_typeof(p_quiz) <> 'array' THEN
    RETURN jsonb_build_object('error', 'invalid_quiz');
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    p_answers := '{}'::jsonb;
  END IF;

  v_total := jsonb_array_length(p_quiz);
  IF v_total = 0 THEN
    RETURN jsonb_build_object('error', 'empty_quiz');
  END IF;

  FOR v_i IN 0 .. v_total - 1 LOOP
    v_q := p_quiz->v_i;
    v_qid := v_q->>'id';
    v_options := COALESCE(v_q->'options', '[]'::jsonb);
    IF jsonb_typeof(v_options) <> 'array' THEN
      v_options := '[]'::jsonb;
    END IF;
    v_opt_len := jsonb_array_length(v_options);
    v_user_ans := p_answers->>v_qid;
    v_correct_raw := v_q->>'correctAnswer';

    v_selected_idx := NULL;
    v_correct_idx := NULL;

    IF v_user_ans IS NOT NULL AND v_user_ans <> '' THEN
      IF v_user_ans ~ '^\d+$' THEN
        v_selected_idx := v_user_ans::integer;
        IF v_selected_idx < 0 OR v_selected_idx >= v_opt_len THEN
          v_selected_idx := NULL;
        END IF;
      END IF;

      IF v_selected_idx IS NULL THEN
        FOR v_j IN 0 .. v_opt_len - 1 LOOP
          IF (v_options->>v_j) = v_user_ans THEN
            v_selected_idx := v_j;
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;

    IF v_correct_raw IS NOT NULL AND v_correct_raw <> '' THEN
      IF v_correct_raw ~ '^\d+$' THEN
        v_correct_idx := v_correct_raw::integer;
        IF v_correct_idx < 0 OR v_correct_idx >= v_opt_len THEN
          v_correct_idx := NULL;
        END IF;
      END IF;

      IF v_correct_idx IS NULL THEN
        FOR v_j IN 0 .. v_opt_len - 1 LOOP
          IF (v_options->>v_j) = v_correct_raw THEN
            v_correct_idx := v_j;
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;

    IF v_selected_idx IS NOT NULL
       AND v_correct_idx IS NOT NULL
       AND v_selected_idx = v_correct_idx THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;

  v_score := round((v_correct::numeric / v_total::numeric) * 100)::integer;

  RETURN jsonb_build_object(
    'correctCount', v_correct,
    'totalQuestions', v_total,
    'score', v_score
  );
END;
$$;

REVOKE ALL ON FUNCTION private.grade_quiz_answers(jsonb, jsonb) FROM PUBLIC;
-- Only other DEFINER RPCs call this; no direct client access
REVOKE ALL ON FUNCTION private.grade_quiz_answers(jsonb, jsonb) FROM anon, authenticated;

-- ── 2. submit_lesson_quiz ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_lesson_quiz(
  p_lesson_id text,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
  v_content jsonb;
  v_quiz jsonb;
  v_grade jsonb;
  v_correct integer;
  v_score integer;
  v_total integer;
  v_existing public.quiz_results%ROWTYPE;
  v_result public.quiz_results%ROWTYPE;
  v_award jsonb;
  v_qid text;
  v_q jsonb;
  v_i integer;
  v_ans text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF p_lesson_id IS NULL OR btrim(p_lesson_id) = '' THEN
    RETURN jsonb_build_object('error', 'invalid_lesson');
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RETURN jsonb_build_object('error', 'invalid_answers');
  END IF;

  SELECT content
    INTO v_content
    FROM public.lms_lessons
   WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'lesson_not_found');
  END IF;

  v_quiz := v_content->'quiz';
  IF v_quiz IS NULL OR jsonb_typeof(v_quiz) <> 'array' OR jsonb_array_length(v_quiz) = 0 THEN
    RETURN jsonb_build_object('error', 'no_quiz');
  END IF;

  -- Require an answer for every question
  FOR v_i IN 0 .. jsonb_array_length(v_quiz) - 1 LOOP
    v_q := v_quiz->v_i;
    v_qid := v_q->>'id';
    v_ans := p_answers->>v_qid;
    IF v_ans IS NULL OR btrim(v_ans) = '' THEN
      RETURN jsonb_build_object('error', 'incomplete_answers');
    END IF;
  END LOOP;

  v_grade := private.grade_quiz_answers(v_quiz, p_answers);
  IF v_grade ? 'error' THEN
    RETURN jsonb_build_object('error', v_grade->>'error');
  END IF;

  v_correct := (v_grade->>'correctCount')::integer;
  v_score := (v_grade->>'score')::integer;
  v_total := (v_grade->>'totalQuestions')::integer;

  SELECT *
    INTO v_existing
    FROM public.quiz_results
   WHERE user_id = v_user_id
     AND lesson_id = p_lesson_id;

  IF FOUND THEN
    -- Heal stored score/correct_count from server grade of *stored* answers
    -- (do not overwrite answers on re-submit)
    v_grade := private.grade_quiz_answers(v_quiz, COALESCE(v_existing.answers, '{}'::jsonb));
    IF NOT (v_grade ? 'error') THEN
      UPDATE public.quiz_results
         SET score = (v_grade->>'score')::integer,
             correct_count = (v_grade->>'correctCount')::integer
       WHERE id = v_existing.id
       RETURNING * INTO v_result;
    ELSE
      v_result := v_existing;
    END IF;

    v_award := public.award_quiz_coins(p_lesson_id);

    RETURN jsonb_build_object(
      'ok', true,
      'alreadySubmitted', true,
      'score', v_result.score,
      'correctCount', COALESCE(v_result.correct_count, 0),
      'totalQuestions', v_total,
      'answers', v_result.answers,
      'coinsAwarded', COALESCE((v_award->>'coinsAwarded')::integer, 0),
      'alreadyAwarded', COALESCE((v_award->>'alreadyAwarded')::boolean, false),
      'newCoffeeCoins', COALESCE((v_award->>'newCoffeeCoins')::integer, 0),
      'awardError', v_award->>'error'
    );
  END IF;

  INSERT INTO public.quiz_results (
    user_id,
    lesson_id,
    score,
    correct_count,
    answers
  ) VALUES (
    v_user_id,
    p_lesson_id,
    v_score,
    v_correct,
    p_answers
  )
  RETURNING * INTO v_result;

  v_award := public.award_quiz_coins(p_lesson_id);

  RETURN jsonb_build_object(
    'ok', true,
    'alreadySubmitted', false,
    'score', v_result.score,
    'correctCount', COALESCE(v_result.correct_count, v_correct),
    'totalQuestions', v_total,
    'answers', v_result.answers,
    'coinsAwarded', COALESCE((v_award->>'coinsAwarded')::integer, 0),
    'alreadyAwarded', COALESCE((v_award->>'alreadyAwarded')::boolean, false),
    'newCoffeeCoins', COALESCE((v_award->>'newCoffeeCoins')::integer, 0),
    'awardError', v_award->>'error'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lesson_quiz(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_lesson_quiz(text, jsonb) TO authenticated;

-- ── 3. Harden award_quiz_coins — recompute, never trust client count ──
CREATE OR REPLACE FUNCTION public.award_quiz_coins(p_lesson_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       text;
  v_result        public.quiz_results%ROWTYPE;
  v_content       jsonb;
  v_quiz          jsonb;
  v_grade         jsonb;
  v_amount        integer;
  v_new_coins     integer;
  v_ref_id        text;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF p_lesson_id IS NULL OR btrim(p_lesson_id) = '' THEN
    RETURN jsonb_build_object('error', 'invalid_lesson');
  END IF;

  SELECT coffee_coins
    INTO v_new_coins
    FROM public.profiles
   WHERE id = v_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  SELECT *
    INTO v_result
    FROM public.quiz_results
   WHERE user_id = v_user_id
     AND lesson_id = p_lesson_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'quiz_result_not_found');
  END IF;

  v_ref_id := v_result.id::text;

  IF EXISTS (
    SELECT 1
      FROM public.coin_ledger
     WHERE user_id = v_user_id
       AND reason = 'quiz'
       AND ref_type = 'quiz_results'
       AND ref_id = v_ref_id
  ) THEN
    RETURN jsonb_build_object(
      'error', null,
      'alreadyAwarded', true,
      'coinsAwarded', 0,
      'correctCount', COALESCE(v_result.correct_count, 0),
      'newCoffeeCoins', COALESCE(v_new_coins, 0)
    );
  END IF;

  SELECT content INTO v_content
    FROM public.lms_lessons
   WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'lesson_not_found');
  END IF;

  v_quiz := v_content->'quiz';
  v_grade := private.grade_quiz_answers(v_quiz, COALESCE(v_result.answers, '{}'::jsonb));

  IF v_grade ? 'error' THEN
    RETURN jsonb_build_object('error', v_grade->>'error');
  END IF;

  v_amount := (v_grade->>'correctCount')::integer;

  -- Persist healed values
  UPDATE public.quiz_results
     SET correct_count = v_amount,
         score = (v_grade->>'score')::integer
   WHERE id = v_result.id;

  IF v_amount < 0 THEN
    RETURN jsonb_build_object('error', 'invalid_correct_count');
  END IF;

  IF v_amount > 100 THEN
    RETURN jsonb_build_object('error', 'correct_count_too_high');
  END IF;

  IF v_amount = 0 THEN
    RETURN jsonb_build_object(
      'error', null,
      'alreadyAwarded', false,
      'coinsAwarded', 0,
      'correctCount', 0,
      'newCoffeeCoins', COALESCE(v_new_coins, 0)
    );
  END IF;

  UPDATE public.profiles
     SET coffee_coins = COALESCE(coffee_coins, 0) + v_amount
   WHERE id = v_user_id
   RETURNING coffee_coins INTO v_new_coins;

  INSERT INTO public.coin_ledger (user_id, amount, reason, ref_type, ref_id)
  VALUES (v_user_id, v_amount, 'quiz', 'quiz_results', v_ref_id);

  RETURN jsonb_build_object(
    'error', null,
    'alreadyAwarded', false,
    'coinsAwarded', v_amount,
    'correctCount', v_amount,
    'newCoffeeCoins', v_new_coins
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_quiz_coins(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_quiz_coins(text) TO authenticated;

-- ── 4. Lock down client writes on quiz_results ────────────────
DROP POLICY IF EXISTS "Users can insert own quiz_results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can upsert own quiz_results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can update own quiz_results" ON public.quiz_results;

-- Keep SELECT policies (own + teachers)

-- ── 5. Verify ─────────────────────────────────────────────────
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'quiz_results'
ORDER BY cmd, policyname;

SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE (n.nspname = 'public' AND p.proname IN ('submit_lesson_quiz', 'award_quiz_coins'))
   OR (n.nspname = 'private' AND p.proname = 'grade_quiz_answers')
ORDER BY n.nspname, p.proname;

SELECT 'quiz_results' AS t, count(*) FROM public.quiz_results
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'coin_ledger', count(*) FROM public.coin_ledger;
