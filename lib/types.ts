export type Subject = "nuraniQaida" | "nazra" | "tajweed";
export type Course = "Nurani Qaida" | "Nazra" | "Tajweed" | "Qirat" | "All";

// Which subjects are required (pass/fail) for each course, and whether
// the online test module applies to that course.
export const COURSE_CONFIG: Record<
  Course,
  { requiredSubjects: Subject[]; showQiratBonus: boolean; onlineTests: boolean }
> = {
  "Nurani Qaida": { requiredSubjects: ["nuraniQaida"], showQiratBonus: false, onlineTests: false },
  "Nazra": { requiredSubjects: ["nazra"], showQiratBonus: false, onlineTests: false },
  "Tajweed": { requiredSubjects: ["tajweed"], showQiratBonus: false, onlineTests: true },
  "Qirat": { requiredSubjects: [], showQiratBonus: true, onlineTests: true },
  "All": { requiredSubjects: ["nazra", "tajweed"], showQiratBonus: true, onlineTests: true },
};

// Which portal("s") this student belongs to. Both log in the same way with
// the same code — this only changes what the admin form asks for and what
// shows up in the student portal. A student can belong to both at once.
//  - "quran"   -> Course/Level as before: paper results, progress, audio.
//  - "academy" -> a free-text Class (e.g. "AI & Chatbots", "9th Class")
//                 alongside Course/Level; adds Daily Performance and Online
//                 Test Results on top of whatever "quran" already shows.
export type Section = "quran" | "academy";

export function portalAccess(student: Pick<Student, "sections" | "course">): {
  showResults: boolean;
  showAudio: boolean;
  showProgress: boolean;
  showTests: boolean;
} {
  const sections = student.sections ?? ["quran"];
  const hasQuran = sections.includes("quran");
  const hasAcademy = sections.includes("academy");
  const config = COURSE_CONFIG[student.course];
  return {
    showResults: hasQuran || hasAcademy,
    showAudio: hasQuran && (config.requiredSubjects.includes("tajweed") || config.showQiratBonus),
    showProgress: hasQuran,
    showTests: hasAcademy || (hasQuran && config.onlineTests),
  };
}

export interface TestResultEntry {
  obtained: number;
  total: number;
}

// Flexible result rows for the complete student Result card. Standard rows
// such as Paper/Nazra/Tajweed and academy-specific rows all use the same
// obtained + total shape. The array is stored inside the existing results JSONB
// column, so no database column change is required.
export interface ResultField extends TestResultEntry {
  id: string;
  name: string;
}

export interface TestResult {
  id: string;
  testNumber: number;
  paperNumber: string;
  date: string; // ISO date
  section?: Section; // result belongs to Quran or Main Academy; older records default to Quran
  resultFields?: ResultField[];
  nuraniQaida: TestResultEntry | null;
  nazra: TestResultEntry | null;
  tajweed: TestResultEntry | null;
  qiratBonus: number | null; // bonus only — a single number, no total, admin-assigned
  requiredPercent: number; // OVERALL passing % that applied to this test
  // Per-subject passing % thresholds that applied to this specific result,
  // when the admin set one different from the overall %. Undefined/missing
  // for a subject means "use requiredPercent (overall) for that subject" —
  // this keeps every result saved before this feature existed working
  // exactly as before with no data migration needed.
  subjectRequiredPercents?: Partial<Record<Subject, number>>;
  // Derived fields (computed, not hand-entered)
  nuraniQaidaPercent: number | null;
  nazraPercent: number | null;
  tajweedPercent: number | null;
  overallObtained: number;
  overallTotal: number;
  overallPercent: number;
  status: "pass" | "fail";
  failedSubjects: Subject[];
}

export type StudentStatus = "active" | "warned" | "rejected";

export interface Student {
  id: string;
  name: string;
  parentName: string;
  sections: Section[];
  course: Course; // only meaningful when sections includes "quran"
  level: "Beginner" | "Intermediate" | "Advanced"; // only meaningful when sections includes "quran"
  academyClass: string; // only meaningful when sections includes "academy", e.g. "AI & Chatbots"
  joinDate: string;
  loginCode: string; // simple portal access code (mock auth)
  status: StudentStatus;
  consecutiveFails: number;
  results: TestResult[];
  // Online test (MCQ exam) fail streak — separate from academic fails
  consecutiveTestFails: number;
  testStatus: StudentStatus;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  audience: "all" | string; // "all" or a student id
  pinned?: boolean;
}

// A private/attachable note — distinct from Announcements: supports one
// file attachment, and is scoped to a section (quran/academy) so it only
// shows up for students actually in that section, on top of the existing
// "all students" or "one specific student" audience targeting.
export interface Note {
  id: string;
  title: string;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  audience: "all" | string; // "all" or a student id
  section: Section;
  pinned: boolean;
  createdAt: string;
}

export interface PassingCriterion {
  testNumber: number;
  requiredPercent: number; // overall passing %
  // Optional per-subject overrides. When a subject is left unset here, that
  // subject's own pass/fail check falls back to requiredPercent.
  nuraniQaidaPercent?: number | null;
  nazraPercent?: number | null;
  tajweedPercent?: number | null;
}

// ---------- Online MCQ Exams ----------

export interface ExamOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: ExamOption[];
}

export interface Exam {
  id: string;
  title: string;
  // Which section this test belongs to — determines who sees it and
  // which tab it appears under for students enrolled in both.
  section: Section;
  // Which numbered test this online exam belongs to — same numbering
  // family as the paper test results, so admin and students can tell
  // "Test 4 (Online)" apart from "Test 4" paper marks at a glance.
  testNumber: number;
  instructionsEn: string;
  instructionsUr: string;
  durationMinutes: number;
  maxViolations: number;
  passingPercent: number;
  isPublished: boolean;
  createdAt: string;
  questions: ExamQuestion[];
  // Scheduling: when students may start (null = open immediately once published)
  scheduledAt: string | null;
  // How long after submission the result becomes visible to the student
  resultRevealMinutes: number;
}

export type ViolationType =
  | "tab_switch"
  | "window_blur"
  | "fullscreen_exit"
  | "copy_attempt"
  | "devtools_attempt";

export interface Violation {
  type: ViolationType;
  at: string;
}

export interface ExamAnswer {
  questionId: string;
  selectedOptionId: string | null;
  savedAt: string | null;
}

export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "auto_submitted_timeout"
  | "auto_submitted_violation";

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt: string | null;
  status: AttemptStatus;
  violations: Violation[];
  answers: ExamAnswer[];
  score: number | null;
  totalMarks: number;
}

export interface QuranReview {
  id: string;
  name: string;
  role: string;
  review: string;
  rating: number;
  approved: boolean;
  createdAt: string;
}

// ---------- Daily recitation performance tracking ----------

export type DailyRating = "not_good" | "average" | "excellent";

export interface DailyRatingEntry {
  id: string;
  studentId: string;
  section: Section; // "quran" or "academy" — independent per-section tracking
  date: string; // ISO date, one entry per student per section per day
  rating: DailyRating;
}

export interface WeekSummary {
  weekNumber: 1 | 2 | 3 | 4;
  startDate: string;
  endDate: string;
  score: number; // 0-100, running weekly score
  dailyScores: { date: string; rating: DailyRating; score: number }[];
  fined: boolean;
  fineAmount: number;
  recoveredBeforeWeekEnd: boolean;
  completed: boolean;
}

export interface PerformanceFine {
  id: string;
  studentId: string;
  section: Section;
  monthKey: string; // e.g. "2026-08"
  weekNumber: 1 | 2 | 3 | 4;
  amount: number;
  createdAt: string;
  waived: boolean;
}

export interface TestFine {
  id: string;
  studentId: string;
  examId: string;
  attemptId: string;
  streakPosition: number; // 1st, 2nd, 3rd consecutive fail
  amount: number;
  createdAt: string;
  waived: boolean;
}

export type ManualFineStatus = "pending" | "received" | "waived";

export interface ManualFine {
  id: string;
  studentId: string;
  section: Section;
  amount: number;
  reason: string;
  fineDate: string;
  status: ManualFineStatus;
  createdAt: string;
}

// ---------- Qirat / Tajweed recitation audio ----------
// One row per (student, testNumber) — the student uploads both recordings,
// the admin listens and enters marks on the same test result form.

export interface AudioSubmission {
  id: string;
  studentId: string;
  testNumber: number;
  qiratUrl: string | null;
  tajweedUrl: string | null;
  qiratSubmittedAt: string | null;
  tajweedSubmittedAt: string | null;
  qiratHeard: boolean;
  tajweedHeard: boolean;
}
export type GiftTriggerType = "result_percent" | "weekly_performance";

export interface GiftRule {
  id: string;
  section: Section | "both";
  category: string;
  title: string;
  description: string;
  triggerType: GiftTriggerType;
  threshold: number;
  active: boolean;
  createdAt: string;
}

export interface Gift {
  id: string;
  studentId: string;
  section: Section;
  ruleId: string | null;
  category: string;
  title: string;
  description: string;
  reason: string;
  awardKey: string;
  awardedAt: string;
}

export type FeeStatus = "pending" | "paid" | "waived";

export interface Fee {
  id: string;
  studentId: string;
  section: Section;
  title: string;
  amount: number;
  dueDate: string | null;
  status: FeeStatus;
  note: string;
  createdAt: string;
}

