-- =============================================================
-- P4 — КРОК 2: Private schema (additive, без втрати даних)
-- Запускати ТІЛЬКИ після перегляду результатів p4_step1_audit.sql
-- Якщо PRIVATE.schema_usage_authenticated вже = true — можна пропустити
-- =============================================================

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_teacher_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('teacher', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()::text
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_teacher_or_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_teacher_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Перевірка
SELECT
  has_schema_privilege('authenticated', 'private', 'USAGE') AS schema_ok,
  private.is_teacher_or_admin() AS teacher_check_as_postgres;

-- Увага: останній рядок від postgres — не від teacher JWT; лише перевірка що функція існує.
