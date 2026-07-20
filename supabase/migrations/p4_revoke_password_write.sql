-- =============================================================
-- P4 — profiles.password: закрити INSERT/UPDATE для anon/authenticated
--
-- ПОРЯДОК:
-- 1) Задеплоїти frontend (register без password; changeUserPassword лише RPC)
-- 2) Run цей SQL у PRODUCTION
--
-- Як і з SELECT: column-level REVOKE не знімає table-level GRANT.
-- Треба REVOKE INSERT/UPDATE на таблицю → GRANT на колонки БЕЗ password.
-- =============================================================

-- A) password може бути NULL (реєстрація більше не пише hash у profiles)
ALTER TABLE public.profiles
  ALTER COLUMN password DROP NOT NULL;

-- B) admin_sync також оновлює profiles.password (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_sync_auth_password(
  p_target_user_id text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_caller_role text;
  v_auth_email text;
  v_profile_name text;
  v_hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT role INTO v_caller_role
    FROM public.profiles
   WHERE id = auth.uid()::text;

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('error', 'password_too_short');
  END IF;

  SELECT p.name INTO v_profile_name
    FROM public.profiles p
   WHERE p.id = p_target_user_id;

  IF v_profile_name IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  SELECT u.email INTO v_auth_email
    FROM auth.users u
   WHERE u.id = p_target_user_id::uuid;

  IF v_auth_email IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'auth_user_not_found',
      'profile_id', p_target_user_id,
      'profile_name', v_profile_name,
      'hint', 'У Authentication → Users немає користувача з таким UUID.'
    );
  END IF;

  v_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

  UPDATE auth.users
     SET encrypted_password = v_hash,
         updated_at = now()
   WHERE id = p_target_user_id::uuid;

  -- Лише через DEFINER — клієнт більше не UPDATE profiles.password
  UPDATE public.profiles
     SET password = v_hash
   WHERE id = p_target_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'auth_email', v_auth_email,
    'profile_name', v_profile_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sync_auth_password(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_sync_auth_password(text, text) TO authenticated;

-- C) Закрити INSERT/UPDATE на колонку password (як крок 3b для SELECT)
REVOKE INSERT ON TABLE public.profiles FROM anon;
REVOKE INSERT ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM anon;
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
  INTO cols
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name <> 'password';

  IF cols IS NULL OR cols = '' THEN
    RAISE EXCEPTION 'profiles: no columns for INSERT/UPDATE grant';
  END IF;

  -- anon: реєстрація після signUp → authenticated; anon INSERT/UPDATE не потрібні
  EXECUTE format(
    'GRANT INSERT (%s) ON public.profiles TO authenticated',
    cols
  );
  EXECUTE format(
    'GRANT UPDATE (%s) ON public.profiles TO authenticated',
    cols
  );
END $$;

-- D) Перевірка: на password для anon/authenticated немає SELECT/INSERT/UPDATE
SELECT grantee AS role, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'password'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Очікування: 0 rows (або лише REFERENCES)

-- Baseline
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'profiles', count(*) FROM public.profiles;
