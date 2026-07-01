-- =============================================================
-- ПЕРЕВІРКА: чи збереглись курси та уроки (дані НЕ видалялись RLS-ом)
-- Запустіть у Supabase SQL Editor — результат видно одразу
-- =============================================================

SELECT 'lms_courses' AS table_name, count(*) AS row_count FROM public.lms_courses
UNION ALL
SELECT 'lms_lessons', count(*) FROM public.lms_lessons;

-- Список курсів
SELECT id, title, status, updated_at
FROM public.lms_courses
ORDER BY created_at NULLS LAST;

-- Кількість уроків по курсах
SELECT course_id, count(*) AS lessons_count
FROM public.lms_lessons
GROUP BY course_id
ORDER BY course_id;

-- Профіль викладача (замініть ім'я при потребі)
SELECT id, name, role, status
FROM public.profiles
WHERE name ILIKE '%Tetiana%' OR name ILIKE '%Tatsii%';

-- Чи є відповідний Auth-користувач (email = u{hex}@lanp.local)
SELECT u.id, u.email, u.last_sign_in_at
FROM auth.users u
WHERE u.email LIKE '%@lanp.local'
ORDER BY u.email;
