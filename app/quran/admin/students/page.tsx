"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Plus, X, ChevronRight } from "lucide-react";
import { Student } from "@/lib/types";

const statusStyles: Record<Student["status"], string> = {
  active: "bg-[var(--primary-tint)] text-[var(--heading)]",
  warned: "bg-[var(--gold-soft)] text-[var(--gold)]",
  rejected: "bg-[var(--rose-tint)] text-[var(--rose)]",
};

const suggestedLevel: Record<Student["course"], Student["level"]> = {
  "Nurani Qaida": "Beginner",
  "Nazra": "Intermediate",
  "Tajweed": "Intermediate",
  "Qirat": "Advanced",
  "All": "Advanced",
};

export default function AdminStudents() {
  const { students, addStudent } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    parentName: "",
    sections: ["quran"] as Student["sections"],
    course: "Nazra" as Student["course"],
    level: "Intermediate" as Student["level"],
    academyClass: "",
    loginCode: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.loginCode) return;
    if (form.sections.length === 0) return;
    if (form.sections.includes("academy") && !form.academyClass.trim()) return;
    addStudent({ ...form, joinDate: new Date().toISOString().slice(0, 10) });
    setForm({
      name: "",
      parentName: "",
      sections: ["quran"],
      course: "Nazra",
      level: "Intermediate",
      academyClass: "",
      loginCode: "",
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Students</p>
          <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Manage Students</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Add Student"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-[var(--ink)]">Sections</label>
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: "quran" as const, title: "Quran Academy", desc: "Nurani Qaida / Nazra / Tajweed / Qirat" },
                { key: "academy" as const, title: "Main Academy", desc: "Computer, AI, English, etc." },
              ]).map(({ key, title, desc }) => {
                const checked = form.sections.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        sections: checked
                          ? form.sections.filter((s) => s !== key)
                          : [...form.sections, key],
                      })
                    }
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium text-left flex items-start gap-2 ${
                      checked
                        ? "border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--heading)]"
                        : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--primary)]/50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center text-[10px] ${
                        checked ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--line)]"
                      }`}
                    >
                      {checked && "✓"}
                    </span>
                    <span>
                      {title}
                      <span className="block text-xs font-normal text-[var(--ink-faint)] mt-0.5">{desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-[var(--ink-faint)]">
              Same login code either way — select both if this student attends both. Their portal shows
              whichever sections apply: Quran results/audio/progress, and/or Main Academy&apos;s Daily
              Performance and Online Test Results.
            </p>
          </div>

          <TextField label="Student name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <TextField label="Parent name" value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} />

          {form.sections.includes("quran") && (
            <>
              <div>
                <label className="text-sm font-medium text-[var(--ink)]">Course</label>
                <select
                  value={form.course}
                  onChange={(e) => {
                    const course = e.target.value as Student["course"];
                    setForm({ ...form, course, level: suggestedLevel[course] });
                  }}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                >
                  <option>Nurani Qaida</option>
                  <option>Nazra</option>
                  <option>Tajweed</option>
                  <option>Qirat</option>
                  <option>All</option>
                </select>
                <p className="mt-1 text-xs text-[var(--ink-faint)]">
                  {form.course === "Nurani Qaida" && "Result only tracks Nurani Qaida. No online tests."}
                  {form.course === "Nazra" && "Result only tracks Nazra. No online tests."}
                  {form.course === "Tajweed" && "Result only tracks Tajweed."}
                  {form.course === "Qirat" && "Bonus-only — admin enters a single score, no pass/fail."}
                  {form.course === "All" && "Nazra + Tajweed required, Qirat as bonus. Full access."}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--ink)]">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as Student["level"] })}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </>
          )}

          {form.sections.includes("academy") && (
            <div className="sm:col-span-2">
              <TextField
                label="Class"
                value={form.academyClass}
                onChange={(v) => setForm({ ...form, academyClass: v })}
                placeholder="e.g. AI & Chatbots, Basic Computer, 9th Class"
                required
              />
            </div>
          )}

          <TextField
            label="Portal access code"
            value={form.loginCode}
            onChange={(v) => setForm({ ...form, loginCode: v })}
            placeholder="e.g. AHM-104"
            required
          />
          <div className="sm:col-span-2">
            <button className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]">
              Save Student
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] divide-y divide-[var(--line)] overflow-hidden">
        {students.map((s) => (
          <Link
            key={s.id}
            href={`/quran/admin/students/${s.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-[var(--primary-tint)]/40 transition-colors"
          >
            <div>
              <p className="font-medium text-[var(--ink)]">{s.name}</p>
              <p className="text-xs text-[var(--ink-faint)]">
                {[
                  s.sections?.includes("quran") ? `${s.course} · ${s.level}` : null,
                  s.sections?.includes("academy") ? `${s.academyClass} · Main Academy` : null,
                ]
                  .filter(Boolean)
                  .join(" + ")}{" "}
                · code: {s.loginCode}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[s.status]}`}>
                {s.status}
              </span>
              <ChevronRight size={16} className="text-[var(--ink-faint)]" />
            </div>
          </Link>
        ))}
        {students.length === 0 && (
          <p className="text-sm text-[var(--ink-faint)] px-6 py-6">No students yet.</p>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--ink)]">{label}</label>
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}
