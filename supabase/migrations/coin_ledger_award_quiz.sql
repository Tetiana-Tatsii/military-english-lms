-- =============================================================
-- coin_ledger + award_quiz_coins
--
-- Run in Supabase Dashboard → SQL Editor (production).
-- Safe to re-run (idempotent).
--
-- Логіка: 1 правильна відповідь = 1 кава-коїн (без стелі 10).
-- Нарахування один раз на результат тесту (ledger UNIQUE).
-- =============================================================

-- ── 1. correct_count on quiz_results ──────────────────────────
ALTER TABLE public.quiz_results
  ADD COLUMN IF NOT EXISTS correct_count integer;

COMMENT ON COLUMN public.quiz_results.correct_count IS
  'Number of correct answers; coffee coins awarded 1:1 via award_quiz_coins.';

-- ── 2. coin_ledger ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  reason text NOT NULL
    CHECK (reason IN ('quiz', 'homework', 'streak', 'manual', 'other')),
  ref_type text,
  ref_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotency: one award per (user, reason, ref)
CREATE UNIQUE INDEX IF NOT EXISTS coin_ledger_idempotent_idx
  ON public.coin_ledger (user_id, reason, ref_type, ref_id)
  WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS coin_ledger_user_id_idx
  ON public.coin_ledger (user_id);

CREATE INDEX IF NOT EXISTS coin_ledger_created_at_idx
  ON public.coin_ledger (created_at DESC);

COMMENT ON TABLE public.coin_ledger IS
  'Append-only audit of coffee coin awards. Writes only via SECURITY DEFINER RPCs.';

ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coin_ledger_select_own" ON public.coin_ledger;
CREATE POLICY "coin_ledger_select_own"
  ON public.coin_ledger FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR private.is_teacher_or_admin()
  );

-- No direct INSERT/UPDATE/DELETE for clients

-- ── 3. award_quiz_coins ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_quiz_coins(p_lesson_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       text;
  v_result        public.quiz_results%ROWTYPE;
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

  -- Lock profile first so concurrent award calls serialize per user
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

  -- Already awarded?
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

  IF v_result.correct_count IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'missing_correct_count',
      'hint', 'Re-submit is blocked; old rows without correct_count are not auto-awarded.'
    );
  END IF;

  v_amount := v_result.correct_count;

  -- Sanity: non-negative; soft upper bound against tampering (not a product "max 10")
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

-- ── 4. Verify ─────────────────────────────────────────────────
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quiz_results'
  AND column_name = 'correct_count';

SELECT 'coin_ledger' AS table_name, count(*)::text AS rows
FROM public.coin_ledger;

SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'award_quiz_coins';
