-- =============================================================
-- p20: lock sensitive profiles columns at trigger level
--
-- Defense in depth if a broad UPDATE/INSERT policy is re-added.
-- Does not replace RLS.
--
-- Who may change role/status/coins/SLP/etc.:
--   • postgres / supabase_admin (SECURITY DEFINER RPCs, SQL editor)
--   • private.is_admin() (REST approve / admin table edits)
-- Everyone else:
--   INSERT → forced student + pending, zero economy fields
--   UPDATE → reject changes to locked columns
--
-- App paths that must keep working:
--   registerUser INSERT student+pending
--   admin approveUser UPDATE status
--   buy_shop_item / process_daily_streak / award_* / submit_lesson_quiz
--     (SECURITY DEFINER, current_user = postgres)
-- =============================================================

CREATE OR REPLACE FUNCTION private.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF private.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'student';
    NEW.status := 'pending';
    NEW.coffee_coins := 0;
    NEW.streak_count := 0;
    NEW.slp_listening := 0;
    NEW.slp_speaking := 0;
    NEW.slp_reading := 0;
    NEW.slp_writing := 0;
    NEW.completed_courses := '[]'::jsonb;
    NEW.purchased_items := '[]'::jsonb;
    NEW.last_login_date := NULL;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.coffee_coins IS DISTINCT FROM OLD.coffee_coins
       OR NEW.streak_count IS DISTINCT FROM OLD.streak_count
       OR NEW.slp_listening IS DISTINCT FROM OLD.slp_listening
       OR NEW.slp_speaking IS DISTINCT FROM OLD.slp_speaking
       OR NEW.slp_reading IS DISTINCT FROM OLD.slp_reading
       OR NEW.slp_writing IS DISTINCT FROM OLD.slp_writing
       OR NEW.completed_courses IS DISTINCT FROM OLD.completed_courses
       OR NEW.purchased_items IS DISTINCT FROM OLD.purchased_items
       OR NEW.active_instructor_item IS DISTINCT FROM OLD.active_instructor_item
       OR NEW.last_login_date IS DISTINCT FROM OLD.last_login_date
    THEN
      RAISE EXCEPTION 'profile_fields_locked'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_profile_fields() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.protect_profile_fields() TO authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_profile_fields();
