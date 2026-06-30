-- Atomic daily streak + coin reward (bypasses RLS safely via auth.uid())
-- Run in Supabase Dashboard → SQL Editor

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
   WHERE id = v_user_id;

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

  v_consecutive := (v_last_login = v_yesterday);
  v_new_streak := CASE WHEN v_consecutive THEN v_streak + 1 ELSE 1 END;
  v_coins_earned := CASE WHEN v_new_streak % 7 = 0 THEN 7 ELSE 1 END;
  v_new_coins := v_coins + v_coins_earned;

  UPDATE public.profiles
     SET last_login_date = v_today,
         streak_count = v_new_streak,
         coffee_coins = v_new_coins
   WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'coinsEarned', v_coins_earned,
    'newStreak', v_new_streak,
    'newCoffeeCoins', v_new_coins,
    'isMilestone', v_new_streak % 7 = 0,
    'wasStreakBroken', NOT v_consecutive AND v_last_login IS NOT NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_daily_streak() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_daily_streak() TO authenticated;
