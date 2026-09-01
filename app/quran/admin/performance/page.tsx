"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { buildMonthSummary, currentMonthKey, RATING_LABEL } from "@/lib/performance";
import { DailyRating, Section } from "@/lib/types";
import { CheckCircle2, Minus, XCircle, Wallet } from "lucide-react";

const RATING_OPTIONS: { value: DailyRating; label: string; icon: React.ReactNode; tone: string }[] = [
  { value: "excellent", label: "Excellent", icon: <CheckCircle2 size={14} />, tone: "bg-[var(--primary)] text-white" },
  { value: "average", label: "Average", icon: <Minus size={14} />, tone: "bg-[var(--gold-soft)] text-[var(--gold)]" },
  { value: "not_good", label: "Not Good", icon: <XCircle size={14} />, tone: "bg-[var(--rose-tint)] text-[var(--rose)]" },
];

const SECTION_LABEL: Record<Section, string> = { quran: "Quran", academy: "Academy" };

export default function AdminPerformance() {
  const { students, dailyRatings, setDailyRating, recordPerformanceFine, performanceFines } = useStore();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [section, setSection] = useState<Section>("quran");
  const monthKey = currentMonthKey();

  const student = students.find((s) => s.id === studentId);
  const studentSections = student?.sections ?? ["quran"];
  // If the student only has one section, that's the only valid choice — ignore any stale
  // selection left over from a previously-picked student who had both.
  const activeSection: Section = studentSections.includes(section) ? section : studentSections[0];

  const myEntries = dailyRatings.filter(
    (e) => e.studentId === studentId && e.section === activeSection && e.date.startsWith(monthKey)
  );
  const summary = useMemo(() => buildMonthSummary(monthKey, myEntries), [monthKey, myEntries]);

  const existingFineWeeks = new Set(
    performanceFines
      .filter((f) => f.studentId === studentId && f.section === activeSection && f.monthKey === monthKey)
      .map((f) => f.weekNumber)
  );

  const rate = (rating: DailyRating) => {
    if (!studentId) return;
    setDailyRating(studentId, date, activeSection, rating);
  };

  // Whenever the computed summary shows a newly-fined week we haven't recorded yet, record it.
  const syncFines = () => {
    summary.weeks.forEach((w) => {
      if (w.fined && !existingFineWeeks.has(w.weekNumber)) {
        recordPerformanceFine({
          studentId,
          section: activeSection,
          monthKey,
          weekNumber: w.weekNumber,
          amount: w.fineAmount,
          waived: false,
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Performance</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Daily Performance Rating</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed max-w-2xl">
          Rate each student's day. Quran and Academy are tracked completely separately for students
          enrolled in both — this drives their monthly performance graph for whichever section you pick
          below. A week that ends below the red line is fined automatically (Rs. 50/70/90/100, escalating
          per offense this month, per section). Resets on the 1st of each month.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              {students.length === 0 && <option value="">No students yet</option>}
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {student && studentSections.length > 1 && (
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Rating for which section?</label>
            <div className="mt-1.5 flex gap-2">
              {studentSections.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSection(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${
                    activeSection === s
                      ? "border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--heading)]"
                      : "border-[var(--line)] text-[var(--ink-soft)]"
                  }`}
                >
                  {SECTION_LABEL[s]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              {student.name} is enrolled in both — Quran and Academy performance are rated and fined
              independently, so pick which one today's rating is for.
            </p>
          </div>
        )}

        {student && (
          <div>
            <p className="text-sm font-medium text-[var(--ink)] mb-2">
              {SECTION_LABEL[activeSection]} rating for {student.name} — {date}
              {myEntries.find((e) => e.date === date) && (
                <span className="ml-2 text-xs text-[var(--link)]">
                  (currently: {RATING_LABEL[myEntries.find((e) => e.date === date)!.rating]})
                </span>
              )}
            </p>
            <div className="flex gap-3 flex-wrap">
              {RATING_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    rate(r.value);
                    setTimeout(syncFines, 0);
                  }}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-transparent hover:opacity-90 ${r.tone}`}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {student && (
        <div>
          <h2 className="font-display text-xl text-[var(--heading)] mb-4">
            {student.name} — {SECTION_LABEL[activeSection]} — {monthKey} Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summary.weeks.map((w) => (
              <div
                key={w.weekNumber}
                className={`rounded-xl border p-4 ${
                  w.fined ? "border-[var(--rose)]/40 bg-[var(--rose-tint)]" : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                <p className="text-xs text-[var(--ink-faint)]">Week {w.weekNumber}</p>
                <p className="font-display text-2xl mt-1 text-[var(--heading)]">{w.score}</p>
                <p className="text-xs text-[var(--ink-faint)] mt-1">{w.dailyScores.length} ratings entered</p>
                {w.fined && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--rose)]">
                    <Wallet size={12} /> Fine: Rs. {w.fineAmount}
                  </p>
                )}
                {w.recoveredBeforeWeekEnd && (
                  <p className="mt-2 text-xs text-[var(--link)]">Recovered before week end — no fine</p>
                )}
              </div>
            ))}
          </div>
          {summary.totalFines > 0 && (
            <p className="mt-3 text-sm text-[var(--rose)] font-medium">
              Total {SECTION_LABEL[activeSection]} fines this month: Rs. {summary.totalFines}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
