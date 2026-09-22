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
  Note,
  GiftRule,
  Gift,
  Fee,
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
  return {
    testNumber: row.test_number,
    requiredPercent: Number(row.required_percent),
    nuraniQaidaPercent: row.nurani_qaida_percent === null || row.nurani_qaida_percent === undefined ? null : Number(row.nurani_qaida_percent),
    nazraPercent: row.nazra_percent === null || row.nazra_percent === undefined ? null : Number(row.nazra_percent),
    tajweedPercent: row.tajweed_percent === null || row.tajweed_percent === undefined ? null : Number(row.tajweed_percent),
  };
}
export function criterionToRow(c: PassingCriterion) {
  return {
    test_number: c.testNumber,
    required_percent: c.requiredPercent,
    nurani_qaida_percent: c.nuraniQaidaPercent ?? null,
    nazra_percent: c.nazraPercent ?? null,
    tajweed_percent: c.tajweedPercent ?? null,
  };
}

// ----- quran_notes -----
export function noteFromRow(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    fileUrl: row.file_url ?? null,
    fileName: row.file_name ?? null,
    audience: row.audience,
    section: row.section ?? "quran",
    pinned: row.pinned ?? false,
    createdAt: row.created_at,
  };
}
export function noteToRow(n: Note) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    file_url: n.fileUrl,
    file_name: n.fileName,
    audience: n.audience,
    section: n.section,
    pinned: n.pinned,
  };
}

// ----- quran_gift_rules -----
export function giftRuleFromRow(row: any): GiftRule {
  return {
    id: row.id,
    section: row.section ?? "both",
    category: row.category,
    title: row.title,
    description: row.description ?? "",
    triggerType: row.trigger_type,
    threshold: Number(row.threshold),
    active: row.active ?? true,
    createdAt: row.created_at,
  };
}
export function giftRuleToRow(r: GiftRule) {
  return {
    id: r.id,
    section: r.section,
    category: r.category,
    title: r.title,
    description: r.description,
    trigger_type: r.triggerType,
    threshold: r.threshold,
    active: r.active,
  };
}

// ----- quran_gifts -----
export function giftFromRow(row: any): Gift {
  return {
    id: row.id,
    studentId: row.student_id,
    section: row.section,
    ruleId: row.rule_id ?? null,
    category: row.category,
    title: row.title,
    description: row.description ?? "",
    reason: row.reason ?? "",
    awardKey: row.award_key,
    awardedAt: row.awarded_at ?? row.created_at,
  };
}
export function giftToRow(g: Gift) {
  return {
    id: g.id,
    student_id: g.studentId,
    section: g.section,
    rule_id: g.ruleId,
    category: g.category,
    title: g.title,
    description: g.description,
    reason: g.reason,
    award_key: g.awardKey,
    awarded_at: g.awardedAt,
  };
}

// ----- quran_fees -----
export function feeFromRow(row: any): Fee {
  return {
    id: row.id,
    studentId: row.student_id,
    section: row.section,
    title: row.title,
    amount: Number(row.amount),
    dueDate: row.due_date ?? null,
    status: row.status ?? "pending",
    note: row.note ?? "",
    createdAt: row.created_at,
  };
}
export function feeToRow(f: Fee) {
  return {
    id: f.id,
    student_id: f.studentId,
    section: f.section,
    title: f.title,
    amount: f.amount,
    due_date: f.dueDate,
    status: f.status,
    note: f.note,
  };
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

// Uploads a note's attached file to Supabase Storage and returns its public
// URL. Unlike the older audio-recording upload, this has no "just make a
// local data URL" fallback — per the DB-only decision made for this app, an
// unconfigured/unreachable database should surface as a clear error, not a
// value that quietly never made it to Supabase.
export async function uploadNoteFile(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from("quran-notes-files").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`File upload failed: ${error.message}`);
  const { data } = supabase.storage.from("quran-notes-files").getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------
// Thin write helpers. Called fire-and-forget from the store (optimistic
// local state already updated the UI) — errors are logged, not thrown,
// so a flaky connection never breaks the page.
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Write helpers. These THROW on failure instead of swallowing the error,
// so the store can surface a visible banner to the admin. Silent console
// logging was the cause of a real bug: students appeared to save fine in
// the UI while nothing ever reached the database.
// ---------------------------------------------------------------------

export async function syncUpsert(table: string, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).upsert(row);
  if (error) {
    console.error(`[supabase] upsert ${table} failed:`, error.message);
    throw new Error(`Could not save to ${table}: ${error.message}`);
  }
}

export async function syncDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error(`[supabase] delete ${table} failed:`, error.message);
    throw new Error(`Could not delete from ${table}: ${error.message}`);
  }
}

export async function deleteStudentCascade(studentId: string) {
  // Delete children first because the existing schema uses foreign keys without
  // ON DELETE CASCADE. Announcements/notes can target a student by audience.
  const byStudent = [
    "quran_test_fines",
    "quran_performance_fines",
    "quran_audio_submissions",
    "quran_daily_ratings",
    "quran_gifts",
    "quran_fees",
    "quran_exam_attempts",
  ];
  for (const table of byStudent) {
    const { error } = await supabase.from(table).delete().eq("student_id", studentId);
    if (error) throw new Error(`Could not delete student data from ${table}: ${error.message}`);
  }
  for (const table of ["quran_announcements", "quran_notes"]) {
    const { error } = await supabase.from(table).delete().eq("audience", studentId);
    if (error) throw new Error(`Could not delete targeted ${table}: ${error.message}`);
  }
  const { error } = await supabase.from("quran_students").delete().eq("id", studentId);
  if (error) throw new Error(`Could not delete student: ${error.message}`);
}

// Fetches every table this app needs in parallel and maps each into the
// app's camelCase shape. A failure on ANY table throws — the app must not
// quietly render an empty student list when the database is unreachable or
// blocked by RLS, because that looks identical to "no students yet".
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
    ["quran_notes", (rows) => rows.map(noteFromRow)],
    ["quran_gift_rules", (rows) => rows.map(giftRuleFromRow)],
    ["quran_gifts", (rows) => rows.map(giftFromRow)],
    ["quran_fees", (rows) => rows.map(feeFromRow)],
  ];

  const results = await Promise.all(
    tables.map(async ([table, map]) => {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.error(`[supabase] fetch ${table} failed:`, error.message);
        throw new Error(`Could not read ${table}: ${error.message}`);
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
    notes: results[10] as Note[],
    giftRules: results[11] as GiftRule[],
    gifts: results[12] as Gift[],
    fees: results[13] as Fee[],
  };
}
