"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { AlertTriangle, Ban, CheckCircle2, RotateCcw, XCircle, Sparkles, Wallet, Check, Plus, Trash2, Award } from "lucide-react";
import { COURSE_CONFIG, ResultField, Subject, Student } from "@/lib/types";
import { getResultFields } from "@/lib/calculations";
import { newUuid } from "@/lib/id";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    students,
    addResult,
    updateStudent,
    deleteStudent,
    requiredPercentFor,
    criteriaFor,
    rejectStudent,
    reinstateStudent,
    performanceFines,
    testFines,
    waivePerformanceFine,
    waiveTestFine,
    exams,
    attempts,
    getAudioSubmission,
    markAudioHeard,
    rejectStudentFromTests,
    reinstateStudentFromTests,
  } = useStore();
  const student = students.find((s) => s.id === id);

  const nextTestNumber = useMemo(
    () => (student ? Math.max(0, ...student.results.map((r) => r.testNumber)) + 1 : 1),
    [student]
  );

  const [testNumber, setTestNumber] = useState(nextTestNumber);
  const [paperNumber, setPaperNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [resultFields, setResultFields] = useState<ResultField[]>(() =>
    defaultResultFields(student?.sections?.includes("quran") ? student.course : undefined)
  );
  const [qiratBonus, setQiratBonus] = useState(0);
  const [resultSection, setResultSection] = useState<"quran" | "academy">(student?.sections?.includes("quran") ? "quran" : "academy");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(() => initialEditForm(student));

  // Overall + per-subject passing % — replaces the old separate "Passing
  // Criteria" page. Editable right here, right when marks are entered.
  // Subject overrides are strings so the field can be blank ("use the
  // overall %") instead of forcing a number.
  const [overallPercent, setOverallPercent] = useState(30);
  const [subjectOverrides, setSubjectOverrides] = useState<Record<Subject, string>>({
    nuraniQaida: "",
    nazra: "",
    tajweed: "",
  });

  // Pre-fills the passing-% fields above from whatever was already set for
  // this exact test number (so every student entered under Test N sees and
  // uses the same thresholds by default) — falls back to the last-known
  // overall % if nothing has ever been set for this test number yet.
  useEffect(() => {
    const existing = criteriaFor(testNumber);
    setOverallPercent(existing?.requiredPercent ?? requiredPercentFor(testNumber));
    setSubjectOverrides({
      nuraniQaida: existing?.nuraniQaidaPercent != null ? String(existing.nuraniQaidaPercent) : "",
      nazra: existing?.nazraPercent != null ? String(existing.nazraPercent) : "",
      tajweed: existing?.tajweedPercent != null ? String(existing.tajweedPercent) : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testNumber]);

  // BUG FIX: this page is the same component instance across
  // /admin/students/[id] navigations — Next.js does not remount it just
  // because the `id` route param changed. Without this effect, all of the
  // form state above silently carried over from whichever student was
  // viewed previously: the wrong test number, the wrong passing-criteria
  // lookup, even the wrong subject fields for a different course. This
  // resets everything the moment the admin switches to a different
  // student's page.
  useEffect(() => {
    setTestNumber(nextTestNumber);
    setPaperNumber("");
    setDate(new Date().toISOString().slice(0, 10));
    setResultFields(defaultResultFields(student?.sections?.includes("quran") ? student?.course : undefined));
    setQiratBonus(0);
    setResultSection(student?.sections?.includes("quran") ? "quran" : "academy");
    setEditForm(initialEditForm(student));
    setEditing(false);
    // Deliberately keyed on the student id, not nextTestNumber — entering a
    // result for the SAME student should still auto-advance the test number
    // (handled separately after submit), not get reset by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!student) {
    return <p className="text-sm text-[var(--ink-faint)]">Student not found.</p>;
  }

  const config = COURSE_CONFIG[student.course];
  const hasQuran = student.sections?.includes("quran") ?? true;
  const hasAcademy = student.sections?.includes("academy") ?? false;
  const needsNurani = hasQuran && config.requiredSubjects.includes("nuraniQaida");
  const needsNazra = hasQuran && config.requiredSubjects.includes("nazra");
  const needsTajweed = hasQuran && config.requiredSubjects.includes("tajweed");
  const needsQirat = hasQuran && config.showQiratBonus;
  const needsAudio = needsTajweed || needsQirat;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedFields = resultFields
      .map((field) => ({ ...field, name: field.name.trim() }))
      .filter((field) => field.name && field.total > 0);
    if (cleanedFields.length === 0) return;

    // Guard against the exact bug that produced a 107.1% "result": obtained
    // marks greater than the total for that subject. Block the save and
    // tell the admin which field is wrong instead of silently accepting it.
    const overMax = cleanedFields.find((field) => field.obtained > field.total);
    if (overMax) {
      alert(
        `"${overMax.name}" has ${overMax.obtained} obtained out of ${overMax.total} total — obtained marks can't be more than the total. Please fix this field before saving.`
      );
      return;
    }
    if (cleanedFields.some((field) => field.obtained < 0)) {
      alert("Obtained marks can't be negative.");
      return;
    }

    // Any subject override left blank means "use the overall %" — only
    // pass along the ones actually filled in.
    const subjectRequiredPercents: Partial<Record<Subject, number>> = {};
    (["nuraniQaida", "nazra", "tajweed"] as Subject[]).forEach((subj) => {
      const raw = subjectOverrides[subj];
      if (raw.trim() !== "" && Number.isFinite(Number(raw))) {
        subjectRequiredPercents[subj] = Number(raw);
      }
    });

    addResult(student.id, {
      testNumber,
      paperNumber,
      date,
      section: resultSection,
      resultFields: cleanedFields,
      qiratBonus: needsQirat ? qiratBonus : null,
      requiredPercent: overallPercent,
      subjectRequiredPercents,
    });
    setTestNumber(testNumber + 1);
    setPaperNumber("");
    setResultFields(defaultResultFields(hasQuran ? student.course : undefined));
    setQiratBonus(0);
  };

  const addResultField = () => {
    setResultFields((prev) => [
      ...prev,
      { id: newUuid(), name: "New Field", obtained: 0, total: 100 },
    ]);
  };

  const updateResultField = (id: string, patch: Partial<ResultField>) => {
    setResultFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const removeResultField = (id: string) => {
    setResultFields((prev) => prev.filter((field) => field.id !== id));
  };

  const useOnlineTestAsPaper = (score: number, total: number) => {
    setResultFields((prev) => {
      const index = prev.findIndex((field) => field.name.trim().toLowerCase() === "paper");
      if (index >= 0) {
        return prev.map((field, i) => (i === index ? { ...field, obtained: score, total } : field));
      }
      return [{ id: newUuid(), name: "Paper", obtained: score, total }, ...prev];
    });
  };

  const studentAttempts = attempts
    .filter((a) => a.studentId === student.id && a.status !== "in_progress")
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  const sortedResults = [...student.results].sort((a, b) => b.testNumber - a.testNumber);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Student</p>
          <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">{student.name}</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            {[
              hasQuran ? `${student.course} · ${student.level}` : null,
              hasAcademy ? `${student.academyClass} · Main Academy` : null,
            ]
              .filter(Boolean)
              .join(" + ")}{" "}
            · parent: {student.parentName || "—"} · code: {student.loginCode}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm font-medium hover:border-[var(--primary)]"><Sparkles size={14} /> {editing ? "Close Edit" : "Edit Student"}</button>
          <StatusPill status={student.status} />
          <StatusPill status={student.testStatus} label="Tests" />
          {student.status === "rejected" ? (
            <button
              onClick={() => reinstateStudent(student.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm font-medium hover:border-[var(--primary)]"
            >
              <RotateCcw size={14} /> Reinstate
            </button>
          ) : (
            student.consecutiveFails >= 3 && (
              <button
                onClick={() => rejectStudent(student.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--rose)] text-white text-sm font-medium hover:opacity-90"
              >
                <Ban size={14} /> Reject from Portal
              </button>
            )
          )}
          {student.testStatus === "rejected" ? (
            <button
              onClick={() => reinstateStudentFromTests(student.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm font-medium hover:border-[var(--primary)]"
            >
              <RotateCcw size={14} /> Reinstate Tests
            </button>
          ) : (
            student.consecutiveTestFails >= 3 && (
              <button
                onClick={() => rejectStudentFromTests(student.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--rose)] text-white text-sm font-medium hover:opacity-90"
              >
                <Ban size={14} /> Reject Online Tests
              </button>
            )
          )}
        </div>
      </div>

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editForm.name.trim() || editForm.sections.length === 0 || (editForm.sections.includes("academy") && !editForm.academyClass.trim()) || !editForm.loginCode.trim()) return;
            updateStudent(student.id, {
              name: editForm.name.trim(),
              parentName: editForm.parentName.trim(),
              sections: editForm.sections,
              course: editForm.course,
              level: editForm.level,
              academyClass: editForm.academyClass.trim(),
              loginCode: editForm.loginCode.trim(),
            });
            setEditing(false);
          }}
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-[var(--heading)]">Edit Student</h2>
              <p className="text-xs text-[var(--ink-faint)] mt-1">Change the student's section, class, course, or portal code without creating a new account.</p>
            </div>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">Cancel</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Student name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} required />
            <TextField label="Parent name" value={editForm.parentName} onChange={(v) => setEditForm({ ...editForm, parentName: v })} />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Sections</label>
            <div className="mt-2 grid sm:grid-cols-2 gap-3">
              {[
                { key: "quran" as const, title: "Quran Academy" },
                { key: "academy" as const, title: "Main Academy" },
              ].map(({ key, title }) => {
                const checked = editForm.sections.includes(key);
                return (
                  <button key={key} type="button" onClick={() => setEditForm({ ...editForm, sections: checked ? editForm.sections.filter((x) => x !== key) : [...editForm.sections, key] })} className={`rounded-xl border px-4 py-3 text-left text-sm ${checked ? "border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--heading)]" : "border-[var(--line)] text-[var(--ink-soft)]"}`}>
                    {checked ? "✓ " : "○ "}{title}
                  </button>
                );
              })}
            </div>
          </div>
          {editForm.sections.includes("quran") && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--ink)]">Quran course</label>
                <select value={editForm.course} onChange={(e) => setEditForm({ ...editForm, course: e.target.value as typeof editForm.course })} className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm">
                  <option>Nurani Qaida</option><option>Nazra</option><option>Tajweed</option><option>Qirat</option><option>All</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--ink)]">Level</label>
                <select value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value as typeof editForm.level })} className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm">
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
            </div>
          )}
          {editForm.sections.includes("academy") && <TextField label="Main Academy class" value={editForm.academyClass} onChange={(v) => setEditForm({ ...editForm, academyClass: v })} required />}
          <TextField label="Portal access code" value={editForm.loginCode} onChange={(v) => setEditForm({ ...editForm, loginCode: v })} required />
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium"><Check size={14} /> Save Changes</button>
            <button type="button" onClick={() => { if (confirm(`Remove ${student.name} completely? This deletes the student and their linked results, tests, performance, gifts, fees, notes and targeted announcements.`)) { deleteStudent(student.id); router.push("/quran/admin/students"); } }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--rose)]/40 text-[var(--rose)] text-sm font-medium hover:bg-[var(--rose-tint)]"><Trash2 size={14} /> Remove Student</button>
          </div>
        </form>
      )}

      {student.consecutiveFails === 2 && student.status !== "rejected" && (
        <Notice
          icon={<AlertTriangle size={16} className="text-[var(--gold)]" />}
          tone="gold"
          text="This student has 2 consecutive fails. The portal is already showing a warning notice to the parent. A 3rd consecutive fail will let you reject this student from the portal."
        />
      )}
      {student.consecutiveTestFails === 2 && student.testStatus !== "rejected" && (
        <Notice
          icon={<AlertTriangle size={16} className="text-[var(--gold)]" />}
          tone="gold"
          text="This student has failed 2 consecutive online tests. A warning is shown in the student portal. A 3rd consecutive fail requires an admin decision; the system will not reject the student automatically."
        />
      )}
      {student.consecutiveTestFails >= 3 && student.testStatus !== "rejected" && (
        <Notice
          icon={<Ban size={16} className="text-[var(--rose)]" />}
          tone="rose"
          text="This student has failed 3 consecutive online tests. Review the student and use Reject Online Tests only if you decide to reject them."
        />
      )}

      {/* Online test results available to Admin while creating the Complete Result. */}
      {studentAttempts.length > 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-xl text-[var(--heading)]">Online Test Results</h2>
              <p className="text-xs text-[var(--ink-faint)] mt-1">
                Submitted online tests appear here so you can use their marks when preparing the Complete Result.
              </p>
            </div>
            <Award size={20} className="text-[var(--link)]" />
          </div>
          <div className="mt-4 space-y-2">
            {portalAccessForAdminTests(student, studentAttempts, exams).map(({ attempt: a, exam }) => {
              const total = a.totalMarks;
              const score = a.score ?? 0;
              const percent = total > 0 ? Math.round((score / total) * 100) : 0;
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] px-4 py-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      Test {exam?.testNumber ?? "—"}{exam ? ` · ${exam.title}` : ""}
                    </p>
                    <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                      Result: {score}/{total} · {percent}%{a.submittedAt ? ` · ${new Date(a.submittedAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => useOnlineTestAsPaper(score, total)}
                    className="px-4 py-2 rounded-full border border-[var(--primary)] text-[var(--heading)] text-xs font-semibold hover:bg-[var(--primary-tint)]"
                  >
                    Use as Paper Result
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Qirat/Tajweed audio review — listen before entering marks below.
          Only relevant for courses that carry Tajweed marks and/or the
          Qirat bonus; Nurani Qaida / Nazra-only students never submit audio. */}
      {hasQuran && needsAudio && (() => {
        const submission = getAudioSubmission(student.id, testNumber);
        const rows: { kind: "qirat" | "tajweed"; label: string; url: string | null; heard: boolean }[] = [
          { kind: "qirat", label: "Qirat recording", url: submission?.qiratUrl ?? null, heard: submission?.qiratHeard ?? false },
          { kind: "tajweed", label: "Tajweed recording", url: submission?.tajweedUrl ?? null, heard: submission?.tajweedHeard ?? false },
        ];
        const missing = rows.filter((r) => !r.url);
        return (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <h2 className="font-display text-lg text-[var(--heading)]">
              Recitation Audio — Test {testNumber}
            </h2>
            <p className="text-xs text-[var(--ink-faint)] mt-1">
              Listen to both recordings before entering Tajweed marks and the Qirat bonus below.
            </p>
            {missing.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--gold)] bg-[var(--gold-soft)] rounded-xl px-3 py-2">
                <AlertTriangle size={13} />
                Student hasn&apos;t uploaded: {missing.map((m) => m.label).join(", ")} yet.
              </div>
            )}
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {rows.map((r) => (
                <div key={r.kind} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
                  <p className="text-sm font-medium text-[var(--ink)] flex items-center gap-1.5">
                    {r.label}
                    {r.heard && <Check size={13} className="text-[var(--link)]" />}
                  </p>
                  {r.url ? (
                    <>
                      <audio controls src={r.url} className="w-full mt-2" />
                      {!r.heard && (
                        <button
                          type="button"
                          onClick={() => markAudioHeard(student.id, testNumber, r.kind)}
                          className="mt-2 text-xs font-medium text-[var(--link)] hover:underline"
                        >
                          Mark as heard
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[var(--ink-faint)] mt-2">Not uploaded yet.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Add result form */}
      {(hasQuran || hasAcademy) && (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-xl text-[var(--heading)]">Enter Result</h2>
        <p className="text-xs text-[var(--ink-faint)] mt-1">
          {student.course === "Qirat"
            ? "This student's course is bonus-only Qirat — just enter a score below, no pass/fail applies."
            : "Percentage and pass/fail are calculated automatically from the % thresholds below."}
        </p>

        {student.course !== "Qirat" && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4 bg-[var(--bg)] rounded-xl border border-[var(--line)] p-4">
            <div>
              <label className="text-sm font-medium text-[var(--ink)]">
                Overall passing % — Test {testNumber}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={overallPercent}
                onChange={(e) => setOverallPercent(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
              <p className="mt-1 text-xs text-[var(--ink-faint)]">
                Applies to the overall score, and to any subject on the right left blank. Setting
                this saves it for Test {testNumber} — every other student entered under this same
                test number will default to it too.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--ink)]">Per-subject overrides (optional)</p>
              {needsNurani && (
                <SubjectPercentField
                  label="Nurani Qaida"
                  value={subjectOverrides.nuraniQaida}
                  onChange={(v) => setSubjectOverrides((prev) => ({ ...prev, nuraniQaida: v }))}
                />
              )}
              {needsNazra && (
                <SubjectPercentField
                  label="Nazra"
                  value={subjectOverrides.nazra}
                  onChange={(v) => setSubjectOverrides((prev) => ({ ...prev, nazra: v }))}
                />
              )}
              {needsTajweed && (
                <SubjectPercentField
                  label="Tajweed"
                  value={subjectOverrides.tajweed}
                  onChange={(v) => setSubjectOverrides((prev) => ({ ...prev, tajweed: v }))}
                />
              )}
            </div>
          </div>
        )}
        {student.sections.length > 1 && (
          <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <label className="text-sm font-medium text-[var(--ink)]">Result section</label>
            <select
              value={resultSection}
              onChange={(e) => {
                const next = e.target.value as "quran" | "academy";
                setResultSection(next);
                setResultFields(defaultResultFields(next === "quran" ? student.course : undefined));
                setQiratBonus(0);
              }}
              className="mt-1.5 w-full sm:w-72 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm"
            >
              <option value="quran">Quran Academy</option>
              <option value="academy">Main Academy</option>
            </select>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">Choose which section this result belongs to so Quran and Academy records remain separate.</p>
          </div>
        )}
        <form onSubmit={submit} className="mt-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--ink)]">Paper number</label>
              <input
                value={paperNumber}
                onChange={(e) => setPaperNumber(e.target.value)}
                placeholder="e.g. P-2026-04"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--ink)]">Test date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {resultFields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <label className="text-sm font-medium text-[var(--ink)]">Result field {index + 1}</label>
                  <button
                    type="button"
                    onClick={() => removeResultField(field.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-[var(--rose)] hover:bg-[var(--rose-tint)]"
                    aria-label={`Delete ${field.name || "result"} field`}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs text-[var(--ink-faint)]">Field name</label>
                    <input
                      value={field.name}
                      onChange={(e) => updateResultField(field.id, { name: e.target.value })}
                      placeholder="e.g. Paper, Nazra, Viva"
                      className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <NumField
                    label="Obtained marks"
                    value={field.obtained}
                    onChange={(v) => updateResultField(field.id, { obtained: v })}
                    min={0}
                  />
                  <NumField
                    label="Total marks"
                    value={field.total}
                    onChange={(v) => updateResultField(field.id, { total: v })}
                    min={1}
                  />
                </div>
                {field.obtained > field.total && (
                  <p className="mt-2 text-xs text-[var(--rose)] flex items-center gap-1">
                    <AlertTriangle size={12} /> Obtained ({field.obtained}) can&apos;t be more than total ({field.total}).
                  </p>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addResultField}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--line)] text-sm font-medium text-[var(--ink-soft)] hover:border-[var(--primary)] hover:text-[var(--heading)]"
            >
              <Plus size={14} /> Add Result Field
            </button>
          </div>

          {needsQirat && (
            <div>
              <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-1.5 mb-1.5">
                <Sparkles size={14} className="text-[var(--gold)]" /> Qirat bonus score
              </label>
              <p className="text-xs text-[var(--ink-faint)] mb-2">
                Just one number after listening to the audio — no total needed, this only ever adds
                to the overall score.
              </p>
              <input
                type="number"
                min={0}
                step="0.01"
                value={qiratBonus}
                onChange={(e) => setQiratBonus(Number(e.target.value))}
                className="w-40 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
          )}

          <button className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]">
            Save Result
          </button>
        </form>
      </div>
      )}

      {/* Fines */}
      <FinesSection
        studentId={student.id}
        performanceFines={performanceFines.filter((f) => f.studentId === student.id && !f.waived)}
        testFines={testFines.filter((f) => f.studentId === student.id && !f.waived)}
        exams={exams}
        onWaivePerformance={waivePerformanceFine}
        onWaiveTest={waiveTestFine}
      />

      {/* Result history */}
      {(hasQuran || hasAcademy) && (
      <div>
        <h2 className="font-display text-xl text-[var(--heading)] mb-4">Result History</h2>
        <div className="space-y-3">
          {sortedResults.length === 0 && (
            <p className="text-sm text-[var(--ink-faint)]">No results recorded yet.</p>
          )}
          {sortedResults.map((r) => {
            const resultStatus = r.status; // trust the status computed and saved at entry time
            return (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-[var(--ink)]">
                  Test {r.testNumber}{r.paperNumber ? ` · Paper ${r.paperNumber}` : ""}{" "}
                  <span className="text-[var(--ink-faint)] font-normal">· {r.date}</span>
                </p>
                <p className="text-xs text-[var(--ink-faint)]">
                  {getResultFields(r).map((field) => `${field.name} ${field.obtained}/${field.total}`).join(" · ")}
                  {r.qiratBonus != null ? `${getResultFields(r).length ? " · " : ""}Qirat +${r.qiratBonus} (bonus)` : ""}
                  {getResultFields(r).length || r.qiratBonus != null ? " · " : ""}Overall {r.overallObtained}/{r.overallTotal} ({r.overallPercent}%)
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                  resultStatus === "pass" ? "bg-[var(--primary-tint)] text-[var(--heading)]" : "bg-[var(--rose-tint)] text-[var(--rose)]"
                }`}
              >
                {resultStatus === "pass" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {resultStatus === "pass" ? "Pass" : "Fail"}
              </span>
            </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

function SubjectPercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-[var(--ink-faint)] w-24 shrink-0">{label}</label>
      <input
        type="number"
        min={1}
        max={100}
        placeholder="uses overall %"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div>
      <label className="text-xs text-[var(--ink-faint)]">{label}</label>
      <input
        type="number"
        min={min}
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}

function StatusPill({ status, label }: { status: "active" | "warned" | "rejected"; label?: string }) {
  const styles: Record<string, string> = {
    active: "bg-[var(--primary-tint)] text-[var(--heading)]",
    warned: "bg-[var(--gold-soft)] text-[var(--gold)]",
    rejected: "bg-[var(--rose-tint)] text-[var(--rose)]",
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${styles[status]}`}>
      {label ? `${label}: ` : ""}{status}
    </span>
  );
}

function initialEditForm(student?: Student) {
  return {
    name: student?.name ?? "",
    parentName: student?.parentName ?? "",
    sections: (student?.sections ?? ["quran"]) as Student["sections"],
    course: (student?.course ?? "Nazra") as Student["course"],
    level: (student?.level ?? "Intermediate") as Student["level"],
    academyClass: student?.academyClass ?? "",
    loginCode: student?.loginCode ?? "",
  };
}

function defaultResultFields(course?: "Nurani Qaida" | "Nazra" | "Tajweed" | "Qirat" | "All"): ResultField[] {
  if (!course) return [{ id: newUuid(), name: "Paper", obtained: 0, total: 100 }];
  const fields: ResultField[] = [{ id: newUuid(), name: "Paper", obtained: 0, total: 100 }];
  const config = COURSE_CONFIG[course];
  for (const subject of config.requiredSubjects) {
    const name = subject === "nuraniQaida" ? "Nurani Qaida" : subject === "nazra" ? "Nazra" : "Tajweed";
    fields.push({ id: newUuid(), name, obtained: 0, total: 60 });
  }
  return fields;
}

function portalAccessForAdminTests(
  student: { id: string },
  attempts: { id: string; studentId: string; status: string; score: number | null; totalMarks: number; submittedAt: string | null; examId: string }[],
  exams: { id: string; testNumber: number; title: string }[]
) {
  return attempts
    .filter((a) => a.studentId === student.id)
    .map((attempt) => ({ attempt, exam: exams.find((e) => e.id === attempt.examId) }))
    .sort((a, b) => (b.attempt.submittedAt ?? "").localeCompare(a.attempt.submittedAt ?? ""));
}

function Notice({ icon, tone, text }: { icon: React.ReactNode; tone: "gold" | "rose"; text: string }) {
  const bg = tone === "gold" ? "bg-[var(--gold-soft)]" : "bg-[var(--rose-tint)]";
  return (
    <div className={`flex items-start gap-3 rounded-2xl ${bg} p-4`}>
      <div className="mt-0.5">{icon}</div>
      <p className="text-sm text-[var(--ink-soft)]">{text}</p>
    </div>
  );
}

function FinesSection({
  studentId,
  performanceFines,
  testFines,
  exams,
  onWaivePerformance,
  onWaiveTest,
}: {
  studentId: string;
  performanceFines: { id: string; monthKey: string; weekNumber: number; amount: number }[];
  testFines: { id: string; examId: string; streakPosition: number; amount: number }[];
  exams: { id: string; title: string; testNumber: number }[];
  onWaivePerformance: (id: string) => void;
  onWaiveTest: (id: string) => void;
}) {
  const total =
    performanceFines.reduce((s, f) => s + f.amount, 0) + testFines.reduce((s, f) => s + f.amount, 0);
  if (performanceFines.length === 0 && testFines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--rose)]/30 bg-[var(--rose-tint)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-[var(--rose)] flex items-center gap-2">
          <Wallet size={18} /> Pending Fines
        </h2>
        <span className="font-semibold text-[var(--rose)]">Rs. {total}</span>
      </div>
      <div className="mt-4 space-y-2">
        {performanceFines.map((f) => (
          <div key={f.id} className="flex items-center justify-between bg-[var(--surface)] rounded-xl px-4 py-2.5 text-sm">
            <span>Daily Performance · {f.monthKey} · Week {f.weekNumber} — Rs. {f.amount}</span>
            <button
              onClick={() => onWaivePerformance(f.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-dark)]"
            >
              <Check size={12} /> Mark Received
            </button>
          </div>
        ))}
        {testFines.map((f) => {
          const exam = exams.find((e) => e.id === f.examId);
          return (
            <div key={f.id} className="flex items-center justify-between bg-[var(--surface)] rounded-xl px-4 py-2.5 text-sm">
              <span>{exam ? `Test ${exam.testNumber} — ${exam.title}` : "Online Test"} · Fail #{f.streakPosition} — Rs. {f.amount}</span>
              <button
                onClick={() => onWaiveTest(f.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-dark)]"
              >
                <Check size={12} /> Mark Received
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
