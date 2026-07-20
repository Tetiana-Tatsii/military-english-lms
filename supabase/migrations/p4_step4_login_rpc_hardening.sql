-- =============================================================
-- P4 — КРОК 4: Login RPC без password_hash
--
-- ПОРЯДОК:
-- 1) Спочатку задеплоїти / запустити frontend (AuthProvider без bcrypt fallback)
-- 2) Потім Run цей SQL у PRODUCTION
--
-- RPC лишає: id, name, role, status, squad_id, auth_email
-- Пароль перевіряє ТІЛЬКИ Supabase Auth (signInWithPassword).
-- =============================================================

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
    'id', v_row.id,
    'name', v_row.name,
    'role', v_row.role,
    'status', v_row.status,
    'squad_id', v_row.squad_id,
    'auth_email', v_auth_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_for_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_for_login(text) TO anon, authenticated;

-- Перевірка: у визначенні функції НЕмає password_hash
SELECT pg_get_functiondef('public.get_profile_for_login(text)'::regprocedure)
  AS function_def;

-- Швидкий виклик (замініть ім'я на реального викладача)
-- SELECT public.get_profile_for_login('Tetiana Tatsii');
-- Очікування: jsonb БЕЗ ключа password_hash

-- Baseline counts
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'profiles', count(*) FROM public.profiles;
