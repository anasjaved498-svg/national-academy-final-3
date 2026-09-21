-- ============================================================
-- Migration v5: Qirat/Tajweed audio + exam scheduling/reveal timers
-- Run this in the Supabase SQL editor AFTER quran-schema-live-v4.sql
-- (or after whatever is your current live schema).
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- 1. New table: one row per (student, test_number). The student uploads
--    both recordings; the admin listens and enters marks on the same
--    result form (no separate audio "score" — marks stay on
--    quran_results / the student's results jsonb, wherever your app
--    currently stores them).
CREATE TABLE IF NOT EXISTS public.quran_audio_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  test_number integer NOT NULL,
  qirat_url text,
  tajweed_url text,
  qirat_submitted_at timestamp with time zone,
  tajweed_submitted_at timestamp with time zone,
  qirat_heard boolean NOT NULL DEFAULT false,
  tajweed_heard boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quran_audio_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT quran_audio_submissions_student_fk FOREIGN KEY (student_id) REFERENCES public.quran_students(id),
  CONSTRAINT quran_audio_submissions_unique UNIQUE (student_id, test_number)
);

-- 2. Exam scheduling + result-reveal delay.
--    scheduled_at:            when the test opens (null = open as soon as published).
--                              Students see a 30-min countdown before this time.
--    result_reveal_minutes:   how long after submission the score is shown
--                              (default 60 = 1 hour, matches "before 15 min ago
--                              counting start in result section" — the last 15
--                              minutes of this window are highlighted in the UI).
ALTER TABLE public.quran_exams
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS result_reveal_minutes integer NOT NULL DEFAULT 60;

-- ============================================================
-- Storage bucket for the audio files themselves
-- ============================================================
-- If you haven't already: Supabase Dashboard -> Storage -> New bucket
-- -> name it "qirat-audio" -> Public bucket: ON.
--
-- Then run this in the SQL editor so students (using the anon key) can
-- upload and everyone can play recordings back via public URL:

insert into storage.buckets (id, name, public)
values ('qirat-audio', 'qirat-audio', true)
on conflict (id) do nothing;

create policy if not exists "qirat-audio anon upload"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'qirat-audio');

create policy if not exists "qirat-audio anon update"
  on storage.objects for update
  to anon
  using (bucket_id = 'qirat-audio');

create policy if not exists "qirat-audio public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'qirat-audio');

-- Note: these policies allow ANY anon-key request to upload/overwrite
-- files in this bucket, matching the app's current "login code" auth
-- (no real Supabase Auth session yet). File paths are namespaced by
-- student id, but they're guessable, not access-controlled. Fine to
-- launch with; tighten later by moving to real Supabase Auth and scoping
-- these policies to auth.uid() if you want stricter access control.
--
-- The app now uploads real files here via supabase.storage when
-- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set in
-- .env.local (see app/quran/portal/audio/page.tsx). Without those set,
-- it silently falls back to storing recordings as base64 in the browser
-- so the feature still works during local development.
