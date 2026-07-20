-- =============================================================
-- P4 — КРОК 3: Закрити SELECT на profiles.password
--
-- ⚠️  ЗАСТАРІЛИЙ ПІДХІД — не використовуйте на проді.
--     Column-level REVOKE НЕ знімає table-level SELECT у PostgreSQL.
--     Запускайте замість цього:
--       p4_step3b_revoke_password_select_fix.sql
--
-- Без втрати даних: паролі лишаються в БД, лише прибираємо
-- читання hash через REST API (anon / authenticated).
--
-- Login fallback працює через get_profile_for_login (SECURITY DEFINER).
-- UPDATE на password лишається для зміни пароля / legacy migrate.
--
-- Після Run:
-- 1. verify counts (2/20/7/3/4/5)
-- 2. Smoke: login teacher + student
-- =============================================================

-- НЕДОСТАТНЬО (залишено для історії / пояснення):
REVOKE SELECT (password) ON public.profiles FROM anon;
REVOKE SELECT (password) ON public.profiles FROM authenticated;

-- Перевірка: anon/authenticated не мають SELECT на password
SELECT grantee AS role, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'password'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Очікування: 0 rows АБО лише UPDATE/INSERT (без SELECT)

-- Baseline counts
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
