-- =============================================================
-- P4 — КРОК 3b: РЕАЛЬНЕ закриття SELECT на profiles.password
--
-- Чому крок 3 «не спрацював»:
-- У PostgreSQL GRANT SELECT ON TABLE дає доступ до ВСІХ колонок.
-- REVOKE SELECT (password) НЕ знімає table-level SELECT.
-- Треба: REVOKE SELECT на всю таблицю → GRANT SELECT лише на
-- потрібні колонки (без password).
--
-- Дані / паролі НЕ видаляються.
-- Login fallback через get_profile_for_login (SECURITY DEFINER) лишається.
-- =============================================================

-- 1) Зняти table-level SELECT (це ключовий крок)
REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.profiles FROM authenticated;

-- 2) Повернути SELECT на всі колонки КРІМ password (динамічно)
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
  INTO cols
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name <> 'password';

  IF cols IS NULL OR cols = '' THEN
    RAISE EXCEPTION 'profiles: no columns found to GRANT SELECT';
  END IF;

  -- anon: SELECT на profiles НЕ потрібен (login = RPC)
  -- authenticated: читає профіль / гейміфікацію / SLP без password
  EXECUTE format(
    'GRANT SELECT (%s) ON public.profiles TO authenticated',
    cols
  );
END $$;

-- 3) Перевірка: для anon/authenticated на колонці password
--    НЕ має бути SELECT
SELECT grantee AS role, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'password'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Очікування: 0 rows з SELECT.
-- Можуть лишитися INSERT / UPDATE / REFERENCES — ок на цьому кроці.

-- 4) Baseline counts
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'profiles', count(*) FROM public.profiles;
