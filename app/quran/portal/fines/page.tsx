"use client";

import { useStore } from "@/lib/store";
import { Wallet, AlertTriangle, Activity, ClipboardList, HandCoins } from "lucide-react";
import { Section } from "@/lib/types";

const SECTION_LABEL: Record<Section, string> = { quran: "Quran", academy: "Academy" };

export default function FinesPage() {
  const { auth, students, performanceFines, testFines, manualFines, exams } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  const sections = student?.sections ?? ["quran"];
  const hasBoth = sections.length > 1;

  const myPerfFines = performanceFines.filter((f) => f.studentId === auth.studentId && !f.waived);
  const myTestFines = testFines.filter((f) => f.studentId === auth.studentId && !f.waived);
  const myManualFines = manualFines.filter((f) => f.studentId === auth.studentId && f.status === "pending");

  const testFineSection = (f: (typeof myTestFines)[number]): Section =>
    exams.find((e) => e.id === f.examId)?.section ?? "quran";

  const pendingTotal = (section: Section) => {
    const perf = myPerfFines.filter((f) => f.section === section).reduce((s, f) => s + f.amount, 0);
    const test = myTestFines.filter((f) => testFineSection(f) === section).reduce((s, f) => s + f.amount, 0);
    const manual = myManualFines.filter((f) => f.section === section).reduce((s, f) => s + f.amount, 0);
    return perf + test + manual;
  };

  const grandTotal = sections.reduce((sum, section) => sum + pendingTotal(section), 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Fines</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Your Pending Fines</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Automatic and manually added fines are shown here. {hasBoth && "Quran and Academy fines are tracked separately."}
        </p>
      </div>

      {hasBoth ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map((section) => (
            <div
              key={section}
              className="rounded-2xl bg-[var(--primary)] text-white p-5 sm:p-6 flex items-center justify-between min-w-0"
            >
              <div className="min-w-0">
                <p className="text-xs text-white/70 uppercase tracking-wide">{SECTION_LABEL[section]} Fines</p>
                <p className="font-display text-2xl sm:text-3xl mt-1 truncate">Rs. {pendingTotal(section)}</p>
              </div>
              <Wallet size={28} className="opacity-80 shrink-0 ml-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--primary)] text-white p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">Total pending</p>
            <p className="font-display text-2xl sm:text-3xl mt-1">Rs. {grandTotal}</p>
          </div>
          <Wallet size={28} className="opacity-80 shrink-0" />
        </div>
      )}

      {grandTotal === 0 && <p className="text-sm text-[var(--ink-faint)]">No pending fines. You're all clear.</p>}

      {sections.map((section) => {
        const perfFines = myPerfFines.filter((f) => f.section === section);
        const testFinesForSection = myTestFines.filter((f) => testFineSection(f) === section);
        const manualFinesForSection = myManualFines.filter((f) => f.section === section);
        if (perfFines.length === 0 && testFinesForSection.length === 0 && manualFinesForSection.length === 0) return null;

        return (
          <div key={section} className="space-y-4">
            {hasBoth && (
              <h2 className="font-display text-lg text-[var(--heading)] flex items-center gap-2">
                {SECTION_LABEL[section]} Fines
                <span className="text-sm font-normal text-[var(--ink-faint)]">Rs. {pendingTotal(section)}</span>
              </h2>
            )}

            {perfFines.length > 0 && (
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2 text-sm">
                  <Activity size={15} className="text-[var(--link)]" /> Daily Performance Fines
                </h3>
                <div className="space-y-2">
                  {perfFines.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-tint)] px-5 py-3 text-sm">
                      <span className="text-[var(--ink)]">{f.monthKey} · Week {f.weekNumber} below target</span>
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
                      <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-tint)] px-5 py-3 text-sm">
                        <span className="text-[var(--ink)]">{exam?.title ?? "Test"} · Fail #{f.streakPosition}</span>
                        <span className="font-semibold text-[var(--rose)]">Rs. {f.amount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {manualFinesForSection.length > 0 && (
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2 text-sm">
                  <HandCoins size={15} className="text-[var(--link)]" /> Manual Fines
                </h3>
                <div className="space-y-2">
                  {manualFinesForSection.map((f) => (
                    <div key={f.id} className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-tint)] px-5 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-[var(--ink)]">Rs. {f.amount}</span>
                        <span className="text-xs text-[var(--rose)] font-semibold">Pending</span>
                      </div>
                      <p className="text-xs text-[var(--ink-soft)] mt-1">{f.reason}</p>
                      <p className="text-[11px] text-[var(--ink-faint)] mt-1">Date: {f.fineDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <p className="flex items-start gap-2 text-xs text-[var(--ink-faint)] bg-[var(--primary-tint)] rounded-xl px-4 py-3">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        Please pay in person at the academy. The admin marks a fine as received once payment is made.
      </p>
    </div>
  );
}
