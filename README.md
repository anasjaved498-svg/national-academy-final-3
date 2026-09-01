# National Academy of Science & Arts — Quran Section

A Next.js + Tailwind website for the Quran section of your academy, styled to match your existing
dark teal/amber site (Playfair Display + DM Sans), with a student/parent portal, an admin panel,
and an online MCQ testing system.

## What's included

- **Public pages**: Home, About, Courses (Nazra/Tajweed/Qirat), Testimonials (live, Quran-only
  feed with submit + admin approval), Announcements, Contact
- **Student/Parent Portal**: Dashboard, Results (report-card style, parent-facing), Progress
  graphs, Online Tests, Test Results (kept separate from academic results), Announcements
- **Admin Panel**: manage students, enter results (auto pass/fail/warnings/rejection), set passing
  % per test, post announcements, approve testimonials, and build/publish online MCQ tests

## Online Tests — how it works

1. Prepare questions in Excel/Sheets using `exam-upload-template.csv` as the format
2. Admin → Online Tests → fill in title/duration/instructions (English + Urdu) → upload the CSV
3. Publish the test — it appears on the student portal instantly
4. Students see bilingual instructions first (must tick both boxes to proceed), then take the
   test in fullscreen with a timer
5. Anti-cheat: tab-switch, window-blur, fullscreen-exit, copy, and dev-tools-shortcut attempts are
   all tracked as violations. Hitting the configured violation limit auto-submits the test, as
   does the timer running out.
6. Each question has a **Save Answer / Save Change** button — students can change their answer as
   many times as they like before submitting, but once submitted it's locked.
7. Results appear on the student's own **Test Results** page — separate from their Nazra/Tajweed
   academic results.

**Honest limitation**: no browser-based system can be 100% cheat-proof (a second device/phone
camera can't be blocked by any website). This gives you the same level of deterrence real online
exam platforms use — not an unbreakable lock.

## Demo logins

- Student/Parent access code: `AHM-101` (or `FAT-102`, `BIL-103`)
- Admin password: `admin123`

## Run locally

```
npm install
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Import it on vercel.com → Framework preset: Next.js (auto-detected) → Deploy
3. You'll get a free `your-project.vercel.app` URL

## Connecting your real Supabase project (whenever you're ready)

Right now all data lives in the browser's localStorage so you can test everything immediately.
When you're ready to go live with real data:

1. Run `quran-schema.sql` then `quran-schema-anticheat.sql` in your Supabase SQL Editor (both
   provided separately) — these add Quran-specific tables alongside your existing ones, no
   conflicts.
2. Create a file named `.env.local` in this project's root folder with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   (Settings → API in your Supabase dashboard has both values.)
3. Let me know once that's done and I'll swap `lib/store.tsx`'s localStorage logic for real
   Supabase calls — the data shapes already match the SQL schema, so this is a contained change,
   not a rebuild.
4. Also replace the hardcoded demo admin password (`admin123` in `lib/store.tsx`) with real
   authentication before real student data goes in.

## Final Vercel + Supabase setup

The current source now writes newly-created database rows with valid UUIDs, matching the `uuid` primary keys in Supabase. Use `quran-schema-final-vercel.sql` as the consolidated database setup/migration for the current application.

For a real Vercel deployment, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings → Environment Variables. Without them, the app deliberately falls back to browser storage so missing Supabase configuration does not cause a Next.js route failure.

See `VERCEL_DEPLOYMENT.md` for the no-404 deployment checklist.

The consolidated SQL also creates the Main Academy public-site tables used by `public/academy.html` (`gallery_items`, `page_views`, `reviews`, and `academy_chat_memory`) when they are missing, plus the `academy-gallery` storage bucket. Existing tables are preserved.
