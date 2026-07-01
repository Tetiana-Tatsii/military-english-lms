-- =============================================================
-- P4 — КРОК 5a: Перевірка legacy / небезпечних політик (READ ONLY)
-- =============================================================

SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname ILIKE '%allow all%'
    OR policyname ILIKE '%public read%'
    OR policyname ILIKE '%anon read%'
    OR policyname = 'lms_lessons_all'
    OR policyname = 'lms_lessons_select'
    OR policyname = 'Allow public read lms_courses'
  )
ORDER BY tablename, policyname;

-- Очікування: 0 rows = можна пропустити 5b

-- Повний список політик lms_* (для огляду)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('lms_courses', 'lms_lessons', 'profiles')
ORDER BY tablename, cmd, policyname;
