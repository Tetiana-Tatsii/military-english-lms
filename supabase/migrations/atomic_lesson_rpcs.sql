-- ================================================================
-- Migration: Atomic lesson/module RPC functions
-- Fixes concurrent teacher editing race condition permanently.
--
-- HOW IT WORKS:
--   Every function uses SELECT ... FOR UPDATE to lock the course
--   row in the DB. If two teachers save at the same moment, the
--   second one waits until the first completes — no data loss.
--
--   SECURITY DEFINER means the function runs as the DB owner,
--   bypassing RLS. This is intentional so that teachers who log
--   in via the fallback path (no Supabase Auth JWT) can still save.
--
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ================================================================


-- ── 1. update_lesson_in_course ──────────────────────────────────
-- Merges p_lesson_patch into the target lesson (keeps other fields).
CREATE OR REPLACE FUNCTION public.update_lesson_in_course(
  p_course_id    TEXT,
  p_module_id    TEXT,
  p_lesson_id    TEXT,
  p_lesson_patch JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modules     JSONB;
  v_mod_idx     INT;
  v_lesson_idx  INT;
  v_new_lesson  JSONB;
  v_new_lessons JSONB;
  v_new_modules JSONB;
BEGIN
  SELECT modules INTO v_modules
  FROM lms_courses
  WHERE id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::INT INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  SELECT (i - 1)::INT INTO v_lesson_idx
  FROM jsonb_array_elements(v_modules -> v_mod_idx -> 'lessons') WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_lesson_id;

  IF v_lesson_idx IS NULL THEN
    RAISE EXCEPTION 'Lesson not found: %', p_lesson_id;
  END IF;

  -- Merge patch into existing lesson (|| keeps existing fields not in patch)
  v_new_lesson  := (v_modules -> v_mod_idx -> 'lessons' -> v_lesson_idx) || p_lesson_patch;
  v_new_lessons := jsonb_set(v_modules -> v_mod_idx -> 'lessons', ARRAY[v_lesson_idx::TEXT], v_new_lesson);
  v_new_modules := jsonb_set(v_modules, ARRAY[v_mod_idx::TEXT, 'lessons'], v_new_lessons);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;


-- ── 2. add_lesson_to_module ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_lesson_to_module(
  p_course_id TEXT,
  p_module_id TEXT,
  p_lesson    JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modules     JSONB;
  v_mod_idx     INT;
  v_new_modules JSONB;
BEGIN
  SELECT modules INTO v_modules
  FROM lms_courses
  WHERE id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::INT INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  v_new_modules := jsonb_set(
    v_modules,
    ARRAY[v_mod_idx::TEXT, 'lessons'],
    (v_modules -> v_mod_idx -> 'lessons') || jsonb_build_array(p_lesson)
  );

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;


-- ── 3. delete_lesson_from_module ────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_lesson_from_module(
  p_course_id TEXT,
  p_module_id TEXT,
  p_lesson_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modules     JSONB;
  v_mod_idx     INT;
  v_new_lessons JSONB;
  v_new_modules JSONB;
BEGIN
  SELECT modules INTO v_modules
  FROM lms_courses
  WHERE id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::INT INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  SELECT COALESCE(jsonb_agg(elem ORDER BY ordinality), '[]'::jsonb) INTO v_new_lessons
  FROM jsonb_array_elements(v_modules -> v_mod_idx -> 'lessons') WITH ORDINALITY t(elem, ordinality)
  WHERE t.elem->>'id' != p_lesson_id;

  v_new_modules := jsonb_set(v_modules, ARRAY[v_mod_idx::TEXT, 'lessons'], v_new_lessons);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;


-- ── 4. update_module_in_course ──────────────────────────────────
-- Updates module metadata (title, icon) without touching lessons.
CREATE OR REPLACE FUNCTION public.update_module_in_course(
  p_course_id    TEXT,
  p_module_id    TEXT,
  p_module_patch JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modules     JSONB;
  v_mod_idx     INT;
  v_new_module  JSONB;
  v_new_modules JSONB;
BEGIN
  SELECT modules INTO v_modules
  FROM lms_courses
  WHERE id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::INT INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  -- Merge patch but never overwrite lessons via this function
  v_new_module  := (v_modules -> v_mod_idx) || (p_module_patch - 'lessons');
  v_new_modules := jsonb_set(v_modules, ARRAY[v_mod_idx::TEXT], v_new_module);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;


-- ── 5. add_module_to_course ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_module_to_course(
  p_course_id TEXT,
  p_module    JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modules     JSONB;
  v_new_modules JSONB;
BEGIN
  SELECT modules INTO v_modules
  FROM lms_courses
  WHERE id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  v_new_modules := v_modules || jsonb_build_array(p_module);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;


-- ── 6. delete_module_from_course ────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_module_from_course(
  p_course_id TEXT,
  p_module_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modules     JSONB;
  v_new_modules JSONB;
BEGIN
  SELECT modules INTO v_modules
  FROM lms_courses
  WHERE id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT COALESCE(jsonb_agg(elem ORDER BY ordinality), '[]'::jsonb) INTO v_new_modules
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, ordinality)
  WHERE t.elem->>'id' != p_module_id;

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;
