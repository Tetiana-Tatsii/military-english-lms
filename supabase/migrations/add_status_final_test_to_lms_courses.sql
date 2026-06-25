-- Migration: add status and final_test columns to lms_courses
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE public.lms_courses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS final_test JSONB NOT NULL DEFAULT '{"title": "", "questions": []}';

-- Update the existing military-english-stanag-2 course status to active
UPDATE public.lms_courses
SET status = 'active'
WHERE id = 'military-english-stanag-2';

-- Insert the general-english-b2 course if it doesn't exist yet
INSERT INTO public.lms_courses (id, title, subtitle, description, status, modules, final_test)
VALUES (
  'general-english-b2',
  'General English (B2 Upper-Intermediate)',
  'Загальний курс англійської мови',
  'Курс у розробці. Фокус на загальну граматику, розмовну практику та письмо.',
  'draft',
  '[]'::jsonb,
  '{"title": "Підсумковий іспит", "questions": []}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
