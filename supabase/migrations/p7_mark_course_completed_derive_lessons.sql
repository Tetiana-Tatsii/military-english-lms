-- =============================================================
-- P7 — mark_course_completed: derive lesson list from DB
-- Additive: CREATE OR REPLACE only. Signature unchanged.
-- p_lesson_ids is ignored (kept for client compatibility).
-- Run in: Supabase Dashboard → SQL Editor → Run
-- =============================================================

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
  v_lesson_ids text[];
  v_lesson_count integer;
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

  IF v_caller IS DISTINCT FROM p_user_id
     AND NOT private.is_teacher_or_admin() THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  -- Always derive lessons from lms_lessons (ignore client p_lesson_ids).
  SELECT coalesce(array_agg(l.id ORDER BY l.order_index, l.id), ARRAY[]::text[])
    INTO v_lesson_ids
    FROM public.lms_lessons l
   WHERE l.course_id = p_course_id;

  v_lesson_count := coalesce(cardinality(v_lesson_ids), 0);

  IF v_lesson_count = 0 THEN
    RETURN jsonb_build_object('error', 'no_lessons');
  END IF;

  SELECT count(*)::integer
    INTO v_missing
    FROM unnest(v_lesson_ids) AS lid(id)
   WHERE NOT EXISTS (
     SELECT 1
       FROM public.answers a
      WHERE a.user_id = p_user_id
        AND a.course_id = p_course_id
        AND a.lesson_id = lid.id
        AND a.status = 'reviewed'
        AND a.score IS NOT NULL
   );

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
     AND a.lesson_id = ANY (v_lesson_ids);

  IF v_reviewed_count < v_lesson_count OR v_avg IS NULL OR v_avg < 60 THEN
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

REVOKE ALL ON FUNCTION public.mark_course_completed(text, text, text[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_course_completed(text, text, text[])
  TO authenticated;

-- Baseline sanity
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'profiles', count(*) FROM public.profiles;
