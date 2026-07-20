-- =============================================================
-- Відновлення викладача: profile.id ↔ auth.users.id
-- (той самий патерн, що для Yura Kramarov)
--
-- ПЕРЕД запуском:
-- 1. diagnose_teachers.sql → verdict = ID_MISMATCH або NO_AUTH
-- 2. Якщо NO_AUTH — Authentication → Users → Add user
--    Email = expected_email_if_latin_name з діагностики
--    АБО email з auth.users якщо вже створений під іншим іменем
-- 3. Замініть ім'я та пароль нижче
-- =============================================================

DO $$
DECLARE
  v_teacher_name   text := 'Tetiana Tatsii';  -- ← точне ім'я з profiles.name
  v_auth_email     text := NULL;               -- ← або явний email з auth.users
  v_new_password   text := 'ЗМІНІТЬ_НА_ПАРОЛЬ';
  v_auth_id        uuid;
  v_old_id         text;
BEGIN
  IF v_auth_email IS NULL THEN
    SELECT id INTO v_auth_id
    FROM auth.users
    WHERE email = 'u' || encode(convert_to(lower(trim(v_teacher_name)), 'UTF8'), 'hex') || '@lanp.local';
  ELSE
    SELECT id INTO v_auth_id FROM auth.users WHERE email = v_auth_email;
  END IF;

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION
      'Auth-користувача немає. Створіть у Authentication → Users для "%".',
      v_teacher_name;
  END IF;

  SELECT id INTO v_old_id
  FROM public.profiles
  WHERE name ILIKE trim(v_teacher_name)
  LIMIT 1;

  IF v_old_id IS NULL THEN
    INSERT INTO public.profiles (id, name, role, status, squad_id)
    VALUES (v_auth_id::text, trim(v_teacher_name), 'teacher', 'approved', NULL);
    RAISE NOTICE 'Created profile for %', v_teacher_name;
  ELSIF v_old_id = v_auth_id::text THEN
    UPDATE public.profiles
    SET role = 'teacher', status = 'approved'
    WHERE id = v_old_id;
    RAISE NOTICE 'Profile already linked for %', v_teacher_name;
  ELSE
    UPDATE public.answers SET user_id = v_auth_id::text WHERE user_id = v_old_id;
    UPDATE public.quiz_results SET user_id = v_auth_id::text WHERE user_id = v_old_id;
    UPDATE public.answers SET locked_by_teacher_id = v_auth_id::text
    WHERE locked_by_teacher_id = v_old_id;

    DELETE FROM public.profiles
    WHERE id = v_auth_id::text AND id <> v_old_id;

    UPDATE public.profiles
    SET id = v_auth_id::text,
        role = 'teacher',
        status = 'approved'
    WHERE id = v_old_id;

    RAISE NOTICE 'Profile id fixed for %: % → %', v_teacher_name, v_old_id, v_auth_id;
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(v_new_password, extensions.gen_salt('bf')),
      updated_at = now(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('name', trim(v_teacher_name), 'role', 'teacher')
  WHERE id = v_auth_id;
END $$;


-- Перевірка після fix
SELECT p.name, p.role, p.status, u.email, (p.id = u.id::text) AS ok
FROM public.profiles p
JOIN auth.users u ON u.id::text = p.id
WHERE p.name ILIKE 'Tetiana Tatsii';  -- ← те саме ім'я
