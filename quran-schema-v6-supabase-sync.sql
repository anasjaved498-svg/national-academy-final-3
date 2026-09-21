-- ============================================================
-- Migration v6: columns the app now needs that were never added to the
-- live database (the app was running on browser-only mock data before,
-- so nothing surfaced this), plus Row Level Security policies so the
-- app can actually read/write these tables at all.
--
-- Run this in the Supabase SQL editor AFTER everything else
-- (quran-schema-live-v4, fix-course, v5-audio-timers, v5-fix).
-- Safe to re-run — every statement uses IF NOT EXISTS / DROP+CREATE.
-- ============================================================

-- ---------- 1. Missing columns ----------

-- Main Academy class name (e.g. "AI & Chatbots") for students in the
-- academy section. quran_students.sections already exists from
-- quran-schema-fix-course.sql.
ALTER TABLE public.quran_students
  ADD COLUMN IF NOT EXISTS academy_class text;

-- Which section (Quran / Main Academy) an online test belongs to, and
-- its paper-test-matching number.
ALTER TABLE public.quran_exams
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'quran',
  ADD COLUMN IF NOT EXISTS test_number integer NOT NULL DEFAULT 1;

ALTER TABLE public.quran_exams
  DROP CONSTRAINT IF EXISTS quran_exams_section_check;
ALTER TABLE public.quran_exams
  ADD CONSTRAINT quran_exams_section_check CHECK (section = ANY (ARRAY['quran','academy']));

-- Daily ratings and performance fines are now tracked independently per
-- section for a student enrolled in both.
ALTER TABLE public.quran_daily_ratings
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'quran';
ALTER TABLE public.quran_daily_ratings
  DROP CONSTRAINT IF EXISTS quran_daily_ratings_section_check;
ALTER TABLE public.quran_daily_ratings
  ADD CONSTRAINT quran_daily_ratings_section_check CHECK (section = ANY (ARRAY['quran','academy']));
-- One rating per student, per section, per day.
ALTER TABLE public.quran_daily_ratings
  DROP CONSTRAINT IF EXISTS quran_daily_ratings_unique;
ALTER TABLE public.quran_daily_ratings
  ADD CONSTRAINT quran_daily_ratings_unique UNIQUE (student_id, section, date);

ALTER TABLE public.quran_performance_fines
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'quran';
ALTER TABLE public.quran_performance_fines
  DROP CONSTRAINT IF EXISTS quran_performance_fines_section_check;
ALTER TABLE public.quran_performance_fines
  ADD CONSTRAINT quran_performance_fines_section_check CHECK (section = ANY (ARRAY['quran','academy']));

-- ---------- 2. Row Level Security ----------
-- Same honest tradeoff as the storage policies already in this repo:
-- the app has no real Supabase Auth session (admin login is just a
-- password check in the browser, students log in with a plain access
-- code) — so these policies open full read/write to anyone holding
-- your public anon key, same as the app already assumes. Fine to launch
-- with for a small trusted academy site; tighten later with real
-- Supabase Auth if you want per-role restrictions enforced server-side
-- instead of just in the app's UI.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'quran_students',
      'quran_announcements',
      'quran_passing_criteria',
      'quran_exams',
      'quran_exam_attempts',
      'quran_reviews',
      'quran_daily_ratings',
      'quran_performance_fines',
      'quran_test_fines',
      'quran_audio_submissions'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s anon select" ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY "%s anon select" ON public.%I FOR SELECT TO anon, authenticated USING (true);',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s anon insert" ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY "%s anon insert" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true);',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s anon update" ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY "%s anon update" ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s anon delete" ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY "%s anon delete" ON public.%I FOR DELETE TO anon, authenticated USING (true);',
      t, t
    );
  END LOOP;
END $$;

-- ---------- 3. Quick check ----------
-- After running this, add a student in the admin portal, then run:
--   select id, name, sections, academy_class, course from public.quran_students order by created_at desc limit 5;
-- It should show up immediately.
