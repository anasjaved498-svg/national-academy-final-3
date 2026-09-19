"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Plus, Save } from "lucide-react";

export default function CriteriaPage() {
  const { criteria, updateCriteria } = useStore();
  const [newTest, setNewTest] = useState(criteria.length + 1);
  const [newPercent, setNewPercent] = useState(30);

  const sorted = [...criteria].sort((a, b) => a.testNumber - b.testNumber);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Settings</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Passing Criteria</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
          Set the required passing percentage for Nazra and Tajweed on each test. Percentages and
          pass/fail status are always calculated automatically from marks you enter — you only
          control the threshold here. Any test number beyond your last entry uses that entry's
          percentage.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] divide-y divide-[var(--line)]">
        {sorted.map((c) => (
          <CriterionRow
            key={c.testNumber}
            testNumber={c.testNumber}
            requiredPercent={c.requiredPercent}
            onSave={(p) => updateCriteria(c.testNumber, p)}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-[var(--line)] p-5">
        <p className="text-sm font-semibold text-[var(--ink)] mb-3">Add a criterion for a new test number</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs text-[var(--ink-faint)]">Test number</label>
            <input
              type="number"
              min={1}
              value={newTest}
              onChange={(e) => setNewTest(Number(e.target.value))}
              className="mt-1 w-28 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--ink-faint)]">Passing %</label>
            <input
              type="number"
              min={1}
              max={100}
              value={newPercent}
              onChange={(e) => setNewPercent(Number(e.target.value))}
              className="mt-1 w-28 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
          <button
            onClick={() => updateCriteria(newTest, newPercent)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]"
          >
            <Plus size={14} /> Add / Update
          </button>
        </div>
      </div>
    </div>
  );
}

function CriterionRow({
  testNumber,
  requiredPercent,
  onSave,
}: {
  testNumber: number;
  requiredPercent: number;
  onSave: (p: number) => void;
}) {
  const [value, setValue] = useState(requiredPercent);
  const dirty = value !== requiredPercent;

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <p className="text-sm font-medium text-[var(--ink)]">Test {testNumber}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-24 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-sm text-right outline-none focus:border-[var(--primary)]"
        />
        <span className="text-sm text-[var(--ink-faint)]">%</span>
        {dirty && (
          <button
            onClick={() => onSave(value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-dark)]"
          >
            <Save size={12} /> Save
          </button>
        )}
      </div>
    </div>
  );
}
