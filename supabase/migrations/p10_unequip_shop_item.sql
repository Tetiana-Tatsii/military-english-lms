-- =============================================================
-- p10: unequip_shop_item RPC
-- Students cannot UPDATE user_inventory (no write RLS).
-- Unequip must go through this SECURITY DEFINER function.
-- Safe to re-run.
--
-- Refreshment: unequip snack/drink/thermos → equip coffee
--              unequip coffee → no-op (default hand stays)
-- Equipment:   set equipped = false for that item only
-- Prestige (cat/dog/drone/victory): rejected
-- =============================================================

CREATE OR REPLACE FUNCTION public.unequip_shop_item(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     text;
  v_kind        text;
  v_coins       integer;
  v_purchased   jsonb;
  v_active_item text;
  v_owned       boolean;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  v_kind := public.shop_item_kind(p_item_id);
  IF v_kind IS NULL THEN
    RETURN jsonb_build_object('error', 'unknown_item');
  END IF;

  -- Module rewards are not shop items — never unequip via PX Store
  IF v_kind NOT IN ('refreshment', 'equipment') THEN
    RETURN jsonb_build_object('error', 'not_unequippable');
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

  -- Coffee is the default hand — unequip is a no-op (keep equipped)
  IF p_item_id = 'coffee' THEN
    INSERT INTO public.user_inventory (user_id, item_id, kind, equipped, acquired_via)
    VALUES (v_user_id, 'coffee', 'refreshment', true, 'starter')
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET equipped = true;

    UPDATE public.user_inventory
       SET equipped = false
     WHERE user_id = v_user_id
       AND kind = 'refreshment'
       AND item_id <> 'coffee'
       AND equipped = true;

    IF v_active_item IS DISTINCT FROM 'coffee' THEN
      v_active_item := 'coffee';
      UPDATE public.profiles
         SET active_instructor_item = v_active_item
       WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
      'coffeeCoins', v_coins,
      'purchasedItems', v_purchased,
      'activeInstructorItem', COALESCE(v_active_item, 'coffee'),
      'kind', v_kind
    );
  END IF;

  v_owned := EXISTS (
    SELECT 1 FROM public.user_inventory
     WHERE user_id = v_user_id AND item_id = p_item_id
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(v_purchased) AS elem
     WHERE elem = p_item_id
  );

  IF NOT v_owned THEN
    RETURN jsonb_build_object('error', 'not_owned');
  END IF;

  IF v_kind = 'refreshment' THEN
    UPDATE public.user_inventory
       SET equipped = false
     WHERE user_id = v_user_id
       AND kind = 'refreshment'
       AND item_id = p_item_id;

    INSERT INTO public.user_inventory (user_id, item_id, kind, equipped, acquired_via)
    VALUES (v_user_id, 'coffee', 'refreshment', true, 'starter')
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET equipped = true;

    UPDATE public.user_inventory
       SET equipped = false
     WHERE user_id = v_user_id
       AND kind = 'refreshment'
       AND item_id <> 'coffee'
       AND equipped = true;

    v_active_item := 'coffee';

    UPDATE public.profiles
       SET active_instructor_item = v_active_item
     WHERE id = v_user_id;
  ELSE
    -- Equipment: unequip this item only. Create a row for legacy purchased_items
    -- (e.g. boots) so equipped=false is the source of truth afterwards.
    INSERT INTO public.user_inventory (user_id, item_id, kind, equipped, acquired_via)
    VALUES (v_user_id, p_item_id, 'equipment', false, 'purchase')
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET equipped = false;

    IF v_active_item = p_item_id THEN
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

      UPDATE public.profiles
         SET active_instructor_item = v_active_item
       WHERE id = v_user_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'coffeeCoins', v_coins,
    'purchasedItems', v_purchased,
    'activeInstructorItem', COALESCE(v_active_item, 'coffee'),
    'kind', v_kind
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unequip_shop_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unequip_shop_item(text) TO authenticated;
