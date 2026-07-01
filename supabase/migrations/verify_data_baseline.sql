-- =============================================================
-- BASELINE: знімок даних ПЕРЕД / ПІСЛЯ змін
-- Запустіть у Supabase SQL Editor (+ New query)
-- Запишіть row_count у docs/data-baseline.txt (дата + хто перевіряв)
-- =============================================================

SELECT 'lms_courses' AS table_name, count(*)::bigint AS row_count FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'answers', count(*) FROM public.answers
UNION ALL SELECT 'quiz_results', count(*) FROM public.quiz_results
UNION ALL SELECT 'support_tickets', count(*) FROM public.support_tickets
ORDER BY table_name;

-- Деталі курсів (мають збігатися до/після рефакторингу frontend)
SELECT id, title, status, updated_at
FROM public.lms_courses
ORDER BY id;

-- Уроки по курсах
SELECT course_id, count(*) AS lessons_count
FROM public.lms_lessons
GROUP BY course_id
ORDER BY course_id;

-- Викладачі / адміни — profile ↔ auth
SELECT
  p.name,
  p.role,
  (p.id = u.id::text) AS profile_auth_ok
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.id
WHERE p.role IN ('teacher', 'admin')
ORDER BY p.name;
