-- =============================================================
-- Fix remaining Security Advisor warnings
-- Run in Supabase Dashboard → SQL Editor
--
-- ORDER MATTERS: policies must switch to private.* BEFORE dropping
-- public.is_teacher_or_admin() / public.is_admin().
-- =============================================================

-- ── 1. Helper functions in private schema (not exposed via /rest/v1/rpc) ──
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_teacher_or_admin()
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
      AND role IN ('teacher', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
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
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_teacher_or_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_teacher_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;


-- ── 2. Point ALL RLS policies at private.* (before dropping public.*) ──

-- profiles
DROP POLICY IF EXISTS "profiles_select_teachers" ON public.profiles;
CREATE POLICY "profiles_select_teachers"
  ON public.profiles FOR SELECT TO authenticated
  USING (private.is_teacher_or_admin());

DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
CREATE POLICY "profiles_admin_manage"
  ON public.profiles FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE TO authenticated
  USING (private.is_admin());

-- lms_courses
DROP POLICY IF EXISTS "lms_courses_insert_teachers" ON public.lms_courses;
CREATE POLICY "lms_courses_insert_teachers"
  ON public.lms_courses FOR INSERT TO authenticated
  WITH CHECK (private.is_teacher_or_admin());

DROP POLICY IF EXISTS "lms_courses_update_teachers" ON public.lms_courses;
CREATE POLICY "lms_courses_update_teachers"
  ON public.lms_courses FOR UPDATE TO authenticated
  USING (private.is_teacher_or_admin()) WITH CHECK (private.is_teacher_or_admin());

DROP POLICY IF EXISTS "lms_courses_delete_teachers" ON public.lms_courses;
CREATE POLICY "lms_courses_delete_teachers"
  ON public.lms_courses FOR DELETE TO authenticated
  USING (private.is_teacher_or_admin());

-- lms_lessons
DROP POLICY IF EXISTS "lms_lessons_insert_teachers" ON public.lms_lessons;
CREATE POLICY "lms_lessons_insert_teachers"
  ON public.lms_lessons FOR INSERT TO authenticated
  WITH CHECK (private.is_teacher_or_admin());

DROP POLICY IF EXISTS "lms_lessons_update_teachers" ON public.lms_lessons;
CREATE POLICY "lms_lessons_update_teachers"
  ON public.lms_lessons FOR UPDATE TO authenticated
  USING (private.is_teacher_or_admin()) WITH CHECK (private.is_teacher_or_admin());

DROP POLICY IF EXISTS "lms_lessons_delete_teachers" ON public.lms_lessons;
CREATE POLICY "lms_lessons_delete_teachers"
  ON public.lms_lessons FOR DELETE TO authenticated
  USING (private.is_teacher_or_admin());

-- answers
DROP POLICY IF EXISTS "answers_select_teachers" ON public.answers;
CREATE POLICY "answers_select_teachers"
  ON public.answers FOR SELECT TO authenticated
  USING (private.is_teacher_or_admin());

DROP POLICY IF EXISTS "answers_update_teachers" ON public.answers;
CREATE POLICY "answers_update_teachers"
  ON public.answers FOR UPDATE TO authenticated
  USING (private.is_teacher_or_admin()) WITH CHECK (private.is_teacher_or_admin());

-- quiz_results
DROP POLICY IF EXISTS "quiz_results_select_teachers" ON public.quiz_results;
CREATE POLICY "quiz_results_select_teachers"
  ON public.quiz_results FOR SELECT TO authenticated
  USING (private.is_teacher_or_admin());

-- support_tickets
DROP POLICY IF EXISTS "support_tickets_select_admin" ON public.support_tickets;
CREATE POLICY "support_tickets_select_admin"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (private.is_admin());

DROP POLICY IF EXISTS "support_tickets_update_admin" ON public.support_tickets;
CREATE POLICY "support_tickets_update_admin"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "support_tickets_insert" ON public.support_tickets;
CREATE POLICY "support_tickets_insert"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND length(trim(message)) > 0
    AND user_name = (
      SELECT name FROM public.profiles WHERE id = auth.uid()::text
    )
  );

-- archive
DROP POLICY IF EXISTS "archive_select_admin" ON public.student_answers_archive;
CREATE POLICY "archive_select_admin"
  ON public.student_answers_archive FOR SELECT TO authenticated
  USING (private.is_admin());


-- ── 3. NOW safe to drop old public helpers ───────────────────────
DROP FUNCTION IF EXISTS public.is_teacher_or_admin();
DROP FUNCTION IF EXISTS public.is_admin();


-- ── 4. Storage — remove broad SELECT (list) policy ───────────────
DROP POLICY IF EXISTS "Allow public uploads updates deletes for student answers" ON storage.objects;
DROP POLICY IF EXISTS "lesson_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "lesson_media_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "student_answers_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "student_answers_bucket_update" ON storage.objects;

CREATE POLICY "lesson_media_insert_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-media'
    AND (storage.foldername(name))[1] IN (
      'student-answers', 'photos', 'audio', 'documents'
    )
  );

CREATE POLICY "lesson_media_update_authenticated"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lesson-media')
  WITH CHECK (bucket_id = 'lesson-media');

CREATE POLICY "student_answers_bucket_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-answers');

CREATE POLICY "student_answers_bucket_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-answers')
  WITH CHECK (bucket_id = 'student-answers');


-- ── 5. Lesson/module RPCs → SECURITY INVOKER + role guard ────────
CREATE OR REPLACE FUNCTION public.update_lesson_in_course(
  p_course_id text, p_module_id text, p_lesson_id text, p_lesson_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_modules jsonb;
  v_mod_idx int;
  v_lesson_idx int;
  v_new_lesson jsonb;
  v_new_lessons jsonb;
  v_new_modules jsonb;
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RAISE EXCEPTION 'Forbidden: teachers only';
  END IF;

  SELECT modules INTO v_modules
  FROM lms_courses WHERE id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::int INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  SELECT (i - 1)::int INTO v_lesson_idx
  FROM jsonb_array_elements(v_modules -> v_mod_idx -> 'lessons') WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_lesson_id;

  IF v_lesson_idx IS NULL THEN
    RAISE EXCEPTION 'Lesson not found: %', p_lesson_id;
  END IF;

  v_new_lesson := (v_modules -> v_mod_idx -> 'lessons' -> v_lesson_idx) || p_lesson_patch;
  v_new_lessons := jsonb_set(v_modules -> v_mod_idx -> 'lessons', ARRAY[v_lesson_idx::text], v_new_lesson);
  v_new_modules := jsonb_set(v_modules, ARRAY[v_mod_idx::text, 'lessons'], v_new_lessons);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_lesson_to_module(
  p_course_id text, p_module_id text, p_lesson jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_modules jsonb;
  v_mod_idx int;
  v_new_modules jsonb;
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RAISE EXCEPTION 'Forbidden: teachers only';
  END IF;

  SELECT modules INTO v_modules
  FROM lms_courses WHERE id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::int INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  v_new_modules := jsonb_set(
    v_modules,
    ARRAY[v_mod_idx::text, 'lessons'],
    (v_modules -> v_mod_idx -> 'lessons') || jsonb_build_array(p_lesson)
  );

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_lesson_from_module(
  p_course_id text, p_module_id text, p_lesson_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_modules jsonb;
  v_mod_idx int;
  v_new_lessons jsonb;
  v_new_modules jsonb;
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RAISE EXCEPTION 'Forbidden: teachers only';
  END IF;

  SELECT modules INTO v_modules
  FROM lms_courses WHERE id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::int INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  SELECT COALESCE(jsonb_agg(elem ORDER BY ordinality), '[]'::jsonb) INTO v_new_lessons
  FROM jsonb_array_elements(v_modules -> v_mod_idx -> 'lessons') WITH ORDINALITY t(elem, ordinality)
  WHERE t.elem->>'id' != p_lesson_id;

  v_new_modules := jsonb_set(v_modules, ARRAY[v_mod_idx::text, 'lessons'], v_new_lessons);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_module_in_course(
  p_course_id text, p_module_id text, p_module_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_modules jsonb;
  v_mod_idx int;
  v_new_module jsonb;
  v_new_modules jsonb;
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RAISE EXCEPTION 'Forbidden: teachers only';
  END IF;

  SELECT modules INTO v_modules
  FROM lms_courses WHERE id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  SELECT (i - 1)::int INTO v_mod_idx
  FROM jsonb_array_elements(v_modules) WITH ORDINALITY t(elem, i)
  WHERE t.elem->>'id' = p_module_id;

  IF v_mod_idx IS NULL THEN
    RAISE EXCEPTION 'Module not found: %', p_module_id;
  END IF;

  v_new_module := (v_modules -> v_mod_idx) || (p_module_patch - 'lessons');
  v_new_modules := jsonb_set(v_modules, ARRAY[v_mod_idx::text], v_new_module);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_module_to_course(
  p_course_id text, p_module jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_modules jsonb;
  v_new_modules jsonb;
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RAISE EXCEPTION 'Forbidden: teachers only';
  END IF;

  SELECT modules INTO v_modules
  FROM lms_courses WHERE id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  v_new_modules := v_modules || jsonb_build_array(p_module);

  UPDATE lms_courses SET modules = v_new_modules WHERE id = p_course_id;
  RETURN v_new_modules;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_module_from_course(
  p_course_id text, p_module_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_modules jsonb;
  v_new_modules jsonb;
BEGIN
  IF NOT private.is_teacher_or_admin() THEN
    RAISE EXCEPTION 'Forbidden: teachers only';
  END IF;

  SELECT modules INTO v_modules
  FROM lms_courses WHERE id = p_course_id FOR UPDATE;

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

REVOKE ALL ON FUNCTION public.update_lesson_in_course(text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_lesson_to_module(text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_lesson_from_module(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_module_in_course(text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_module_to_course(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_module_from_course(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_lesson_in_course(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_lesson_to_module(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_lesson_from_module(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_module_in_course(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_module_to_course(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_module_from_course(text, text) TO authenticated;


-- ── 6. Gamification RPCs → SECURITY INVOKER ──────────────────────
CREATE OR REPLACE FUNCTION public.process_daily_streak()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id      text;
  v_last_login   date;
  v_streak       integer;
  v_coins        integer;
  v_today        date := CURRENT_DATE;
  v_yesterday    date := CURRENT_DATE - 1;
  v_new_streak   integer;
  v_coins_earned integer;
  v_new_coins    integer;
  v_consecutive  boolean;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0,
      'newStreak', 0,
      'newCoffeeCoins', 0,
      'isMilestone', false,
      'wasStreakBroken', false,
      'error', 'not_authenticated'
    );
  END IF;

  SELECT last_login_date, streak_count, coffee_coins
    INTO v_last_login, v_streak, v_coins
    FROM public.profiles
   WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0,
      'newStreak', 0,
      'newCoffeeCoins', 0,
      'isMilestone', false,
      'wasStreakBroken', false,
      'error', 'profile_not_found'
    );
  END IF;

  IF v_last_login = v_today THEN
    RETURN jsonb_build_object(
      'coinsEarned', 0,
      'newStreak', v_streak,
      'newCoffeeCoins', v_coins,
      'isMilestone', v_streak > 0 AND v_streak % 7 = 0,
      'wasStreakBroken', false
    );
  END IF;

  v_consecutive := (v_last_login = v_yesterday);
  v_new_streak := CASE WHEN v_consecutive THEN v_streak + 1 ELSE 1 END;
  v_coins_earned := CASE WHEN v_new_streak % 7 = 0 THEN 7 ELSE 1 END;
  v_new_coins := v_coins + v_coins_earned;

  UPDATE public.profiles
     SET last_login_date = v_today,
         streak_count = v_new_streak,
         coffee_coins = v_new_coins
   WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'coinsEarned', v_coins_earned,
    'newStreak', v_new_streak,
    'newCoffeeCoins', v_new_coins,
    'isMilestone', v_new_streak % 7 = 0,
    'wasStreakBroken', NOT v_consecutive AND v_last_login IS NOT NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_shop_item(p_item_id text, p_price integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id       text;
  v_coins         integer;
  v_purchased     jsonb;
  v_already_owned boolean;
  v_new_coins     integer;
  v_new_purchased jsonb;
BEGIN
  v_user_id := auth.uid()::text;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT coffee_coins, purchased_items
    INTO v_coins, v_purchased
    FROM public.profiles
   WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  IF v_purchased IS NULL OR jsonb_typeof(v_purchased) <> 'array' THEN
    v_purchased := '[]'::jsonb;
  END IF;

  v_already_owned := (p_price = 0) OR EXISTS (
    SELECT 1
      FROM jsonb_array_elements_text(v_purchased) AS elem
     WHERE elem = p_item_id
  );

  IF NOT v_already_owned AND v_coins < p_price THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  v_new_coins := CASE WHEN v_already_owned THEN v_coins ELSE v_coins - p_price END;

  IF v_already_owned OR p_price = 0 THEN
    v_new_purchased := v_purchased;
  ELSE
    v_new_purchased := v_purchased || jsonb_build_array(p_item_id);
  END IF;

  UPDATE public.profiles
     SET coffee_coins = v_new_coins,
         purchased_items = v_new_purchased,
         active_instructor_item = p_item_id
   WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'coffeeCoins', v_new_coins,
    'purchasedItems', v_new_purchased,
    'activeInstructorItem', p_item_id,
    'charged', (NOT v_already_owned AND p_price > 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_daily_streak() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.buy_shop_item(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_daily_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_shop_item(text, integer) TO authenticated;
