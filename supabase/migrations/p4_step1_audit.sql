-- =============================================================
-- P4 — КРОК 1: АУДИТ (READ ONLY, дані не змінюються)
-- Supabase SQL Editor → + New query → Run весь файл
-- Надішліть скріни / результати — підкажемо крок 2
-- =============================================================

-- ── A. Baseline counts (мають = docs/data-baseline.txt) ────────
SELECT 'BASELINE' AS section, 'lms_courses' AS item, count(*)::text AS value FROM public.lms_courses
UNION ALL SELECT 'BASELINE', 'lms_lessons', count(*)::text FROM public.lms_lessons
UNION ALL SELECT 'BASELINE', 'profiles', count(*)::text FROM public.profiles
UNION ALL SELECT 'BASELINE', 'answers', count(*)::text FROM public.answers
UNION ALL SELECT 'BASELINE', 'quiz_results', count(*)::text FROM public.quiz_results
UNION ALL SELECT 'BASELINE', 'support_tickets', count(*)::text FROM public.support_tickets;


-- ── B. RLS увімкнено? ───────────────────────────────────────────
SELECT 'RLS' AS section, tablename AS item,
       CASE WHEN rowsecurity THEN 'enabled' ELSE 'DISABLED' END AS value
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'lms_courses', 'lms_lessons',
    'answers', 'quiz_results', 'support_tickets', 'student_answers_archive'
  )
ORDER BY tablename;


-- ── C. Усі політики (шукайте дублікати / застарілі імена) ───────
SELECT 'POLICIES' AS section,
       tablename || ' / ' || policyname AS item,
       cmd || ' → ' || roles::text AS value
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ── D. Небезпечні / застарілі політики (має бути 0 rows) ────────
SELECT 'RISK_POLICY' AS section, tablename || ' / ' || policyname AS item, cmd AS value
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname ILIKE '%allow all%'
    OR policyname ILIKE '%public read%'
    OR (tablename = 'lms_lessons' AND policyname = 'lms_lessons_all')
    OR (cmd IN ('INSERT','UPDATE','DELETE') AND qual = 'true' AND with_check = 'true')
  );


-- ── E. Private schema + helpers (потрібно для module RPC) ───────
SELECT 'PRIVATE' AS section, 'schema_usage_authenticated' AS item,
       has_schema_privilege('authenticated', 'private', 'USAGE')::text AS value
UNION ALL
SELECT 'PRIVATE', 'is_teacher_or_admin_exists',
       EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'private' AND p.proname = 'is_teacher_or_admin'
       )::text
UNION ALL
SELECT 'PRIVATE', 'is_admin_exists',
       EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'private' AND p.proname = 'is_admin'
       )::text;


-- ── F. Хто може викликати login RPC ─────────────────────────────
SELECT 'RPC' AS section,
       p.proname AS item,
       CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END
       || ' | anon=' || has_function_privilege('anon', p.oid, 'EXECUTE')::text
       || ' | auth=' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text
       AS value
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_profile_for_login',
    'process_daily_streak',
    'buy_shop_item',
    'add_module_to_course',
    'update_module_in_course'
  )
ORDER BY p.proname;


-- ── G. Студентські політики (quiz + answers) ────────────────────
-- Мають існувати INSERT/SELECT для student own rows
SELECT 'STUDENT_RLS' AS section,
       tablename || ' / ' || policyname AS item,
       cmd AS value
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('quiz_results', 'answers')
  AND (
    policyname ILIKE '%own%'
    OR policyname ILIKE '%student%'
    OR policyname ILIKE '%user%'
  )
ORDER BY tablename, cmd;


-- ── H. Teachers profile ↔ auth ──────────────────────────────────
SELECT 'AUTH' AS section, p.name AS item,
       CASE
         WHEN p.id = u.id::text AND p.status = 'approved' THEN 'OK'
         WHEN p.id <> u.id::text THEN 'ID_MISMATCH'
         WHEN u.id IS NULL THEN 'NO_AUTH'
         ELSE 'CHECK'
       END AS value
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.id
WHERE p.role IN ('teacher', 'admin')
ORDER BY p.name;


-- ── I. profiles.password — чи відкритий SELECT? ─────────────────
-- Якщо REVOKE SELECT (password) застосовано — anon/authenticated не читають колонку
SELECT 'PASSWORD_COLUMN' AS section,
       grantee AS item,
       privilege_type AS value
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'password'
ORDER BY grantee, privilege_type;
