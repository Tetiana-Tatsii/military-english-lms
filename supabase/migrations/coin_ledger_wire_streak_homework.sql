-- =============================================================
-- coin_ledger: wire homework + daily streak awards
--
-- Run AFTER coin_ledger_award_quiz.sql
-- Safe to re-run (idempotent CREATE OR REPLACE).
--
-- Quiz already writes to coin_ledger.
-- This updates:
--   • award_homework_coins  → reason 'homework', ref answers.id
--   • process_daily_streak  → reason 'streak',   ref date (YYYY-MM-DD)
--
-- Shop purchases = spending (not awards) — out of scope here.
-- No backfill for past awards (balances already on profiles).
-- =============================================================

-- ── 1. Homework ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_homework_coins(
  p_answer_id uuid,
  p_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answer        public.answers%ROWTYPE;
  v_student_id    text;
  v_new_coins     integer;
  v_ref_id        text;
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 20 THEN
    RETURN jsonb_build_object('error', 'invalid_amount');
  END IF;

  SELECT * INTO v_answer
    FROM public.answers
   WHERE id = p_answer_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'answer_not_found');
  END IF;

  v_ref_id := p_answer_id::text;

  IF v_answer.coins_awarded THEN
    RETURN jsonb_build_object(
      'error', 'already_awarded',
      'coinsAwardedAmount', COALESCE(v_answer.coins_awarded_amount, 0)
    );
  END IF;

  -- Extra idempotency via ledger (covers race / re-run)
  IF EXISTS (
    SELECT 1
      FROM public.coin_ledger
     WHERE reason = 'homework'
       AND ref_type = 'answers'
       AND ref_id = v_ref_id
  ) THEN
    RETURN jsonb_build_object(
      'error', 'already_awarded',
      'coinsAwardedAmount', COALESCE(v_answer.coins_awarded_amount, 0)
    );
  END IF;

  v_student_id := v_answer.user_id::text;

  IF v_student_id IS NULL OR v_student_id = '' THEN
    SELECT id::text INTO v_student_id
      FROM public.profiles
     WHERE name = v_answer.student_name
     LIMIT 1;
  END IF;

  IF v_student_id IS NULL OR v_student_id = '' THEN
    RETURN jsonb_build_object('error', 'student_not_found');
  END IF;

  -- Lock student wallet
  SELECT coffee_coins INTO v_new_coins
    FROM public.profiles
   WHERE id = v_student_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'student_not_found');
  END IF;

  UPDATE public.profiles
     SET coffee_coins = COALESCE(coffee_coins, 0) + p_amount
   WHERE id = v_student_id
   RETURNING coffee_coins INTO v_new_coins;

  UPDATE public.answers
     SET coins_awarded = true,
         coins_awarded_amount = p_amount
   WHERE id = p_answer_id;

  INSERT INTO public.coin_ledger (user_id, amount, reason, ref_type, ref_id)
  VALUES (v_student_id, p_amount, 'homework', 'answers', v_ref_id);

  RETURN jsonb_build_object(
    'error', null,
    'studentId', v_student_id,
    'coinsAwardedAmount', p_amount,
    'newCoffeeCoins', v_new_coins
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_homework_coins(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_homework_coins(uuid, integer) TO authenticated;

-- ── 2. Daily streak ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_daily_streak()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      text;
  v_last_login   date;
  v_streak       integer;
  v_coins        integer;
  v_today        date := CURRENT_DATE;
  v_yesterday    date := CURRENT_DATE - 1;
  v_new_streak   integer;
  v_coins_earned integer;
  v_new_coins    integer;
  v_consecutive  boolean;
  v_ref_id       text;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0,
      'newStreak', 0,
      'newCoffeeCoins', 0,
      'isMilestone', false,
      'wasStreakBroken', false,
      'error', 'not_authenticated'
    );
  END IF;

  SELECT last_login_date, streak_count, coffee_coins
    INTO v_last_login, v_streak, v_coins
    FROM public.profiles
   WHERE id = v_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0,
      'newStreak', 0,
      'newCoffeeCoins', 0,
      'isMilestone', false,
      'wasStreakBroken', false,
      'error', 'profile_not_found'
    );
  END IF;

  IF v_last_login = v_today THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0,
      'newStreak', v_streak,
      'newCoffeeCoins', v_coins,
      'isMilestone', v_streak > 0 AND v_streak % 7 = 0,
      'wasStreakBroken', false
    );
  END IF;

  v_ref_id := v_today::text;

  -- Idempotent vs concurrent double-login the same day
  IF EXISTS (
    SELECT 1
      FROM public.coin_ledger
     WHERE user_id = v_user_id
       AND reason = 'streak'
       AND ref_type = 'daily_login'
       AND ref_id = v_ref_id
  ) THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0,
      'newStreak', v_streak,
      'newCoffeeCoins', v_coins,
      'isMilestone', v_streak > 0 AND v_streak % 7 = 0,
      'wasStreakBroken', false
    );
  END IF;

  v_consecutive := (v_last_login = v_yesterday);
  v_new_streak := CASE WHEN v_consecutive THEN v_streak + 1 ELSE 1 END;
  v_coins_earned := CASE WHEN v_new_streak % 7 = 0 THEN 7 ELSE 1 END;
  v_new_coins := v_coins + v_coins_earned;

  UPDATE public.profiles
     SET last_login_date = v_today,
         streak_count = v_new_streak,
         coffee_coins = v_new_coins
   WHERE id = v_user_id;

  INSERT INTO public.coin_ledger (user_id, amount, reason, ref_type, ref_id)
  VALUES (v_user_id, v_coins_earned, 'streak', 'daily_login', v_ref_id);

  RETURN jsonb_build_object(
    'coinsEarned', v_coins_earned,
    'newStreak', v_new_streak,
    'newCoffeeCoins', v_new_coins,
    'isMilestone', v_new_streak % 7 = 0,
    'wasStreakBroken', NOT v_consecutive AND v_last_login IS NOT NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_daily_streak() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_daily_streak() TO authenticated;

-- ── 3. Verify ─────────────────────────────────────────────────
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('award_homework_coins', 'process_daily_streak', 'award_quiz_coins')
ORDER BY p.proname;

SELECT reason, count(*) AS rows
FROM public.coin_ledger
GROUP BY reason
ORDER BY reason;
