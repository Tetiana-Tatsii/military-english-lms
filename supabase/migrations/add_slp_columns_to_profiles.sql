-- Migration: add SLP skill columns to profiles
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS slp_listening  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slp_speaking   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slp_reading    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slp_writing    INTEGER NOT NULL DEFAULT 0;
