-- =============================================================
-- p19: student answers INSERT only as pending homework
--
-- App insert (submitHomeworkAnswer) already sends:
--   user_id, course_id, lesson_id, text, audio_url, attachments,
--   status = pending, student_name, squad_id
-- Unspecified columns use defaults: score NULL, coins_awarded false, etc.
--
-- Teacher grading still uses answers_update_teachers (unchanged).
-- Rollback: restore WITH CHECK (user_id = auth.uid()::text).
-- =============================================================

DROP POLICY IF EXISTS "answers_insert_own" ON public.answers;

CREATE POLICY "answers_insert_own"
  ON public.answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    AND status = 'pending'
    AND score IS NULL
    AND COALESCE(btrim(teacher_feedback), '') = ''
    AND teacher_feedback_audio IS NULL
    AND locked_by_teacher_id IS NULL
    AND coins_awarded = false
    AND coins_awarded_amount = 0
  );
