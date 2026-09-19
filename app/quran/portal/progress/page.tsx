"use client";

import { useStore } from "@/lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts";
import { Sparkles, AlertTriangle } from "lucide-react";
import { COURSE_CONFIG, portalAccess } from "@/lib/types";

const SUBJECT_COLOR: Record<string, string> = {
  nuraniQaida: "var(--primary)",
  nazra: "var(--primary)",
  tajweed: "var(--gold)",
};
const SUBJECT_LABEL: Record<string, string> = {
  nuraniQaida: "Nurani Qaida",
  nazra: "Nazra",
  tajweed: "Tajweed",
};

export default function ProgressPage() {
  const { students, auth, requiredPercentFor } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  if (!student) return null;

  if (!portalAccess(student).showProgress) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Progress</p>
        <p className="text-sm text-[var(--ink-faint)]">Progress charts aren&apos;t part of your program.</p>
      </div>
    );
  }

  const config = COURSE_CONFIG[student.course];
  const subjects = config.requiredSubjects; // e.g. ["nazra"] or ["nazra","tajweed"]

  const sorted = [...student.results].sort((a, b) => a.testNumber - b.testNumber);
  const chartData = sorted.map((r) => ({
    test: `Test ${r.testNumber}`,
    ...(subjects.includes("nuraniQaida") ? { "Nurani Qaida": r.nuraniQaidaPercent } : {}),
    ...(subjects.includes("nazra") ? { Nazra: r.nazraPercent } : {}),
    ...(subjects.includes("tajweed") ? { Tajweed: r.tajweedPercent } : {}),
    required: r.requiredPercent,
    failed: r.status === "fail",
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Progress</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">
          {student.name}&rsquo;s progress over time
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          {subjects.map((s) => SUBJECT_LABEL[s]).join(" and ")} percentage across each test. Points
          marked in red are tests where the required passing mark was not met.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        {chartData.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">Not enough results yet to plot progress.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                <XAxis dataKey="test" stroke="var(--ink-faint)" fontSize={12} />
                <YAxis stroke="var(--ink-faint)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Legend />
                {subjects.map((s) => (
                  <Line
                    key={s}
                    type="monotone"
                    dataKey={SUBJECT_LABEL[s]}
                    stroke={SUBJECT_COLOR[s]}
                    strokeWidth={2.5}
                    dot={(props) => <CustomDot {...props} />}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {config.showQiratBonus && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[var(--gold)]" />
            <h2 className="font-semibold text-[var(--ink)]">Qirat — bonus subject</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {sorted.filter((r) => r.qiratBonus != null).length === 0 && (
              <p className="text-sm text-[var(--ink-faint)]">No Qirat marks recorded.</p>
            )}
            {sorted
              .filter((r) => r.qiratBonus != null)
              .map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] px-4 py-3 text-center min-w-[100px]"
                >
                  <p className="text-xs text-[var(--ink-faint)]">Test {r.testNumber}</p>
                  <p className="font-display text-lg text-[var(--heading)]">+{r.qiratBonus}</p>
                  <p className="text-[10px] text-[var(--gold)] font-semibold uppercase tracking-wide">Bonus</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-[var(--ink-faint)] bg-[var(--primary-tint)] rounded-xl px-4 py-3">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--rose)]" />
        Required passing percentage increases with each test (currently {requiredPercentFor(sorted.length + 1 || 1)}%
        for the next test) — this is set and adjusted by the academy administrator.
      </p>
    </div>
  );
}

function CustomDot(props: any) {
  const { cx, cy, payload, stroke } = props;
  if (payload.failed) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="var(--rose)" stroke="white" strokeWidth={2} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={4} fill={stroke} stroke="white" strokeWidth={1.5} />;
}
