-- =============================================================
-- P7 — Courses/lessons SELECT: approved students + teachers/admins
-- Pending authenticated users can no longer read course content.
-- Additive: DROP POLICY IF EXISTS + CREATE POLICY.
-- Apply AFTER frontend pending signOut (Step 1).
-- Run in: Supabase Dashboard → SQL Editor → Run
-- =============================================================

CREATE OR REPLACE FUNCTION private.is_approved_user()
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
      AND status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION private.is_approved_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_approved_user() TO authenticated;

-- ── lms_courses SELECT ────────────────────────────────────────
DROP POLICY IF EXISTS "lms_courses_select_authenticated" ON public.lms_courses;
DROP POLICY IF EXISTS "lms_courses_select_approved" ON public.lms_courses;

CREATE POLICY "lms_courses_select_approved"
  ON public.lms_courses
  FOR SELECT
  TO authenticated
  USING (
    private.is_teacher_or_admin()
    OR private.is_approved_user()
  );

-- ── lms_lessons SELECT ────────────────────────────────────────
DROP POLICY IF EXISTS "lms_lessons_select_authenticated" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_select" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_select_approved" ON public.lms_lessons;

CREATE POLICY "lms_lessons_select_approved"
  ON public.lms_lessons
  FOR SELECT
  TO authenticated
  USING (
    private.is_teacher_or_admin()
    OR private.is_approved_user()
  );

-- Verify policies
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('lms_courses', 'lms_lessons')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- Baseline sanity
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
