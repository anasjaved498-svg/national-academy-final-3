"use client";

import { useStore } from "@/lib/store";
import { Wallet, AlertTriangle, Activity, ClipboardList } from "lucide-react";
import { Section } from "@/lib/types";

const SECTION_LABEL: Record<Section, string> = { quran: "Quran", academy: "Academy" };

export default function FinesPage() {
  const { auth, students, performanceFines, testFines, exams } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  const sections = student?.sections ?? ["quran"];
  const hasBoth = sections.length > 1;

  const myPerfFines = performanceFines.filter((f) => f.studentId === auth.studentId && !f.waived);
  const myTestFines = testFines.filter((f) => f.studentId === auth.studentId && !f.waived);

  // Test fines inherit their section from the exam they belong to.
  const testFineSection = (f: (typeof myTestFines)[number]): Section =>
    exams.find((e) => e.id === f.examId)?.section ?? "quran";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Fines</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Your Pending Fines</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          These clear automatically once the academy marks them as received.
          {hasBoth && " Quran and Academy fines are tracked separately below."}
        </p>
      </div>

      {hasBoth ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map((section) => {
            const sectionPerf = myPerfFines.filter((f) => f.section === section);
            const sectionTest = myTestFines.filter((f) => testFineSection(f) === section);
            const amount =
              sectionPerf.reduce((sum, f) => sum + f.amount, 0) +
              sectionTest.reduce((sum, f) => sum + f.amount, 0);
            return (
              <div
                key={section}
                className="rounded-2xl bg-[var(--primary)] text-white p-5 sm:p-6 flex items-center justify-between min-w-0"
              >
                <div className="min-w-0">
                  <p className="text-xs text-white/70 uppercase tracking-wide">{SECTION_LABEL[section]} Fines</p>
                  <p className="font-display text-2xl sm:text-3xl mt-1 truncate">Rs. {amount}</p>
                </div>
                <Wallet size={28} className="opacity-80 shrink-0 ml-4" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--primary)] text-white p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">Total pending</p>
            <p className="font-display text-2xl sm:text-3xl mt-1">
              Rs. {myPerfFines.reduce((s, f) => s + f.amount, 0) + myTestFines.reduce((s, f) => s + f.amount, 0)}
            </p>
          </div>
          <Wallet size={28} className="opacity-80 shrink-0" />
        </div>
      )}

      {(myPerfFines.length === 0 && myTestFines.length === 0) && (
        <p className="text-sm text-[var(--ink-faint)]">No pending fines. You're all clear.</p>
      )}

      {sections.map((section) => {
        const perfFines = myPerfFines.filter((f) => f.section === section);
        const testFinesForSection = myTestFines.filter((f) => testFineSection(f) === section);
        if (perfFines.length === 0 && testFinesForSection.length === 0) return null;

        const sectionTotal =
          perfFines.reduce((s, f) => s + f.amount, 0) + testFinesForSection.reduce((s, f) => s + f.amount, 0);

        return (
          <div key={section} className="space-y-4">
            {hasBoth && (
              <h2 className="font-display text-lg text-[var(--heading)] flex items-center gap-2">
                {SECTION_LABEL[section]} Fines
                <span className="text-sm font-normal text-[var(--ink-faint)]">Rs. {sectionTotal}</span>
              </h2>
            )}

            {perfFines.length > 0 && (
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2 text-sm">
                  <Activity size={15} className="text-[var(--link)]" /> Daily Performance Fines
                </h3>
                <div className="space-y-2">
                  {perfFines.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-tint)] px-5 py-3 text-sm"
                    >
                      <span className="text-[var(--ink)]">
                        {f.monthKey} · Week {f.weekNumber} below target
                      </span>
                      <span className="font-semibold text-[var(--rose)]">Rs. {f.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testFinesForSection.length > 0 && (
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2 text-sm">
                  <ClipboardList size={15} className="text-[var(--link)]" /> Online Test Fines
                </h3>
                <div className="space-y-2">
                  {testFinesForSection.map((f) => {
                    const exam = exams.find((e) => e.id === f.examId);
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-tint)] px-5 py-3 text-sm"
                      >
                        <span className="text-[var(--ink)]">
                          {exam?.title ?? "Test"} · Fail #{f.streakPosition}
                        </span>
                        <span className="font-semibold text-[var(--rose)]">Rs. {f.amount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <p className="flex items-start gap-2 text-xs text-[var(--ink-faint)] bg-[var(--primary-tint)] rounded-xl px-4 py-3">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        Please pay in person at the academy — the admin marks fines as received once payment is made.
      </p>
    </div>
  );
}
