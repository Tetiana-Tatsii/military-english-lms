-- =============================================================
-- p17: drop leftover permissive RLS that OR-bypasses C1/C2
--
-- Why this is safe for the app:
--   profiles: students never UPDATE; register already inserts
--             student+pending; admin approve uses profiles_admin_manage;
--             coins / SLP / shop / streak go through SECURITY DEFINER RPCs
--             (owner postgres, bypass RLS).
--   answers: students only INSERT homework; teacher feedback + lock
--            use answers_update_teachers.
--   quiz_results: client only SELECT; writes go through submit_lesson_quiz.
--
-- Keep:
--   profiles_insert_own_student, profiles_admin_manage,
--   profiles_select_own, profiles_select_teachers, profiles_admin_delete
--   answers_insert_own, answers_select_own, answers_select_teachers,
--   answers_update_teachers
--   quiz_results_select_own, quiz_results_select_teachers
-- =============================================================

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

DROP POLICY IF EXISTS "answers_update_own" ON public.answers;

DROP POLICY IF EXISTS "quiz_results_update_own" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results_insert_own" ON public.quiz_results;
