-- Migration: gamification system
-- Run in Supabase Dashboard → SQL Editor

-- 1. Gamification columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coffee_coins           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date        DATE,
  ADD COLUMN IF NOT EXISTS streak_count           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_instructor_item TEXT    NOT NULL DEFAULT 'coffee',
  ADD COLUMN IF NOT EXISTS purchased_items        JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS completed_courses      JSONB   NOT NULL DEFAULT '[]';

-- 2. Prevent duplicate quiz submissions at DB level
ALTER TABLE public.quiz_results
  DROP CONSTRAINT IF EXISTS quiz_results_user_lesson_unique;
ALTER TABLE public.quiz_results
  ADD CONSTRAINT quiz_results_user_lesson_unique UNIQUE (user_id, lesson_id);

-- 3. Prevent double coin awards on homework
ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS coins_awarded BOOLEAN NOT NULL DEFAULT false;
