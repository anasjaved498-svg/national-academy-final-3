"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ShieldAlert, Clock, CheckCircle2, AlertTriangle, Maximize } from "lucide-react";
import { ExamAttempt } from "@/lib/types";

// Deterministic per-string shuffle (mulberry32-style PRNG seeded from the
// attempt id) so each student's question and option order is randomized but
// stays the same across reloads/resumes of the same attempt — this makes it
// harder for students to just call out "answer C for Q3" to each other,
// since "Q3" and "C" mean something different per student.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 1 | h);
    h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function TakeExam() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { exams, attempts, auth, startAttempt, saveAnswer, recordViolation, submitAttempt } = useStore();

  const exam = exams.find((e) => e.id === id);
  const existingAttempt = attempts.find((a) => a.examId === id && a.studentId === auth.studentId);

  const [phase, setPhase] = useState<"instructions" | "exam" | "done">(
    existingAttempt && existingAttempt.status !== "in_progress" ? "done" : "instructions"
  );
  const [ackEn, setAckEn] = useState(false);
  const [ackUr, setAckUr] = useState(false);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(
    existingAttempt && existingAttempt.status === "in_progress" ? existingAttempt : null
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [violationToast, setViolationToast] = useState<string | null>(null);
  const [fullscreenError, setFullscreenError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);

  // sync fresh attempt from store when it updates (after saveAnswer etc.)
  useEffect(() => {
    if (!attempt) return;
    const fresh = attempts.find((a) => a.id === attempt.id);
    if (fresh) setAttempt(fresh);
  }, [attempts, attempt?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSubmit = useCallback(
    (reason: "manual" | "timeout" | "violation") => {
      if (!attempt || submittedRef.current) return;
      submittedRef.current = true;
      submitAttempt(attempt.id, reason);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setPhase("done");
    },
    [attempt, submitAttempt]
  );

  const violate = useCallback(
    (type: Parameters<typeof recordViolation>[1], message: string) => {
      if (!attempt || phase !== "exam" || submittedRef.current) return;
      recordViolation(attempt.id, type);
      const current = attempts.find((a) => a.id === attempt.id);
      const count = (current?.violations.length ?? 0) + 1;
      if (exam && count >= exam.maxViolations) {
        setViolationToast(`Violation limit reached — test submitted automatically.`);
        doSubmit("violation");
      } else {
        setViolationToast(`${message} (${count}/${exam?.maxViolations ?? 3} warnings)`);
        setTimeout(() => setViolationToast(null), 4000);
      }
    },
    [attempt, phase, recordViolation, attempts, exam, doSubmit]
  );

  // Tick the clock every second while waiting for a scheduled test to open,
  // or while a result-reveal countdown is being shown.
  useEffect(() => {
    if (phase === "exam") return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          doSubmit("timeout");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, doSubmit]);

  // Anti-cheat listeners
  useEffect(() => {
    if (phase !== "exam") return;

    const onVisibility = () => {
      if (document.hidden) violate("tab_switch", "Tab switch detected");
    };
    const onBlur = () => violate("window_blur", "Window lost focus");
    const onFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) violate("fullscreen_exit", "You exited fullscreen");
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      violate("copy_attempt", "Copying is not allowed");
    };
    const onPasteOrCut = (e: ClipboardEvent) => {
      e.preventDefault();
      violate("copy_attempt", "Paste/cut is not allowed");
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const blocked =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ["U", "P", "S"].includes(e.key.toUpperCase()));
      if (blocked) {
        e.preventDefault();
        violate("devtools_attempt", "That shortcut is blocked during the test");
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPasteOrCut);
    document.addEventListener("cut", onPasteOrCut);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPasteOrCut);
      document.removeEventListener("cut", onPasteOrCut);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase, violate]);

  // Per-attempt shuffled question/option order (see seededShuffle above).
  const shuffledQuestions = useMemo(() => {
    if (!exam || !attempt) return exam?.questions ?? [];
    return seededShuffle(exam.questions, attempt.id).map((q) => ({
      ...q,
      options: seededShuffle(q.options, attempt.id + q.id),
    }));
  }, [exam, attempt?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!exam) return <p className="text-sm text-[var(--ink-faint)]">Test not found.</p>;

  const fmtDuration = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (phase === "done") {
    const finalAttempt = attempt ? attempts.find((a) => a.id === attempt.id) : existingAttempt;
    const submittedMs = finalAttempt?.submittedAt ? new Date(finalAttempt.submittedAt).getTime() : null;
    const revealMs = submittedMs != null ? submittedMs + exam.resultRevealMinutes * 60 * 1000 : null;
    const msUntilReveal = revealMs != null ? revealMs - nowTick : 0;
    const revealed = revealMs == null || msUntilReveal <= 0;

    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle2 size={36} className="mx-auto text-[var(--link)]" />
        <h1 className="font-display text-2xl mt-4 text-[var(--heading)]">Test submitted</h1>
        {!revealed ? (
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <p className="text-sm text-[var(--ink-soft)]">Your result will be available in</p>
            <p
              className={`font-display text-3xl mt-2 ${
                msUntilReveal <= 15 * 60 * 1000 ? "text-[var(--gold)]" : "text-[var(--heading)]"
              }`}
            >
              {fmtDuration(msUntilReveal)}
            </p>
            <p className="text-xs text-[var(--ink-faint)] mt-2">
              Check back on this page or on Test Results once the countdown ends.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            {finalAttempt?.score != null
              ? `You scored ${finalAttempt.score} out of ${finalAttempt.totalMarks}.`
              : "Your result will appear in Test Results shortly."}
          </p>
        )}
        <button
          onClick={() => router.push("/quran/portal/test-results")}
          className="mt-6 px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]"
        >
          View Test Results
        </button>
      </div>
    );
  }

  if (phase === "instructions") {
    const scheduledMs = exam.scheduledAt ? new Date(exam.scheduledAt).getTime() : null;
    const msUntilOpen = scheduledMs != null ? scheduledMs - nowTick : 0;
    const isLocked = scheduledMs != null && msUntilOpen > 0;
    const showCountdown = isLocked && msUntilOpen <= 30 * 60 * 1000;

    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-2 text-[var(--gold)]">
          <ShieldAlert size={18} />
          <p className="text-xs font-semibold uppercase tracking-wide">Read before you begin</p>
        </div>
        <h1 className="font-display text-3xl mt-2 text-[var(--heading)]">Test {exam.testNumber} — {exam.title}</h1>

        {isLocked && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
            {showCountdown ? (
              <>
                <p className="text-sm text-[var(--ink-soft)]">This test opens in</p>
                <p className="font-display text-3xl mt-1 text-[var(--gold)]">{fmtDuration(msUntilOpen)}</p>
              </>
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">
                This test opens at{" "}
                <span className="font-semibold text-[var(--heading)]">
                  {new Date(scheduledMs as number).toLocaleString()}
                </span>
              </p>
            )}
            <p className="text-xs text-[var(--ink-faint)] mt-2">
              You can read the instructions below now, but Start Test stays disabled until the timer ends.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-2">Instructions (English)</p>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed whitespace-pre-line">{exam.instructionsEn}</p>
          <label className="mt-4 flex items-start gap-2 text-sm text-[var(--ink)]">
            <input type="checkbox" checked={ackEn} onChange={(e) => setAckEn(e.target.checked)} className="mt-1 accent-[var(--primary)]" />
            I have read and understood the English instructions.
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6" dir="rtl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-2 text-right">ہدایات (اردو)</p>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed font-arabic whitespace-pre-line">{exam.instructionsUr}</p>
          <label className="mt-4 flex items-start gap-2 text-sm text-[var(--ink)] flex-row-reverse text-right">
            <input type="checkbox" checked={ackUr} onChange={(e) => setAckUr(e.target.checked)} className="mt-1 accent-[var(--primary)]" />
            میں نے اردو ہدایات پڑھ اور سمجھ لی ہیں۔
          </label>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--ink-faint)] bg-[var(--gold-soft)] rounded-xl px-4 py-3">
          <Maximize size={14} className="text-[var(--gold)]" />
          Starting will open fullscreen mode. Leaving fullscreen, switching tabs, or copying text counts
          as a violation — after {exam.maxViolations} violations your test is submitted automatically.
        </div>

        <button
          disabled={!ackEn || !ackUr || isLocked}
          onClick={async () => {
            setFullscreenError("");
            // Request fullscreen on the whole page FIRST, as the very first thing
            // in this click handler — browsers only allow requestFullscreen while
            // still inside the synchronous part of a user gesture. Previously this
            // targeted a ref on a div that only exists once phase === "exam", which
            // was still null at click time, so the request silently did nothing.
            try {
              await document.documentElement.requestFullscreen?.();
            } catch {
              setFullscreenError(
                "Fullscreen was blocked by your browser. Please allow fullscreen for this site (check the address bar or your browser settings) and press Start Test again — fullscreen is required so we can detect if you leave the test."
              );
              return;
            }
            const a = startAttempt(exam.id);
            setAttempt(a);
            setSecondsLeft(exam.durationMinutes * 60);
            // Set this explicitly instead of waiting for the "fullscreenchange"
            // event — that event already fired the instant requestFullscreen()
            // resolved above, before phase flips to "exam" and the listener
            // effect below gets attached, so it would otherwise be missed and
            // isFullscreen would incorrectly stay false (the "you're not in
            // fullscreen" banner showing even though the student is).
            setIsFullscreen(true);
            setPhase("exam");
          }}
          className="mt-6 w-full px-6 py-3 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Test
        </button>
        {fullscreenError && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-[var(--rose)] bg-[var(--rose-tint)] rounded-xl px-4 py-3">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {fullscreenError}
          </p>
        )}
      </div>
    );
  }

  // phase === "exam"
  const q = shuffledQuestions[currentQ];
  const answered = attempt?.answers.find((a) => a.questionId === q.id);
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[var(--bg)] overflow-y-auto p-4 select-none"
    >
      <div className="max-w-2xl mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <p className="font-display text-xl text-[var(--heading)]">Test {exam.testNumber} — {exam.title}</p>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              secondsLeft < 30 ? "bg-[var(--rose-tint)] text-[var(--rose)]" : "bg-[var(--primary-tint)] text-[var(--link)]"
            }`}
          >
            <Clock size={14} /> {minutes}:{secs.toString().padStart(2, "0")}
          </span>
        </div>

        {violationToast && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--rose)] bg-[var(--rose-tint)] rounded-xl px-4 py-3">
            <AlertTriangle size={15} /> {violationToast}
          </div>
        )}

        {!isFullscreen && (
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-[var(--rose)] bg-[var(--rose-tint)] rounded-xl px-4 py-3">
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} /> You&apos;re not in fullscreen — this counts as a violation.
            </span>
            <button
              type="button"
              onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
              className="px-3 py-1.5 rounded-full bg-[var(--rose)] text-white text-xs font-semibold shrink-0"
            >
              Return to Fullscreen
            </button>
          </div>
        )}

        <div className="flex gap-1.5 mb-6 flex-wrap">
          {shuffledQuestions.map((qq, i) => {
            const a = attempt?.answers.find((ans) => ans.questionId === qq.id);
            return (
              <button
                key={qq.id}
                onClick={() => setCurrentQ(i)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                  i === currentQ
                    ? "bg-[var(--primary)] text-white"
                    : a?.selectedOptionId
                    ? "bg-[var(--primary-tint)] text-[var(--link)]"
                    : "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-faint)]"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="text-xs text-[var(--ink-faint)] mb-2">Question {currentQ + 1} of {shuffledQuestions.length}</p>
          <p className="text-base font-medium text-[var(--ink)]">{q.text}</p>

          <div className="mt-5 space-y-2.5">
            {q.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-colors ${
                  selected[q.id] === opt.id || (!selected[q.id] && answered?.selectedOptionId === opt.id)
                    ? "border-[var(--primary)] bg-[var(--primary-tint)]"
                    : "border-[var(--line)] hover:border-[var(--primary)]/50"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={selected[q.id] === opt.id || (!selected[q.id] && answered?.selectedOptionId === opt.id)}
                  onChange={() => setSelected((s) => ({ ...s, [q.id]: opt.id }))}
                  className="accent-[var(--primary)]"
                />
                {opt.text}
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              disabled={!selected[q.id]}
              onClick={() => {
                if (!attempt || !selected[q.id]) return;
                saveAnswer(attempt.id, q.id, selected[q.id]);
                setSavedFlash(q.id);
                setTimeout(() => setSavedFlash(null), 1500);
              }}
              className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)] disabled:opacity-40"
            >
              {answered?.selectedOptionId ? "Save Change" : "Save Answer"}
            </button>
            {(selected[q.id] || answered?.selectedOptionId) && (
              <button
                type="button"
                onClick={() => {
                  if (!attempt) return;
                  setSelected((s) => {
                    const next = { ...s };
                    delete next[q.id];
                    return next;
                  });
                  saveAnswer(attempt.id, q.id, null);
                }}
                className="px-5 py-2 rounded-full border border-[var(--line)] text-sm font-medium text-[var(--ink-soft)] hover:border-[var(--rose)] hover:text-[var(--rose)]"
              >
                Reset Choice
              </button>
            )}
            {savedFlash === q.id && (
              <span className="text-xs text-[var(--link)] flex items-center gap-1">
                <CheckCircle2 size={13} /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((c) => c - 1)}
            className="px-4 py-2 rounded-full border border-[var(--line)] text-sm disabled:opacity-30"
          >
            Previous
          </button>
          {currentQ < shuffledQuestions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((c) => c + 1)}
              className="px-4 py-2 rounded-full border border-[var(--line)] text-sm hover:border-[var(--primary)]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm("Submit the test now? You cannot change answers after submitting.")) {
                  doSubmit("manual");
                }
              }}
              className="px-6 py-2.5 rounded-full bg-[var(--gold)] text-[#1a1200] text-sm font-semibold hover:opacity-90"
            >
              Submit Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
