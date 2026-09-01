-- ============================================================
-- QURAN SECTION — SIMPLIFIED LIVE SCHEMA (v4)
-- This REPLACES quran_results / quran_exams / quran_exam_questions /
-- quran_exam_options / quran_exam_attempts / quran_exam_answers from the
-- earlier normalized schema files. If you already ran those, drop them
-- first (see bottom of this file) — this version is what the app code
-- actually talks to now.
--
-- Why the change: nested lists (a student's results, an exam's questions,
-- an attempt's answers) are stored as single JSON columns instead of
-- separate linked tables. Simpler to wire up and maintain at your scale,
-- while still being one real shared database instead of browser storage.
-- ============================================================

create table public.quran_students (
  id uuid not null default gen_random_uuid(),
  name text not null,
  parent_name text,
  course text not null default 'Nazra' check (course in ('Nazra','Tajweed','Qirat')),
  level text not null default 'Beginner' check (level in ('Beginner','Intermediate','Advanced')),
  login_code text not null unique,
  status text not null default 'active' check (status in ('active','warned','rejected')),
  consecutive_fails integer not null default 0,
  test_status text not null default 'active' check (test_status in ('active','warned','rejected')),
  consecutive_test_fails integer not null default 0,
  join_date date not null default current_date,
  results jsonb not null default '[]'::jsonb,
  -- results: [{ id, testNumber, paperNumber, date, nazra:{obtained,total}, tajweed:{...},
  --             qirat:{...}|null, requiredPercent, nazraPercent, tajweedPercent, qiratPercent,
  --             overallObtained, overallTotal, overallPercent, status, failedSubjects[] }]
  created_at timestamp with time zone default now(),
  constraint quran_students_pkey primary key (id)
);

create table public.quran_passing_criteria (
  test_number integer not null,
  required_percent numeric not null check (required_percent > 0 and required_percent <= 100),
  updated_at timestamp with time zone default now(),
  constraint quran_passing_criteria_pkey primary key (test_number)
);

create table public.quran_announcements (
  id uuid not null default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all',
  pinned boolean default false,
  created_at timestamp with time zone default now(),
  constraint quran_announcements_pkey primary key (id)
);

create table public.quran_reviews (
  id uuid not null default gen_random_uuid(),
  name text not null,
  role text,
  review text not null,
  rating integer not null default 5 check (rating >= 1 and rating <= 5),
  approved boolean default false,
  created_at timestamp with time zone default now(),
  constraint quran_reviews_pkey primary key (id)
);

create table public.quran_exams (
  id uuid not null default gen_random_uuid(),
  title text not null,
  instructions_en text,
  instructions_ur text,
  duration_minutes integer not null default 5,
  max_violations integer not null default 3,
  passing_percent numeric not null default 50,
  is_published boolean not null default false,
  questions jsonb not null default '[]'::jsonb,
  -- questions: [{ id, text, options:[{id,text,isCorrect}] }]
  created_at timestamp with time zone default now(),
  constraint quran_exams_pkey primary key (id)
);

create table public.quran_exam_attempts (
  id uuid not null default gen_random_uuid(),
  exam_id uuid not null,
  student_id uuid not null,
  started_at timestamp with time zone default now(),
  submitted_at timestamp with time zone,
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted','auto_submitted_timeout','auto_submitted_violation')),
  violations jsonb not null default '[]'::jsonb,   -- [{type, at}]
  answers jsonb not null default '[]'::jsonb,       -- [{questionId, selectedOptionId, savedAt}]
  score numeric,
  total_marks numeric not null default 0,
  constraint quran_exam_attempts_pkey primary key (id),
  constraint quran_exam_attempts_exam_fk foreign key (exam_id) references public.quran_exams(id) on delete cascade,
  constraint quran_exam_attempts_student_fk foreign key (student_id) references public.quran_students(id) on delete cascade,
  constraint quran_exam_attempts_unique unique (exam_id, student_id)
);

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

create table public.quran_performance_fines (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  month_key text not null,
  week_number integer not null check (week_number between 1 and 4),
  amount numeric not null,
  waived boolean not null default false,
  created_at timestamp with time zone default now(),
  constraint quran_performance_fines_pkey primary key (id),
  constraint quran_performance_fines_student_fk foreign key (student_id) references public.quran_students(id) on delete cascade
);

create table public.quran_test_fines (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  exam_id uuid not null,
  attempt_id uuid not null,
  streak_position integer not null,
  amount numeric not null,
  waived boolean not null default false,
  created_at timestamp with time zone default now(),
  constraint quran_test_fines_pkey primary key (id),
  constraint quran_test_fines_student_fk foreign key (student_id) references public.quran_students(id) on delete cascade
);

-- ============================================================
-- Row Level Security
-- IMPORTANT HONEST NOTE: your student/admin logins are app-level checks
-- (an access code, a password) — not real Supabase Auth accounts. That
-- means there is no auth.uid() to scope policies by. The policies below
-- are intentionally permissive (anyone with your public anon key can
-- read/write) so the app functions today. This is a real limitation:
-- a technically savvy person who found your anon key could bypass the
-- app entirely and query Supabase directly. For a small local academy
-- this is a low practical risk, but it is NOT the same as true per-user
-- security. Upgrading to real Supabase Auth (so policies can check
-- auth.uid()) is the fix, and is separate follow-up work.
-- ============================================================

alter table public.quran_students enable row level security;
alter table public.quran_passing_criteria enable row level security;
alter table public.quran_announcements enable row level security;
alter table public.quran_reviews enable row level security;
alter table public.quran_exams enable row level security;
alter table public.quran_exam_attempts enable row level security;
alter table public.quran_daily_ratings enable row level security;
alter table public.quran_performance_fines enable row level security;
alter table public.quran_test_fines enable row level security;

create policy "anon full access" on public.quran_students for all using (true) with check (true);
create policy "anon full access" on public.quran_passing_criteria for all using (true) with check (true);
create policy "anon full access" on public.quran_announcements for all using (true) with check (true);
create policy "anon full access" on public.quran_reviews for all using (true) with check (true);
create policy "anon full access" on public.quran_exams for all using (true) with check (true);
create policy "anon full access" on public.quran_exam_attempts for all using (true) with check (true);
create policy "anon full access" on public.quran_daily_ratings for all using (true) with check (true);
create policy "anon full access" on public.quran_performance_fines for all using (true) with check (true);
create policy "anon full access" on public.quran_test_fines for all using (true) with check (true);

insert into public.quran_passing_criteria (test_number, required_percent) values
  (1, 30), (2, 35), (3, 40), (4, 40), (5, 45)
on conflict (test_number) do nothing;

-- ============================================================
-- If you already ran the earlier normalized schema files, drop those
-- superseded tables now (safe — the app never wrote real data to them):
-- ============================================================
-- drop table if exists public.quran_exam_answers cascade;
-- drop table if exists public.quran_exam_options cascade;
-- drop table if exists public.quran_exam_questions cascade;
-- (quran_exam_attempts, quran_exams, quran_results, quran_students are
--  recreated above with `create table` — if they already exist from an
--  earlier run, drop them first with `drop table if exists ... cascade;`
--  before re-running this file.)
