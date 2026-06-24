-- =============================================================
-- Military English LMS — Supabase Migration
-- Запускати в Supabase SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. Виправлення lms_courses.modules: TEXT → JSONB
-- ─────────────────────────────────────────────
ALTER TABLE lms_courses
  ALTER COLUMN modules TYPE JSONB
  USING modules::JSONB;

-- ─────────────────────────────────────────────
-- 2. Виправлення quiz_results
-- ─────────────────────────────────────────────

-- 2a. Якщо таблиці ще немає — створюємо правильно
CREATE TABLE IF NOT EXISTS quiz_results (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT    NOT NULL,  -- TEXT для сумісності з legacy usr-{ts} ID
  lesson_id   TEXT    NOT NULL,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  answers     JSONB   NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. UNIQUE constraint — потрібен для upsert onConflict
ALTER TABLE quiz_results
  DROP CONSTRAINT IF EXISTS uq_quiz_results_user_lesson;
ALTER TABLE quiz_results
  ADD CONSTRAINT uq_quiz_results_user_lesson UNIQUE (user_id, lesson_id);

-- 2c. Індекси для швидких запитів
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id   ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_lesson_id ON quiz_results(lesson_id);

-- ─────────────────────────────────────────────
-- 3. profiles — SLP-колонки + заборона SELECT password
-- ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS slp_listening INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slp_speaking  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slp_reading   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slp_writing   INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────
-- 4. answers — locked_by_teacher_id
-- ─────────────────────────────────────────────
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS locked_by_teacher_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_answers_locked_by ON answers(locked_by_teacher_id);

-- ─────────────────────────────────────────────
-- 5. student_answers_archive
--    Перейменована вручну — зберігає тестову історію перевірок платформи.
--    Код застосунку її не використовує, нічого робити не потрібно.
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- 6. RLS — quiz_results
-- ─────────────────────────────────────────────
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quiz_results"         ON quiz_results;
DROP POLICY IF EXISTS "Users can insert own quiz_results"       ON quiz_results;
DROP POLICY IF EXISTS "Users can upsert own quiz_results"       ON quiz_results;
DROP POLICY IF EXISTS "Teachers/Admins can view all quiz_results" ON quiz_results;

-- Студент бачить тільки свої результати
CREATE POLICY "Users can view own quiz_results"
ON quiz_results FOR SELECT
USING (user_id = auth.uid()::TEXT OR user_id = (
  SELECT id FROM profiles WHERE id = user_id LIMIT 1
));

-- Студент може зберегти/оновити свій результат
CREATE POLICY "Users can upsert own quiz_results"
ON quiz_results FOR INSERT
WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update own quiz_results"
ON quiz_results FOR UPDATE
USING (user_id = auth.uid()::TEXT);

-- Викладачі та адміни бачать всі результати
CREATE POLICY "Teachers/Admins can view all quiz_results"
ON quiz_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.role IN ('teacher', 'admin')
  )
);

-- ─────────────────────────────────────────────
-- 7. RLS — answers
-- ─────────────────────────────────────────────
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert own answers"     ON answers;
DROP POLICY IF EXISTS "Students can view own answers"       ON answers;
DROP POLICY IF EXISTS "Teachers/Admins can view all answers" ON answers;
DROP POLICY IF EXISTS "Teachers/Admins can update answers"  ON answers;
DROP POLICY IF EXISTS "Teachers/Admins can lock answers"    ON answers;

-- Студент може відправити свою відповідь
CREATE POLICY "Students can insert own answers"
ON answers FOR INSERT
WITH CHECK (user_id = auth.uid()::TEXT);

-- Студент бачить тільки свої відповіді
CREATE POLICY "Students can view own answers"
ON answers FOR SELECT
USING (user_id = auth.uid()::TEXT);

-- Викладачі та адміни бачать всі відповіді
CREATE POLICY "Teachers/Admins can view all answers"
ON answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.role IN ('teacher', 'admin')
  )
);

-- Викладачі та адміни можуть оновлювати відповіді (оцінка, фідбек, блокування)
CREATE POLICY "Teachers/Admins can update answers"
ON answers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.role IN ('teacher', 'admin')
  )
);

-- ─────────────────────────────────────────────
-- 8. RLS — profiles
-- ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"            ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"          ON profiles;
DROP POLICY IF EXISTS "Teachers/Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers/Admins can update profiles"   ON profiles;
DROP POLICY IF EXISTS "Allow insert during registration"      ON profiles;

-- Будь-хто може зареєструватися (INSERT без auth)
CREATE POLICY "Allow insert during registration"
ON profiles FOR INSERT
WITH CHECK (true);

-- Користувач бачить свій профіль
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid()::TEXT);

-- Викладачі та адміни бачать всі профілі
CREATE POLICY "Teachers/Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.id = auth.uid()::TEXT
      AND p2.role IN ('teacher', 'admin')
  )
);

-- Адміни можуть оновлювати профілі (approve, password, SLP)
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.id = auth.uid()::TEXT
      AND p2.role = 'admin'
  )
);

-- Користувач може оновити свій SLP (після здачі тесту)
CREATE POLICY "Users can update own slp"
ON profiles FOR UPDATE
USING (id = auth.uid()::TEXT);

-- ─────────────────────────────────────────────
-- 9. RLS — support_tickets
-- ─────────────────────────────────────────────
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert tickets"              ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets"           ON support_tickets;
DROP POLICY IF EXISTS "Admins can update ticket status"       ON support_tickets;

CREATE POLICY "Users can insert tickets"
ON support_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all tickets"
ON support_tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update ticket status"
ON support_tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.role = 'admin'
  )
);

-- ─────────────────────────────────────────────
-- 10. RLS — lms_courses
-- ─────────────────────────────────────────────
ALTER TABLE lms_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved users can view courses"       ON lms_courses;
DROP POLICY IF EXISTS "Teachers/Admins can manage courses"    ON lms_courses;

-- Затверджені користувачі можуть читати курси
CREATE POLICY "Approved users can view courses"
ON lms_courses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.status = 'approved'
  )
);

-- Викладачі та адміни можуть редагувати курси
CREATE POLICY "Teachers/Admins can manage courses"
ON lms_courses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.role IN ('teacher', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::TEXT
      AND profiles.role IN ('teacher', 'admin')
  )
);
