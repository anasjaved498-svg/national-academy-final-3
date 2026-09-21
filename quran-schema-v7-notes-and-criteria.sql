-- ============================================================
-- Migration v7:
--   1. Per-subject passing % columns on quran_passing_criteria
--      (advanced Passing Criteria — set inline in Enter Result now,
--      the standalone Passing Criteria admin page has been removed)
--   2. New quran_notes table + Storage bucket for the Notes feature
--      (separate from Announcements — supports one file attachment)
--
-- Run this in the Supabase SQL editor after quran-schema-v6-supabase-sync.sql.
-- Safe to re-run — every statement uses IF NOT EXISTS / DROP+CREATE.
-- ============================================================

-- ---------- 1. Per-subject passing % ----------

ALTER TABLE public.quran_passing_criteria
  ADD COLUMN IF NOT EXISTS nurani_qaida_percent numeric,
  ADD COLUMN IF NOT EXISTS nazra_percent numeric,
  ADD COLUMN IF NOT EXISTS tajweed_percent numeric;

-- ---------- 2. Notes table ----------

CREATE TABLE IF NOT EXISTS public.quran_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  file_url text,
  file_name text,
  audience text NOT NULL DEFAULT 'all'::text,
  section text NOT NULL DEFAULT 'quran'::text CHECK (section = ANY (ARRAY['quran'::text, 'academy'::text])),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quran_notes_pkey PRIMARY KEY (id)
);

ALTER TABLE public.quran_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quran_notes anon select" ON public.quran_notes;
CREATE POLICY "quran_notes anon select" ON public.quran_notes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "quran_notes anon insert" ON public.quran_notes;
CREATE POLICY "quran_notes anon insert" ON public.quran_notes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "quran_notes anon update" ON public.quran_notes;
CREATE POLICY "quran_notes anon update" ON public.quran_notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "quran_notes anon delete" ON public.quran_notes;
CREATE POLICY "quran_notes anon delete" ON public.quran_notes FOR DELETE TO anon, authenticated USING (true);

-- ---------- 3. Storage bucket for note attachments ----------
-- Create the bucket itself from the Supabase dashboard first:
--   Storage → New bucket → name exactly "quran-notes-files" → Public: ON
-- Then run the policies below (same pattern as the qirat-audio bucket
-- already set up in quran-schema-v5-fix.sql).

DROP POLICY IF EXISTS "quran-notes-files anon select" ON storage.objects;
CREATE POLICY "quran-notes-files anon select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'quran-notes-files');

DROP POLICY IF EXISTS "quran-notes-files anon insert" ON storage.objects;
CREATE POLICY "quran-notes-files anon insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'quran-notes-files');

DROP POLICY IF EXISTS "quran-notes-files anon update" ON storage.objects;
CREATE POLICY "quran-notes-files anon update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'quran-notes-files')
  WITH CHECK (bucket_id = 'quran-notes-files');

DROP POLICY IF EXISTS "quran-notes-files anon delete" ON storage.objects;
CREATE POLICY "quran-notes-files anon delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'quran-notes-files');

-- ---------- 4. Quick check ----------
-- select column_name from information_schema.columns
--   where table_name = 'quran_passing_criteria';
-- select * from public.quran_notes order by created_at desc limit 5;
