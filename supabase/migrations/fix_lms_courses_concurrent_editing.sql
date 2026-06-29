-- =============================================================
-- Migration: fix concurrent editing issues in lms_courses
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- =============================================================

-- 1. Add updated_at column (if it doesn't exist)
ALTER TABLE public.lms_courses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lms_courses_updated_at ON public.lms_courses;
CREATE TRIGGER trg_lms_courses_updated_at
  BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 2. RLS policies — ensure authenticated teachers can read & update
-- =============================================================

-- Enable RLS if not already enabled
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;

-- Drop old policies to recreate cleanly
DROP POLICY IF EXISTS "Allow authenticated read lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow authenticated update lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow authenticated insert lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow public read lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Allow anon read lms_courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Teachers can update courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Teachers can insert courses" ON public.lms_courses;

-- Everyone (including students / anon) can READ courses
CREATE POLICY "Allow public read lms_courses"
  ON public.lms_courses
  FOR SELECT
  USING (true);

-- Only authenticated users (teachers / admins) can INSERT
CREATE POLICY "Allow authenticated insert lms_courses"
  ON public.lms_courses
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (teachers / admins) can UPDATE
CREATE POLICY "Allow authenticated update lms_courses"
  ON public.lms_courses
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can DELETE
DROP POLICY IF EXISTS "Allow authenticated delete lms_courses" ON public.lms_courses;
CREATE POLICY "Allow authenticated delete lms_courses"
  ON public.lms_courses
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================================
-- 3. Enable Realtime for lms_courses
--    (allows teacher editor to receive live updates)
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.lms_courses;

-- =============================================================
-- Diagnostic: check current policies
-- =============================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'lms_courses';
