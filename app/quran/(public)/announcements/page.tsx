"use client";

import { useStore } from "@/lib/store";
import { Megaphone, Pin } from "lucide-react";

export default function AnnouncementsPage() {
  const { announcements } = useStore();
  const publicAnnouncements = announcements.filter((a) => a.audience === "all");
  const sorted = [...publicAnnouncements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Announcements</p>
      <h1 className="font-display text-4xl mt-2 text-[var(--heading)]">Academy notices</h1>
      <p className="mt-3 text-[var(--ink-soft)]">Updates and notices posted by the academy.</p>

      <div className="mt-10 space-y-4">
        {sorted.length === 0 && (
          <p className="text-sm text-[var(--ink-faint)]">No announcements yet.</p>
        )}
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
