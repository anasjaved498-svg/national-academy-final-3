"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import ArchFrame from "@/components/ArchFrame";
import WarningBanner from "@/components/WarningBanner";
import { FileText, LineChart, TrendingUp, CalendarCheck } from "lucide-react";

export default function PortalDashboard() {
  const { students, auth } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  if (!student) return null;

  const latest = [...student.results].sort((a, b) => b.testNumber - a.testNumber)[0];

  return (
    <div className="space-y-8">
      <WarningBanner student={student} />

      <div className="rounded-2xl bg-[var(--primary)] text-white p-8 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/70">Dear Parent / Student</p>
          <h1 className="font-display text-2xl mt-1">{student.name}&rsquo;s Overview</h1>
          <p className="text-sm text-white/80 mt-1">
            Enrolled in {student.course} · {student.level} level
          </p>
        </div>
        <ArchFrame tone="gold" className="w-16 h-20 shrink-0">
          <span className="font-display text-2xl">{student.name[0]}</span>
        </ArchFrame>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <SummaryCard
          icon={<FileText size={17} />}
          label="Latest overall %"
          value={latest ? `${latest.overallPercent}%` : "—"}
          tone={latest?.status === "fail" ? "rose" : "primary"}
        />
        <SummaryCard
          icon={<TrendingUp size={17} />}
          label="Tests recorded"
          value={String(student.results.length)}
        />
        <SummaryCard
          icon={<CalendarCheck size={17} />}
          label="Consecutive fails"
          value={String(student.consecutiveFails)}
          tone={student.consecutiveFails >= 2 ? "rose" : "primary"}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          href="/quran/portal/results"
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-full bg-[var(--primary-tint)] text-[var(--heading)] flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">View Results</p>
            <p className="text-sm text-[var(--ink-soft)]">Full report cards, test by test</p>
          </div>
        </Link>
        <Link
          href="/quran/portal/progress"
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-full bg-[var(--primary-tint)] text-[var(--heading)] flex items-center justify-center">
            <LineChart size={18} />
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">View Progress</p>
            <p className="text-sm text-[var(--ink-soft)]">Graphs of Nazra & Tajweed over time</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "rose";
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          tone === "rose" ? "bg-[var(--rose-tint)] text-[var(--rose)]" : "bg-[var(--primary-tint)] text-[var(--heading)]"
        }`}
      >
        {icon}
      </div>
      <p className={`font-display text-2xl mt-3 ${tone === "rose" ? "text-[var(--rose)]" : "text-[var(--heading)]"}`}>
        {value}
      </p>
      <p className="text-xs text-[var(--ink-faint)] mt-1">{label}</p>
    </div>
  );
}
