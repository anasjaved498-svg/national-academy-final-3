"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { buildMonthSummary, currentMonthKey, PERFORMANCE_RED_LINE, WEEK_START_SCORE } from "@/lib/performance";
import { Section } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Wallet, TrendingUp } from "lucide-react";

const SECTION_LABEL: Record<Section, string> = { quran: "Quran", academy: "Academy" };

function GiftTargetLabel({ viewBox, threshold }: { viewBox?: { x?: number; y?: number }; threshold: number }) {
  const x = typeof viewBox?.x === "number" ? viewBox.x + 8 : 12;
  const y = typeof viewBox?.y === "number" ? viewBox.y - 8 : 16;

  return (
    <text x={x} y={y} fill="var(--gold)" fontSize={11} fontWeight={600}>
      🎁 Gift target {threshold}%
    </text>
  );
}

function SectionPerformance({ section }: { section: Section }) {
  const { auth, dailyRatings, performanceFines, giftRules } = useStore();
  const monthKey = currentMonthKey();
  const myEntries = dailyRatings.filter(
    (e) => e.studentId === auth.studentId && e.section === section && e.date.startsWith(monthKey)
  );
  const summary = useMemo(() => buildMonthSummary(monthKey, myEntries), [monthKey, myEntries]);
  const myFines = performanceFines.filter(
    (f) => f.studentId === auth.studentId && f.section === section && f.monthKey === monthKey && !f.waived
  );

  // The graph's gift line is controlled by the existing Admin -> Gifts ->
  // Gift Rules -> Weekly Performance threshold. A section-specific rule wins;
  // otherwise a rule configured for both sections is used. If multiple rules
  // match, the highest active threshold is the visual target.
  const giftThreshold = useMemo(() => {
    const matching = giftRules
      .filter(
        (rule) =>
          rule.active &&
          rule.triggerType === "weekly_performance" &&
          (rule.section === section || rule.section === "both")
      )
      .sort((a, b) => {
        const aSpecific = a.section === section ? 1 : 0;
        const bSpecific = b.section === section ? 1 : 0;
        if (aSpecific !== bSpecific) return bSpecific - aSpecific;
        return b.threshold - a.threshold;
      });

    return matching[0]?.threshold ?? null;
  }, [giftRules, section]);

  const chartData = summary.weeks
    .filter((w) => w.dailyScores.length > 0)
    .flatMap((w) => [
      // Explicit weekly reset point: each new week starts from the baseline
      // instead of carrying the previous week's final score into the line.
      {
        label: `W${w.weekNumber} · Reset`,
        score: WEEK_START_SCORE,
        week: w.weekNumber,
      },
      ...w.dailyScores.map((d) => ({
        label: `W${w.weekNumber} · ${d.date.slice(8)}`,
        score: d.score,
        week: w.weekNumber,
      })),
    ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        {chartData.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">No ratings recorded yet this month.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 18, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--ink-faint)" fontSize={11} />
                <YAxis stroke="var(--ink-faint)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <ReferenceLine
                  y={PERFORMANCE_RED_LINE}
                  stroke="var(--rose)"
                  strokeDasharray="4 4"
                  label={{ value: "Red line", position: "insideTopRight", fill: "var(--rose)", fontSize: 11 }}
                />
                {giftThreshold != null && (
                  <ReferenceLine
                    y={giftThreshold}
                    stroke="var(--gold)"
                    strokeDasharray="7 5"
                    strokeWidth={1.8}
                    label={<GiftTargetLabel threshold={giftThreshold} />}
                  />
                )}
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summary.weeks.map((w) => (
          <div
            key={w.weekNumber}
            className={`rounded-xl border p-4 ${
              w.fined ? "border-[var(--rose)]/40 bg-[var(--rose-tint)]" : "border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            <p className="text-xs text-[var(--ink-faint)]">Week {w.weekNumber}</p>
            <p className="font-display text-2xl mt-1 text-[var(--heading)]">
              {w.dailyScores.length > 0 ? w.score : "—"}
            </p>
            {w.fined && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--rose)]">
                <Wallet size={12} /> Rs. {w.fineAmount} fine
              </p>
            )}
            {w.recoveredBeforeWeekEnd && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--link)]">
                <TrendingUp size={12} /> Recovered
              </p>
            )}
          </div>
        ))}
      </div>

      {myFines.length > 0 && (
        <div className="rounded-2xl bg-[var(--rose-tint)] border border-[var(--rose)]/30 p-5">
          <p className="font-semibold text-[var(--rose)] flex items-center gap-2">
            <Wallet size={16} /> {SECTION_LABEL[section]} fines this month: Rs.{" "}
            {myFines.reduce((s, f) => s + f.amount, 0)}
          </p>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Please speak with the academy regarding payment.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PerformancePage() {
  const { students, auth } = useStore();
  const student = students.find((s) => s.id === auth.studentId);
  const sections = student?.sections ?? ["quran"];
  const [tab, setTab] = useState<Section>(sections[0]);
  const activeSection = sections.includes(tab) ? tab : sections[0];
  const monthKey = currentMonthKey();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Performance</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">
          Daily Performance — {monthKey}
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Tracks how each day&apos;s rating (Not Good / Average / Excellent) shapes the week. Each
          week starts again from the weekly baseline, while the graph keeps the full month of weekly
          history. The red line marks the level that triggers a fine if a week ends below it.
          {giftThresholdHint(sections.length > 1)}
        </p>
      </div>

      {sections.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-full text-sm font-medium border ${
                activeSection === s
                  ? "border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--heading)]"
                  : "border-[var(--line)] text-[var(--ink-soft)]"
              }`}
            >
              {SECTION_LABEL[s]} Performance
            </button>
          ))}
        </div>
      )}

      <SectionPerformance key={activeSection} section={activeSection} />
    </div>
  );
}

function giftThresholdHint(hasBoth: boolean) {
  return ` ${hasBoth ? "Quran and Academy are tracked completely independently. " : ""}The 🎁 gift target line is controlled by the active Weekly Performance Gift Rule threshold in Admin.`;
}
