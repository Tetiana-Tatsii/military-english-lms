-- =============================================================
-- P5 / C2 — Harden profiles INSERT (registration)
--
-- Was: "Allow insert during registration" WITH CHECK (true)
-- Now: only own row, forced student + pending
--
-- Safe for current UI (login registers only as student).
-- Teachers/admins are NOT created via public registration.
--
-- Run in Supabase Dashboard → SQL Editor (production).
-- No DROP TABLE / no mass DELETE.
-- =============================================================

DROP POLICY IF EXISTS "Allow insert during registration" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_student" ON public.profiles;

CREATE POLICY "profiles_insert_own_student"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()::text
  AND role = 'student'
  AND status = 'pending'
);

-- Verify
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Baseline
SELECT 'profiles' AS t, count(*) FROM public.profiles
UNION ALL SELECT 'lms_courses', count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
