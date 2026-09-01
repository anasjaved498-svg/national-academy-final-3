-- ============================================================
-- Run this FIRST, before quran-schema-live-v4.sql, to clear out
-- tables created by earlier schema files. Safe to run even if
-- some of these don't exist — "if exists" skips them quietly.
-- This does NOT touch your original 4 tables (academy_chat_memory,
-- gallery_items, page_views, reviews) — only the quran_* ones.
-- ============================================================

drop table if exists public.quran_test_fines cascade;
drop table if exists public.quran_performance_fines cascade;
drop table if exists public.quran_daily_ratings cascade;
drop table if exists public.quran_exam_answers cascade;
drop table if exists public.quran_exam_attempts cascade;
drop table if exists public.quran_exam_options cascade;
drop table if exists public.quran_exam_questions cascade;
drop table if exists public.quran_exams cascade;
drop table if exists public.quran_results cascade;
drop table if exists public.quran_reviews cascade;
drop table if exists public.quran_announcements cascade;
drop table if exists public.quran_passing_criteria cascade;
drop table if exists public.quran_students cascade;
