-- ============================================================
-- Fixes the quran_students.course check constraint to allow the
-- two newer course values ("Nurani Qaida" and "All") that were
-- added after your original schema run. Safe to run once.
-- ============================================================

alter table public.quran_students
  drop constraint if exists quran_students_course_check;

alter table public.quran_students
  add constraint quran_students_course_check
  check (course = any (array['Nurani Qaida','Nazra','Tajweed','Qirat','All']));

-- ============================================================
-- A student can now belong to BOTH the Quran section and the Main
-- Academy section at once, so this replaces the old single "section"
-- text column (never actually added to this live schema yet — the app
-- was still running on its local mock store) with a text array.
-- ============================================================

alter table public.quran_students
  add column if not exists sections text[] NOT NULL DEFAULT ARRAY['quran'];

alter table public.quran_students
  drop constraint if exists quran_students_sections_check;

alter table public.quran_students
  add constraint quran_students_sections_check
  check (sections <@ array['quran','academy']::text[] and array_length(sections, 1) > 0);
