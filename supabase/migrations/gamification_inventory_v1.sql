-- =============================================================
-- Gamification inventory v1: user_inventory + backfill
--
-- Run in Supabase Dashboard → SQL Editor (production).
-- Safe to re-run (idempotent).
--
-- Що робить:
-- 1) Створює public.user_inventory (володіння + equipped)
-- 2) Backfill з profiles.purchased_items (+ coffee як starter)
-- 3) Оновлює buy_shop_item: dual-write у inventory
--    (profiles.purchased_items / active_instructor_item лишаються
--     для сумісності з поточним клієнтом)
-- =============================================================

-- ── 1. Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  item_id text NOT NULL,
  kind text NOT NULL
    CHECK (kind IN ('refreshment', 'equipment', 'companion', 'victory')),
  equipped boolean NOT NULL DEFAULT false,
  acquired_via text NOT NULL DEFAULT 'purchase'
    CHECK (acquired_via IN ('purchase', 'starter', 'module_reward', 'migration')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_inventory_user_item_unique UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS user_inventory_user_id_idx
  ON public.user_inventory (user_id);

CREATE INDEX IF NOT EXISTS user_inventory_user_equipped_idx
  ON public.user_inventory (user_id, equipped)
  WHERE equipped = true;

COMMENT ON TABLE public.user_inventory IS
  'Owned shop / reward items. Replaces reliance on profiles.purchased_items JSON.';

-- ── 2. Kind helper (каталог = SHOP_ITEMS у src/lib/gamification.ts) ──
CREATE OR REPLACE FUNCTION public.shop_item_kind(p_item_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_item_id
    WHEN 'coffee'   THEN 'refreshment'
    WHEN 'snickers' THEN 'refreshment'
    WHEN 'energy'   THEN 'refreshment'
    WHEN 'thermos'  THEN 'refreshment'
    WHEN 'boots'    THEN 'equipment'
    -- future companions / victory (module rewards)
    WHEN 'cat'      THEN 'companion'
    WHEN 'dog'      THEN 'companion'
    WHEN 'drone'    THEN 'companion'
    WHEN 'victory'  THEN 'victory'
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.shop_item_kind(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shop_item_kind(text) TO authenticated;

-- ── 3. RLS ────────────────────────────────────────────────────
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_inventory_select_own" ON public.user_inventory;
CREATE POLICY "user_inventory_select_own"
  ON public.user_inventory FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR private.is_teacher_or_admin()
  );

-- Students must not INSERT/UPDATE/DELETE directly — only via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "user_inventory_no_direct_write" ON public.user_inventory;

-- ── 4. Backfill from purchased_items ──────────────────────────
-- 4a) Rows from JSON array
INSERT INTO public.user_inventory (user_id, item_id, kind, equipped, acquired_via)
SELECT
  p.id AS user_id,
  elem AS item_id,
  public.shop_item_kind(elem) AS kind,
  (elem = COALESCE(NULLIF(p.active_instructor_item, ''), 'coffee')) AS equipped,
  'migration'::text AS acquired_via
FROM public.profiles p
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN p.purchased_items IS NULL THEN '[]'::jsonb
    WHEN jsonb_typeof(p.purchased_items) = 'array' THEN p.purchased_items
    ELSE '[]'::jsonb
  END
) AS elem
WHERE public.shop_item_kind(elem) IS NOT NULL
ON CONFLICT (user_id, item_id) DO NOTHING;

-- 4b) Starter coffee for everyone (free item; even if never in purchased_items)
INSERT INTO public.user_inventory (user_id, item_id, kind, equipped, acquired_via)
SELECT
  p.id,
  'coffee',
  'refreshment',
  (
    COALESCE(NULLIF(p.active_instructor_item, ''), 'coffee') = 'coffee'
    AND NOT EXISTS (
      SELECT 1
        FROM public.user_inventory ui
       WHERE ui.user_id = p.id
         AND ui.equipped = true
    )
  ),
  'starter'
FROM public.profiles p
ON CONFLICT (user_id, item_id) DO NOTHING;

-- 4c) Ensure exactly one equipped item when possible:
--     prefer active_instructor_item if owned, else coffee
UPDATE public.user_inventory ui
   SET equipped = false
 WHERE ui.equipped = true
   AND EXISTS (
     SELECT 1
       FROM public.user_inventory ui2
      WHERE ui2.user_id = ui.user_id
        AND ui2.equipped = true
        AND ui2.id <> ui.id
   );

UPDATE public.user_inventory ui
   SET equipped = true
  FROM public.profiles p
 WHERE ui.user_id = p.id
   AND ui.item_id = COALESCE(NULLIF(p.active_instructor_item, ''), 'coffee')
   AND NOT EXISTS (
     SELECT 1
       FROM public.user_inventory x
      WHERE x.user_id = ui.user_id
        AND x.equipped = true
   );

UPDATE public.user_inventory ui
   SET equipped = true
 WHERE ui.item_id = 'coffee'
   AND NOT EXISTS (
     SELECT 1
       FROM public.user_inventory x
      WHERE x.user_id = ui.user_id
        AND x.equipped = true
   );

-- ── 5. buy_shop_item — dual-write inventory ───────────────────
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
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  v_kind := public.shop_item_kind(p_item_id);
  IF v_kind IS NULL THEN
    RETURN jsonb_build_object('error', 'unknown_item');
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
         SELECT 1
           FROM public.user_inventory
          WHERE user_id = v_user_id AND item_id = p_item_id
       )
    OR EXISTS (
         SELECT 1
           FROM jsonb_array_elements_text(v_purchased) AS elem
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

  -- Legacy columns (app still reads these)
  UPDATE public.profiles
     SET coffee_coins = v_new_coins,
         purchased_items = v_new_purchased,
         active_instructor_item = p_item_id
   WHERE id = v_user_id;

  -- Inventory: own + equip (single active for now — matches current UI)
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

  UPDATE public.user_inventory
     SET equipped = false
   WHERE user_id = v_user_id
     AND item_id <> p_item_id
     AND equipped = true;

  RETURN jsonb_build_object(
    'coffeeCoins', v_new_coins,
    'purchasedItems', v_new_purchased,
    'activeInstructorItem', p_item_id,
    'charged', v_charged,
    'priceCharged', CASE WHEN v_charged THEN v_price ELSE 0 END,
    'kind', v_kind
  );
END;
$$;

DROP FUNCTION IF EXISTS public.buy_shop_item(text, integer);

REVOKE ALL ON FUNCTION public.buy_shop_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_shop_item(text) TO authenticated;

-- ── 6. Verify ─────────────────────────────────────────────────
SELECT
  'user_inventory' AS table_name,
  count(*)::text AS rows,
  count(DISTINCT user_id)::text AS users_with_items
FROM public.user_inventory;

SELECT
  kind,
  count(*) AS items
FROM public.user_inventory
GROUP BY kind
ORDER BY kind;

-- Profiles whose purchased_items are not fully covered by inventory
SELECT
  p.id,
  p.name,
  p.purchased_items,
  (
    SELECT coalesce(jsonb_agg(ui.item_id ORDER BY ui.item_id), '[]'::jsonb)
    FROM public.user_inventory ui
    WHERE ui.user_id = p.id
  ) AS inventory_items
FROM public.profiles p
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements_text(
    CASE
      WHEN p.purchased_items IS NULL THEN '[]'::jsonb
      WHEN jsonb_typeof(p.purchased_items) = 'array' THEN p.purchased_items
      ELSE '[]'::jsonb
    END
  ) AS elem
  WHERE public.shop_item_kind(elem) IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
        FROM public.user_inventory ui
       WHERE ui.user_id = p.id AND ui.item_id = elem
    )
)
LIMIT 20;

SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'buy_shop_item';
