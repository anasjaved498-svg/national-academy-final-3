"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { StickyNote, Pin, User, Paperclip } from "lucide-react";
import { markSeen } from "@/lib/seenTracker";

export default function PortalNotes() {
  const { notes, students, auth } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  const mySections = student?.sections ?? [];

  const relevant = notes.filter(
    (n) => (n.audience === "all" || n.audience === auth.studentId) && mySections.includes(n.section)
  );
  const sorted = [...relevant].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)
  );

  useEffect(() => {
    if (auth.studentId) markSeen("notes", auth.studentId, relevant.map((n) => n.id));
    // Only re-run when the set of relevant notes actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.studentId, relevant.map((n) => n.id).join(",")]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Notes</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Notes for you</h1>
      </div>

      <div className="space-y-4">
        {sorted.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No notes yet.</p>}
        {sorted.map((n) => (
          <div key={n.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--primary-tint)] text-[var(--heading)] flex items-center justify-center shrink-0">
                <StickyNote size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[var(--ink)]">{n.title}</h3>
                  {n.pinned && <Pin size={13} className="text-[var(--gold)]" />}
                  {n.audience !== "all" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--link)] bg-[var(--primary-tint)] px-2 py-0.5 rounded-full">
                      <User size={10} /> Just for you
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">{n.body}</p>
                {n.fileUrl && (
                  <a
                    href={n.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full border border-[var(--primary)] text-xs font-semibold text-[var(--heading)] hover:bg-[var(--primary-tint)]"
                  >
                    <Paperclip size={12} /> {n.fileName ?? "Open attachment"}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
