-- Admin: sync Supabase Auth password after changing profile password in the app.
-- Run in Supabase SQL Editor. Requires extensions schema (pgcrypto).

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
      'hint', 'У Authentication → Users немає користувача з таким UUID. Створіть його з тим самим id, що в profiles, або виконайте SQL з docs/RESET_PASSWORD.md'
    );
  END IF;

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
         updated_at = now()
   WHERE id = p_target_user_id::uuid;

  RETURN jsonb_build_object(
    'ok', true,
    'auth_email', v_auth_email,
    'profile_name', v_profile_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sync_auth_password(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sync_auth_password(text, text) TO authenticated;
