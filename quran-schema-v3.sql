-- ============================================================
-- QURAN SECTION — SCHEMA UPDATE 3
-- Run this after quran-schema.sql and quran-schema-anticheat.sql.
-- All statements are additive/idempotent.
-- ============================================================

-- Paper number, shown on report cards (separate from the internal test sequence number)
alter table public.quran_results
  add column if not exists paper_number text;

-- Passing percentage per exam (set once, before publishing)
alter table public.quran_exams
  add column if not exists passing_percent numeric not null default 50
    check (passing_percent > 0 and passing_percent <= 100);

-- Separate consecutive-fail streak + status for ONLINE TESTS
-- (kept independent from the academic Nazra/Tajweed streak on quran_students.status)
alter table public.quran_students
  add column if not exists consecutive_test_fails integer not null default 0,
  add column if not exists test_status text not null default 'active'
    check (test_status in ('active','warned','rejected'));

-- Fines for failing online tests — Rs. 50/70/90, escalating per consecutive fail
create table public.quran_test_fines (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  exam_id uuid not null,
  attempt_id uuid not null,
  streak_position integer not null,       -- 1st, 2nd, 3rd consecutive fail
  amount numeric not null,
  waived boolean not null default false,
  created_at timestamp with time zone default now(),
  constraint quran_test_fines_pkey primary key (id),
  constraint quran_test_fines_student_fk foreign key (student_id) references public.quran_students(id) on delete cascade,
  constraint quran_test_fines_exam_fk foreign key (exam_id) references public.quran_exams(id) on delete cascade,
  constraint quran_test_fines_attempt_fk foreign key (attempt_id) references public.quran_exam_attempts(id) on delete cascade
);

-- Daily recitation rating — one entry per student per day
create table public.quran_daily_ratings (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  date date not null,
  rating text not null check (rating in ('excellent','average','not_good')),
  created_at timestamp with time zone default now(),
  constraint quran_daily_ratings_pkey primary key (id),
  constraint quran_daily_ratings_student_fk foreign key (student_id) references public.quran_students(id) on delete cascade,
  constraint quran_daily_ratings_unique unique (student_id, date)
);

-- Weekly performance fines — Rs. 50/70/90/100, escalating per offense within the month
create table public.quran_performance_fines (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  month_key text not null,               -- e.g. '2026-08'
  week_number integer not null check (week_number between 1 and 4),
  amount numeric not null,
  waived boolean not null default false,
  created_at timestamp with time zone default now(),
  constraint quran_performance_fines_pkey primary key (id),
  constraint quran_performance_fines_student_fk foreign key (student_id) references public.quran_students(id) on delete cascade,
  constraint quran_performance_fines_unique unique (student_id, month_key, week_number)
);

-- ============================================================
-- Row Level Security for the new tables
-- ============================================================
alter table public.quran_test_fines enable row level security;
alter table public.quran_daily_ratings enable row level security;
alter table public.quran_performance_fines enable row level security;

-- No public policies on these — they're admin/student-scoped, not public-readable.
-- Once real auth is wired up, add policies like:
--   create policy "student reads own fines" on public.quran_test_fines
--     for select using (student_id = auth.uid());
-- (Requires students to have real Supabase Auth accounts, which the current
-- access-code login does not yet use — see the note in the handoff message.)
