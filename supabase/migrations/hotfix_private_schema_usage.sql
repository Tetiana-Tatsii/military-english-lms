-- =============================================================
-- Hotfix: module RPCs fail with "permission denied for schema private"
--
-- Уроки зберігаються через lms_lessons + RLS (працює).
-- Модулі — через RPC update_module_in_course (SECURITY INVOKER),
-- який викликає private.is_teacher_or_admin() → потрібен USAGE на private.
-- =============================================================

GRANT USAGE ON SCHEMA private TO authenticated;

-- На всяк випадок — EXECUTE на helper (якщо ще не видано)
GRANT EXECUTE ON FUNCTION private.is_teacher_or_admin() TO authenticated;
