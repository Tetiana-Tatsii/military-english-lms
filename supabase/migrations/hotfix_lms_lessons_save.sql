-- =============================================================
-- Hotfix: збереження уроків (lms_lessons upsert) для викладачів
-- Run in Supabase SQL Editor
-- =============================================================

CREATE SCHEMA IF NOT EXISTS private;

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

REVOKE ALL ON FUNCTION private.is_teacher_or_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_teacher_or_admin() TO authenticated;

ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;

-- Прибрати старі широкі політики (якщо лишились)
DROP POLICY IF EXISTS "lms_lessons_all" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_select" ON public.lms_lessons;

DROP POLICY IF EXISTS "lms_lessons_select_authenticated" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_insert_teachers" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_update_teachers" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_delete_teachers" ON public.lms_lessons;

-- Читання: усі залогінені (студенти + викладачі)
CREATE POLICY "lms_lessons_select_authenticated"
  ON public.lms_lessons FOR SELECT
  TO authenticated
  USING (true);

-- Запис: лише викладач / адмін (потрібно для upsert = INSERT + UPDATE)
CREATE POLICY "lms_lessons_insert_teachers"
  ON public.lms_lessons FOR INSERT
  TO authenticated
  WITH CHECK (private.is_teacher_or_admin());

CREATE POLICY "lms_lessons_update_teachers"
  ON public.lms_lessons FOR UPDATE
  TO authenticated
  USING (private.is_teacher_or_admin())
  WITH CHECK (private.is_teacher_or_admin());

CREATE POLICY "lms_lessons_delete_teachers"
  ON public.lms_lessons FOR DELETE
  TO authenticated
  USING (private.is_teacher_or_admin());

-- Діагностика (перевірте свою роль після входу як викладач):
-- SELECT auth.uid() AS my_uid,
--        (SELECT role FROM public.profiles WHERE id = auth.uid()::text) AS my_role,
--        private.is_teacher_or_admin() AS can_edit_lessons;
