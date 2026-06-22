-- SQL Script for Supabase Migration
-- Execute this in Supabase SQL Editor

-- 1. Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_lesson_id ON quiz_results(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_lesson ON quiz_results(user_id, lesson_id);

-- 2. Add SLP columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS slp_listening INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slp_speaking INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slp_reading INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slp_writing INTEGER DEFAULT 0;

-- 3. Add locked_by_teacher_id column to answers table
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS locked_by_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Create index for locking queries
CREATE INDEX IF NOT EXISTS idx_answers_locked_by ON answers(locked_by_teacher_id);

-- 5. Enable Row Level Security (RLS) for quiz_results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own quiz results
CREATE POLICY IF NOT EXISTS "Users can view own quiz_results" 
ON quiz_results FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own quiz results
CREATE POLICY IF NOT EXISTS "Users can insert own quiz_results" 
ON quiz_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Teachers/Admins can view all quiz results
CREATE POLICY IF NOT EXISTS "Teachers/Admins can view all quiz_results" 
ON quiz_results FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'teacher' OR profiles.role = 'admin')
  )
);

-- 6. Enable RLS for answers table (if not already enabled)
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers/Admins can update locked_by_teacher_id
CREATE POLICY IF NOT EXISTS "Teachers/Admins can lock answers" 
ON answers FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'teacher' OR profiles.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'teacher' OR profiles.role = 'admin')
  )
);
