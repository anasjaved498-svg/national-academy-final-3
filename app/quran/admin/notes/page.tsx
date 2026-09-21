"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { uploadNoteFile } from "@/lib/db";
import { Plus, Trash2, Pin, Paperclip, Loader2, AlertTriangle } from "lucide-react";
import { Section } from "@/lib/types";

export default function AdminNotes() {
  const { notes, students, addNote, deleteNote } = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [section, setSection] = useState<Section>("quran");
  const [pinned, setPinned] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setError("");
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    if (file) {
      setUploading(true);
      try {
        fileUrl = await uploadNoteFile(file);
        fileName = file.name;
      } catch (err) {
        setUploading(false);
        setError(err instanceof Error ? err.message : "File upload failed — please try again.");
        return;
      }
      setUploading(false);
    }
    addNote({ title, body, audience, section, pinned, fileUrl, fileName });
    setTitle("");
    setBody("");
    setAudience("all");
    setPinned(false);
    setFile(null);
  };

  const sorted = [...notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Notes</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Send a Note</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Separate from Announcements — supports one file attachment (a PDF, image, or worksheet)
          and is scoped to a Quran or Academy section.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--ink)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tajweed rules — revision sheet"
            className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--ink)]">Note</label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the note..."
            className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-1.5">
            <Paperclip size={14} /> Attach a file (optional)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1.5 w-full text-sm text-[var(--ink-soft)] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[var(--primary-tint)] file:text-[var(--heading)]"
          />
          {file && <p className="mt-1 text-xs text-[var(--ink-faint)]">{file.name}</p>}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as Section)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="quran">Quran</option>
              <option value="academy">Academy</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All students in this section</option>
              {students
                .filter((s) => s.sections.includes(section))
                .map((s) => (
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

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--rose)]">
            <AlertTriangle size={13} /> {error}
          </p>
        )}

        <button
          disabled={uploading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)] disabled:opacity-50"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {uploading ? "Uploading..." : "Send Note"}
        </button>
      </form>

      <div className="space-y-3">
        {sorted.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-[var(--ink)]">{n.title}</p>
                {n.pinned && <Pin size={12} className="text-[var(--gold)]" />}
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--heading)] capitalize">
                  {n.section}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                {new Date(n.createdAt).toLocaleDateString()} ·{" "}
                {n.audience === "all" ? "All students" : students.find((s) => s.id === n.audience)?.name ?? "Unknown"}
              </p>
              <p className="text-sm text-[var(--ink-soft)] mt-1.5">{n.body}</p>
              {n.fileUrl && (
                <a
                  href={n.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[var(--link)] hover:underline"
                >
                  <Paperclip size={12} /> {n.fileName ?? "Attached file"}
                </a>
              )}
            </div>
            <button
              onClick={() => deleteNote(n.id)}
              className="shrink-0 p-2 rounded-lg text-[var(--rose)] hover:bg-[var(--rose-tint)]"
              aria-label="Delete note"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No notes sent yet.</p>}
      </div>
    </div>
  );
}
