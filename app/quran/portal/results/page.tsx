"use client";

import { useStore } from "@/lib/store";
import WarningBanner from "@/components/WarningBanner";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { portalAccess } from "@/lib/types";

export default function ResultsPage() {
  const { students, auth } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  if (!student) return null;

  if (!portalAccess(student).showResults) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Report Card</p>
        <p className="text-sm text-[var(--ink-faint)]">Paper results aren&apos;t part of your program.</p>
      </div>
    );
  }

  const sorted = [...student.results].sort((a, b) => b.testNumber - a.testNumber);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Report Card</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">
          Dear Parent, here is {student.name}&rsquo;s result history
        </h1>
      </div>

      <WarningBanner student={student} />

      {sorted.length === 0 && (
        <p className="text-sm text-[var(--ink-faint)]">No results have been posted yet.</p>
      )}

      <div className="space-y-6">
        {sorted.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--primary-tint)]">
              <div>
                <p className="font-semibold text-[var(--heading)]">Test {r.testNumber}</p>
                <p className="text-xs text-[var(--ink-faint)]">
                  {r.date} · Paper #{r.paperNumber || "—"} · Passing mark: {r.requiredPercent}%
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  r.status === "pass" ? "bg-[var(--primary)] text-white" : "bg-[var(--rose)] text-white"
                }`}
              >
                {r.status === "pass" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {r.status === "pass" ? "Passed" : "Needs Improvement"}
              </span>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-left text-[var(--ink-faint)] text-xs uppercase tracking-wide">
                    <th className="pb-2 font-medium">Subject</th>
                    <th className="pb-2 font-medium">Obtained</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Percentage</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {r.nuraniQaida && (
                    <SubjectRow
                      name="Nurani Qaida"
                      obtained={r.nuraniQaida.obtained}
                      total={r.nuraniQaida.total}
                      percent={r.nuraniQaidaPercent ?? 0}
                      failed={r.failedSubjects.includes("nuraniQaida")}
                    />
                  )}
                  {r.nazra && (
                    <SubjectRow
                      name="Nazra"
                      obtained={r.nazra.obtained}
                      total={r.nazra.total}
                      percent={r.nazraPercent ?? 0}
                      failed={r.failedSubjects.includes("nazra")}
                    />
                  )}
                  {r.tajweed && (
                    <SubjectRow
                      name="Tajweed"
                      obtained={r.tajweed.obtained}
                      total={r.tajweed.total}
                      percent={r.tajweedPercent ?? 0}
                      failed={r.failedSubjects.includes("tajweed")}
                    />
                  )}
                  {r.qiratBonus != null && (
                    <tr>
                      <td className="py-2.5 font-medium flex items-center gap-1.5">
                        Qirat <Sparkles size={12} className="text-[var(--gold)]" />
                      </td>
                      <td className="py-2.5">+{r.qiratBonus}</td>
                      <td className="py-2.5">—</td>
                      <td className="py-2.5">—</td>
                      <td className="py-2.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)]">
                          Bonus
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr className="font-semibold text-[var(--heading)]">
                    <td className="pt-3">Overall</td>
                    <td className="pt-3">{r.overallObtained}</td>
                    <td className="pt-3">{r.overallTotal}</td>
                    <td className="pt-3">{r.overallPercent}%</td>
                    <td className="pt-3">—</td>
                  </tr>
                </tbody>
              </table>
              {r.failedSubjects.length > 0 && (
                <p className="mt-4 text-xs text-[var(--rose)] bg-[var(--rose-tint)] rounded-lg px-3 py-2">
                  {student.name} needs improvement in{" "}
                  {r.failedSubjects
                    .map((s) => (s === "nazra" ? "Nazra" : s === "tajweed" ? "Tajweed" : "Nurani Qaida"))
                    .join(" and ")}{" "}
                  — below the required {r.requiredPercent}% for this test.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectRow({
  name,
  obtained,
  total,
  percent,
  failed,
}: {
  name: string;
  obtained: number;
  total: number;
  percent: number;
  failed: boolean;
}) {
  return (
    <tr>
      <td className="py-2.5 font-medium">{name}</td>
      <td className="py-2.5">{obtained}</td>
      <td className="py-2.5">{total}</td>
      <td className="py-2.5">{percent}%</td>
      <td className="py-2.5">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            failed ? "bg-[var(--rose-tint)] text-[var(--rose)]" : "bg-[var(--primary-tint)] text-[var(--heading)]"
          }`}
        >
          {failed ? "Fail" : "Pass"}
        </span>
      </td>
    </tr>
  );
}
