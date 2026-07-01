-- =============================================================
-- P4 — КРОК 5b: Прибрати legacy політики (лише DROP POLICY, дані не чіпаємо)
-- Запускати ТІЛЬКИ якщо 5a знайшов небезпечні рядки
-- Або якщо Security Advisor скаржиться на "Allow all"
-- =============================================================

-- Старі широкі політики (якщо лишились після ранніх міграцій)
DROP POLICY IF EXISTS "Allow all access for now" ON public.profiles;
DROP POLICY IF EXISTS "Allow all lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow public read lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow anon read lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow authenticated read lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "lms_lessons_all" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_select" ON public.lms_lessons;

-- Переконатись що сучасні політики на місці (не створює дублікатів — IF NOT EXISTS немає для policies,
-- тому лише DROP старих; сучасні вже мають бути з hotfix/fix_remaining_warnings)

-- Перевірка: небезпечних більше немає
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname ILIKE '%allow all%'
    OR policyname = 'lms_lessons_all'
  );

-- Baseline counts
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;

-- Smoke після 5b: login teacher → курси видно → save lesson
