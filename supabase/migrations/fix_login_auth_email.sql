-- =============================================================
-- Fix login: use real auth.users.email (not nameToEmail guess)
-- Latin "tetiana tatsii" vs Cyrillic "Тетяна Тацій" → different emails
-- Run in Supabase SQL Editor
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_profile_for_login(p_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles%ROWTYPE;
  v_auth_email text;
BEGIN
  SELECT * INTO v_row
  FROM public.profiles
  WHERE name ILIKE trim(p_name)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT u.email INTO v_auth_email
  FROM auth.users u
  WHERE u.id::text = v_row.id;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'role', v_row.role,
    'status', v_row.status,
    'squad_id', v_row.squad_id,
    'password_hash', v_row.password,
    'auth_email', v_auth_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_for_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_for_login(text) TO anon;

-- Синхронізація пароля Auth з профілем (за іменем або id)
-- Замініть пароль і ім'я:
/*
UPDATE auth.users u
SET encrypted_password = extensions.crypt('ВашПароль123', extensions.gen_salt('bf')),
    updated_at = now()
FROM public.profiles p
WHERE u.id::text = p.id
  AND p.name ILIKE 'Tetiana Tatsii';
*/
