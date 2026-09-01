"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Award, ShieldAlert, Clock, Ban, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { portalAccess, Section } from "@/lib/types";

const SECTION_LABEL: Record<Section, string> = { quran: "Quran", academy: "Academy" };

function fmtDuration(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TestResultsPage() {
  const { exams, attempts, auth, students, testFines } = useStore();
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const student = students.find((s) => s.id === auth.studentId);
  const studentSections = student?.sections ?? ["quran"];
  const hasBoth = studentSections.length > 1;
  const [tab, setTab] = useState<Section>(studentSections[0]);
  const activeSection: Section = studentSections.includes(tab) ? tab : studentSections[0];
  const examSection = (examId: string): Section => exams.find((e) => e.id === examId)?.section ?? "quran";
  const mine = attempts
    .filter((a) => a.studentId === auth.studentId && a.status !== "in_progress")
    .filter((a) => studentSections.includes(examSection(a.examId)))
    .filter((a) => !hasBoth || examSection(a.examId) === activeSection)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  if (student && !portalAccess(student).showTests) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Test Results</p>
        <p className="text-sm text-[var(--ink-faint)]">
          Online tests aren't part of the {student.course} course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Test Results</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Your Online Test Results</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          These are separate from your monthly Nazra/Tajweed/Qirat results — this page is only for
          online tests taken through the portal.
        </p>
      </div>

      {hasBoth && (
        <div className="flex flex-wrap gap-2">
          {studentSections.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-full text-sm font-medium border ${
                activeSection === s
                  ? "border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--heading)]"
                  : "border-[var(--line)] text-[var(--ink-soft)]"
              }`}
            >
              {SECTION_LABEL[s]} Results
            </button>
          ))}
        </div>
      )}

      {student?.testStatus === "rejected" && (
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--rose-tint)] border border-[var(--rose)]/30 p-5">
          <Ban size={20} className="text-[var(--rose)] mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-[var(--rose)]">You are terminated from online tests</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              {student.name} has failed 3 consecutive online tests. Please contact the academy to
              discuss next steps.
            </p>
          </div>
        </div>
      )}
      {student?.testStatus === "warned" && (
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--gold-soft)] border border-[var(--gold)]/30 p-5">
          <ShieldAlert size={20} className="text-[var(--gold)] mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-[var(--heading)]">Warning: 2 consecutive test fails</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              One more consecutive fail will terminate your online test access.
            </p>
          </div>
        </div>
      )}

      {(() => {
        const upcoming = exams
          .filter((ex) => ex.isPublished && ex.scheduledAt && studentSections.includes(ex.section))
          .filter((ex) => !attempts.some((a) => a.examId === ex.id && a.studentId === auth.studentId))
          .map((ex) => ({ ex, msUntilOpen: new Date(ex.scheduledAt as string).getTime() - nowTick }))
          .filter((x) => x.msUntilOpen > 0 && x.msUntilOpen <= 30 * 60 * 1000)
          .sort((a, b) => a.msUntilOpen - b.msUntilOpen)[0];
        if (!upcoming) return null;
        return (
          <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] p-5 text-center">
            <p className="text-sm text-[var(--ink)] font-medium">Test {upcoming.ex.testNumber} — {upcoming.ex.title} opens in</p>
            <p className="font-display text-2xl mt-1 text-[var(--gold)]">{fmtDuration(upcoming.msUntilOpen)}</p>
          </div>
        );
      })()}

      <div className="space-y-4">
        {mine.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No online tests completed yet.</p>}
        {mine.map((a) => {
          const exam = exams.find((e) => e.id === a.examId);
          const pct = a.totalMarks > 0 ? Math.round(((a.score ?? 0) / a.totalMarks) * 100) : 0;
          const passed = exam ? pct >= exam.passingPercent : true;
          const fine = testFines.find((f) => f.attemptId === a.id && !f.waived);
          const submittedMs = a.submittedAt ? new Date(a.submittedAt).getTime() : null;
          const revealMs =
            submittedMs != null && exam ? submittedMs + exam.resultRevealMinutes * 60 * 1000 : null;
          const msUntilReveal = revealMs != null ? revealMs - nowTick : 0;
          const revealed = revealMs == null || msUntilReveal <= 0;

          if (!revealed) {
            return (
              <div key={a.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] flex items-center justify-center shrink-0">
                    <Clock size={17} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{exam ? `Test ${exam.testNumber} — ${exam.title}` : "Untitled test"}</p>
                    <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                      Submitted {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-[var(--ink-soft)]">Result available in</p>
                  <p
                    className={`font-display text-2xl mt-1 ${
                      msUntilReveal <= 15 * 60 * 1000 ? "text-[var(--gold)]" : "text-[var(--heading)]"
                    }`}
                  >
                    {fmtDuration(msUntilReveal)}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={a.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-tint)] text-[var(--link)] flex items-center justify-center shrink-0">
                    <Award size={17} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{exam ? `Test ${exam.testNumber} — ${exam.title}` : "Untitled test"}</p>
                    <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                      Submitted {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                      {exam ? ` · Passing mark: ${exam.passingPercent}%` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl text-[var(--heading)]">{a.score}/{a.totalMarks}</p>
                  <p className="text-xs text-[var(--ink-faint)]">{pct}%</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
                    passed ? "bg-[var(--primary-tint)] text-[var(--link)]" : "bg-[var(--rose-tint)] text-[var(--rose)]"
                  }`}
                >
                  {passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {passed ? "Passed" : "Failed"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink-faint)]">
                  <Clock size={11} />
                  {a.status === "auto_submitted_timeout" ? "Auto-submitted (time up)" : a.status === "auto_submitted_violation" ? "Auto-submitted (violations)" : "Submitted manually"}
                </span>
                {a.violations.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--rose-tint)] text-[var(--rose)]">
                    <ShieldAlert size={11} /> {a.violations.length} violation(s) recorded
                  </span>
                )}
                {fine && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] font-semibold">
                    <Wallet size={11} /> Fine: Rs. {fine.amount} (fail #{fine.streakPosition} this streak)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
