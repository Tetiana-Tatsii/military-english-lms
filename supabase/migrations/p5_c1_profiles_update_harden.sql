-- =============================================================
-- P5 / C1 — Harden profiles UPDATE (no self privilege / coin edits)
--
-- Was: "Users can update own slp" → UPDATE any column on own row
-- Now: students/teachers have NO direct own-row UPDATE for money/role.
--      SLP + completed_courses go through SECURITY DEFINER RPCs.
--      Admin still updates via profiles_admin_manage (approve, etc.).
--
-- Deploy WITH matching frontend (slp.ts, gamification.ts).
-- Run in Supabase Dashboard → SQL Editor.
-- No DROP TABLE / no mass DELETE.
-- =============================================================

-- ── 1. Drop broad self-update policy ──────────────────────────
DROP POLICY IF EXISTS "Users can update own slp" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Keep admin UPDATE (re-assert if missing)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
CREATE POLICY "profiles_admin_manage"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ── 2. update_profile_slp ─────────────────────────────────────
-- Caller: student (own id) OR teacher/admin (any student).
-- Only writes slp_* columns.
CREATE OR REPLACE FUNCTION public.update_profile_slp(
  p_user_id text,
  p_slp jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller text := auth.uid()::text;
  v_listening integer;
  v_speaking integer;
  v_reading integer;
  v_writing integer;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RETURN jsonb_build_object('error', 'invalid_user');
  END IF;

  IF p_slp IS NULL OR jsonb_typeof(p_slp) <> 'object' THEN
    RETURN jsonb_build_object('error', 'invalid_slp');
  END IF;

  IF v_caller IS DISTINCT FROM p_user_id
     AND NOT private.is_teacher_or_admin() THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  v_listening := NULLIF(p_slp->>'listening', '')::integer;
  v_speaking  := NULLIF(p_slp->>'speaking', '')::integer;
  v_reading   := NULLIF(p_slp->>'reading', '')::integer;
  v_writing   := NULLIF(p_slp->>'writing', '')::integer;

  -- Also accept slp_* keys from older clients
  IF v_listening IS NULL THEN
    v_listening := NULLIF(p_slp->>'slp_listening', '')::integer;
  END IF;
  IF v_speaking IS NULL THEN
    v_speaking := NULLIF(p_slp->>'slp_speaking', '')::integer;
  END IF;
  IF v_reading IS NULL THEN
    v_reading := NULLIF(p_slp->>'slp_reading', '')::integer;
  END IF;
  IF v_writing IS NULL THEN
    v_writing := NULLIF(p_slp->>'slp_writing', '')::integer;
  END IF;

  IF v_listening IS NULL AND v_speaking IS NULL
     AND v_reading IS NULL AND v_writing IS NULL THEN
    RETURN jsonb_build_object('error', 'empty_slp');
  END IF;

  -- Clamp 0..100 when provided
  IF v_listening IS NOT NULL THEN
    v_listening := GREATEST(0, LEAST(100, v_listening));
  END IF;
  IF v_speaking IS NOT NULL THEN
    v_speaking := GREATEST(0, LEAST(100, v_speaking));
  END IF;
  IF v_reading IS NOT NULL THEN
    v_reading := GREATEST(0, LEAST(100, v_reading));
  END IF;
  IF v_writing IS NOT NULL THEN
    v_writing := GREATEST(0, LEAST(100, v_writing));
  END IF;

  UPDATE public.profiles
     SET slp_listening = COALESCE(v_listening, slp_listening),
         slp_speaking  = COALESCE(v_speaking,  slp_speaking),
         slp_reading   = COALESCE(v_reading,   slp_reading),
         slp_writing   = COALESCE(v_writing,   slp_writing)
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'userId', p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.update_profile_slp(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_profile_slp(text, jsonb) TO authenticated;

-- ── 3. mark_course_completed ──────────────────────────────────
-- Appends course_id to completed_courses after verifying reviewed HW.
-- Caller: student (own) OR teacher/admin.
CREATE OR REPLACE FUNCTION public.mark_course_completed(
  p_user_id text,
  p_course_id text,
  p_lesson_ids text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller text := auth.uid()::text;
  v_completed jsonb;
  v_lesson_id text;
  v_reviewed_count integer;
  v_avg numeric;
  v_missing integer := 0;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF p_user_id IS NULL OR btrim(p_user_id) = ''
     OR p_course_id IS NULL OR btrim(p_course_id) = '' THEN
    RETURN jsonb_build_object('error', 'invalid_args');
  END IF;

  IF p_lesson_ids IS NULL OR cardinality(p_lesson_ids) = 0 THEN
    RETURN jsonb_build_object('error', 'no_lessons');
  END IF;

  IF v_caller IS DISTINCT FROM p_user_id
     AND NOT private.is_teacher_or_admin() THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  -- Every lesson must have a reviewed answer with score
  FOREACH v_lesson_id IN ARRAY p_lesson_ids LOOP
    IF NOT EXISTS (
      SELECT 1
        FROM public.answers a
       WHERE a.user_id = p_user_id
         AND a.course_id = p_course_id
         AND a.lesson_id = v_lesson_id
         AND a.status = 'reviewed'
         AND a.score IS NOT NULL
    ) THEN
      v_missing := v_missing + 1;
    END IF;
  END LOOP;

  IF v_missing > 0 THEN
    RETURN jsonb_build_object(
      'error', 'incomplete',
      'missingLessons', v_missing
    );
  END IF;

  SELECT count(*), avg(a.score)
    INTO v_reviewed_count, v_avg
    FROM public.answers a
   WHERE a.user_id = p_user_id
     AND a.course_id = p_course_id
     AND a.status = 'reviewed'
     AND a.score IS NOT NULL
     AND a.lesson_id = ANY (p_lesson_ids);

  IF v_reviewed_count < cardinality(p_lesson_ids) OR v_avg IS NULL OR v_avg < 60 THEN
    RETURN jsonb_build_object(
      'error', 'avg_too_low',
      'avgScore', COALESCE(round(v_avg, 1), 0)
    );
  END IF;

  SELECT COALESCE(completed_courses, '[]'::jsonb)
    INTO v_completed
    FROM public.profiles
   WHERE id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  -- completed_courses is a jsonb array of course id strings
  IF v_completed @> jsonb_build_array(p_course_id) THEN
    RETURN jsonb_build_object(
      'ok', true,
      'alreadyCompleted', true,
      'completedCourses', v_completed
    );
  END IF;

  v_completed := v_completed || jsonb_build_array(p_course_id);

  UPDATE public.profiles
     SET completed_courses = v_completed
   WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'alreadyCompleted', false,
    'completedCourses', v_completed,
    'avgScore', round(v_avg, 1)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_course_completed(text, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_course_completed(text, text, text[]) TO authenticated;

-- ── 4. Verify ─────────────────────────────────────────────────
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'UPDATE'
ORDER BY policyname;

SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('update_profile_slp', 'mark_course_completed')
ORDER BY p.proname;

-- Baseline
SELECT 'profiles' AS t, count(*) FROM public.profiles
UNION ALL SELECT 'lms_courses', count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
