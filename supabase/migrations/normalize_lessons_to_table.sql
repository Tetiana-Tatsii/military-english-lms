-- ================================================================
-- Migration: Normalize lessons into a separate table
--
-- WHY: All lessons were stored inside lms_courses.modules (JSONB).
--      Any save operation rewrote the entire array, so concurrent
--      edits by different teachers overwrote each other.
--
-- AFTER THIS MIGRATION:
--   • lms_courses.modules  — only module structure {id, title, icon}
--   • lms_lessons          — one row per lesson, independent upsert
--
-- TEACHERS CAN NOW SAVE DIFFERENT LESSONS SIMULTANEOUSLY WITH ZERO
-- RISK OF OVERWRITING EACH OTHER.
--
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ================================================================


-- ── 1. Create lms_lessons table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lms_lessons (
  id          TEXT        PRIMARY KEY,
  course_id   TEXT        NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  module_id   TEXT        NOT NULL,
  order_index INTEGER     NOT NULL DEFAULT 0,
  content     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lms_lessons_course_id_idx
  ON public.lms_lessons (course_id);

CREATE INDEX IF NOT EXISTS lms_lessons_course_module_idx
  ON public.lms_lessons (course_id, module_id);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lms_lessons_updated_at ON public.lms_lessons;
CREATE TRIGGER trg_lms_lessons_updated_at
  BEFORE UPDATE ON public.lms_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 2. Migrate existing lessons from JSONB into lms_lessons ─────
INSERT INTO public.lms_lessons (id, course_id, module_id, order_index, content)
SELECT
  (lesson ->> 'id')        AS id,
  c.id                     AS course_id,
  (mod    ->> 'id')        AS module_id,
  (lesson_ord - 1)::INT    AS order_index,
  lesson                   AS content
FROM
  public.lms_courses c,
  LATERAL jsonb_array_elements(c.modules)          WITH ORDINALITY AS m(mod,    mod_ord),
  LATERAL jsonb_array_elements(mod -> 'lessons')   WITH ORDINALITY AS l(lesson, lesson_ord)
WHERE
  lesson ->> 'id' IS NOT NULL
ON CONFLICT (id) DO NOTHING;


-- ── 3. Strip lessons from lms_courses.modules ───────────────────
-- After migration, lms_courses.modules stores only {id, title, icon}.
-- Lessons are rebuilt on the frontend from lms_lessons.
UPDATE public.lms_courses
SET modules = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',      mod ->> 'id',
        'title',   mod ->> 'title',
        'icon',    mod ->> 'icon',
        'lessons', '[]'::jsonb
      )
      ORDER BY mod_ord
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(modules) WITH ORDINALITY AS t(mod, mod_ord)
);


-- ── 4. RLS for lms_lessons ──────────────────────────────────────
ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lms_lessons_select" ON public.lms_lessons;
DROP POLICY IF EXISTS "lms_lessons_all"    ON public.lms_lessons;

-- Everyone can read lessons (students, teachers, anon preview)
CREATE POLICY "lms_lessons_select"
  ON public.lms_lessons
  FOR SELECT
  USING (true);

-- All writes are allowed (teachers may use fallback auth without JWT)
-- Tighten to auth.role() = 'authenticated' once all teachers use Supabase Auth
CREATE POLICY "lms_lessons_all"
  ON public.lms_lessons
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ── 5. Enable Realtime for lms_lessons ──────────────────────────
-- Teachers receive live updates when another teacher saves a lesson.
ALTER PUBLICATION supabase_realtime ADD TABLE public.lms_lessons;


-- ── 6. Also add updated_at to lms_courses (if missing) ──────────
ALTER TABLE public.lms_courses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_lms_courses_updated_at ON public.lms_courses;
CREATE TRIGGER trg_lms_courses_updated_at
  BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── Done ─────────────────────────────────────────────────────────
-- Verify:
-- SELECT count(*) FROM lms_lessons;
-- SELECT id, jsonb_array_length(modules) AS mod_count FROM lms_courses;
