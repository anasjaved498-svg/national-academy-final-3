import { supabase } from "./supabase";
import {
  Student,
  Announcement,
  PassingCriterion,
  Exam,
  ExamAttempt,
  QuranReview,
  DailyRatingEntry,
  PerformanceFine,
  TestFine,
  AudioSubmission,
} from "./types";

// ---------------------------------------------------------------------
// Every table this app reads/writes, and a from-row / to-row pair for
// each — the DB uses snake_case columns, the app uses camelCase types.
// These are the ONLY place that mapping happens. Run
// quran-schema-v6-supabase-sync.sql before this code will work — it adds
// the columns below that don't exist in the original schema yet
// (sections, academy_class, test_number, section on a few tables).
// ---------------------------------------------------------------------

// ----- quran_students -----
export function studentFromRow(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    parentName: row.parent_name ?? "",
    sections: Array.isArray(row.sections) && row.sections.length > 0 ? row.sections : ["quran"],
    course: row.course,
    level: row.level,
    academyClass: row.academy_class ?? "",
    joinDate: row.join_date,
    loginCode: row.login_code,
    status: row.status,
    consecutiveFails: row.consecutive_fails,
    results: row.results ?? [],
    consecutiveTestFails: row.consecutive_test_fails,
    testStatus: row.test_status,
  };
}
export function studentToRow(s: Student) {
  return {
    id: s.id,
    name: s.name,
    parent_name: s.parentName || null,
    course: s.course,
    level: s.level,
    login_code: s.loginCode,
    status: s.status,
    consecutive_fails: s.consecutiveFails,
    test_status: s.testStatus,
    consecutive_test_fails: s.consecutiveTestFails,
    join_date: s.joinDate,
    results: s.results,
    sections: s.sections,
    academy_class: s.academyClass || null,
  };
}

// ----- quran_announcements -----
export function announcementFromRow(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    date: (row.created_at ?? "").slice(0, 10),
    audience: row.audience,
    pinned: row.pinned ?? false,
  };
}
export function announcementToRow(a: Announcement) {
  return { id: a.id, title: a.title, body: a.body, audience: a.audience, pinned: a.pinned ?? false };
}

// ----- quran_passing_criteria -----
export function criterionFromRow(row: any): PassingCriterion {
  return { testNumber: row.test_number, requiredPercent: Number(row.required_percent) };
}
export function criterionToRow(c: PassingCriterion) {
  return { test_number: c.testNumber, required_percent: c.requiredPercent };
}

// ----- quran_exams -----
export function examFromRow(row: any): Exam {
  return {
    id: row.id,
    title: row.title,
    section: row.section ?? "quran",
    testNumber: row.test_number ?? 1,
    instructionsEn: row.instructions_en ?? "",
    instructionsUr: row.instructions_ur ?? "",
    durationMinutes: row.duration_minutes,
    maxViolations: row.max_violations,
    passingPercent: Number(row.passing_percent),
    isPublished: row.is_published,
    createdAt: row.created_at,
    questions: row.questions ?? [],
    scheduledAt: row.scheduled_at,
    resultRevealMinutes: row.result_reveal_minutes,
  };
}
export function examToRow(e: Exam) {
  return {
    id: e.id,
    title: e.title,
    section: e.section,
    test_number: e.testNumber,
    instructions_en: e.instructionsEn,
    instructions_ur: e.instructionsUr,
    duration_minutes: e.durationMinutes,
    max_violations: e.maxViolations,
    passing_percent: e.passingPercent,
    is_published: e.isPublished,
    questions: e.questions,
    scheduled_at: e.scheduledAt,
    result_reveal_minutes: e.resultRevealMinutes,
  };
}

// ----- quran_exam_attempts -----
export function attemptFromRow(row: any): ExamAttempt {
  return {
    id: row.id,
    examId: row.exam_id,
    studentId: row.student_id,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    status: row.status,
    violations: row.violations ?? [],
    answers: row.answers ?? [],
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    totalMarks: Number(row.total_marks),
  };
}
export function attemptToRow(a: ExamAttempt) {
  return {
    id: a.id,
    exam_id: a.examId,
    student_id: a.studentId,
    started_at: a.startedAt,
    submitted_at: a.submittedAt,
    status: a.status,
    violations: a.violations,
    answers: a.answers,
    score: a.score,
    total_marks: a.totalMarks,
  };
}

// ----- quran_reviews -----
export function reviewFromRow(row: any): QuranReview {
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    review: row.review,
    rating: row.rating,
    approved: row.approved,
    createdAt: (row.created_at ?? "").slice(0, 10),
  };
}
export function reviewToRow(r: QuranReview) {
  return { id: r.id, name: r.name, role: r.role || null, review: r.review, rating: r.rating, approved: r.approved };
}

// ----- quran_daily_ratings -----
export function ratingFromRow(row: any): DailyRatingEntry {
  return { id: row.id, studentId: row.student_id, section: row.section ?? "quran", date: row.date, rating: row.rating };
}
export function ratingToRow(r: DailyRatingEntry) {
  return { id: r.id, student_id: r.studentId, section: r.section, date: r.date, rating: r.rating };
}

// ----- quran_performance_fines -----
export function perfFineFromRow(row: any): PerformanceFine {
  return {
    id: row.id,
    studentId: row.student_id,
    section: row.section ?? "quran",
    monthKey: row.month_key,
    weekNumber: row.week_number,
    amount: Number(row.amount),
    createdAt: row.created_at,
    waived: row.waived,
  };
}
export function perfFineToRow(f: PerformanceFine) {
  return {
    id: f.id,
    student_id: f.studentId,
    section: f.section,
    month_key: f.monthKey,
    week_number: f.weekNumber,
    amount: f.amount,
    waived: f.waived,
  };
}

// ----- quran_test_fines -----
export function testFineFromRow(row: any): TestFine {
  return {
    id: row.id,
    studentId: row.student_id,
    examId: row.exam_id,
    attemptId: row.attempt_id,
    streakPosition: row.streak_position,
    amount: Number(row.amount),
    createdAt: row.created_at,
    waived: row.waived,
  };
}
export function testFineToRow(f: TestFine) {
  return {
    id: f.id,
    student_id: f.studentId,
    exam_id: f.examId,
    attempt_id: f.attemptId,
    streak_position: f.streakPosition,
    amount: f.amount,
    waived: f.waived,
  };
}

// ----- quran_audio_submissions -----
export function audioFromRow(row: any): AudioSubmission {
  return {
    id: row.id,
    studentId: row.student_id,
    testNumber: row.test_number,
    qiratUrl: row.qirat_url,
    tajweedUrl: row.tajweed_url,
    qiratSubmittedAt: row.qirat_submitted_at,
    tajweedSubmittedAt: row.tajweed_submitted_at,
    qiratHeard: row.qirat_heard,
    tajweedHeard: row.tajweed_heard,
  };
}
export function audioToRow(a: AudioSubmission) {
  return {
    id: a.id,
    student_id: a.studentId,
    test_number: a.testNumber,
    qirat_url: a.qiratUrl,
    tajweed_url: a.tajweedUrl,
    qirat_submitted_at: a.qiratSubmittedAt,
    tajweed_submitted_at: a.tajweedSubmittedAt,
    qirat_heard: a.qiratHeard,
    tajweed_heard: a.tajweedHeard,
  };
}

// ---------------------------------------------------------------------
// Thin write helpers. Called fire-and-forget from the store (optimistic
// local state already updated the UI) — errors are logged, not thrown,
// so a flaky connection never breaks the page.
// ---------------------------------------------------------------------

export async function syncUpsert(table: string, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).upsert(row);
  if (error) console.error(`[supabase] upsert ${table} failed:`, error.message);
}

export async function syncDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) console.error(`[supabase] delete ${table} failed:`, error.message);
}

// Fetches every table this app needs in parallel and maps each into the
// app's camelCase shape. Any single table failing (e.g. a missing column
// before the migration SQL has been run) is logged and treated as empty
// rather than aborting the whole load.
export async function fetchAllData() {
  const tables: [string, (rows: any[]) => any][] = [
    ["quran_students", (rows) => rows.map(studentFromRow)],
    ["quran_announcements", (rows) => rows.map(announcementFromRow)],
    ["quran_passing_criteria", (rows) => rows.map(criterionFromRow)],
    ["quran_exams", (rows) => rows.map(examFromRow)],
    ["quran_exam_attempts", (rows) => rows.map(attemptFromRow)],
    ["quran_reviews", (rows) => rows.map(reviewFromRow)],
    ["quran_daily_ratings", (rows) => rows.map(ratingFromRow)],
    ["quran_performance_fines", (rows) => rows.map(perfFineFromRow)],
    ["quran_test_fines", (rows) => rows.map(testFineFromRow)],
    ["quran_audio_submissions", (rows) => rows.map(audioFromRow)],
  ];

  const results = await Promise.all(
    tables.map(async ([table, map]) => {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.error(`[supabase] fetch ${table} failed:`, error.message);
        return [];
      }
      return map(data ?? []);
    })
  );

  return {
    students: results[0] as Student[],
    announcements: results[1] as Announcement[],
    criteria: results[2] as PassingCriterion[],
    exams: results[3] as Exam[],
    attempts: results[4] as ExamAttempt[],
    quranReviews: results[5] as QuranReview[],
    dailyRatings: results[6] as DailyRatingEntry[],
    performanceFines: results[7] as PerformanceFine[],
    testFines: results[8] as TestFine[],
    audioSubmissions: results[9] as AudioSubmission[],
  };
}
