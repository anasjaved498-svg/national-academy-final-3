"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Plus, Trash2, Pin } from "lucide-react";

export default function AdminAnnouncements() {
  const { announcements, students, addAnnouncement, deleteAnnouncement } = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [pinned, setPinned] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    addAnnouncement({ title, body, audience, pinned });
    setTitle("");
    setBody("");
    setAudience("all");
    setPinned(false);
  };

  const sorted = [...announcements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date)
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Announcements</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Post an Announcement</h1>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--ink)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Test 4 schedule announced"
            className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--ink)]">Message</label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the announcement..."
            className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All students (public + portal)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} only
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink)] mt-6 sm:mt-7">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-[var(--primary)]" />
            Pin to top
          </label>
        </div>
        <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]">
          <Plus size={15} /> Post Announcement
        </button>
      </form>

      <div className="space-y-3">
        {sorted.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-[var(--ink)]">{a.title}</p>
                {a.pinned && <Pin size={12} className="text-[var(--gold)]" />}
              </div>
              <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                {a.date} · {a.audience === "all" ? "All students" : students.find((s) => s.id === a.audience)?.name ?? "Unknown"}
              </p>
              <p className="text-sm text-[var(--ink-soft)] mt-1.5">{a.body}</p>
            </div>
            <button
              onClick={() => deleteAnnouncement(a.id)}
              className="shrink-0 p-2 rounded-lg text-[var(--rose)] hover:bg-[var(--rose-tint)]"
              aria-label="Delete announcement"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
