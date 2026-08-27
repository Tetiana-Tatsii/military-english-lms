-- =============================================================
-- p18: close public write on storage.objects (lesson-media)
--
-- Keep buckets PUBLIC so existing getPublicUrl() lesson media
-- and homework attachments still open in the browser.
-- Authenticated path-ownership policies from H3 stay in place:
--   students: student-answers/{uid}/…
--   teachers: photos|audio|documents/{uid}/…
-- App never calls storage.remove(), so dropping public DELETE
-- does not affect the UI.
-- =============================================================

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;
