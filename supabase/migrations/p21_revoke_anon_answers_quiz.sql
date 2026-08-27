-- =============================================================
-- p21: revoke anon grants on answers and quiz_results
--
-- Table-level GRANT ALL TO anon is the Supabase default.
-- RLS already has no anon policies, so unauthenticated REST
-- cannot read/write these tables today. Revoke is defense in
-- depth if a policy is added later.
--
-- App access is authenticated-only (homework, teacher review,
-- submit_lesson_quiz). Login RPC does not touch these tables.
--
-- Rollback:
--   GRANT ALL ON TABLE public.answers TO anon;
--   GRANT ALL ON TABLE public.quiz_results TO anon;
-- =============================================================

REVOKE ALL ON TABLE public.answers FROM anon;
REVOKE ALL ON TABLE public.quiz_results FROM anon;
