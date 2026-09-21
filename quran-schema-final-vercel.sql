-- ============================================================
-- National Academy — final Quran/Academy schema for Vercel + Supabase
-- ============================================================
-- This file is designed for the current Next.js app in this folder.
-- It is safe to run on an existing database: missing columns/tables are
-- added, and the section constraints used by the app are normalised.
--
-- IMPORTANT SECURITY NOTE
-- The website currently uses its own student login code + browser admin
-- password, not Supabase Auth. The anon policies below therefore allow the
-- app to read/write these tables. This is functional, but not equivalent to
-- server-enforced per-user authentication. Move to Supabase Auth before using
-- highly sensitive data or publicising the database API widely.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Base tables (fresh install) ----------

create table if not exists public.quran_students (
  id uuid not null default gen_random_uuid(),
  name text not null,
  parent_name text,
  course text not null default 'Nazra',
  level text not null default 'Beginner',
  login_code text not null unique,
  status text not null default 'active',
  consecutive_fails integer not null default 0,
  test_status text not null default 'active',
  consecutive_test_fails integer not null default 0,
  join_date date not null default current_date,
  results jsonb not null default '[]'::jsonb,
  sections text[] not null default array['quran']::text[],
  academy_class text,
  created_at timestamptz default now(),
  constraint quran_students_pkey primary key (id)
);

create table if not exists public.quran_passing_criteria (
  test_number integer not null,
  required_percent numeric not null,
  updated_at timestamptz default now(),
  constraint quran_passing_criteria_pkey primary key (test_number)
);

create table if not exists public.quran_announcements (
  id uuid not null default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all',
  pinned boolean default false,
  created_at timestamptz default now(),
  constraint quran_announcements_pkey primary key (id)
);

create table if not exists public.quran_reviews (
  id uuid not null default gen_random_uuid(),
  name text not null,
  role text,
  review text not null,
  rating integer not null default 5,
  approved boolean default false,
  created_at timestamptz default now(),
  constraint quran_reviews_pkey primary key (id)
);

create table if not exists public.quran_exams (
  id uuid not null default gen_random_uuid(),
  title text not null,
  instructions_en text,
  instructions_ur text,
  duration_minutes integer not null default 5,
  max_violations integer not null default 3,
  passing_percent numeric not null default 50,
  is_published boolean not null default false,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  scheduled_at timestamptz,
  result_reveal_minutes integer not null default 60,
  section text not null default 'quran',
  test_number integer not null default 1,
  constraint quran_exams_pkey primary key (id)
);

create table if not exists public.quran_exam_attempts (
  id uuid not null default gen_random_uuid(),
  exam_id uuid not null,
  student_id uuid not null,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  status text not null default 'in_progress',
  violations jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  score numeric,
  total_marks numeric not null default 0,
  constraint quran_exam_attempts_pkey primary key (id)
);

create table if not exists public.quran_daily_ratings (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  date date not null,
  rating text not null,
  created_at timestamptz default now(),
  section text not null default 'quran',
  constraint quran_daily_ratings_pkey primary key (id)
);

create table if not exists public.quran_performance_fines (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  month_key text not null,
  week_number integer not null,
  amount numeric not null,
  waived boolean not null default false,
  created_at timestamptz default now(),
  section text not null default 'quran',
  constraint quran_performance_fines_pkey primary key (id)
);

create table if not exists public.quran_test_fines (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  exam_id uuid not null,
  attempt_id uuid not null,
  streak_position integer not null,
  amount numeric not null,
  waived boolean not null default false,
  created_at timestamptz default now(),
  constraint quran_test_fines_pkey primary key (id)
);

create table if not exists public.quran_audio_submissions (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  test_number integer not null,
  qirat_url text,
  tajweed_url text,
  qirat_submitted_at timestamptz,
  tajweed_submitted_at timestamptz,
  qirat_heard boolean not null default false,
  tajweed_heard boolean not null default false,
  created_at timestamptz default now(),
  constraint quran_audio_submissions_pkey primary key (id)
);

-- ---------- Existing-database upgrades ----------

alter table public.quran_students
  add column if not exists sections text[] not null default array['quran']::text[],
  add column if not exists academy_class text;

alter table public.quran_exams
  add column if not exists scheduled_at timestamptz,
  add column if not exists result_reveal_minutes integer not null default 60,
  add column if not exists section text not null default 'quran',
  add column if not exists test_number integer not null default 1;

alter table public.quran_daily_ratings
  add column if not exists section text not null default 'quran';

alter table public.quran_performance_fines
  add column if not exists section text not null default 'quran';

-- ---------- Normalise validation rules ----------

alter table public.quran_students drop constraint if exists quran_students_course_check;
alter table public.quran_students
  add constraint quran_students_course_check
  check (course = any (array['Nurani Qaida','Nazra','Tajweed','Qirat','All']));

alter table public.quran_students drop constraint if exists quran_students_level_check;
alter table public.quran_students
  add constraint quran_students_level_check
  check (level = any (array['Beginner','Intermediate','Advanced']));

alter table public.quran_students drop constraint if exists quran_students_status_check;
alter table public.quran_students
  add constraint quran_students_status_check
  check (status = any (array['active','warned','rejected']));

alter table public.quran_students drop constraint if exists quran_students_test_status_check;
alter table public.quran_students
  add constraint quran_students_test_status_check
  check (test_status = any (array['active','warned','rejected']));

alter table public.quran_students drop constraint if exists quran_students_sections_check;
alter table public.quran_students
  add constraint quran_students_sections_check
  check (
    sections is not null
    and array_length(sections, 1) > 0
    and sections <@ array['quran','academy']::text[]
  );

alter table public.quran_exams drop constraint if exists quran_exams_section_check;
alter table public.quran_exams
  add constraint quran_exams_section_check
  check (section = any (array['quran','academy']));

alter table public.quran_daily_ratings drop constraint if exists quran_daily_ratings_section_check;
alter table public.quran_daily_ratings
  add constraint quran_daily_ratings_section_check
  check (section = any (array['quran','academy']));

alter table public.quran_daily_ratings drop constraint if exists quran_daily_ratings_rating_check;
alter table public.quran_daily_ratings
  add constraint quran_daily_ratings_rating_check
  check (rating = any (array['excellent','average','not_good']));

alter table public.quran_performance_fines drop constraint if exists quran_performance_fines_section_check;
alter table public.quran_performance_fines
  add constraint quran_performance_fines_section_check
  check (section = any (array['quran','academy']));

alter table public.quran_performance_fines drop constraint if exists quran_performance_fines_week_check;
alter table public.quran_performance_fines
  add constraint quran_performance_fines_week_check
  check (week_number between 1 and 4);

alter table public.quran_reviews drop constraint if exists quran_reviews_rating_check;
alter table public.quran_reviews
  add constraint quran_reviews_rating_check
  check (rating between 1 and 5);

alter table public.quran_exam_attempts drop constraint if exists quran_exam_attempts_status_check;
alter table public.quran_exam_attempts
  add constraint quran_exam_attempts_status_check
  check (status = any (array['in_progress','submitted','auto_submitted_timeout','auto_submitted_violation']));

alter table public.quran_exam_attempts drop constraint if exists quran_exam_attempts_exam_fk;
alter table public.quran_exam_attempts
  add constraint quran_exam_attempts_exam_fk
  foreign key (exam_id) references public.quran_exams(id) on delete cascade;

alter table public.quran_exam_attempts drop constraint if exists quran_exam_attempts_student_fk;
alter table public.quran_exam_attempts
  add constraint quran_exam_attempts_student_fk
  foreign key (student_id) references public.quran_students(id) on delete cascade;

alter table public.quran_daily_ratings drop constraint if exists quran_daily_ratings_student_fk;
alter table public.quran_daily_ratings
  add constraint quran_daily_ratings_student_fk
  foreign key (student_id) references public.quran_students(id) on delete cascade;

alter table public.quran_performance_fines drop constraint if exists quran_performance_fines_student_fk;
alter table public.quran_performance_fines
  add constraint quran_performance_fines_student_fk
  foreign key (student_id) references public.quran_students(id) on delete cascade;

alter table public.quran_test_fines drop constraint if exists quran_test_fines_student_fk;
alter table public.quran_test_fines
  add constraint quran_test_fines_student_fk
  foreign key (student_id) references public.quran_students(id) on delete cascade;

alter table public.quran_test_fines drop constraint if exists quran_test_fines_exam_fk;
alter table public.quran_test_fines
  add constraint quran_test_fines_exam_fk
  foreign key (exam_id) references public.quran_exams(id) on delete cascade;

alter table public.quran_test_fines drop constraint if exists quran_test_fines_attempt_fk;
alter table public.quran_test_fines
  add constraint quran_test_fines_attempt_fk
  foreign key (attempt_id) references public.quran_exam_attempts(id) on delete cascade;

alter table public.quran_audio_submissions drop constraint if exists quran_audio_submissions_student_fk;
alter table public.quran_audio_submissions
  add constraint quran_audio_submissions_student_fk
  foreign key (student_id) references public.quran_students(id) on delete cascade;

-- ---------- Uniqueness the current application expects ----------
-- These indexes avoid duplicate same-day section ratings and duplicate
-- performance fines. They are partial/sparse enough to work with existing
-- rows in the common case.
create unique index if not exists quran_daily_ratings_student_section_date_uidx
  on public.quran_daily_ratings(student_id, section, date);

create unique index if not exists quran_performance_fines_student_section_month_week_uidx
  on public.quran_performance_fines(student_id, section, month_key, week_number);

create unique index if not exists quran_audio_submissions_student_test_uidx
  on public.quran_audio_submissions(student_id, test_number);

create unique index if not exists quran_exam_attempts_exam_student_uidx
  on public.quran_exam_attempts(exam_id, student_id);

create unique index if not exists quran_test_fines_attempt_uidx
  on public.quran_test_fines(attempt_id);

-- ---------- Helpful indexes ----------
create index if not exists quran_students_created_at_idx on public.quran_students(created_at desc);
create index if not exists quran_exams_section_published_idx on public.quran_exams(section, is_published, scheduled_at);
create index if not exists quran_exam_attempts_student_idx on public.quran_exam_attempts(student_id);
create index if not exists quran_daily_ratings_student_section_date_idx on public.quran_daily_ratings(student_id, section, date desc);
create index if not exists quran_performance_fines_student_section_idx on public.quran_performance_fines(student_id, section, month_key);
create index if not exists quran_test_fines_student_idx on public.quran_test_fines(student_id, created_at desc);
create index if not exists quran_audio_submissions_student_idx on public.quran_audio_submissions(student_id, test_number desc);

-- ---------- Passing criteria ----------
insert into public.quran_passing_criteria (test_number, required_percent) values
  (1, 30), (2, 35), (3, 40), (4, 40), (5, 45)
on conflict (test_number) do nothing;

-- ---------- RLS ----------
-- The app has no auth.uid() session yet, so these policies match the app's
-- current custom login model. Replace them with role-aware policies when
-- migrating to Supabase Auth.

do $$
declare
  t text;
begin
  foreach t in array array[
    'quran_students',
    'quran_passing_criteria',
    'quran_announcements',
    'quran_reviews',
    'quran_exams',
    'quran_exam_attempts',
    'quran_daily_ratings',
    'quran_performance_fines',
    'quran_test_fines',
    'quran_audio_submissions'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%s anon select" on public.%I', t, t);
    execute format('create policy "%s anon select" on public.%I for select to anon, authenticated using (true)', t, t);

    execute format('drop policy if exists "%s anon insert" on public.%I', t, t);
    execute format('create policy "%s anon insert" on public.%I for insert to anon, authenticated with check (true)', t, t);

    execute format('drop policy if exists "%s anon update" on public.%I', t, t);
    execute format('create policy "%s anon update" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);

    execute format('drop policy if exists "%s anon delete" on public.%I', t, t);
    execute format('create policy "%s anon delete" on public.%I for delete to anon, authenticated using (true)', t, t);
  end loop;
end $$;

-- ---------- Audio storage ----------
insert into storage.buckets (id, name, public)
values ('qirat-audio', 'qirat-audio', true)
on conflict (id) do nothing;

drop policy if exists "qirat-audio anon upload" on storage.objects;
create policy "qirat-audio anon upload"
  on storage.objects for insert to anon
  with check (bucket_id = 'qirat-audio');

drop policy if exists "qirat-audio anon update" on storage.objects;
create policy "qirat-audio anon update"
  on storage.objects for update to anon
  using (bucket_id = 'qirat-audio') with check (bucket_id = 'qirat-audio');

drop policy if exists "qirat-audio public read" on storage.objects;
create policy "qirat-audio public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'qirat-audio');

-- ---------- Quick verification ----------
select id, name, sections, academy_class, course
from public.quran_students
order by created_at desc
limit 10;

-- ============================================================
-- Main Academy public-site tables used by public/academy.html
-- ============================================================

create table if not exists public.academy_chat_memory (
  id bigint generated by default as identity primary key,
  session_id text not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.gallery_items (
  id uuid not null default gen_random_uuid() primary key,
  type text not null,
  url text not null,
  caption text,
  created_at timestamptz default now()
);

create table if not exists public.page_views (
  id uuid not null default gen_random_uuid() primary key,
  view_count bigint not null default 1000,
  updated_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  role text,
  review text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  approved boolean default false,
  created_at timestamptz default now()
);

create index if not exists academy_chat_memory_session_idx
  on public.academy_chat_memory(session_id, created_at desc);
create index if not exists gallery_items_created_idx
  on public.gallery_items(created_at asc);
create index if not exists reviews_approved_created_idx
  on public.reviews(approved, created_at asc);

-- These tables are used directly from the static public homepage with the
-- project's anon key. This matches the current website architecture.
do $$
declare
  t text;
begin
  foreach t in array array['academy_chat_memory','gallery_items','page_views','reviews']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%s anon select" on public.%I', t, t);
    execute format('create policy "%s anon select" on public.%I for select to anon, authenticated using (true)', t, t);

    execute format('drop policy if exists "%s anon insert" on public.%I', t, t);
    execute format('create policy "%s anon insert" on public.%I for insert to anon, authenticated with check (true)', t, t);

    execute format('drop policy if exists "%s anon update" on public.%I', t, t);
    execute format('create policy "%s anon update" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('academy-gallery', 'academy-gallery', true)
on conflict (id) do nothing;

drop policy if exists "academy-gallery anon upload" on storage.objects;
create policy "academy-gallery anon upload"
  on storage.objects for insert to anon
  with check (bucket_id = 'academy-gallery');

drop policy if exists "academy-gallery anon update" on storage.objects;
create policy "academy-gallery anon update"
  on storage.objects for update to anon
  using (bucket_id = 'academy-gallery') with check (bucket_id = 'academy-gallery');

drop policy if exists "academy-gallery public read" on storage.objects;
create policy "academy-gallery public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'academy-gallery');
