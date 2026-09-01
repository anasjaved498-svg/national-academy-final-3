-- ============================================================
-- FIX: your previous run failed on "create policy if not exists" —
-- that syntax doesn't exist in Postgres (only a few statement types
-- support IF NOT EXISTS, CREATE POLICY isn't one of them). This uses
-- DROP POLICY IF EXISTS + CREATE POLICY instead, which is safe to
-- run multiple times.
-- ============================================================

-- 1. Create the bucket (safe to re-run)
insert into storage.buckets (id, name, public)
values ('qirat-audio', 'qirat-audio', true)
on conflict (id) do nothing;

-- 2. Policies — drop first (no error if they don't exist yet), then create
drop policy if exists "qirat-audio anon upload" on storage.objects;
create policy "qirat-audio anon upload"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'qirat-audio');

drop policy if exists "qirat-audio anon update" on storage.objects;
create policy "qirat-audio anon update"
  on storage.objects for update
  to anon
  using (bucket_id = 'qirat-audio');

drop policy if exists "qirat-audio public read" on storage.objects;
create policy "qirat-audio public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'qirat-audio');

-- Same honest note as before: these policies allow any request using your
-- public anon key to upload/overwrite files in this bucket — matching the
-- app's current login-code auth (no real Supabase Auth session yet).
-- Fine to launch with; tighten later if you move to real Supabase Auth.
