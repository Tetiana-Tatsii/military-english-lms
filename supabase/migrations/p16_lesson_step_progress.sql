-- =============================================================
-- p16: persist lesson step progress (coin/cat/dog/drone fill)
-- Students read/write only their own rows.
-- Trigger never downgrades unlocked step index.
-- Safe to re-run.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.lesson_step_progress (
  user_id text NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  unlocked_step_index integer NOT NULL DEFAULT 0
    CHECK (unlocked_step_index >= 0),
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS lesson_step_progress_lesson_id_idx
  ON public.lesson_step_progress (lesson_id);

ALTER TABLE public.lesson_step_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_step_progress_select_own" ON public.lesson_step_progress;
CREATE POLICY "lesson_step_progress_select_own"
  ON public.lesson_step_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR private.is_teacher_or_admin()
  );

DROP POLICY IF EXISTS "lesson_step_progress_insert_own" ON public.lesson_step_progress;
CREATE POLICY "lesson_step_progress_insert_own"
  ON public.lesson_step_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "lesson_step_progress_update_own" ON public.lesson_step_progress;
CREATE POLICY "lesson_step_progress_update_own"
  ON public.lesson_step_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

REVOKE ALL ON TABLE public.lesson_step_progress FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.lesson_step_progress TO authenticated;

CREATE OR REPLACE FUNCTION public.lesson_step_progress_no_downgrade()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Never lose unlocked steps; completion may be cleared if homework is missing.
  NEW.unlocked_step_index := GREATEST(OLD.unlocked_step_index, NEW.unlocked_step_index);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lesson_step_progress_no_downgrade
  ON public.lesson_step_progress;
CREATE TRIGGER lesson_step_progress_no_downgrade
  BEFORE UPDATE ON public.lesson_step_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.lesson_step_progress_no_downgrade();
