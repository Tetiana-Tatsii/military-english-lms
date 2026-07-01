-- =============================================================
-- Recover Yura Kramarov — v2 (коли перевірка повертає 0 rows)
-- Вставте в SQL Editor → + New query → Run по блоках
-- =============================================================

-- ── A. ДІАГНОСТИКА (спочатку тільки це) ─────────────────────
SELECT 'profiles' AS src, id, name, role, status
FROM public.profiles
WHERE name ILIKE '%yura%' OR name ILIKE '%kramarov%'
   OR id ILIKE '%797572%' OR id = 'ud0b0d0b4d0bcd196d0bd@lanp.local';

SELECT 'auth.users' AS src, id::text AS auth_id, email
FROM auth.users
WHERE email = 'u79757261206b72616d61726f76@lanp.local'
   OR email ILIKE '%79757261206b72616d61726f76%';

-- Якщо auth_id NULL у другому запиті → спочатку створіть користувача:
-- Authentication → Users → Add user
-- Email: u79757261206b72616d61726f76@lanp.local
-- Password: ваш пароль
-- Auto Confirm User: ON


-- ── B. ВІДНОВЛЕННЯ (після того як auth.users існує) ───────────
-- Замініть пароль у v_new_password!

DO $$
DECLARE
  v_auth_id      uuid;
  v_auth_email   text := 'u79757261206b72616d61726f76@lanp.local';
  v_old_id       text;
  v_new_password text := 'ЗМІНІТЬ_НА_ПАРОЛЬ';
BEGIN
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_auth_email;

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION
      'Немає auth.users з email %. Створіть у Authentication → Users.',
      v_auth_email;
  END IF;

  SELECT id INTO v_old_id
  FROM public.profiles
  WHERE id = v_auth_id::text
     OR name ILIKE '%yura%'
     OR name ILIKE '%kramarov%'
     OR id = 'ud0b0d0b4d0bcd196d0bd@lanp.local'
  ORDER BY
    CASE WHEN id = v_auth_id::text THEN 0 ELSE 1 END,
    CASE WHEN name ILIKE 'Yura Kramarov' THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_old_id IS NULL OR v_old_id = v_auth_id::text THEN
    INSERT INTO public.profiles (id, name, password, role, status, squad_id)
    VALUES (v_auth_id::text, 'Yura Kramarov', '', 'admin', 'approved', NULL)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      status = EXCLUDED.status;
    RAISE NOTICE 'Profile upserted for auth id %', v_auth_id;
  ELSE
    UPDATE public.answers SET user_id = v_auth_id::text WHERE user_id = v_old_id;
    UPDATE public.quiz_results SET user_id = v_auth_id::text WHERE user_id = v_old_id;
    UPDATE public.answers SET locked_by_teacher_id = v_auth_id::text
    WHERE locked_by_teacher_id = v_old_id;

    DELETE FROM public.profiles
    WHERE id = v_auth_id::text AND id <> v_old_id;

    UPDATE public.profiles
    SET id = v_auth_id::text,
        name = 'Yura Kramarov',
        role = 'admin',
        status = 'approved'
    WHERE id = v_old_id;

    RAISE NOTICE 'Profile id fixed: % → %', v_old_id, v_auth_id;
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(v_new_password, extensions.gen_salt('bf')),
      updated_at = now(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('name', 'Yura Kramarov', 'role', 'admin')
  WHERE id = v_auth_id;
END $$;


-- ── C. ПЕРЕВІРКА (має бути 1 row, ok = true) ─────────────────
SELECT p.id, p.name, p.role, u.email, (p.id = u.id::text) AS ok
FROM public.profiles p
JOIN auth.users u ON u.id::text = p.id
WHERE u.email = 'u79757261206b72616d61726f76@lanp.local';
