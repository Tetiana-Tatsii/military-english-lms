-- =============================================================
-- ДІАГНОСТИКА: чи можна редагувати курси/уроки і зберігати в Supabase
-- Запустіть у SQL Editor (+ New query). Результати — по блоках.
-- =============================================================

-- ── 1. ДАНІ (мають бути > 0) ───────────────────────────────────
SELECT 'lms_courses' AS check_name, count(*)::text AS result, 'OK якщо > 0' AS note
FROM public.lms_courses
UNION ALL
SELECT 'lms_lessons', count(*)::text, 'OK якщо > 0'
FROM public.lms_lessons;


-- ── 2. RLS увімкнено? ───────────────────────────────────────────
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('lms_courses', 'lms_lessons', 'profiles')
ORDER BY tablename;


-- ── 3. ПОЛІТИКИ (потрібні для редагування) ──────────────────────
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('lms_courses', 'lms_lessons')
ORDER BY tablename, cmd, policyname;

-- Очікується мінімум:
-- lms_courses: SELECT + INSERT + UPDATE (+ DELETE опційно)
-- lms_lessons: SELECT + INSERT + UPDATE (+ DELETE опційно)
-- Політики INSERT/UPDATE мають перевіряти teacher/admin (private.is_teacher_or_admin)


-- ── 4. Функція перевірки ролі ───────────────────────────────────
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('is_teacher_or_admin', 'is_admin')
ORDER BY n.nspname, p.proname;

-- Очікується: private.is_teacher_or_admin()


-- ── 5. RPC для модулів (додати/перейменувати модуль) ────────────
SELECT
  p.proname AS rpc_name,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'add_module_to_course',
    'update_module_in_course',
    'delete_module_from_course',
    'reorder_modules_in_course'
  )
ORDER BY p.proname;


-- ── 6. Викладачі/адміни з правильним profile.id = auth.id ───────
SELECT
  p.name,
  p.role,
  p.status,
  (p.id = u.id::text) AS profile_auth_match,
  u.email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.id
WHERE p.role IN ('teacher', 'admin')
ORDER BY p.role, p.name;

-- profile_auth_match = false → цей користувач НЕ зможе редагувати (RLS блокує)


-- ── 7. Швидка перевірка для Yura (admin) ─────────────────────────
SELECT
  p.name,
  p.role,
  (p.id = u.id::text) AS ok,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lms_lessons' AND cmd = 'INSERT'
  ) AS has_lesson_insert_policy,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lms_courses' AND cmd = 'UPDATE'
  ) AS has_course_update_policy
FROM public.profiles p
JOIN auth.users u ON u.id::text = p.id
WHERE u.email = 'u79757261206b72616d61726f76@lanp.local';
