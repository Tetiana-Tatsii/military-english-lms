-- =============================================================
-- P5 / H2 — Certificates: issue only via SECURITY DEFINER RPC
--
-- Was: certificates_insert_own → any auth user can insert own row
-- Now: no client INSERT; issue_certificate() verifies homework +
--      quizzes + SLP >= 60 from DB, then inserts.
--
-- Deploy WITH matching frontend (src/lib/certificates.ts).
-- Run in Supabase Dashboard → SQL Editor.
-- =============================================================

-- ── 1. Drop client INSERT ─────────────────────────────────────
DROP POLICY IF EXISTS "certificates_insert_own" ON public.certificates;

-- Keep SELECT (own or teacher/admin)
DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;
CREATE POLICY "certificates_select_own"
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text
    OR private.is_teacher_or_admin()
  );

-- ── 2. issue_certificate ──────────────────────────────────────
-- Issues (or returns existing) certificate for auth.uid() + course.
CREATE OR REPLACE FUNCTION public.issue_certificate(p_course_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
  v_student_name text;
  v_course_title text;
  v_course_status text;
  v_lesson record;
  v_total_lessons integer := 0;
  v_homework_done integer := 0;
  v_quizzes_required integer := 0;
  v_quizzes_done integer := 0;
  v_has_quiz boolean;
  v_slp_avg numeric;
  v_cert public.certificates%ROWTYPE;
  v_cert_number text;
  v_short text;
  v_completed_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF p_course_id IS NULL OR btrim(p_course_id) = '' THEN
    RETURN jsonb_build_object('error', 'invalid_course');
  END IF;

  -- Already issued?
  SELECT *
    INTO v_cert
    FROM public.certificates
   WHERE user_id = v_user_id
     AND course_id = p_course_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'alreadyIssued', true,
      'certificate', to_jsonb(v_cert)
    );
  END IF;

  SELECT c.title, c.status
    INTO v_course_title, v_course_status
    FROM public.lms_courses c
   WHERE c.id = p_course_id;

  IF v_course_title IS NULL THEN
    RETURN jsonb_build_object('error', 'course_not_found');
  END IF;

  IF v_course_status IS DISTINCT FROM 'active' THEN
    RETURN jsonb_build_object('error', 'course_not_active');
  END IF;

  SELECT p.name,
         round((
           COALESCE(p.slp_listening, 0)
         + COALESCE(p.slp_speaking, 0)
         + COALESCE(p.slp_reading, 0)
         + COALESCE(p.slp_writing, 0)
         ) / 4.0)
    INTO v_student_name, v_slp_avg
    FROM public.profiles p
   WHERE p.id = v_user_id;

  IF v_student_name IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  IF COALESCE(v_slp_avg, 0) < 60 THEN
    RETURN jsonb_build_object(
      'error', 'slp_too_low',
      'slpAverage', COALESCE(v_slp_avg, 0)
    );
  END IF;

  FOR v_lesson IN
    SELECT l.id, l.content
      FROM public.lms_lessons l
     WHERE l.course_id = p_course_id
     ORDER BY l.order_index
  LOOP
    v_total_lessons := v_total_lessons + 1;

    IF EXISTS (
      SELECT 1
        FROM public.answers a
       WHERE a.user_id = v_user_id
         AND a.course_id = p_course_id
         AND a.lesson_id = v_lesson.id
    ) THEN
      v_homework_done := v_homework_done + 1;
    END IF;

    v_has_quiz := jsonb_typeof(v_lesson.content->'quiz') = 'array'
      AND jsonb_array_length(v_lesson.content->'quiz') > 0;

    IF v_has_quiz THEN
      v_quizzes_required := v_quizzes_required + 1;
      IF EXISTS (
        SELECT 1
          FROM public.quiz_results q
         WHERE q.user_id = v_user_id
           AND q.lesson_id = v_lesson.id
      ) THEN
        v_quizzes_done := v_quizzes_done + 1;
      END IF;
    END IF;
  END LOOP;

  IF v_total_lessons = 0 THEN
    RETURN jsonb_build_object('error', 'no_lessons');
  END IF;

  IF v_homework_done < v_total_lessons THEN
    RETURN jsonb_build_object(
      'error', 'homework_incomplete',
      'homeworkDone', v_homework_done,
      'totalLessons', v_total_lessons
    );
  END IF;

  IF v_quizzes_done < v_quizzes_required THEN
    RETURN jsonb_build_object(
      'error', 'quizzes_incomplete',
      'quizzesDone', v_quizzes_done,
      'quizzesRequired', v_quizzes_required
    );
  END IF;

  SELECT max(a.created_at)
    INTO v_completed_at
    FROM public.answers a
   WHERE a.user_id = v_user_id
     AND a.course_id = p_course_id;

  v_completed_at := COALESCE(v_completed_at, now());

  v_short := upper(substr(regexp_replace(p_course_id, '[^a-zA-Z0-9]', '', 'g'), 1, 8));
  IF v_short IS NULL OR v_short = '' THEN
    v_short := 'COURSE';
  END IF;
  v_cert_number := 'MEL-' || v_short || '-' || to_char(now(), 'YYYY') || '-' ||
    upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));

  BEGIN
    INSERT INTO public.certificates (
      user_id,
      course_id,
      student_name,
      course_title,
      certificate_number,
      completed_at,
      issued_at
    ) VALUES (
      v_user_id,
      p_course_id,
      v_student_name,
      v_course_title,
      v_cert_number,
      v_completed_at,
      now()
    )
    RETURNING * INTO v_cert;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT *
        INTO v_cert
        FROM public.certificates
       WHERE user_id = v_user_id
         AND course_id = p_course_id;
      RETURN jsonb_build_object(
        'ok', true,
        'alreadyIssued', true,
        'certificate', to_jsonb(v_cert)
      );
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'alreadyIssued', false,
    'certificate', to_jsonb(v_cert),
    'slpAverage', v_slp_avg
  );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_certificate(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_certificate(text) TO authenticated;

-- ── 3. Verify ─────────────────────────────────────────────────
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'certificates'
ORDER BY policyname, cmd;

SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'issue_certificate';

SELECT 'certificates' AS t, count(*) FROM public.certificates
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'lms_courses', count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
