# Vercel deployment checklist

## 1. GitHub repository root

The repository root must directly contain:

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- `app/`
- `components/`
- `lib/`
- `public/`

Do **not** put the project inside another nested folder.

## 2. Vercel project settings

Use the repository root as **Root Directory**.

Expected framework:

`Next.js`

Build command:

`npm run build`

Install command:

`npm install` (Vercel may auto-detect this)

Output directory:

Leave the Next.js default. Do not set a static `public` output directory.

## 3. Supabase environment variables

For real database mode, add these in:

Vercel → Project → Settings → Environment Variables

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Use the same values for **Production**, **Preview**, and **Development** if you want all Vercel environments to use the same Supabase project.

The app intentionally falls back to local browser storage when these variables are missing, so a missing Supabase env variable does not create a Next.js route 404.

## 4. Database

Run `quran-schema-final-vercel.sql` in the Supabase SQL Editor.

This supports:

- Quran-only students
- Academy-only students
- Students enrolled in both sections
- Section-specific daily ratings
- Section-specific performance fines
- Section-specific online tests
- Online test attempts/results
- Qirat/Tajweed audio submissions
- Admin announcements/reviews/criteria

## 5. Audio storage

The SQL creates the `qirat-audio` bucket and its current app-compatible policies.

## 6. Local verification before pushing

From the folder containing `package.json`:

```bash
npm install
npm run build
npm run dev
```

Then test:

- `/`
- `/quran`
- `/quran/login`
- `/quran/portal`
- `/quran/portal/results`
- `/quran/portal/audio`
- `/quran/portal/progress`
- `/quran/portal/performance`
- `/quran/portal/tests`
- `/quran/portal/test-results`
- `/quran/portal/fines`
- `/quran/admin`

## 7. No-404 rule of thumb

If Vercel shows 404 for `/quran/portal/...`:

1. Check that the deployment is using the repository root.
2. Check that `app/quran/portal/.../page.tsx` exists in GitHub.
3. Check the deployment build log for a failed build.
4. Make sure Vercel is deploying this Next.js project, not a parent folder.

A correct Next.js deployment does not need a custom `vercel.json` for these App Router routes.

## 8. Security note

The current academy uses custom browser-side login code/password checks rather than Supabase Auth. The current database policies therefore allow the public anon role to read/write the app tables. This is functional but should not be considered strong authentication. For real student data, the next security upgrade should be Supabase Auth + RLS policies based on `auth.uid()`.
