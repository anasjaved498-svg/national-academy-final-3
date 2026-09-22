"use client";

import { useEffect } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Section } from "@/lib/types";
import { markSeen } from "@/lib/seenTracker";

const SECTION_LABEL: Record<Section, string> = { quran: "Quran", academy: "Academy" };

export default function PortalFeesPage() {
  const { auth, students, fees } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  const sections = student?.sections ?? [];
  const mine = fees.filter((f) => f.studentId === auth.studentId && sections.includes(f.section)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    if (!auth.studentId) return;
    markSeen("fees", auth.studentId, mine.map((f) => f.id));
    markSeen("features", auth.studentId, ["fees-v1"]);
  }, [auth.studentId, mine.map((f) => f.id).join(",")]);

  const pendingTotal = mine.filter((f) => f.status === "pending").reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-7">
      <div><p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Fees</p><h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Fee Details</h1><p className="text-sm text-[var(--ink-soft)] mt-1">Quran and Academy fees remain separate for students enrolled in both sections.</p></div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs uppercase tracking-wide text-[var(--gold)]">Pending total</p><p className="font-display text-3xl mt-1 text-[var(--heading)]">Rs. {pendingTotal}</p></div>
      <div className="space-y-4">
        {sections.map((section) => {
          const list = mine.filter((f) => f.section === section);
          const total = list.filter((f) => f.status === "pending").reduce((sum, f) => sum + f.amount, 0);
          return <section key={section} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><div className="flex items-center justify-between gap-3 flex-wrap"><h2 className="font-display text-xl text-[var(--heading)]">{SECTION_LABEL[section]} Fees</h2><span className="text-sm font-semibold text-[var(--heading)]">Rs. {total} pending</span></div><div className="mt-4 space-y-2">{list.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No fee entries yet.</p>}{list.map((f) => <div key={f.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3"><div className="flex items-center justify-between gap-3 flex-wrap"><div><p className="font-medium text-[var(--ink)]">{f.title}</p>{f.note && <p className="text-xs text-[var(--ink-soft)] mt-1">{f.note}</p>}</div><p className="font-semibold text-[var(--heading)]">Rs. {f.amount}</p></div><div className="mt-2 flex items-center gap-3 text-xs text-[var(--ink-faint)]"><span className={`inline-flex items-center gap-1 ${f.status === "paid" ? "text-[var(--link)]" : f.status === "waived" ? "text-[var(--gold)]" : "text-[var(--rose)]"}`}>{f.status === "paid" ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{f.status === "paid" ? "Paid" : f.status === "waived" ? "Waived" : "Pending"}</span>{f.dueDate && <span>Due {f.dueDate}</span>}</div></div>)}</div></section>;
        })}
      </div>
    </div>
  );
}
