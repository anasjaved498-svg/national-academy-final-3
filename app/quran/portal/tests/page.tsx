"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { ClipboardList, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
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

export default function TestsPage() {
  const { exams, attempts, auth, students } = useStore();
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
  const published = exams.filter((e) => e.isPublished && studentSections.includes(e.section));
  const visible = hasBoth ? published.filter((e) => e.section === activeSection) : published;

  if (student && !portalAccess(student).showTests) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Online Tests</p>
        <p className="text-sm text-[var(--ink-faint)]">
          Online tests aren't part of the {student.course} course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Online Tests</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Available Tests</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Each test can be attempted once. It's timed, and switching tabs or leaving fullscreen is recorded.
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
              {SECTION_LABEL[s]} Tests
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {visible.length === 0 && (
          <p className="text-sm text-[var(--ink-faint)]">No tests available right now.</p>
        )}
        {visible.map((ex) => {
          const attempt = attempts.find((a) => a.examId === ex.id && a.studentId === auth.studentId);
          const scheduledMs = ex.scheduledAt ? new Date(ex.scheduledAt).getTime() : null;
          const msUntilOpen = scheduledMs != null ? scheduledMs - nowTick : 0;
          const isLocked = !attempt && scheduledMs != null && msUntilOpen > 0;
          const showCountdown = isLocked && msUntilOpen <= 30 * 60 * 1000;

          return (
            <div key={ex.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-[var(--primary-tint)] text-[var(--link)] flex items-center justify-center shrink-0">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink)]"><span className="text-[var(--gold)]">Test {ex.testNumber} ·</span> {ex.title}</p>
                  <p className="text-xs text-[var(--ink-faint)] mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock size={11} /> {ex.durationMinutes} min</span>
                    <span>{ex.questions.length} questions</span>
                    <span className="flex items-center gap-1"><ShieldAlert size={11} /> max {ex.maxViolations} violations</span>
                  </p>
                  {isLocked && (
                    <p className={`text-xs mt-1.5 font-semibold ${showCountdown ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"}`}>
                      {showCountdown
                        ? `Opens in ${fmtDuration(msUntilOpen)}`
                        : `Opens at ${new Date(scheduledMs as number).toLocaleString()}`}
                    </p>
                  )}
                </div>
              </div>

              {attempt ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--primary-tint)] text-[var(--link)]">
                  <CheckCircle2 size={13} /> {attempt.status === "in_progress" ? "In progress" : "Completed"}
                </span>
              ) : (
                <Link
                  href={`/quran/portal/tests/${ex.id}`}
                  className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]"
                >
                  {isLocked ? "View" : "Start Test"}
                </Link>
              )}
              {attempt?.status === "in_progress" && (
                <Link
                  href={`/quran/portal/tests/${ex.id}`}
                  className="px-5 py-2.5 rounded-full border border-[var(--line)] text-sm font-medium hover:border-[var(--primary)]"
                >
                  Resume
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
