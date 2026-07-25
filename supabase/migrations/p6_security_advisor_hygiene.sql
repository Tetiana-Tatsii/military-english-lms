-- =============================================================
-- P6 — Security Advisor hygiene (Supabase linter warnings)
--
-- Safe / intentional:
--   • Student/teacher RPCs stay EXECUTE for authenticated +
--     enforce auth.uid() / role checks inside (SECURITY DEFINER).
--   • get_profile_for_login stays callable by anon (login before
--     session). Payload minimized; EXECUTE revoked from authenticated.
--
-- Fixes in this file:
--   1) shop_item_kind — SET search_path; not exposed to clients
--   2) get_profile_for_login — revoke authenticated; thinner JSON
--   3) award_quiz_coins — revoke authenticated (only via submit_lesson_quiz)
--   4) Re-assert REVOKE PUBLIC/anon on admin + coin RPCs
--
-- Dashboard (manual): Auth → enable Leaked password protection
-- =============================================================

-- ── 1. shop_item_kind: mutable search_path + over-exposed ─────
CREATE OR REPLACE FUNCTION public.shop_item_kind(p_item_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_item_id
    WHEN 'coffee'   THEN 'refreshment'
    WHEN 'snickers' THEN 'refreshment'
    WHEN 'energy'   THEN 'refreshment'
    WHEN 'thermos'  THEN 'refreshment'
    WHEN 'boots'    THEN 'equipment'
    WHEN 'cat'      THEN 'companion'
    WHEN 'dog'      THEN 'companion'
    WHEN 'drone'    THEN 'companion'
    WHEN 'victory'  THEN 'victory'
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.shop_item_kind(text) FROM PUBLIC, anon, authenticated;
-- Owner / SECURITY DEFINER callers (buy_shop_item) can still use it.

-- ── 2. get_profile_for_login: keep anon, drop authenticated ───
-- Login needs this before sign-in. Do not return role/id/squad.
CREATE OR REPLACE FUNCTION public.get_profile_for_login(p_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles%ROWTYPE;
  v_auth_email text;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT * INTO v_row
  FROM public.profiles
  WHERE name ILIKE trim(p_name)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT u.email INTO v_auth_email
  FROM auth.users u
  WHERE u.id::text = v_row.id;

  RETURN jsonb_build_object(
    'status', v_row.status,
    'auth_email', v_auth_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_for_login(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_for_login(text) TO anon;

COMMENT ON FUNCTION public.get_profile_for_login(text) IS
  'Intentional anon RPC for login email/status lookup. No password. Minimal JSON.';

-- ── 3. award_quiz_coins: not a public client entrypoint ───────
-- Coins are awarded inside submit_lesson_quiz (SECURITY DEFINER).
REVOKE ALL ON FUNCTION public.award_quiz_coins(text) FROM PUBLIC, anon, authenticated;

-- ── 4. Re-assert grants (linter noise, but keep defense-in-depth) ──
REVOKE ALL ON FUNCTION public.admin_sync_auth_password(text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_sync_auth_password(text, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.award_homework_coins(uuid, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_homework_coins(uuid, integer)
  TO authenticated;

REVOKE ALL ON FUNCTION public.buy_shop_item(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_shop_item(text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.issue_certificate(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_certificate(text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.mark_course_completed(text, text, text[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_course_completed(text, text, text[])
  TO authenticated;

REVOKE ALL ON FUNCTION public.process_daily_streak()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_daily_streak()
  TO authenticated;

REVOKE ALL ON FUNCTION public.submit_lesson_quiz(text, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_lesson_quiz(text, jsonb)
  TO authenticated;

REVOKE ALL ON FUNCTION public.update_profile_slp(text, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_profile_slp(text, jsonb)
  TO authenticated;

-- ── 5. Verify privileges (run after apply) ────────────────────
SELECT
  n.nspname AS schema,
  p.proname AS function,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS security_definer,
  COALESCE(
    (
      SELECT string_agg(privilege_type || ':' || grantee, ', ' ORDER BY grantee)
      FROM information_schema.routine_privileges rp
      WHERE rp.specific_schema = n.nspname
        AND rp.routine_name = p.proname
        AND rp.grantee IN ('PUBLIC', 'anon', 'authenticated')
    ),
    '(none to PUBLIC/anon/authenticated)'
  ) AS grants
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'shop_item_kind',
    'get_profile_for_login',
    'admin_sync_auth_password',
    'award_homework_coins',
    'award_quiz_coins',
    'buy_shop_item',
    'issue_certificate',
    'mark_course_completed',
    'process_daily_streak',
    'submit_lesson_quiz',
    'update_profile_slp'
  )
ORDER BY p.proname;
