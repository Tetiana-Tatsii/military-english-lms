-- =============================================================
-- ДІАГНОСТИКА ВИКЛАДАЧІВ: чи можуть редагувати курси/уроки як admin
-- Політики на скріні OK — цей скрипт перевіряє profile ↔ auth
-- Запустіть у SQL Editor (+ New query)
-- =============================================================

-- ── 1. ЗВЕДЕНА ТАБЛИЦЯ (всі teacher + admin) ────────────────────
-- verdict:
--   OK              — можна редагувати
--   NO_AUTH         — немає auth.users (створити в Authentication)
--   ID_MISMATCH     — profile.id ≠ auth.uid() (потрібен fix як у Yura)
--   NOT_APPROVED    — status ≠ approved
--   ORPHAN_PROFILE  — profile.id не UUID і auth не знайдено

SELECT
  p.name,
  p.role,
  p.status,
  p.id AS profile_id,
  u.id::text AS auth_id,
  u.email AS auth_email,
  'u' || encode(convert_to(lower(trim(p.name)), 'UTF8'), 'hex') || '@lanp.local'
    AS expected_email_if_latin_name,
  (p.id = u.id::text) AS profile_auth_match,
  (p.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') AS profile_id_is_uuid,
  CASE
    WHEN p.status IS DISTINCT FROM 'approved' THEN 'NOT_APPROVED'
    WHEN u.id IS NULL AND p.id !~ '^[0-9a-f]{8}-' THEN 'ORPHAN_PROFILE'
    WHEN u.id IS NULL THEN 'NO_AUTH'
    WHEN p.id <> u.id::text THEN 'ID_MISMATCH'
    ELSE 'OK'
  END AS verdict
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.id
WHERE p.role IN ('teacher', 'admin')
ORDER BY
  CASE p.role WHEN 'admin' THEN 0 ELSE 1 END,
  p.name;


-- ── 2. ЛИШЕ ПРОБЛЕМНІ (потребують виправлення) ──────────────────
SELECT *
FROM (
  SELECT
    p.name,
    p.role,
    p.id AS profile_id,
    u.email AS auth_email,
    CASE
      WHEN p.status IS DISTINCT FROM 'approved' THEN 'NOT_APPROVED'
      WHEN u.id IS NULL AND p.id !~ '^[0-9a-f]{8}-' THEN 'ORPHAN_PROFILE'
      WHEN u.id IS NULL THEN 'NO_AUTH'
      WHEN p.id <> u.id::text THEN 'ID_MISMATCH'
      ELSE 'OK'
    END AS verdict
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id::text = p.id
  WHERE p.role IN ('teacher', 'admin')
) t
WHERE t.verdict <> 'OK'
ORDER BY t.name;


-- ── 3. AUTH без профілю (рідко, але перевірити) ─────────────────
SELECT u.id::text AS auth_id, u.email, u.raw_user_meta_data->>'name' AS meta_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id::text
WHERE u.email LIKE '%@lanp.local'
  AND p.id IS NULL
ORDER BY u.email;


-- ── 4. Політики (мають збігатися зі скріном) ────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('lms_courses', 'lms_lessons')
ORDER BY tablename, cmd;

-- Очікується по 4 політики на таблицю:
-- *_select_authenticated, *_insert_teachers, *_update_teachers, *_delete_teachers


-- ── 5. Перевірка логіки is_teacher_or_admin (симуляція) ─────────
-- Для кожного викладача: чи спрацює RLS, якщо id збігається?
SELECT
  p.name,
  p.role,
  (p.id = u.id::text) AS would_pass_rls,
  p.status = 'approved' AS is_approved
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.id
WHERE p.role = 'teacher'
ORDER BY p.name;
