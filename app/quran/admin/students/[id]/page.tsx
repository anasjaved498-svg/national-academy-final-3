"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { AlertTriangle, Ban, CheckCircle2, RotateCcw, XCircle, Sparkles, Wallet, Check } from "lucide-react";
import { COURSE_CONFIG } from "@/lib/types";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    students,
    addResult,
    requiredPercentFor,
    rejectStudent,
    reinstateStudent,
    performanceFines,
    testFines,
    waivePerformanceFine,
    waiveTestFine,
    exams,
    getAudioSubmission,
    markAudioHeard,
  } = useStore();
  const student = students.find((s) => s.id === id);

  const nextTestNumber = useMemo(
    () => (student ? Math.max(0, ...student.results.map((r) => r.testNumber)) + 1 : 1),
    [student]
  );

  const [testNumber, setTestNumber] = useState(nextTestNumber);
  const [paperNumber, setPaperNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [nuraniQaidaObt, setNuraniQaidaObt] = useState(0);
  const [nuraniQaidaTotal, setNuraniQaidaTotal] = useState(60);
  const [nazraObt, setNazraObt] = useState(0);
  const [nazraTotal, setNazraTotal] = useState(60);
  const [tajweedObt, setTajweedObt] = useState(0);
  const [tajweedTotal, setTajweedTotal] = useState(60);
  const [qiratBonus, setQiratBonus] = useState(0);

  if (!student) {
    return <p className="text-sm text-[var(--ink-faint)]">Student not found.</p>;
  }

  const config = COURSE_CONFIG[student.course];
  const hasQuran = student.sections?.includes("quran") ?? true;
  const hasAcademy = student.sections?.includes("academy") ?? false;
  const needsNurani = config.requiredSubjects.includes("nuraniQaida");
  const needsNazra = config.requiredSubjects.includes("nazra");
  const needsTajweed = config.requiredSubjects.includes("tajweed");
  const needsQirat = config.showQiratBonus;
  const needsAudio = needsTajweed || needsQirat;

  const required = requiredPercentFor(testNumber);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addResult(student.id, {
      testNumber,
      paperNumber,
      date,
      nuraniQaida: needsNurani ? { obtained: nuraniQaidaObt, total: nuraniQaidaTotal } : null,
      nazra: needsNazra ? { obtained: nazraObt, total: nazraTotal } : null,
      tajweed: needsTajweed ? { obtained: tajweedObt, total: tajweedTotal } : null,
      qiratBonus: needsQirat ? qiratBonus : null,
    });
    setTestNumber(testNumber + 1);
    setPaperNumber("");
    setNuraniQaidaObt(0);
    setNazraObt(0);
    setTajweedObt(0);
    setQiratBonus(0);
  };

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
        <div className="flex items-center gap-3">
          <StatusPill status={student.status} />
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
        </div>
      </div>

      {student.consecutiveFails === 2 && student.status !== "rejected" && (
        <Notice
          icon={<AlertTriangle size={16} className="text-[var(--gold)]" />}
          tone="gold"
          text="This student has 2 consecutive fails. The portal is already showing a warning notice to the parent. A 3rd consecutive fail will let you reject this student from the portal."
        />
      )}
      {student.consecutiveFails >= 3 && student.status !== "rejected" && (
        <Notice
          icon={<Ban size={16} className="text-[var(--rose)]" />}
          tone="rose"
          text="This student has failed 3 consecutive tests. Use the Reject button above to suspend portal access, or add a passing result to reset the streak."
        />
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
      {hasQuran && (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-xl text-[var(--heading)]">Enter Result</h2>
        <p className="text-xs text-[var(--ink-faint)] mt-1">
          {student.course === "Qirat"
            ? "This student's course is bonus-only Qirat — just enter a score below, no pass/fail applies."
            : <>Passing mark for Test {testNumber}: <span className="font-semibold text-[var(--heading)]">{required}%</span> (set in Passing Criteria).</>}
          {" "}Percentage and pass/fail are calculated automatically.
        </p>
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

          {needsNurani && (
            <SubjectInputs
              label="Nurani Qaida (required)"
              obtained={nuraniQaidaObt}
              total={nuraniQaidaTotal}
              onObtained={setNuraniQaidaObt}
              onTotal={setNuraniQaidaTotal}
            />
          )}
          {needsNazra && (
            <SubjectInputs
              label="Nazra (required)"
              obtained={nazraObt}
              total={nazraTotal}
              onObtained={setNazraObt}
              onTotal={setNazraTotal}
            />
          )}
          {needsTajweed && (
            <SubjectInputs
              label="Tajweed (required)"
              obtained={tajweedObt}
              total={tajweedTotal}
              onObtained={setTajweedObt}
              onTotal={setTajweedTotal}
            />
          )}

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
      {hasQuran && (
      <div>
        <h2 className="font-display text-xl text-[var(--heading)] mb-4">Result History</h2>
        <div className="space-y-3">
          {sortedResults.length === 0 && (
            <p className="text-sm text-[var(--ink-faint)]">No results recorded yet.</p>
          )}
          {sortedResults.map((r) => (
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
                  {r.nuraniQaidaPercent != null ? `Nurani Qaida ${r.nuraniQaidaPercent}% · ` : ""}
                  {r.nazraPercent != null ? `Nazra ${r.nazraPercent}% · ` : ""}
                  {r.tajweedPercent != null ? `Tajweed ${r.tajweedPercent}% · ` : ""}
                  {r.qiratBonus != null ? `Qirat +${r.qiratBonus} (bonus) · ` : ""}
                  Overall {r.overallPercent}%
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                  r.status === "pass" ? "bg-[var(--primary-tint)] text-[var(--heading)]" : "bg-[var(--rose-tint)] text-[var(--rose)]"
                }`}
              >
                {r.status === "pass" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {r.status === "pass" ? "Pass" : "Fail"}
              </span>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

function SubjectInputs({
  label,
  obtained,
  total,
  onObtained,
  onTotal,
}: {
  label: string;
  obtained: number;
  total: number;
  onObtained: (v: number) => void;
  onTotal: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--ink)] mb-1.5">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Obtained marks" value={obtained} onChange={onObtained} min={0} />
        <NumField label="Total marks" value={total} onChange={onTotal} min={1} />
      </div>
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
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "warned" | "rejected" }) {
  const styles: Record<string, string> = {
    active: "bg-[var(--primary-tint)] text-[var(--heading)]",
    warned: "bg-[var(--gold-soft)] text-[var(--gold)]",
    rejected: "bg-[var(--rose-tint)] text-[var(--rose)]",
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${styles[status]}`}>
      {status}
    </span>
  );
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
