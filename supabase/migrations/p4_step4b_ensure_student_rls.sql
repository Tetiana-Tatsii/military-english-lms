-- =============================================================
-- P4 — КРОК 4b: Гарантувати student RLS (additive, без втрати даних)
-- Запускати ТІЛЬКИ якщо в 4a бракує student INSERT/SELECT
-- Або якщо student не може здати quiz / homework
-- =============================================================

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- quiz_results — student
DROP POLICY IF EXISTS "Users can view own quiz_results" ON public.quiz_results;
CREATE POLICY "Users can view own quiz_results"
  ON public.quiz_results FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own quiz_results" ON public.quiz_results;
CREATE POLICY "Users can insert own quiz_results"
  ON public.quiz_results FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own quiz_results" ON public.quiz_results;
CREATE POLICY "Users can update own quiz_results"
  ON public.quiz_results FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- quiz_results — teachers (не чіпаємо якщо вже є quiz_results_select_teachers)
DROP POLICY IF EXISTS "quiz_results_select_teachers" ON public.quiz_results;
CREATE POLICY "quiz_results_select_teachers"
  ON public.quiz_results FOR SELECT TO authenticated
  USING (private.is_teacher_or_admin());

-- answers — student
DROP POLICY IF EXISTS "Students can insert own answers" ON public.answers;
CREATE POLICY "Students can insert own answers"
  ON public.answers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Students can view own answers" ON public.answers;
CREATE POLICY "Students can view own answers"
  ON public.answers FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- answers — teachers
DROP POLICY IF EXISTS "answers_select_teachers" ON public.answers;
CREATE POLICY "answers_select_teachers"
  ON public.answers FOR SELECT TO authenticated
  USING (private.is_teacher_or_admin());

DROP POLICY IF EXISTS "answers_update_teachers" ON public.answers;
CREATE POLICY "answers_update_teachers"
  ON public.answers FOR UPDATE TO authenticated
  USING (private.is_teacher_or_admin())
  WITH CHECK (private.is_teacher_or_admin());

-- Перевірка
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('quiz_results', 'answers')
ORDER BY tablename, cmd, policyname;
