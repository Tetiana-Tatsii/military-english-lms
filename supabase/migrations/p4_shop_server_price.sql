-- =============================================================
-- P4 / Shop: buy_shop_item — ціна ТІЛЬКИ з серверного каталогу
--
-- Було: клієнт передавав p_price → можна купити за 0.
-- Стало: клієнт передає лише p_item_id; ціна з CASE у RPC.
--
-- Каталог має збігатися з src/lib/gamification.ts → SHOP_ITEMS
-- =============================================================

-- Нова сигнатура (1 аргумент)
CREATE OR REPLACE FUNCTION public.buy_shop_item(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         text;
  v_coins           integer;
  v_purchased       jsonb;
  v_price           integer;
  v_already_owned   boolean;
  v_new_coins       integer;
  v_new_purchased   jsonb;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  -- Server-side price catalogue (must match SHOP_ITEMS in app)
  v_price := CASE p_item_id
    WHEN 'coffee'   THEN 0
    WHEN 'snickers' THEN 30
    WHEN 'energy'   THEN 40
    WHEN 'thermos'  THEN 50
    WHEN 'boots'    THEN 60
    ELSE NULL
  END;

  IF v_price IS NULL THEN
    RETURN jsonb_build_object('error', 'unknown_item');
  END IF;

  SELECT coffee_coins, purchased_items
    INTO v_coins, v_purchased
    FROM public.profiles
   WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  IF v_purchased IS NULL OR jsonb_typeof(v_purchased) <> 'array' THEN
    v_purchased := '[]'::jsonb;
  END IF;

  v_already_owned := (v_price = 0) OR EXISTS (
    SELECT 1
      FROM jsonb_array_elements_text(v_purchased) AS elem
     WHERE elem = p_item_id
  );

  IF NOT v_already_owned AND v_coins < v_price THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  v_new_coins := CASE WHEN v_already_owned THEN v_coins ELSE v_coins - v_price END;

  IF v_already_owned OR v_price = 0 THEN
    v_new_purchased := v_purchased;
  ELSE
    v_new_purchased := v_purchased || jsonb_build_array(p_item_id);
  END IF;

  UPDATE public.profiles
     SET coffee_coins = v_new_coins,
         purchased_items = v_new_purchased,
         active_instructor_item = p_item_id
   WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'coffeeCoins', v_new_coins,
    'purchasedItems', v_new_purchased,
    'activeInstructorItem', p_item_id,
    'charged', (NOT v_already_owned AND v_price > 0),
    'priceCharged', CASE WHEN NOT v_already_owned THEN v_price ELSE 0 END
  );
END;
$$;

-- Прибрати стару перегрузку з p_price (інакше PostgREST може плутатись)
DROP FUNCTION IF EXISTS public.buy_shop_item(text, integer);

REVOKE ALL ON FUNCTION public.buy_shop_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_shop_item(text) TO authenticated;

-- Перевірка сигнатури
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'buy_shop_item';

-- Baseline
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
