-- =============================================================
-- Hotfix: courses not loading + login broken after RLS changes
-- Run in Supabase SQL Editor
-- =============================================================

-- ── 1. Courses & lessons: guaranteed read for logged-in users ──
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved users can view courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow all lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow public read lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "lms_courses_select_authenticated" ON public.lms_courses;

CREATE POLICY "lms_courses_select_authenticated"
  ON public.lms_courses FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "lms_lessons_select" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_all" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_select_authenticated" ON public.lms_lessons;

CREATE POLICY "lms_lessons_select_authenticated"
  ON public.lms_lessons FOR SELECT
  TO authenticated
  USING (true);


-- ── 2. Login helper (fallback when Auth password out of sync) ──
-- SECURITY DEFINER: reads password hash server-side; not exposed via SELECT on table.
CREATE OR REPLACE FUNCTION public.get_profile_for_login(p_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.profiles
  WHERE name ILIKE trim(p_name)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'role', v_row.role,
    'status', v_row.status,
    'squad_id', v_row.squad_id,
    'password_hash', v_row.password
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_for_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_for_login(text) TO anon, authenticated;


-- ── 3. Gamification RPCs: restore SECURITY DEFINER ───────────
-- (INVOKER can fail when profile UPDATE is restricted by RLS edge cases)
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
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0, 'newStreak', 0, 'newCoffeeCoins', 0,
      'isMilestone', false, 'wasStreakBroken', false, 'error', 'not_authenticated'
    );
  END IF;

  SELECT last_login_date, streak_count, coffee_coins
    INTO v_last_login, v_streak, v_coins
    FROM public.profiles WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0, 'newStreak', 0, 'newCoffeeCoins', 0,
      'isMilestone', false, 'wasStreakBroken', false, 'error', 'profile_not_found'
    );
  END IF;

  IF v_last_login = v_today THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0, 'newStreak', v_streak, 'newCoffeeCoins', v_coins,
      'isMilestone', v_streak > 0 AND v_streak % 7 = 0, 'wasStreakBroken', false
    );
  END IF;

  v_consecutive := (v_last_login = v_yesterday);
  v_new_streak := CASE WHEN v_consecutive THEN v_streak + 1 ELSE 1 END;
  v_coins_earned := CASE WHEN v_new_streak % 7 = 0 THEN 7 ELSE 1 END;
  v_new_coins := v_coins + v_coins_earned;

  UPDATE public.profiles
     SET last_login_date = v_today, streak_count = v_new_streak, coffee_coins = v_new_coins
   WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'coinsEarned', v_coins_earned, 'newStreak', v_new_streak, 'newCoffeeCoins', v_new_coins,
    'isMilestone', v_new_streak % 7 = 0,
    'wasStreakBroken', NOT v_consecutive AND v_last_login IS NOT NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_shop_item(p_item_id text, p_price integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text; v_coins integer; v_purchased jsonb;
  v_already_owned boolean; v_new_coins integer; v_new_purchased jsonb;
BEGIN
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT coffee_coins, purchased_items INTO v_coins, v_purchased
  FROM public.profiles WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  IF v_purchased IS NULL OR jsonb_typeof(v_purchased) <> 'array' THEN
    v_purchased := '[]'::jsonb;
  END IF;

  v_already_owned := (p_price = 0) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(v_purchased) AS elem WHERE elem = p_item_id
  );

  IF NOT v_already_owned AND v_coins < p_price THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  v_new_coins := CASE WHEN v_already_owned THEN v_coins ELSE v_coins - p_price END;
  v_new_purchased := CASE
    WHEN v_already_owned OR p_price = 0 THEN v_purchased
    ELSE v_purchased || jsonb_build_array(p_item_id)
  END;

  UPDATE public.profiles
     SET coffee_coins = v_new_coins, purchased_items = v_new_purchased,
         active_instructor_item = p_item_id
   WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'coffeeCoins', v_new_coins, 'purchasedItems', v_new_purchased,
    'activeInstructorItem', p_item_id, 'charged', (NOT v_already_owned AND p_price > 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_daily_streak() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.buy_shop_item(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_daily_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_shop_item(text, integer) TO authenticated;
