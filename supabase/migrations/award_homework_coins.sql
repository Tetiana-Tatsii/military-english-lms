-- Teacher awards homework coins (SECURITY DEFINER — bypasses profiles UPDATE RLS)
-- Re-run in Supabase SQL Editor (fixes uuid = text type mismatch)

ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS coins_awarded_amount INTEGER NOT NULL DEFAULT 0;

-- Drop old signature if it was created with text param
DROP FUNCTION IF EXISTS public.award_homework_coins(text, integer);

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
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 20 THEN
    RETURN jsonb_build_object('error', 'invalid_amount');
  END IF;

  SELECT * INTO v_answer
    FROM public.answers
   WHERE id = p_answer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'answer_not_found');
  END IF;

  IF v_answer.coins_awarded THEN
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

  UPDATE public.profiles
     SET coffee_coins = COALESCE(coffee_coins, 0) + p_amount
   WHERE id = v_student_id
   RETURNING coffee_coins INTO v_new_coins;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'student_not_found');
  END IF;

  UPDATE public.answers
     SET coins_awarded = true,
         coins_awarded_amount = p_amount
   WHERE id = p_answer_id;

  RETURN jsonb_build_object(
    'error', null,
    'studentId', v_student_id,
    'coinsAwardedAmount', p_amount,
    'newCoffeeCoins', v_new_coins
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_homework_coins(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_homework_coins(uuid, integer) TO authenticated;
