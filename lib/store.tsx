"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Announcement, PassingCriterion, Student, TestResultEntry, Exam, ExamQuestion, ExamAttempt, ViolationType, QuranReview, DailyRatingEntry, DailyRating, PerformanceFine, TestFine, AudioSubmission, Section } from "./types";
import { seedAnnouncements, seedCriteria, seedStudents, seedQuranReviews } from "./seed";
import { computeConsecutiveFails, computeResult } from "./calculations";
import { buildMonthSummary, currentMonthKey } from "./performance";
import { supabaseConfigured } from "./supabase";
import { newUuid } from "./id";
import {
  fetchAllData,
  syncUpsert,
  syncDelete,
  studentToRow,
  announcementToRow,
  criterionToRow,
  examToRow,
  attemptToRow,
  reviewToRow,
  ratingToRow,
  perfFineToRow,
  testFineToRow,
  audioToRow,
} from "./db";

interface AuthState {
  role: "guest" | "admin" | "student";
  studentId?: string;
}

interface StoreState {
  students: Student[];
  announcements: Announcement[];
  criteria: PassingCriterion[];
  exams: Exam[];
  attempts: ExamAttempt[];
  quranReviews: QuranReview[];
  dailyRatings: DailyRatingEntry[];
  performanceFines: PerformanceFine[];
  testFines: TestFine[];
  audioSubmissions: AudioSubmission[];
  auth: AuthState;
  // True once the initial load (Supabase or localStorage) has finished —
  // pages can use this to show a loading state instead of an empty flash.
  dataReady: boolean;
  loginAdmin: (password: string) => boolean;
  loginStudent: (code: string) => boolean;
  logout: () => void;
  addStudent: (s: Omit<Student, "id" | "results" | "status" | "consecutiveFails" | "consecutiveTestFails" | "testStatus">) => void;
  addResult: (
    studentId: string,
    data: {
      testNumber: number;
      paperNumber: string;
      date: string;
      nuraniQaida: TestResultEntry | null;
      nazra: TestResultEntry | null;
      tajweed: TestResultEntry | null;
      qiratBonus: number | null;
    }
  ) => void;
  requiredPercentFor: (testNumber: number) => number;
  updateCriteria: (testNumber: number, requiredPercent: number) => void;
  rejectStudent: (studentId: string) => void;
  reinstateStudent: (studentId: string) => void;
  addAnnouncement: (a: Omit<Announcement, "id" | "date">) => void;
  deleteAnnouncement: (id: string) => void;
  // Exams
  addExam: (e: {
    title: string;
    section: Section;
    testNumber: number;
    instructionsEn: string;
    instructionsUr: string;
    durationMinutes: number;
    maxViolations: number;
    passingPercent: number;
    scheduledAt: string | null;
    resultRevealMinutes: number;
    questions: { text: string; options: { text: string; isCorrect: boolean }[] }[];
  }) => void;
  togglePublish: (examId: string, publish: boolean) => void;
  deleteExam: (examId: string) => void;
  startAttempt: (examId: string) => ExamAttempt;
  saveAnswer: (attemptId: string, questionId: string, selectedOptionId: string | null) => void;
  recordViolation: (attemptId: string, type: ViolationType) => void;
  submitAttempt: (
    attemptId: string,
    reason: "manual" | "timeout" | "violation"
  ) => void;
  // Quran testimonials
  addQuranReview: (r: { name: string; role: string; review: string; rating: number }) => void;
  approveQuranReview: (id: string) => void;
  deleteQuranReview: (id: string) => void;
  // Performance graph
  setDailyRating: (studentId: string, date: string, section: Section, rating: DailyRating) => void;
  recordPerformanceFine: (f: Omit<PerformanceFine, "id" | "createdAt">) => void;
  waivePerformanceFine: (id: string) => void;
  // Test fail fines
  recordTestFine: (f: Omit<TestFine, "id" | "createdAt">) => void;
  waiveTestFine: (id: string) => void;
  setStudentTestStatus: (studentId: string, consecutiveTestFails: number, testStatus: Student["status"]) => void;
  // Qirat/Tajweed recitation audio
  submitAudio: (studentId: string, testNumber: number, kind: "qirat" | "tajweed", dataUrl: string) => void;
  markAudioHeard: (studentId: string, testNumber: number, kind: "qirat" | "tajweed") => void;
  getAudioSubmission: (studentId: string, testNumber: number) => AudioSubmission | undefined;
}

const StoreContext = createContext<StoreState | null>(null);

const STORAGE_KEY = "quran-academy-data-v3";

// Older saved data (before "sections" existed) has students with a single
// `section: "quran" | "academy"` field instead of `sections: Section[]`.
// Upgrade those records in place so the rest of the app never has to think
// about the old shape. (Only relevant to the localStorage fallback path —
// Supabase rows are already migrated by the v6 SQL script.)
function migrateStudent(s: Student & { section?: "quran" | "academy" }): Student {
  if (Array.isArray(s.sections) && s.sections.length > 0) return s as Student;
  const { section, ...rest } = s;
  return { ...rest, sections: [section ?? "quran"] } as Student;
}

function loadInitialLocal() {
  const base = {
    students: seedStudents,
    announcements: seedAnnouncements,
    criteria: seedCriteria,
    exams: [],
    attempts: [],
    quranReviews: seedQuranReviews,
    dailyRatings: [],
    performanceFines: [],
    testFines: [],
    audioSubmissions: [],
  };
  if (typeof window === "undefined") {
    return base;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = { ...base, ...JSON.parse(raw) };
      parsed.students = (parsed.students ?? []).map(migrateStudent);
      return parsed;
    }
  } catch {
    // fall through to seed
  }
  return base;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>(seedStudents);
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements);
  const [criteria, setCriteria] = useState<PassingCriterion[]>(seedCriteria);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [quranReviews, setQuranReviews] = useState<QuranReview[]>(seedQuranReviews);
  const [dailyRatings, setDailyRatings] = useState<DailyRatingEntry[]>([]);
  const [performanceFines, setPerformanceFines] = useState<PerformanceFine[]>([]);
  const [testFines, setTestFines] = useState<TestFine[]>([]);
  const [audioSubmissions, setAudioSubmissions] = useState<AudioSubmission[]>([]);
  const [auth, setAuth] = useState<AuthState>({ role: "guest" });
  const [hydrated, setHydrated] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  // Every mutating function below reads current arrays from these refs
  // (kept in sync every render) instead of closing over stale state — the
  // functions themselves are plain consts recreated each render, so this
  // just avoids relying on render-order timing.
  const studentsRef = useRef(students);
  studentsRef.current = students;
  const examsRef = useRef(exams);
  examsRef.current = exams;
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;

  // ---------- Initial load: Supabase when configured, else localStorage ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (supabaseConfigured) {
        try {
          const data = await fetchAllData();
          if (cancelled) return;
          setStudents(data.students.length > 0 ? data.students : seedStudents);
          setAnnouncements(data.announcements.length > 0 ? data.announcements : seedAnnouncements);
          setCriteria(data.criteria.length > 0 ? data.criteria : seedCriteria);
          setExams(data.exams);
          setAttempts(data.attempts);
          setQuranReviews(data.quranReviews.length > 0 ? data.quranReviews : seedQuranReviews);
          setDailyRatings(data.dailyRatings);
          setPerformanceFines(data.performanceFines);
          setTestFines(data.testFines);
          setAudioSubmissions(data.audioSubmissions);
        } catch (err) {
          console.error("[supabase] initial load failed, falling back to local data:", err);
          const initial = loadInitialLocal();
          setStudents(initial.students);
          setAnnouncements(initial.announcements);
          setCriteria(initial.criteria);
          setExams(initial.exams ?? []);
          setAttempts(initial.attempts ?? []);
          setQuranReviews(initial.quranReviews ?? seedQuranReviews);
          setDailyRatings(initial.dailyRatings ?? []);
          setPerformanceFines(initial.performanceFines ?? []);
          setTestFines(initial.testFines ?? []);
          setAudioSubmissions(initial.audioSubmissions ?? []);
        }
      } else {
        const initial = loadInitialLocal();
        setStudents(initial.students);
        setAnnouncements(initial.announcements);
        setCriteria(initial.criteria);
        setExams(initial.exams ?? []);
        setAttempts(initial.attempts ?? []);
        setQuranReviews(initial.quranReviews ?? seedQuranReviews);
        setDailyRatings(initial.dailyRatings ?? []);
        setPerformanceFines(initial.performanceFines ?? []);
        setTestFines(initial.testFines ?? []);
        setAudioSubmissions(initial.audioSubmissions ?? []);
      }
      if (typeof window !== "undefined") {
        const savedAuth = window.sessionStorage.getItem("quran-academy-auth");
        if (savedAuth) setAuth(JSON.parse(savedAuth));
      }
      if (!cancelled) {
        setHydrated(true);
        setDataReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // localStorage stays as a local cache/fallback in every mode — cheap,
  // and it's what keeps local dev (no Supabase env vars) working exactly
  // as before.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        students,
        announcements,
        criteria,
        exams,
        attempts,
        quranReviews,
        dailyRatings,
        performanceFines,
        testFines,
        audioSubmissions,
      })
    );
  }, [students, announcements, criteria, exams, attempts, quranReviews, dailyRatings, performanceFines, testFines, audioSubmissions, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.sessionStorage.setItem("quran-academy-auth", JSON.stringify(auth));
  }, [auth, hydrated]);

  // Auto-fine sweep: whenever ratings (or the student list) change, check every
  // student's current-month performance summary — independently per section —
  // and record any newly-due fine that isn't already on file. This runs
  // automatically no matter which page or flow added the rating — not tied to
  // a specific button click — so a week crossing the red line always produces
  // a fine, every week, on its own.
  useEffect(() => {
    if (!hydrated) return;
    const monthKey = currentMonthKey();
    const newFines: PerformanceFine[] = [];
    for (const student of students) {
      for (const section of student.sections) {
        const myEntries = dailyRatings.filter(
          (e) => e.studentId === student.id && e.section === section && e.date.startsWith(monthKey)
        );
        if (myEntries.length === 0) continue;
        const summary = buildMonthSummary(monthKey, myEntries);
        const already = new Set(
          performanceFines
            .filter((f) => f.studentId === student.id && f.section === section && f.monthKey === monthKey)
            .map((f) => f.weekNumber)
        );
        for (const w of summary.weeks) {
          if (w.fined && !already.has(w.weekNumber)) {
            newFines.push({
              id: newUuid(),
              studentId: student.id,
              section,
              monthKey,
              weekNumber: w.weekNumber,
              amount: w.fineAmount,
              waived: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
    if (newFines.length > 0) {
      setPerformanceFines((prev) => [...prev, ...newFines]);
      if (supabaseConfigured) {
        for (const f of newFines) syncUpsert("quran_performance_fines", perfFineToRow(f)).catch(() => {});
      }
    }
    // Deliberately depends only on the raw inputs that can create a new fine —
    // not on performanceFines itself, to avoid re-triggering off its own writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyRatings, students, hydrated]);

  const requiredPercentFor = useCallback(
    (testNumber: number) => {
      const found = criteria.find((c) => c.testNumber === testNumber);
      if (found) return found.requiredPercent;
      const sorted = [...criteria].sort((a, b) => a.testNumber - b.testNumber);
      return sorted.length ? sorted[sorted.length - 1].requiredPercent : 30;
    },
    [criteria]
  );

  const loginAdmin = (password: string) => {
    // Demo-only credential. Replace with real auth (e.g. Supabase Auth) before going live.
    if (password === "admin123") {
      setAuth({ role: "admin" });
      return true;
    }
    return false;
  };

  const loginStudent = (code: string) => {
    const student = studentsRef.current.find(
      (s) => s.loginCode.toLowerCase() === code.trim().toLowerCase()
    );
    if (!student) return false;
    if (student.status === "rejected") return false;
    setAuth({ role: "student", studentId: student.id });
    return true;
  };

  const logout = () => setAuth({ role: "guest" });

  const addStudent: StoreState["addStudent"] = (s) => {
    const id = newUuid();
    const student: Student = {
      ...s,
      id,
      results: [],
      status: "active",
      consecutiveFails: 0,
      consecutiveTestFails: 0,
      testStatus: "active",
    };
    setStudents((prev) => [...prev, student]);
    if (supabaseConfigured) syncUpsert("quran_students", studentToRow(student));
  };

  const addResult: StoreState["addResult"] = (studentId, data) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const requiredPercent = requiredPercentFor(data.testNumber);
    const newResult = computeResult({
      id: newUuid(),
      testNumber: data.testNumber,
      paperNumber: data.paperNumber,
      date: data.date,
      course: s.course,
      nuraniQaida: data.nuraniQaida,
      nazra: data.nazra,
      tajweed: data.tajweed,
      qiratBonus: data.qiratBonus,
      requiredPercent,
    });
    const results = [...s.results.filter((r) => r.testNumber !== data.testNumber), newResult];
    const consecutiveFails = computeConsecutiveFails(results);
    const status: Student["status"] =
      s.status === "rejected"
        ? "rejected"
        : consecutiveFails >= 3
        ? "warned" // stays warned until admin explicitly rejects
        : consecutiveFails === 2
        ? "warned"
        : "active";
    const updated: Student = { ...s, results, consecutiveFails, status };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_students", studentToRow(updated));
  };

  const updateCriteria: StoreState["updateCriteria"] = (testNumber, requiredPercent) => {
    setCriteria((prev) => {
      const exists = prev.find((c) => c.testNumber === testNumber);
      const next = exists
        ? prev.map((c) => (c.testNumber === testNumber ? { ...c, requiredPercent } : c))
        : [...prev, { testNumber, requiredPercent }].sort((a, b) => a.testNumber - b.testNumber);
      return next;
    });
    if (supabaseConfigured) syncUpsert("quran_passing_criteria", criterionToRow({ testNumber, requiredPercent }));
  };

  const rejectStudent = (studentId: string) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const updated: Student = { ...s, status: "rejected" };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_students", studentToRow(updated));
  };

  const reinstateStudent = (studentId: string) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const updated: Student = { ...s, status: "active", consecutiveFails: 0 };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_students", studentToRow(updated));
  };

  const addAnnouncement: StoreState["addAnnouncement"] = (a) => {
    const id = newUuid();
    const date = new Date().toISOString().slice(0, 10);
    const announcement: Announcement = { ...a, id, date };
    setAnnouncements((prev) => [announcement, ...prev]);
    if (supabaseConfigured) syncUpsert("quran_announcements", announcementToRow(announcement));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    if (supabaseConfigured) syncDelete("quran_announcements", id);
  };

  // ---------- Exams ----------

  const addExam: StoreState["addExam"] = (e) => {
    const examId = newUuid();
    const questions: ExamQuestion[] = e.questions.map((q, i) => ({
      id: `${examId}-q${i}`,
      text: q.text,
      options: q.options.map((o, j) => ({ ...o, id: `${examId}-q${i}-o${j}` })),
    }));
    const exam: Exam = {
      id: examId,
      title: e.title,
      section: e.section,
      testNumber: e.testNumber,
      instructionsEn: e.instructionsEn,
      instructionsUr: e.instructionsUr,
      durationMinutes: e.durationMinutes,
      maxViolations: e.maxViolations,
      passingPercent: e.passingPercent,
      isPublished: false,
      createdAt: new Date().toISOString(),
      questions,
      scheduledAt: e.scheduledAt,
      resultRevealMinutes: e.resultRevealMinutes,
    };
    setExams((prev) => [exam, ...prev]);
    if (supabaseConfigured) syncUpsert("quran_exams", examToRow(exam));
  };

  const togglePublish = (examId: string, publish: boolean) => {
    const ex = examsRef.current.find((x) => x.id === examId);
    if (!ex) return;
    const updated: Exam = { ...ex, isPublished: publish };
    setExams((prev) => prev.map((x) => (x.id === examId ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_exams", examToRow(updated));
  };

  const deleteExam = (examId: string) => {
    const removedAttemptIds = attemptsRef.current.filter((a) => a.examId === examId).map((a) => a.id);
    setExams((prev) => prev.filter((ex) => ex.id !== examId));
    setAttempts((prev) => prev.filter((a) => a.examId !== examId));
    if (supabaseConfigured) {
      syncDelete("quran_exams", examId);
      for (const id of removedAttemptIds) syncDelete("quran_exam_attempts", id);
    }
  };

  const startAttempt: StoreState["startAttempt"] = (examId) => {
    const exam = examsRef.current.find((ex) => ex.id === examId);
    const studentId = auth.studentId!;
    const existing = attemptsRef.current.find((a) => a.examId === examId && a.studentId === studentId);
    if (existing) return existing;
    const attempt: ExamAttempt = {
      id: newUuid(),
      examId,
      studentId,
      startedAt: new Date().toISOString(),
      submittedAt: null,
      status: "in_progress",
      violations: [],
      answers: (exam?.questions ?? []).map((q) => ({
        questionId: q.id,
        selectedOptionId: null,
        savedAt: null,
      })),
      score: null,
      totalMarks: exam?.questions.length ?? 0,
    };
    setAttempts((prev) => [...prev, attempt]);
    if (supabaseConfigured) syncUpsert("quran_exam_attempts", attemptToRow(attempt));
    return attempt;
  };

  const saveAnswer: StoreState["saveAnswer"] = (attemptId, questionId, selectedOptionId) => {
    const a = attemptsRef.current.find((x) => x.id === attemptId);
    if (!a || a.status !== "in_progress") return;
    const updated: ExamAttempt = {
      ...a,
      answers: a.answers.map((ans) =>
        ans.questionId === questionId
          ? { ...ans, selectedOptionId, savedAt: new Date().toISOString() }
          : ans
      ),
    };
    setAttempts((prev) => prev.map((x) => (x.id === attemptId ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_exam_attempts", attemptToRow(updated));
  };

  const recordViolation: StoreState["recordViolation"] = (attemptId, type) => {
    const a = attemptsRef.current.find((x) => x.id === attemptId);
    if (!a || a.status !== "in_progress") return;
    const updated: ExamAttempt = { ...a, violations: [...a.violations, { type, at: new Date().toISOString() }] };
    setAttempts((prev) => prev.map((x) => (x.id === attemptId ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_exam_attempts", attemptToRow(updated));
  };

  const submitAttempt: StoreState["submitAttempt"] = (attemptId, reason) => {
    const attempt = attemptsRef.current.find((a) => a.id === attemptId);
    const exam = attempt ? examsRef.current.find((ex) => ex.id === attempt.examId) : undefined;
    if (!attempt || attempt.status !== "in_progress") return;

    let score = 0;
    if (exam) {
      for (const ans of attempt.answers) {
        const q = exam.questions.find((qq) => qq.id === ans.questionId);
        const opt = q?.options.find((o) => o.id === ans.selectedOptionId);
        if (opt?.isCorrect) score += 1;
      }
    }
    const status =
      reason === "manual"
        ? "submitted"
        : reason === "timeout"
        ? "auto_submitted_timeout"
        : "auto_submitted_violation";
    const updatedAttempt: ExamAttempt = { ...attempt, status, submittedAt: new Date().toISOString(), score };
    setAttempts((prev) => prev.map((x) => (x.id === attemptId ? updatedAttempt : x)));
    if (supabaseConfigured) syncUpsert("quran_exam_attempts", attemptToRow(updatedAttempt));

    // Apply test-fail fine/termination logic (separate streak from academic results)
    if (exam) {
      const student = studentsRef.current.find((s) => s.id === attempt.studentId);
      if (student) {
        const totalMarks = exam.questions.length;
        const percent = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
        const passed = percent >= exam.passingPercent;
        const newStreak = passed ? 0 : student.consecutiveTestFails + 1;
        const newStatus: Student["status"] =
          newStreak >= 3 ? "rejected" : newStreak === 2 ? "warned" : "active";
        setStudentTestStatus(student.id, newStreak, newStatus);
        if (!passed) {
          const fineSchedule = [50, 70, 90];
          const amount = fineSchedule[Math.min(newStreak - 1, fineSchedule.length - 1)];
          recordTestFine({
            studentId: student.id,
            examId: exam.id,
            attemptId,
            streakPosition: newStreak,
            amount,
            waived: false,
          });
        }
      }
    }
  };

  // ---------- Quran testimonials ----------

  const addQuranReview: StoreState["addQuranReview"] = (r) => {
    const id = newUuid();
    const review: QuranReview = { ...r, id, approved: false, createdAt: new Date().toISOString().slice(0, 10) };
    setQuranReviews((prev) => [review, ...prev]);
    if (supabaseConfigured) syncUpsert("quran_reviews", reviewToRow(review));
  };

  const approveQuranReview = (id: string) => {
    const r = quranReviews.find((x) => x.id === id);
    if (!r) return;
    const updated: QuranReview = { ...r, approved: true };
    setQuranReviews((prev) => prev.map((x) => (x.id === id ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_reviews", reviewToRow(updated));
  };

  const deleteQuranReview = (id: string) => {
    setQuranReviews((prev) => prev.filter((r) => r.id !== id));
    if (supabaseConfigured) syncDelete("quran_reviews", id);
  };

  // ---------- Performance graph ----------

  const setDailyRating: StoreState["setDailyRating"] = (studentId, date, section, rating) => {
    setDailyRatings((prev) => {
      const existing = prev.find(
        (e) => e.studentId === studentId && e.date === date && e.section === section
      );
      const entry: DailyRatingEntry = existing
        ? { ...existing, rating }
        : { id: newUuid(), studentId, date, section, rating };
      if (supabaseConfigured) syncUpsert("quran_daily_ratings", ratingToRow(entry));
      return existing ? prev.map((e) => (e.id === existing.id ? entry : e)) : [...prev, entry];
    });
  };

  const recordPerformanceFine: StoreState["recordPerformanceFine"] = (f) => {
    const fine: PerformanceFine = { ...f, id: newUuid(), createdAt: new Date().toISOString() };
    setPerformanceFines((prev) => [...prev, fine]);
    if (supabaseConfigured) syncUpsert("quran_performance_fines", perfFineToRow(fine));
  };

  const waivePerformanceFine = (id: string) => {
    const f = performanceFines.find((x) => x.id === id);
    if (!f) return;
    const updated: PerformanceFine = { ...f, waived: true };
    setPerformanceFines((prev) => prev.map((x) => (x.id === id ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_performance_fines", perfFineToRow(updated));
  };

  // ---------- Test fail fines ----------

  const recordTestFine: StoreState["recordTestFine"] = (f) => {
    const fine: TestFine = { ...f, id: newUuid(), createdAt: new Date().toISOString() };
    setTestFines((prev) => [...prev, fine]);
    if (supabaseConfigured) syncUpsert("quran_test_fines", testFineToRow(fine));
  };

  const waiveTestFine = (id: string) => {
    const f = testFines.find((x) => x.id === id);
    if (!f) return;
    const updated: TestFine = { ...f, waived: true };
    setTestFines((prev) => prev.map((x) => (x.id === id ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_test_fines", testFineToRow(updated));
  };

  const setStudentTestStatus: StoreState["setStudentTestStatus"] = (
    studentId,
    consecutiveTestFails,
    testStatus
  ) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const updated: Student = { ...s, consecutiveTestFails, testStatus };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_students", studentToRow(updated));
  };

  const submitAudio: StoreState["submitAudio"] = (studentId, testNumber, kind, dataUrl) => {
    setAudioSubmissions((prev) => {
      const existing = prev.find((a) => a.studentId === studentId && a.testNumber === testNumber);
      const now = new Date().toISOString();
      const updated: AudioSubmission = existing
        ? {
            ...existing,
            ...(kind === "qirat"
              ? { qiratUrl: dataUrl, qiratSubmittedAt: now, qiratHeard: false }
              : { tajweedUrl: dataUrl, tajweedSubmittedAt: now, tajweedHeard: false }),
          }
        : {
            id: newUuid(),
            studentId,
            testNumber,
            qiratUrl: kind === "qirat" ? dataUrl : null,
            tajweedUrl: kind === "tajweed" ? dataUrl : null,
            qiratSubmittedAt: kind === "qirat" ? now : null,
            tajweedSubmittedAt: kind === "tajweed" ? now : null,
            qiratHeard: false,
            tajweedHeard: false,
          };
      if (supabaseConfigured) syncUpsert("quran_audio_submissions", audioToRow(updated));
      return existing ? prev.map((a) => (a.id === existing.id ? updated : a)) : [...prev, updated];
    });
  };

  const markAudioHeard: StoreState["markAudioHeard"] = (studentId, testNumber, kind) => {
    const a = audioSubmissions.find((x) => x.studentId === studentId && x.testNumber === testNumber);
    if (!a) return;
    const updated: AudioSubmission = { ...a, ...(kind === "qirat" ? { qiratHeard: true } : { tajweedHeard: true }) };
    setAudioSubmissions((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    if (supabaseConfigured) syncUpsert("quran_audio_submissions", audioToRow(updated));
  };

  const getAudioSubmission: StoreState["getAudioSubmission"] = (studentId, testNumber) =>
    audioSubmissions.find((a) => a.studentId === studentId && a.testNumber === testNumber);

  const value: StoreState = {
    students,
    announcements,
    criteria,
    exams,
    attempts,
    quranReviews,
    dailyRatings,
    performanceFines,
    testFines,
    audioSubmissions,
    auth,
    dataReady,
    loginAdmin,
    loginStudent,
    logout,
    addStudent,
    addResult,
    requiredPercentFor,
    updateCriteria,
    rejectStudent,
    reinstateStudent,
    addAnnouncement,
    deleteAnnouncement,
    addExam,
    togglePublish,
    deleteExam,
    startAttempt,
    saveAnswer,
    recordViolation,
    submitAttempt,
    addQuranReview,
    approveQuranReview,
    deleteQuranReview,
    setDailyRating,
    recordPerformanceFine,
    waivePerformanceFine,
    recordTestFine,
    waiveTestFine,
    setStudentTestStatus,
    submitAudio,
    markAudioHeard,
    getAudioSubmission,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
