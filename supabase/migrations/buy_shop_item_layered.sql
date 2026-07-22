-- =============================================================
-- buy_shop_item: layered equip (refreshment vs equipment)
--
-- Run AFTER gamification_inventory_v1.sql
-- Safe to re-run.
--
-- Refreshment: only one equipped; updates active_instructor_item
-- Equipment: stacks (does not unequip other equipment / refreshment)
-- =============================================================

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
  v_kind            text;
  v_already_owned   boolean;
  v_new_coins       integer;
  v_new_purchased   jsonb;
  v_charged         boolean;
  v_active_item     text;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  v_kind := public.shop_item_kind(p_item_id);
  IF v_kind IS NULL THEN
    RETURN jsonb_build_object('error', 'unknown_item');
  END IF;

  -- Only shop-purchasable kinds here (companions / victory via module rewards later)
  IF v_kind NOT IN ('refreshment', 'equipment') THEN
    RETURN jsonb_build_object('error', 'not_purchasable');
  END IF;

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

  SELECT coffee_coins, purchased_items, active_instructor_item
    INTO v_coins, v_purchased, v_active_item
    FROM public.profiles
   WHERE id = v_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  IF v_purchased IS NULL OR jsonb_typeof(v_purchased) <> 'array' THEN
    v_purchased := '[]'::jsonb;
  END IF;

  v_already_owned := (v_price = 0)
    OR EXISTS (
         SELECT 1 FROM public.user_inventory
          WHERE user_id = v_user_id AND item_id = p_item_id
       )
    OR EXISTS (
         SELECT 1 FROM jsonb_array_elements_text(v_purchased) AS elem
          WHERE elem = p_item_id
       );

  IF NOT v_already_owned AND v_coins < v_price THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  v_charged := (NOT v_already_owned AND v_price > 0);
  v_new_coins := CASE WHEN v_charged THEN v_coins - v_price ELSE v_coins END;

  IF v_already_owned OR v_price = 0 THEN
    v_new_purchased := v_purchased;
    IF v_price = 0 AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_purchased) e WHERE e = p_item_id
    ) THEN
      v_new_purchased := v_purchased || jsonb_build_array(p_item_id);
    END IF;
  ELSE
    v_new_purchased := v_purchased || jsonb_build_array(p_item_id);
  END IF;

  -- active_instructor_item = hand refreshment for speech / legacy UI
  IF v_kind = 'refreshment' THEN
    v_active_item := p_item_id;
  ELSIF v_active_item IS NULL
     OR public.shop_item_kind(v_active_item) IS DISTINCT FROM 'refreshment' THEN
    -- Keep a sensible hand item if legacy active was equipment
    v_active_item := COALESCE(
      (
        SELECT ui.item_id
          FROM public.user_inventory ui
         WHERE ui.user_id = v_user_id
           AND ui.kind = 'refreshment'
           AND ui.equipped = true
         LIMIT 1
      ),
      'coffee'
    );
  END IF;

  UPDATE public.profiles
     SET coffee_coins = v_new_coins,
         purchased_items = v_new_purchased,
         active_instructor_item = v_active_item
   WHERE id = v_user_id;

  INSERT INTO public.user_inventory (user_id, item_id, kind, equipped, acquired_via)
  VALUES (
    v_user_id,
    p_item_id,
    v_kind,
    true,
    CASE WHEN v_price = 0 THEN 'starter' ELSE 'purchase' END
  )
  ON CONFLICT (user_id, item_id) DO UPDATE
    SET equipped = true;

  IF v_kind = 'refreshment' THEN
    -- Only one drink / snack in hand
    UPDATE public.user_inventory
       SET equipped = false
     WHERE user_id = v_user_id
       AND kind = 'refreshment'
       AND item_id <> p_item_id
       AND equipped = true;
  END IF;
  -- equipment: leave other equipment equipped (layered)

  RETURN jsonb_build_object(
    'coffeeCoins', v_new_coins,
    'purchasedItems', v_new_purchased,
    'activeInstructorItem', v_active_item,
    'charged', v_charged,
    'priceCharged', CASE WHEN v_charged THEN v_price ELSE 0 END,
    'kind', v_kind
  );
END;
$$;

REVOKE ALL ON FUNCTION public.buy_shop_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_shop_item(text) TO authenticated;

SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'buy_shop_item';
