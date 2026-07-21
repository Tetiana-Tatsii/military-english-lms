-- =============================================================
-- Certificates: issue record per student + course
-- Run in Supabase SQL Editor (production)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id text NOT NULL,
  student_name text NOT NULL,
  course_title text NOT NULL,
  certificate_number text NOT NULL,
  completed_at timestamptz NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certificates_user_course_unique UNIQUE (user_id, course_id),
  CONSTRAINT certificates_number_unique UNIQUE (certificate_number)
);

CREATE INDEX IF NOT EXISTS certificates_user_id_idx
  ON public.certificates (user_id);

CREATE INDEX IF NOT EXISTS certificates_course_id_idx
  ON public.certificates (course_id);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;
CREATE POLICY "certificates_select_own"
  ON public.certificates FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR private.is_teacher_or_admin()
  );

DROP POLICY IF EXISTS "certificates_insert_own" ON public.certificates;
CREATE POLICY "certificates_insert_own"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Students do not update/delete; teachers can read for verification
DROP POLICY IF EXISTS "certificates_select_teachers" ON public.certificates;

-- Verify
SELECT 'certificates' AS table_name, count(*)::text AS rows
FROM public.certificates;
