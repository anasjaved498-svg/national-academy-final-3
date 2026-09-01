"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Users, AlertTriangle, Ban, Megaphone } from "lucide-react";

export default function AdminDashboard() {
  const { students, announcements } = useStore();

  const active = students.filter((s) => s.status === "active").length;
  const warned = students.filter((s) => s.status === "warned").length;
  const rejected = students.filter((s) => s.status === "rejected").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Admin</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Academy Overview</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard icon={<Users size={17} />} label="Total students" value={String(students.length)} />
        <StatCard icon={<Users size={17} />} label="In good standing" value={String(active)} />
        <StatCard icon={<AlertTriangle size={17} />} label="Warned" value={String(warned)} tone="gold" />
        <StatCard icon={<Ban size={17} />} label="Rejected" value={String(rejected)} tone="rose" />
      </div>

      {warned > 0 && (
        <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] p-5">
          <p className="font-semibold text-[var(--heading)] flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--gold)]" /> Students needing attention
          </p>
          <div className="mt-3 space-y-2">
            {students
              .filter((s) => s.status === "warned")
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/quran/admin/students/${s.id}`}
                  className="flex items-center justify-between text-sm bg-[var(--surface)] rounded-lg px-4 py-2.5 hover:shadow-sm"
                >
                  <span className="font-medium text-[var(--ink)]">{s.name}</span>
                  <span className="text-xs text-[var(--rose)]">
                    {s.consecutiveFails} consecutive fails
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          href="/quran/admin/students"
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-full bg-[var(--primary-tint)] text-[var(--heading)] flex items-center justify-center">
            <Users size={18} />
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">Manage Students</p>
            <p className="text-sm text-[var(--ink-soft)]">Add students, enter results</p>
          </div>
        </Link>
        <Link
          href="/quran/admin/announcements"
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-full bg-[var(--primary-tint)] text-[var(--heading)] flex items-center justify-center">
            <Megaphone size={18} />
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">Post Announcement</p>
            <p className="text-sm text-[var(--ink-soft)]">{announcements.length} posted so far</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "gold" | "rose";
}) {
  const tones: Record<string, string> = {
    primary: "bg-[var(--primary-tint)] text-[var(--heading)]",
    gold: "bg-[var(--gold-soft)] text-[var(--gold)]",
    rose: "bg-[var(--rose-tint)] text-[var(--rose)]",
  };
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tones[tone]}`}>{icon}</div>
      <p className="font-display text-2xl mt-3 text-[var(--heading)]">{value}</p>
      <p className="text-xs text-[var(--ink-faint)] mt-1">{label}</p>
    </div>
  );
}
