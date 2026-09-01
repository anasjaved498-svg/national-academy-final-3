"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useStore } from "@/lib/store";
import { Upload, Eye, EyeOff, Trash2, FileCheck2, AlertCircle } from "lucide-react";
import { Section } from "@/lib/types";

interface ParsedQuestion {
  text: string;
  options: { text: string; isCorrect: boolean }[];
}

export default function AdminTests() {
  const { exams, students, attempts, addExam, togglePublish, deleteExam } = useStore();

  const nextTestNumber = Math.max(0, ...exams.map((e) => e.testNumber ?? 0)) + 1;

  const [title, setTitle] = useState("");
  const [section, setSection] = useState<Section>("quran");
  const [testNumber, setTestNumber] = useState(nextTestNumber);
  const [instructionsEn, setInstructionsEn] = useState(
    "Read each question carefully and select one answer. You can change your answer any time before submitting by selecting a different option and pressing Save. Do not switch tabs, exit fullscreen, or copy content during the test — doing so is recorded and may auto-submit your test."
  );
  const [instructionsUr, setInstructionsUr] = useState(
    "ہر سوال کو غور سے پڑھیں اور ایک جواب منتخب کریں۔ آپ سیو (Save) کر کے جمع کروانے سے پہلے جتنی بار چاہیں جواب تبدیل کر سکتے ہیں۔ ٹیسٹ کے دوران ٹیب تبدیل کرنا، فل سکرین سے باہر آنا، یا کاپی کرنا ریکارڈ ہوتا ہے اور آپ کا ٹیسٹ خودکار طور پر جمع ہو سکتا ہے۔"
  );
  const [duration, setDuration] = useState(5);
  const [maxViolations, setMaxViolations] = useState(3);
  const [passingPercent, setPassingPercent] = useState(50);
  const [scheduledAt, setScheduledAt] = useState(""); // datetime-local string, "" = open immediately
  const [resultRevealMinutes, setResultRevealMinutes] = useState(60);
  const [parsed, setParsed] = useState<ParsedQuestion[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File) => {
    setParseError("");
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          const rows = result.data as Record<string, string>[];
          const questions: ParsedQuestion[] = rows.map((row, idx) => {
            const required = ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option"];
            for (const key of required) {
              if (!row[key] || !row[key].trim()) {
                throw new Error(`Row ${idx + 2}: missing "${key}"`);
              }
            }
            const correct = row.correct_option.trim().toUpperCase();
            if (!["A", "B", "C", "D"].includes(correct)) {
              throw new Error(`Row ${idx + 2}: correct_option must be A, B, C or D`);
            }
            const letters = ["A", "B", "C", "D"];
            return {
              text: row.question_text.trim(),
              options: letters.map((l) => ({
                text: row[`option_${l.toLowerCase()}`].trim(),
                isCorrect: l === correct,
              })),
            };
          });
          if (questions.length === 0) throw new Error("No questions found in the file.");
          setParsed(questions);
        } catch (err) {
          setParsed(null);
          setParseError(err instanceof Error ? err.message : "Could not parse file.");
        }
      },
      error: (err) => setParseError(err.message),
    });
  };

  const create = () => {
    if (!title || !parsed) return;
    addExam({
      title,
      section,
      testNumber,
      instructionsEn,
      instructionsUr,
      durationMinutes: duration,
      maxViolations,
      passingPercent,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      resultRevealMinutes,
      questions: parsed,
    });
    setTitle("");
    setTestNumber(testNumber + 1);
    setParsed(null);
    setFileName("");
    setScheduledAt("");
    setResultRevealMinutes(60);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Online Tests</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Create MCQ Test</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed max-w-2xl">
          Prepare questions in a spreadsheet, save as CSV, and upload here. Once published, the
          test appears on the student portal with a timer and anti-cheat protections.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-[var(--ink)]">Section</label>
          <div className="mt-1.5 flex gap-2">
            {(["quran", "academy"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  section === s
                    ? "border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--heading)]"
                    : "border-[var(--line)] text-[var(--ink-soft)]"
                }`}
              >
                {s === "quran" ? "Quran" : "Academy"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--ink-faint)]">
            Only students enrolled in this section will see the test — for a student enrolled in
            both, it appears under their {section === "quran" ? "Quran" : "Academy"} tab.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Test title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tajweed Basics — Quiz 1"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Test number</label>
            <input
              type="number"
              min={1}
              value={testNumber}
              onChange={(e) => setTestNumber(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              Shown to students and on attempts below so you can tell this online test apart from
              paper Test {testNumber}. Auto-filled with the next number, but you can change it.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--ink)]">Duration (min)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--ink)]">Max violations</label>
              <input
                type="number"
                min={1}
                value={maxViolations}
                onChange={(e) => setMaxViolations(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--ink)]">Passing %</label>
              <input
                type="number"
                min={1}
                max={100}
                value={passingPercent}
                onChange={(e) => setPassingPercent(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">
              Test opens at <span className="text-[var(--ink-faint)] font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              Students see a countdown starting 30 minutes before this time and can&apos;t start early. Leave
              blank to let the test open as soon as it&apos;s published.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Reveal result after (minutes)</label>
            <input
              type="number"
              min={0}
              value={resultRevealMinutes}
              onChange={(e) => setResultRevealMinutes(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              After submitting, students see a countdown instead of their score until this much time has
              passed (default 60 = 1 hour). Set to 0 to reveal instantly.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Instructions (English)</label>
            <textarea
              rows={4}
              value={instructionsEn}
              onChange={(e) => setInstructionsEn(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Instructions (Urdu)</label>
            <textarea
              rows={4}
              dir="rtl"
              value={instructionsUr}
              onChange={(e) => setInstructionsUr(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] font-arabic"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--ink)]">Upload paper + answer key (CSV)</label>
          <p className="text-xs text-[var(--ink-faint)] mt-1 mb-1.5">
            One file, one upload — the <code>correct_option</code> column in your CSV IS the
            answer key. There's no separate answer-key step: once a student submits, their
            answers are matched against this file automatically and scored for you. You never
            need to check a paper by hand.
          </p>
          <label className="mt-1.5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)] px-4 py-6 text-sm text-[var(--ink-faint)] cursor-pointer hover:border-[var(--primary)]">
            <Upload size={16} />
            {fileName || "Click to choose a .csv file"}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
          {parseError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--rose)]">
              <AlertCircle size={13} /> {parseError}
            </p>
          )}
          {parsed && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--link)]">
              <FileCheck2 size={13} /> {parsed.length} questions parsed successfully.
            </p>
          )}
        </div>

        <button
          disabled={!title || !parsed}
          onClick={create}
          className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create Test (unpublished)
        </button>
      </div>

      {/* Existing tests */}
      <div>
        <h2 className="font-display text-xl text-[var(--heading)] mb-4">Your Tests</h2>
        <div className="space-y-3">
          {exams.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No tests created yet.</p>}
          {exams.map((ex) => {
            const examAttempts = attempts.filter((a) => a.examId === ex.id);
            return (
              <div key={ex.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      <span className="text-[var(--gold)]">Test {ex.testNumber} ·</span> {ex.title}
                    </p>
                    <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                      {ex.questions.length} questions · {ex.durationMinutes} min · max {ex.maxViolations} violations · pass {ex.passingPercent}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        ex.isPublished ? "bg-[var(--primary-tint)] text-[var(--link)]" : "bg-[var(--gold-soft)] text-[var(--gold)]"
                      }`}
                    >
                      {ex.isPublished ? "Published" : "Draft"}
                    </span>
                    <button
                      onClick={() => togglePublish(ex.id, !ex.isPublished)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--line)] text-xs font-medium hover:border-[var(--primary)]"
                    >
                      {ex.isPublished ? <EyeOff size={12} /> : <Eye size={12} />}
                      {ex.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => deleteExam(ex.id)}
                      className="p-1.5 rounded-full text-[var(--rose)] hover:bg-[var(--rose-tint)]"
                      aria-label="Delete test"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {examAttempts.length > 0 && (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wide mb-2">
                      Attempts ({examAttempts.length})
                    </p>
                    <div className="space-y-1.5">
                      {examAttempts.map((a) => {
                        const student = students.find((s) => s.id === a.studentId);
                        return (
                          <div key={a.id} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--ink-soft)]">{student?.name ?? "Unknown"}</span>
                            <span className="text-[var(--ink-faint)]">
                              {a.status === "in_progress"
                                ? "In progress"
                                : `${a.score}/${a.totalMarks} · ${a.status.replace(/_/g, " ")}`}
                              {a.violations.length > 0 ? ` · ${a.violations.length} violation(s)` : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
