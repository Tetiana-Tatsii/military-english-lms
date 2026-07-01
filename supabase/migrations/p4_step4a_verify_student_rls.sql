-- =============================================================
-- P4 — КРОК 4a: Перевірка student RLS (READ ONLY)
-- Увага: Supabase показує лише ОСТАННІЙ SELECT.
-- Запускайте блок A окремо, потім блок B.
-- =============================================================

-- ── A. Політики quiz_results + answers (запустіть цей блок окремо) ──
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('quiz_results', 'answers')
ORDER BY tablename, cmd, policyname;

-- Очікується мінімум:
-- quiz_results: INSERT/UPDATE/SELECT для student (own user_id)
-- quiz_results: SELECT для teachers
-- answers: INSERT/SELECT для student
-- answers: SELECT/UPDATE для teachers

-- ── B. Baseline counts (окремий Run) ───────────────────────────
-- SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
-- UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
