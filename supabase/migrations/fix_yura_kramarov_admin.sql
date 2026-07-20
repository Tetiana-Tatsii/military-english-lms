-- =============================================================
-- Fix: Yura Kramarov (admin) — sync profile ↔ auth.users
--
-- Проблема: якщо ім'я змінювали, profile.id може не збігатися з auth.users.id
-- → login без сесії → RLS не показує курси
--
-- Run in Supabase SQL Editor step by step
-- =============================================================

-- ── 1. ДІАГНОСТИКА (спочатку подивіться результат) ─────────────
SELECT 'profile' AS src, p.id, p.name, p.role, p.status
FROM public.profiles p
WHERE p.name ILIKE '%Yura%' OR p.name ILIKE '%Kramarov%';

SELECT 'auth' AS src, u.id::text AS auth_id, u.email, u.raw_user_meta_data->>'name' AS meta_name
FROM auth.users u
WHERE u.email = 'u79757261206b72616d61726f76@lanp.local'
   OR u.email ILIKE '%79757261206b72616d61726f76%'
   OR u.raw_user_meta_data->>'name' ILIKE '%Yura%'
   OR u.raw_user_meta_data->>'name' ILIKE '%Kramarov%';

SELECT
  p.name,
  p.id AS profile_id,
  u.id::text AS auth_id,
  u.email AS auth_email,
  (p.id = u.id::text) AS ids_match
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.id
WHERE p.name ILIKE '%Yura%' OR p.name ILIKE '%Kramarov%';


-- ── 2. ВИПРАВЛЕННЯ (замініть пароль!) ─────────────────────────
-- Email для логіну "Yura Kramarov" (латиниця):
-- u79757261206b72616d61726f76@lanp.local

DO $$
DECLARE
  v_auth_id   uuid;
  v_auth_email text := 'u79757261206b72616d61726f76@lanp.local';
  v_old_id    text;
  v_new_password text := 'ЗМІНІТЬ_НА_ПАРОЛЬ';  -- ← ваш пароль тут
BEGIN
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_auth_email;

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION
      'Auth-користувача немає. Створіть: Authentication → Users → Add user → email: %',
      v_auth_email;
  END IF;

  SELECT id INTO v_old_id FROM public.profiles
  WHERE name ILIKE '%Yura%' OR name ILIKE '%Kramarov%'
  ORDER BY CASE WHEN name ILIKE 'Yura Kramarov' THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_old_id IS NULL THEN
    -- Профілю немає — створюємо
    INSERT INTO public.profiles (id, name, role, status, squad_id)
    VALUES (v_auth_id::text, 'Yura Kramarov', 'admin', 'approved', NULL);
    RAISE NOTICE 'Created profile for Yura Kramarov';
  ELSE
    -- Оновлюємо role/name
    UPDATE public.profiles
    SET name = 'Yura Kramarov', role = 'admin', status = 'approved'
    WHERE id = v_old_id;

    -- Якщо id профілю ≠ auth id — переносимо на правильний UUID
    IF v_old_id <> v_auth_id::text THEN
      UPDATE public.answers SET user_id = v_auth_id::text WHERE user_id = v_old_id;
      UPDATE public.quiz_results SET user_id = v_auth_id::text WHERE user_id = v_old_id;
      UPDATE public.answers SET locked_by_teacher_id = v_auth_id::text
      WHERE locked_by_teacher_id = v_old_id;

      IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_auth_id::text AND id <> v_old_id) THEN
        DELETE FROM public.profiles WHERE id = v_auth_id::text;
      END IF;

      UPDATE public.profiles SET id = v_auth_id::text WHERE id = v_old_id;

      RAISE NOTICE 'Profile id fixed: % → %', v_old_id, v_auth_id;
    END IF;
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(v_new_password, extensions.gen_salt('bf')),
      updated_at = now(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('name', 'Yura Kramarov', 'role', 'admin')
  WHERE id = v_auth_id;

  RAISE NOTICE 'Done. Login: name "Yura Kramarov", password as set above';
END $$;


-- ── 3. ПЕРЕВІРКА після fix ────────────────────────────────────
SELECT p.id, p.name, p.role, u.email, (p.id = u.id::text) AS ok
FROM public.profiles p
JOIN auth.users u ON u.id::text = p.id
WHERE p.name = 'Yura Kramarov';
