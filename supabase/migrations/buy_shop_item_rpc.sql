-- Atomic shop purchase (deduct coins + update purchased_items)
-- Re-run in Supabase SQL Editor if shop purchases skip charging

CREATE OR REPLACE FUNCTION public.buy_shop_item(p_item_id text, p_price integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         text;
  v_coins           integer;
  v_purchased       jsonb;
  v_already_owned   boolean;
  v_new_coins       integer;
  v_new_purchased   jsonb;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT coffee_coins, purchased_items
    INTO v_coins, v_purchased
    FROM public.profiles
   WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  -- Always treat purchased_items as a JSON array
  IF v_purchased IS NULL OR jsonb_typeof(v_purchased) <> 'array' THEN
    v_purchased := '[]'::jsonb;
  END IF;

  v_already_owned := (p_price = 0) OR EXISTS (
    SELECT 1
      FROM jsonb_array_elements_text(v_purchased) AS elem
     WHERE elem = p_item_id
  );

  IF NOT v_already_owned AND v_coins < p_price THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  v_new_coins := CASE WHEN v_already_owned THEN v_coins ELSE v_coins - p_price END;

  IF v_already_owned OR p_price = 0 THEN
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
    'charged', (NOT v_already_owned AND p_price > 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.buy_shop_item(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buy_shop_item(text, integer) TO authenticated;
