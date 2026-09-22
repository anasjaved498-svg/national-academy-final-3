"use client";

import { useEffect } from "react";
import { Gift as GiftIcon, Sparkles, CalendarDays } from "lucide-react";
import { useStore } from "@/lib/store";
import { Section } from "@/lib/types";
import { markSeen } from "@/lib/seenTracker";

const SECTION_LABEL: Record<Section, string> = { quran: "Quran", academy: "Academy" };

export default function PortalGiftsPage() {
  const { auth, students, gifts } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  const sections = student?.sections ?? [];
  const mine = gifts.filter((g) => g.studentId === auth.studentId && sections.includes(g.section)).sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));

  useEffect(() => {
    if (!auth.studentId) return;
    markSeen("gifts", auth.studentId, mine.map((g) => g.id));
    markSeen("features", auth.studentId, ["gifts-v1"]);
  }, [auth.studentId, mine.map((g) => g.id).join(",")]);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Rewards</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Gifts & Achievements</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Rewards can be triggered by excellent results, strong weekly performance, or awarded manually by the academy.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((section) => {
          const list = mine.filter((g) => g.section === section);
          return <div key={section} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs uppercase tracking-wide text-[var(--gold)]">{SECTION_LABEL[section]}</p><p className="font-display text-2xl text-[var(--heading)] mt-1">{list.length} reward{list.length === 1 ? "" : "s"}</p></div>;
        })}
      </div>

      <div className="space-y-3">
        {mine.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center"><GiftIcon size={28} className="mx-auto text-[var(--gold)]" /><p className="text-sm text-[var(--ink-soft)] mt-3">No gifts have been awarded yet. Keep working hard — your achievements will appear here.</p></div>}
        {mine.map((g) => (
          <div key={g.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="flex items-start gap-4"><div className="w-11 h-11 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] flex items-center justify-center shrink-0"><GiftIcon size={20} /></div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[var(--ink)]">{g.title}</h3><span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--heading)]">{g.category}</span><span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--ink-faint)]">{SECTION_LABEL[g.section]}</span></div><p className="text-sm text-[var(--ink-soft)] mt-2">{g.reason}</p>{g.description && <p className="text-sm text-[var(--ink-soft)] mt-2">{g.description}</p>}<p className="text-xs text-[var(--ink-faint)] mt-3 flex items-center gap-1.5"><CalendarDays size={12} /> {new Date(g.awardedAt).toLocaleDateString()}</p></div><Sparkles size={18} className="text-[var(--gold)] shrink-0" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
