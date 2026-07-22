-- =============================================================
-- P5 / H3 — Storage path ownership for lesson-media
--
-- Was: any authenticated can INSERT into student-answers|photos|…
--      and UPDATE any object in lesson-media
-- Now: path must be {folder}/{auth.uid()}/filename
--      UPDATE only own folder; teachers write photos|audio|documents
--
-- IMPORTANT: deploy frontend path change FIRST, then run this SQL.
-- Old public URLs keep working; only new uploads use owned paths.
-- =============================================================

-- ── lesson-media ──────────────────────────────────────────────
DROP POLICY IF EXISTS "lesson_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "lesson_media_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "lesson_media_insert_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "lesson_media_update_own_folder" ON storage.objects;

-- Students: student-answers/{uid}/…
-- Teachers/admins: photos|audio|documents/{uid}/…
CREATE POLICY "lesson_media_insert_own_folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-media'
    AND (
      (
        (storage.foldername(name))[1] = 'student-answers'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      (
        private.is_teacher_or_admin()
        AND (storage.foldername(name))[1] IN ('photos', 'audio', 'documents')
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

CREATE POLICY "lesson_media_update_own_folder"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesson-media'
    AND (
      (
        (storage.foldername(name))[1] = 'student-answers'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      (
        private.is_teacher_or_admin()
        AND (storage.foldername(name))[1] IN ('photos', 'audio', 'documents')
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    bucket_id = 'lesson-media'
    AND (
      (
        (storage.foldername(name))[1] = 'student-answers'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      (
        private.is_teacher_or_admin()
        AND (storage.foldername(name))[1] IN ('photos', 'audio', 'documents')
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

-- ── legacy/unused student-answers bucket — lock to own prefix ─
DROP POLICY IF EXISTS "student_answers_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "student_answers_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "student_answers_bucket_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "student_answers_bucket_update_own" ON storage.objects;

CREATE POLICY "student_answers_bucket_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-answers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "student_answers_bucket_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-answers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'student-answers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Verify ────────────────────────────────────────────────────
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%lesson_media%'
    OR policyname ILIKE '%student_answers%'
  )
ORDER BY policyname;
