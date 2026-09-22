"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Announcement, PassingCriterion, Student, ResultField, Exam, ExamQuestion, ExamAttempt, ViolationType, QuranReview, DailyRatingEntry, DailyRating, PerformanceFine, TestFine, ManualFine, ManualFineStatus, AudioSubmission, Section, Note, Subject, GiftRule, Gift, Fee, FeeStatus } from "./types";
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
  manualFineToRow,
  audioToRow,
  noteToRow,
  giftRuleToRow,
  giftToRow,
  feeToRow,
  deleteStudentCascade,
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
  manualFines: ManualFine[];
  audioSubmissions: AudioSubmission[];
  notes: Note[];
  giftRules: GiftRule[];
  gifts: Gift[];
  fees: Fee[];
  auth: AuthState;
  // True once the initial load has finished — pages can use this to show a
  // loading state instead of an empty flash.
  dataReady: boolean;
  // Non-null when the database is unreachable or a save failed. Shown as a
  // banner so a failed write is never mistaken for a successful one.
  dbError: string | null;
  dismissDbError: () => void;
  loginAdmin: (password: string) => boolean;
  loginStudent: (code: string) => boolean;
  logout: () => void;
  addStudent: (s: Omit<Student, "id" | "results" | "status" | "consecutiveFails" | "consecutiveTestFails" | "testStatus">) => void;
  updateStudent: (studentId: string, patch: Partial<Omit<Student, "id">>) => void;
  deleteStudent: (studentId: string) => void;
  addResult: (
    studentId: string,
    data: {
      testNumber: number;
      paperNumber: string;
      date: string;
      section?: Section;
      resultFields: ResultField[];
      qiratBonus: number | null;
      // Overall + optional per-subject passing % actually used for this
      // specific save. Also gets written back into quran_passing_criteria
      // for this test number, so the next student entered for the same
      // test defaults to the same thresholds.
      requiredPercent: number;
      subjectRequiredPercents?: Partial<Record<Subject, number>>;
    }
  ) => void;
  requiredPercentFor: (testNumber: number) => number;
  // Full criteria row for a test number (overall + any per-subject
  // overrides), or undefined if nothing has been set for it yet — used to
  // pre-fill the Enter Result form.
  criteriaFor: (testNumber: number) => PassingCriterion | undefined;
  updateCriteria: (criterion: PassingCriterion) => void;
  rejectStudent: (studentId: string) => void;
  reinstateStudent: (studentId: string) => void;
  addAnnouncement: (a: Omit<Announcement, "id" | "date">) => void;
  deleteAnnouncement: (id: string) => void;
  // Notes (separate from Announcements — supports one file attachment,
  // scoped to a Quran/Academy section)
  addNote: (n: Omit<Note, "id" | "createdAt">) => void;
  deleteNote: (id: string) => void;
  // Gifts
  addGiftRule: (r: Omit<GiftRule, "id" | "createdAt">) => void;
  updateGiftRule: (r: GiftRule) => void;
  deleteGiftRule: (id: string) => void;
  addGift: (g: Omit<Gift, "id" | "awardedAt" | "awardKey" | "ruleId"> & { ruleId?: string | null; awardKey?: string }) => void;
  deleteGift: (id: string) => void;
  // Fees
  addFee: (f: Omit<Fee, "id" | "createdAt">) => void;
  updateFeeStatus: (id: string, status: FeeStatus) => void;
  deleteFee: (id: string) => void;
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
  // Manual fines: these are independent from the automatic performance/test fine system.
  addManualFine: (f: Omit<ManualFine, "id" | "createdAt" | "status"> & { status?: ManualFineStatus }) => void;
  updateManualFineStatus: (id: string, status: ManualFineStatus) => void;
  deleteManualFine: (id: string) => void;
  setStudentTestStatus: (studentId: string, consecutiveTestFails: number, testStatus: Student["status"]) => void;
  rejectStudentFromTests: (studentId: string) => void;
  reinstateStudentFromTests: (studentId: string) => void;
  // Qirat/Tajweed recitation audio
  submitAudio: (studentId: string, testNumber: number, kind: "qirat" | "tajweed", dataUrl: string) => void;
  markAudioHeard: (studentId: string, testNumber: number, kind: "qirat" | "tajweed") => void;
  getAudioSubmission: (studentId: string, testNumber: number) => AudioSubmission | undefined;
}

const StoreContext = createContext<StoreState | null>(null);

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
  const [manualFines, setManualFines] = useState<ManualFine[]>([]);
  const [audioSubmissions, setAudioSubmissions] = useState<AudioSubmission[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [giftRules, setGiftRules] = useState<GiftRule[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [auth, setAuth] = useState<AuthState>({ role: "guest" });
  const [hydrated, setHydrated] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  // Set whenever the database can't be read or written. Surfaced as a
  // visible banner so a failed save is never mistaken for a successful one.
  const [dbError, setDbError] = useState<string | null>(null);

  // Wraps every write. On failure it shows the error to the user AND
  // re-reads from the database, so the screen goes back to showing what is
  // actually stored rather than the optimistic value that didn't save.
  const runWrite = useCallback((promise: Promise<unknown>) => {
    promise.catch(async (err) => {
      console.error("[supabase] write failed:", err);
      setDbError(
        `${err instanceof Error ? err.message : String(err)} — this change was NOT saved to the database.`
      );
      try {
        const data = await fetchAllData();
        setStudents(data.students);
        setAnnouncements(data.announcements);
        setExams(data.exams);
        setAttempts(data.attempts);
        setQuranReviews(data.quranReviews);
        setDailyRatings(data.dailyRatings);
        setPerformanceFines(data.performanceFines);
        setTestFines(data.testFines);
        setManualFines(data.manualFines);
        setAudioSubmissions(data.audioSubmissions);
        setNotes(data.notes);
        setGiftRules(data.giftRules);
        setGifts(data.gifts);
        setFees(data.fees);
      } catch {
        // Already showing an error; nothing more to do.
      }
    });
  }, []);
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
  const giftRulesRef = useRef(giftRules);
  giftRulesRef.current = giftRules;
  const giftsRef = useRef(gifts);
  giftsRef.current = gifts;
  const feesRef = useRef(fees);
  feesRef.current = fees;
  const manualFinesRef = useRef(manualFines);
  manualFinesRef.current = manualFines;
  const dailyRatingsRef = useRef(dailyRatings);
  dailyRatingsRef.current = dailyRatings;

  // ---------- Initial load: Supabase ONLY ----------
  // No localStorage fallback. If the database can't be reached, the app
  // shows an error instead of quietly switching to browser-only data —
  // that fallback is exactly what caused students to be created in one
  // browser and be invisible everywhere else (and in the database).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabaseConfigured) {
        if (!cancelled) {
          setDbError(
            "Database is not connected. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing from this deployment. Add them in Vercel → Settings → Environment Variables, then redeploy. Nothing you enter will be saved until this is fixed."
          );
          setDataReady(true);
          setHydrated(true);
        }
        return;
      }
      try {
        const data = await fetchAllData();
        if (cancelled) return;
        setStudents(data.students);
        setAnnouncements(data.announcements);
        setCriteria(data.criteria.length > 0 ? data.criteria : seedCriteria);
        setExams(data.exams);
        setAttempts(data.attempts);
        setQuranReviews(data.quranReviews.length > 0 ? data.quranReviews : seedQuranReviews);
        setDailyRatings(data.dailyRatings);
        setPerformanceFines(data.performanceFines);
        setTestFines(data.testFines);
        setManualFines(data.manualFines);
        setAudioSubmissions(data.audioSubmissions);
        setNotes(data.notes);
        setGiftRules(data.giftRules);
        setGifts(data.gifts);
        setFees(data.fees);
        setDbError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("[supabase] initial load failed:", err);
        setDbError(
          `Could not load data from the database: ${
            err instanceof Error ? err.message : String(err)
          }. Check your Supabase connection and that the RLS policies from quran-schema-v6-supabase-sync.sql have been run.`
        );
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

  // NOTE: student/result/exam data is deliberately NOT cached in
  // localStorage. Supabase is the single source of truth. Only the
  // "who is currently logged in" session below is stored in the browser.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.sessionStorage.setItem("quran-academy-auth", JSON.stringify(auth));
  }, [auth, hydrated]);

  const addGiftRecord = useCallback((gift: Gift) => {
    if (giftsRef.current.some((g) => g.awardKey === gift.awardKey)) return;
    giftsRef.current = [...giftsRef.current, gift];
    setGifts((prev) => [...prev, gift]);
    runWrite(syncUpsert("quran_gifts", giftToRow(gift)));
  }, [runWrite]);

  const sweepAutomaticGifts = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const rules = giftRulesRef.current.filter((r) => r.active);
    if (rules.length === 0) return;

    for (const student of studentsRef.current) {
      for (const result of student.results) {
        const section = result.section ?? (student.sections.includes("academy") && !student.sections.includes("quran") ? "academy" : "quran");
        for (const rule of rules) {
          if (rule.triggerType !== "result_percent") continue;
          if (rule.section !== "both" && rule.section !== section) continue;
          if (result.overallPercent < rule.threshold) continue;
          addGiftRecord({
            id: newUuid(),
            studentId: student.id,
            section,
            ruleId: rule.id,
            category: rule.category,
            title: rule.title,
            description: rule.description,
            reason: `Result Test ${result.testNumber}: ${result.overallPercent}%`,
            awardKey: `result:${result.id}:rule:${rule.id}`,
            awardedAt: new Date().toISOString(),
          });
        }
      }

      const monthKeys = new Set(
        dailyRatingsRef.current
          .filter((e) => e.studentId === student.id)
          .map((e) => e.date.slice(0, 7))
      );
      for (const section of student.sections) {
        for (const monthKey of monthKeys) {
          const entries = dailyRatingsRef.current.filter(
            (e) => e.studentId === student.id && e.section === section && e.date.startsWith(monthKey)
          );
          if (entries.length === 0) continue;
          const summary = buildMonthSummary(monthKey, entries);
          for (const week of summary.weeks) {
            if (!week.completed) continue;
            for (const rule of rules) {
              if (rule.triggerType !== "weekly_performance") continue;
              if (rule.section !== "both" && rule.section !== section) continue;
              if (week.score < rule.threshold) continue;
              addGiftRecord({
                id: newUuid(),
                studentId: student.id,
                section,
                ruleId: rule.id,
                category: rule.category,
                title: rule.title,
                description: rule.description,
                reason: `${monthKey} Week ${week.weekNumber}: weekly score ${week.score}`,
                awardKey: `week:${student.id}:${section}:${monthKey}:${week.weekNumber}:rule:${rule.id}`,
                awardedAt: `${week.endDate}T23:59:59.000Z`,
              });
            }
          }
        }
      }
    }
    void today;
  }, [addGiftRecord]);

  useEffect(() => {
    if (!hydrated) return;
    sweepAutomaticGifts();
    // The sweep is triggered by students, ratings, or rule changes. Gift writes
    // themselves must not retrigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, students, dailyRatings, giftRules]);

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
      for (const f of newFines) runWrite(syncUpsert("quran_performance_fines", perfFineToRow(f)));
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

  const criteriaFor: StoreState["criteriaFor"] = useCallback(
    (testNumber: number) => criteria.find((c) => c.testNumber === testNumber),
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
    runWrite(syncUpsert("quran_students", studentToRow(student)));
  };

  const updateStudent: StoreState["updateStudent"] = (studentId, patch) => {
    const current = studentsRef.current.find((s) => s.id === studentId);
    if (!current) return;
    const updated: Student = { ...current, ...patch };
    if (!updated.sections.length) return;
    if (!updated.sections.includes("academy")) updated.academyClass = "";
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    runWrite(syncUpsert("quran_students", studentToRow(updated)));
  };

  const deleteStudent: StoreState["deleteStudent"] = (studentId) => {
    if (!studentsRef.current.some((s) => s.id === studentId)) return;
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setAnnouncements((prev) => prev.filter((a) => a.audience !== studentId));
    setNotes((prev) => prev.filter((n) => n.audience !== studentId));
    setDailyRatings((prev) => prev.filter((x) => x.studentId !== studentId));
    setPerformanceFines((prev) => prev.filter((x) => x.studentId !== studentId));
    setTestFines((prev) => prev.filter((x) => x.studentId !== studentId));
    setManualFines((prev) => prev.filter((x) => x.studentId !== studentId));
    setAttempts((prev) => prev.filter((x) => x.studentId !== studentId));
    setAudioSubmissions((prev) => prev.filter((x) => x.studentId !== studentId));
    setGifts((prev) => prev.filter((x) => x.studentId !== studentId));
    setFees((prev) => prev.filter((x) => x.studentId !== studentId));
    runWrite(deleteStudentCascade(studentId));
  };

  const addResult: StoreState["addResult"] = (studentId, data) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const newResult = computeResult({
      id: newUuid(),
      testNumber: data.testNumber,
      paperNumber: data.paperNumber,
      date: data.date,
      section: data.section ?? (s.sections.includes("academy") && !s.sections.includes("quran") ? "academy" : "quran"),
      course: s.course,
      resultFields: data.resultFields,
      qiratBonus: data.qiratBonus,
      requiredPercent: data.requiredPercent,
      subjectRequiredPercents: data.subjectRequiredPercents,
    });
    const resultSection = data.section ?? (s.sections.includes("academy") && !s.sections.includes("quran") ? "academy" : "quran");
    const results = [
      ...s.results.filter((r) => {
        const existingSection = r.section ?? "quran";
        return !(r.testNumber === data.testNumber && existingSection === resultSection);
      }),
      newResult,
    ];
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
    runWrite(syncUpsert("quran_students", studentToRow(updated)));

    // Keep the passing-criteria row for this test number in sync with what
    // was actually just used, so the NEXT student entered for the same test
    // number defaults to the same thresholds instead of stale/old ones —
    // this is what used to cause "Test 3 shows 40%" surprises.
    updateCriteria({
      testNumber: data.testNumber,
      requiredPercent: data.requiredPercent,
      nuraniQaidaPercent: data.subjectRequiredPercents?.nuraniQaida ?? null,
      nazraPercent: data.subjectRequiredPercents?.nazra ?? null,
      tajweedPercent: data.subjectRequiredPercents?.tajweed ?? null,
    });
  };

  const updateCriteria: StoreState["updateCriteria"] = (criterion) => {
    setCriteria((prev) => {
      const exists = prev.find((c) => c.testNumber === criterion.testNumber);
      const next = exists
        ? prev.map((c) => (c.testNumber === criterion.testNumber ? criterion : c))
        : [...prev, criterion].sort((a, b) => a.testNumber - b.testNumber);
      return next;
    });
    runWrite(syncUpsert("quran_passing_criteria", criterionToRow(criterion)));
  };

  const rejectStudent = (studentId: string) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const updated: Student = { ...s, status: "rejected" };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    runWrite(syncUpsert("quran_students", studentToRow(updated)));
  };

  const reinstateStudent = (studentId: string) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const updated: Student = { ...s, status: "active", consecutiveFails: 0 };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    runWrite(syncUpsert("quran_students", studentToRow(updated)));
  };

  const addAnnouncement: StoreState["addAnnouncement"] = (a) => {
    const id = newUuid();
    const date = new Date().toISOString().slice(0, 10);
    const announcement: Announcement = { ...a, id, date };
    setAnnouncements((prev) => [announcement, ...prev]);
    runWrite(syncUpsert("quran_announcements", announcementToRow(announcement)));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    runWrite(syncDelete("quran_announcements", id));
  };

  const addNote: StoreState["addNote"] = (n) => {
    const id = newUuid();
    const note: Note = { ...n, id, createdAt: new Date().toISOString() };
    setNotes((prev) => [note, ...prev]);
    runWrite(syncUpsert("quran_notes", noteToRow(note)));
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    runWrite(syncDelete("quran_notes", id));
  };

  // ---------- Gifts ----------

  const addGiftRule: StoreState["addGiftRule"] = (r) => {
    const rule: GiftRule = { ...r, id: newUuid(), createdAt: new Date().toISOString() };
    setGiftRules((prev) => [rule, ...prev]);
    runWrite(syncUpsert("quran_gift_rules", giftRuleToRow(rule)));
  };

  const updateGiftRule: StoreState["updateGiftRule"] = (rule) => {
    setGiftRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    runWrite(syncUpsert("quran_gift_rules", giftRuleToRow(rule)));
  };

  const deleteGiftRule = (id: string) => {
    const linked = giftsRef.current.filter((g) => g.ruleId === id);
    if (linked.length > 0) {
      setGifts((prev) => prev.map((g) => (g.ruleId === id ? { ...g, ruleId: null } : g)));
      linked.forEach((gift) => {
        runWrite(syncUpsert("quran_gifts", giftToRow({ ...gift, ruleId: null })));
      });
      giftsRef.current = giftsRef.current.map((g) => (g.ruleId === id ? { ...g, ruleId: null } : g));
    }
    setGiftRules((prev) => prev.filter((r) => r.id !== id));
    runWrite(syncDelete("quran_gift_rules", id));
  };

  const addGift: StoreState["addGift"] = (g) => {
    const gift: Gift = {
      ...g,
      id: newUuid(),
      ruleId: g.ruleId ?? null,
      awardKey: g.awardKey ?? `manual:${newUuid()}`,
      awardedAt: new Date().toISOString(),
    };
    addGiftRecord(gift);
  };

  const deleteGift = (id: string) => {
    setGifts((prev) => prev.filter((g) => g.id !== id));
    runWrite(syncDelete("quran_gifts", id));
  };

  // ---------- Fees ----------

  const addFee: StoreState["addFee"] = (f) => {
    const fee: Fee = { ...f, id: newUuid(), createdAt: new Date().toISOString() };
    setFees((prev) => [fee, ...prev]);
    runWrite(syncUpsert("quran_fees", feeToRow(fee)));
  };

  const updateFeeStatus: StoreState["updateFeeStatus"] = (id, status) => {
    const fee = feesRef.current.find((f) => f.id === id);
    if (!fee) return;
    const updated = { ...fee, status };
    setFees((prev) => prev.map((f) => (f.id === id ? updated : f)));
    runWrite(syncUpsert("quran_fees", feeToRow(updated)));
  };

  const deleteFee = (id: string) => {
    setFees((prev) => prev.filter((f) => f.id !== id));
    runWrite(syncDelete("quran_fees", id));
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
    runWrite(syncUpsert("quran_exams", examToRow(exam)));
  };

  const togglePublish = (examId: string, publish: boolean) => {
    const ex = examsRef.current.find((x) => x.id === examId);
    if (!ex) return;
    const updated: Exam = { ...ex, isPublished: publish };
    setExams((prev) => prev.map((x) => (x.id === examId ? updated : x)));
    runWrite(syncUpsert("quran_exams", examToRow(updated)));
  };

  const deleteExam = (examId: string) => {
    const removedAttemptIds = attemptsRef.current.filter((a) => a.examId === examId).map((a) => a.id);
    setExams((prev) => prev.filter((ex) => ex.id !== examId));
    setAttempts((prev) => prev.filter((a) => a.examId !== examId));
    // Attempts reference the exam by foreign key, so they must go first.
    for (const id of removedAttemptIds) runWrite(syncDelete("quran_exam_attempts", id));
    runWrite(syncDelete("quran_exams", examId));
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
    runWrite(syncUpsert("quran_exam_attempts", attemptToRow(attempt)));
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
    runWrite(syncUpsert("quran_exam_attempts", attemptToRow(updated)));
  };

  const recordViolation: StoreState["recordViolation"] = (attemptId, type) => {
    const a = attemptsRef.current.find((x) => x.id === attemptId);
    if (!a || a.status !== "in_progress") return;
    const updated: ExamAttempt = { ...a, violations: [...a.violations, { type, at: new Date().toISOString() }] };
    setAttempts((prev) => prev.map((x) => (x.id === attemptId ? updated : x)));
    runWrite(syncUpsert("quran_exam_attempts", attemptToRow(updated)));
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
    runWrite(syncUpsert("quran_exam_attempts", attemptToRow(updatedAttempt)));

    // Apply test-fail fine/termination logic (separate streak from academic results)
    if (exam) {
      const student = studentsRef.current.find((s) => s.id === attempt.studentId);
      if (student) {
        const totalMarks = exam.questions.length;
        const percent = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
        const passed = percent >= exam.passingPercent;
        const newStreak = passed ? 0 : student.consecutiveTestFails + 1;
        const newStatus: Student["status"] =
          student.testStatus === "rejected"
            ? "rejected"
            : newStreak >= 2
            ? "warned"
            : "active";
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
    runWrite(syncUpsert("quran_reviews", reviewToRow(review)));
  };

  const approveQuranReview = (id: string) => {
    const r = quranReviews.find((x) => x.id === id);
    if (!r) return;
    const updated: QuranReview = { ...r, approved: true };
    setQuranReviews((prev) => prev.map((x) => (x.id === id ? updated : x)));
    runWrite(syncUpsert("quran_reviews", reviewToRow(updated)));
  };

  const deleteQuranReview = (id: string) => {
    setQuranReviews((prev) => prev.filter((r) => r.id !== id));
    runWrite(syncDelete("quran_reviews", id));
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
      runWrite(syncUpsert("quran_daily_ratings", ratingToRow(entry)));
      return existing ? prev.map((e) => (e.id === existing.id ? entry : e)) : [...prev, entry];
    });
  };

  const recordPerformanceFine: StoreState["recordPerformanceFine"] = (f) => {
    const fine: PerformanceFine = { ...f, id: newUuid(), createdAt: new Date().toISOString() };
    setPerformanceFines((prev) => [...prev, fine]);
    runWrite(syncUpsert("quran_performance_fines", perfFineToRow(fine)));
  };

  const waivePerformanceFine = (id: string) => {
    const f = performanceFines.find((x) => x.id === id);
    if (!f) return;
    const updated: PerformanceFine = { ...f, waived: true };
    setPerformanceFines((prev) => prev.map((x) => (x.id === id ? updated : x)));
    runWrite(syncUpsert("quran_performance_fines", perfFineToRow(updated)));
  };

  // ---------- Test fail fines ----------

  const recordTestFine: StoreState["recordTestFine"] = (f) => {
    const fine: TestFine = { ...f, id: newUuid(), createdAt: new Date().toISOString() };
    setTestFines((prev) => [...prev, fine]);
    runWrite(syncUpsert("quran_test_fines", testFineToRow(fine)));
  };

  const waiveTestFine = (id: string) => {
    const f = testFines.find((x) => x.id === id);
    if (!f) return;
    const updated: TestFine = { ...f, waived: true };
    setTestFines((prev) => prev.map((x) => (x.id === id ? updated : x)));
    runWrite(syncUpsert("quran_test_fines", testFineToRow(updated)));
  };

  // ---------- Manual fines ----------
  // These records are intentionally separate from the automatic performance
  // and online-test fine tables. Adding one here never changes a student's
  // performance/test streaks, and receiving/waiving one never changes them.
  const addManualFine: StoreState["addManualFine"] = (f) => {
    const reason = f.reason.trim();
    if (!reason || !Number.isFinite(f.amount) || f.amount <= 0) return;
    const fine: ManualFine = {
      ...f,
      id: newUuid(),
      amount: Number(f.amount),
      reason,
      fineDate: f.fineDate || new Date().toISOString().slice(0, 10),
      status: f.status ?? "pending",
      createdAt: new Date().toISOString(),
    };
    manualFinesRef.current = [fine, ...manualFinesRef.current];
    setManualFines((prev) => [fine, ...prev]);
    runWrite(syncUpsert("quran_manual_fines", manualFineToRow(fine)));
  };

  const updateManualFineStatus: StoreState["updateManualFineStatus"] = (id, status) => {
    const fine = manualFinesRef.current.find((x) => x.id === id);
    if (!fine) return;
    const updated: ManualFine = { ...fine, status };
    manualFinesRef.current = manualFinesRef.current.map((x) => (x.id === id ? updated : x));
    setManualFines((prev) => prev.map((x) => (x.id === id ? updated : x)));
    runWrite(syncUpsert("quran_manual_fines", manualFineToRow(updated)));
  };

  const deleteManualFine = (id: string) => {
    manualFinesRef.current = manualFinesRef.current.filter((x) => x.id !== id);
    setManualFines((prev) => prev.filter((x) => x.id !== id));
    runWrite(syncDelete("quran_manual_fines", id));
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
    runWrite(syncUpsert("quran_students", studentToRow(updated)));
  };

  const rejectStudentFromTests: StoreState["rejectStudentFromTests"] = (studentId) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const updated: Student = { ...s, testStatus: "rejected" };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    runWrite(syncUpsert("quran_students", studentToRow(updated)));
  };

  const reinstateStudentFromTests: StoreState["reinstateStudentFromTests"] = (studentId) => {
    const s = studentsRef.current.find((x) => x.id === studentId);
    if (!s) return;
    const updated: Student = { ...s, testStatus: "active", consecutiveTestFails: 0 };
    setStudents((prev) => prev.map((x) => (x.id === studentId ? updated : x)));
    runWrite(syncUpsert("quran_students", studentToRow(updated)));
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
      runWrite(syncUpsert("quran_audio_submissions", audioToRow(updated)));
      return existing ? prev.map((a) => (a.id === existing.id ? updated : a)) : [...prev, updated];
    });
  };

  const markAudioHeard: StoreState["markAudioHeard"] = (studentId, testNumber, kind) => {
    const a = audioSubmissions.find((x) => x.studentId === studentId && x.testNumber === testNumber);
    if (!a) return;
    const updated: AudioSubmission = { ...a, ...(kind === "qirat" ? { qiratHeard: true } : { tajweedHeard: true }) };
    setAudioSubmissions((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    runWrite(syncUpsert("quran_audio_submissions", audioToRow(updated)));
  };

  const getAudioSubmission: StoreState["getAudioSubmission"] = (studentId, testNumber) =>
    audioSubmissions.find((a) => a.studentId === studentId && a.testNumber === testNumber);

  const dismissDbError = () => setDbError(null);

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
    manualFines,
    audioSubmissions,
    notes,
    giftRules,
    gifts,
    fees,
    auth,
    dataReady,
    dbError,
    dismissDbError,
    loginAdmin,
    loginStudent,
    logout,
    addStudent,
    updateStudent,
    deleteStudent,
    addResult,
    requiredPercentFor,
    criteriaFor,
    updateCriteria,
    rejectStudent,
    reinstateStudent,
    addAnnouncement,
    deleteAnnouncement,
    addNote,
    deleteNote,
    addGiftRule,
    updateGiftRule,
    deleteGiftRule,
    addGift,
    deleteGift,
    addFee,
    updateFeeStatus,
    deleteFee,
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
    addManualFine,
    updateManualFineStatus,
    deleteManualFine,
    setStudentTestStatus,
    rejectStudentFromTests,
    reinstateStudentFromTests,
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
