"use client";

import { useStore } from "@/lib/store";
import { Megaphone, Pin, User } from "lucide-react";

export default function PortalAnnouncements() {
  const { announcements, auth } = useStore();
  const relevant = announcements.filter(
    (a) => a.audience === "all" || a.audience === auth.studentId
  );
  const sorted = [...relevant].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date)
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Announcements</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Notices for you</h1>
      </div>

      <div className="space-y-4">
        {sorted.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No announcements.</p>}
        {sorted.map((a) => (
          <div key={a.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--primary-tint)] text-[var(--heading)] flex items-center justify-center shrink-0">
                <Megaphone size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[var(--ink)]">{a.title}</h3>
                  {a.pinned && <Pin size={13} className="text-[var(--gold)]" />}
                  {a.audience !== "all" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--link)] bg-[var(--primary-tint)] px-2 py-0.5 rounded-full">
                      <User size={10} /> Just for you
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-faint)] mt-0.5">{a.date}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">{a.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
