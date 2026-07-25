-- =============================================================
-- P7 — Server-side SLP recalculation
-- 1) New RPC recalculate_profile_slp(p_user_id) — computes from DB
-- 2) update_profile_slp — teacher/admin only (no student self-write)
-- Run in: Supabase Dashboard → SQL Editor → Run
-- =============================================================

-- ── 1. recalculate_profile_slp ────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalculate_profile_slp(p_user_id text)
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

  IF v_caller IS DISTINCT FROM p_user_id
     AND NOT private.is_teacher_or_admin() THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  -- Average quiz_results + reviewed answers per skill.
  -- Lesson skill lives in lms_lessons.content->>'skill' (default mixed).
  WITH lesson_skills AS (
    SELECT
      l.id AS lesson_id,
      lower(coalesce(nullif(btrim(l.content->>'skill'), ''), 'mixed')) AS skill
    FROM public.lms_lessons l
  ),
  skill_scores AS (
    SELECT ls.skill, q.score::numeric AS score
      FROM public.quiz_results q
      JOIN lesson_skills ls ON ls.lesson_id = q.lesson_id
     WHERE q.user_id = p_user_id
       AND q.score IS NOT NULL
    UNION ALL
    SELECT ls.skill, a.score::numeric AS score
      FROM public.answers a
      JOIN lesson_skills ls ON ls.lesson_id = a.lesson_id
     WHERE a.user_id = p_user_id
       AND a.status = 'reviewed'
       AND a.score IS NOT NULL
  ),
  expanded AS (
    -- mixed counts toward every skill bucket
    SELECT s.skill_name, ss.score
      FROM skill_scores ss
      CROSS JOIN LATERAL (
        SELECT unnest(
          CASE
            WHEN ss.skill = 'mixed' THEN
              ARRAY['listening', 'speaking', 'reading', 'writing']
            WHEN ss.skill IN ('listening', 'speaking', 'reading', 'writing') THEN
              ARRAY[ss.skill]
            ELSE
              ARRAY[]::text[]
          END
        ) AS skill_name
      ) s
  ),
  averages AS (
    SELECT
      skill_name,
      round(avg(score))::integer AS avg_score
    FROM expanded
    GROUP BY skill_name
  )
  SELECT
    max(avg_score) FILTER (WHERE skill_name = 'listening'),
    max(avg_score) FILTER (WHERE skill_name = 'speaking'),
    max(avg_score) FILTER (WHERE skill_name = 'reading'),
    max(avg_score) FILTER (WHERE skill_name = 'writing')
  INTO v_listening, v_speaking, v_reading, v_writing
  FROM averages;

  IF v_listening IS NULL AND v_speaking IS NULL
     AND v_reading IS NULL AND v_writing IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'empty', true, 'userId', p_user_id);
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

  RETURN jsonb_build_object(
    'ok', true,
    'userId', p_user_id,
    'slp', jsonb_build_object(
      'listening', v_listening,
      'speaking', v_speaking,
      'reading', v_reading,
      'writing', v_writing
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_profile_slp(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_profile_slp(text)
  TO authenticated;

-- ── 2. update_profile_slp — teacher/admin only ────────────────
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

  IF NOT private.is_teacher_or_admin() THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RETURN jsonb_build_object('error', 'invalid_user');
  END IF;

  IF p_slp IS NULL OR jsonb_typeof(p_slp) <> 'object' THEN
    RETURN jsonb_build_object('error', 'invalid_slp');
  END IF;

  v_listening := NULLIF(p_slp->>'listening', '')::integer;
  v_speaking  := NULLIF(p_slp->>'speaking', '')::integer;
  v_reading   := NULLIF(p_slp->>'reading', '')::integer;
  v_writing   := NULLIF(p_slp->>'writing', '')::integer;

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

REVOKE ALL ON FUNCTION public.update_profile_slp(text, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_profile_slp(text, jsonb)
  TO authenticated;

-- Baseline sanity
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'profiles', count(*) FROM public.profiles;
