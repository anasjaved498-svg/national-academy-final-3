"use client";

import { useState } from "react";
import { Gift as GiftIcon, Plus, Save, Trash2, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { GiftRule, Section } from "@/lib/types";

export default function AdminGiftsPage() {
  const { students, giftRules, gifts, addGiftRule, updateGiftRule, deleteGiftRule, addGift, deleteGift } = useStore();
  const [ruleForm, setRuleForm] = useState({ section: "both" as GiftRule["section"], category: "Academic Excellence", title: "90%+ Achievement Gift", description: "", triggerType: "result_percent" as GiftRule["triggerType"], threshold: 90 });
  const [awardForm, setAwardForm] = useState({ studentId: students[0]?.id ?? "", section: "quran" as Section, category: "Special Achievement", title: "Achievement Gift", description: "", reason: "" });

  const submitRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.category.trim() || !ruleForm.title.trim()) return;
    addGiftRule({ ...ruleForm, category: ruleForm.category.trim(), title: ruleForm.title.trim(), description: ruleForm.description.trim(), threshold: Math.max(0, Math.min(100, Number(ruleForm.threshold) || 0)), active: true });
    setRuleForm({ section: "both", category: "Academic Excellence", title: "90%+ Achievement Gift", description: "", triggerType: "result_percent", threshold: 90 });
  };

  const award = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === awardForm.studentId);
    if (!student || !awardForm.title.trim() || !student.sections.includes(awardForm.section)) return;
    addGift({ studentId: student.id, section: awardForm.section, category: awardForm.category.trim() || "Special Achievement", title: awardForm.title.trim(), description: awardForm.description.trim(), reason: awardForm.reason.trim() || "Awarded by the academy." });
    setAwardForm((f) => ({ ...f, title: "Achievement Gift", description: "", reason: "" }));
  };

  return (
    <div className="space-y-8">
      <div><p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Rewards</p><h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Gifts Management</h1><p className="text-sm text-[var(--ink-soft)] mt-1">Automatic rules can reward 90%+ results or strong completed weekly performance. You can also award a gift manually.</p></div>

      <form onSubmit={submitRule} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
        <div className="flex items-center gap-2"><Zap size={17} className="text-[var(--gold)]" /><h2 className="font-display text-xl text-[var(--heading)]">Add automatic gift rule</h2></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Category"><input value={ruleForm.category} onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })} className={inputClass} /></Field>
          <Field label="Gift title"><input value={ruleForm.title} onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })} className={inputClass} /></Field>
          <Field label="Trigger"><select value={ruleForm.triggerType} onChange={(e) => setRuleForm({ ...ruleForm, triggerType: e.target.value as GiftRule["triggerType"] })} className={inputClass}><option value="result_percent">Result percentage</option><option value="weekly_performance">Weekly performance score</option></select></Field>
          <Field label="Threshold"><input type="number" min={0} max={100} step="0.1" value={ruleForm.threshold} onChange={(e) => setRuleForm({ ...ruleForm, threshold: Number(e.target.value) })} className={inputClass} /></Field>
          <Field label="Section"><select value={ruleForm.section} onChange={(e) => setRuleForm({ ...ruleForm, section: e.target.value as GiftRule["section"] })} className={inputClass}><option value="both">Both sections</option><option value="quran">Quran</option><option value="academy">Academy</option></select></Field>
          <Field label="Description"><input value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} placeholder="What does this reward mean?" className={inputClass} /></Field>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium"><Plus size={14} /> Add Rule</button>
      </form>

      <div className="space-y-3">
        {giftRules.map((rule) => <RuleCard key={rule.id} rule={rule} onSave={updateGiftRule} onDelete={() => deleteGiftRule(rule.id)} />)}
      </div>

      <form onSubmit={award} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
        <div className="flex items-center gap-2"><GiftIcon size={17} className="text-[var(--gold)]" /><h2 className="font-display text-xl text-[var(--heading)]">Award a gift manually</h2></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Student"><select value={awardForm.studentId} onChange={(e) => { const student = students.find((s) => s.id === e.target.value); const section = student?.sections.includes(awardForm.section) ? awardForm.section : student?.sections[0] ?? "quran"; setAwardForm({ ...awardForm, studentId: e.target.value, section }); }} className={inputClass}>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Section"><select value={awardForm.section} onChange={(e) => setAwardForm({ ...awardForm, section: e.target.value as Section })} className={inputClass}>{(students.find((s) => s.id === awardForm.studentId)?.sections ?? ["quran"]).map((s) => <option key={s} value={s}>{s === "quran" ? "Quran" : "Academy"}</option>)}</select></Field>
          <Field label="Category"><input value={awardForm.category} onChange={(e) => setAwardForm({ ...awardForm, category: e.target.value })} className={inputClass} /></Field>
          <Field label="Gift title"><input value={awardForm.title} onChange={(e) => setAwardForm({ ...awardForm, title: e.target.value })} className={inputClass} /></Field>
          <Field label="Reason"><input value={awardForm.reason} onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })} placeholder="e.g. Consistent effort this month" className={inputClass} /></Field>
          <Field label="Description"><input value={awardForm.description} onChange={(e) => setAwardForm({ ...awardForm, description: e.target.value })} className={inputClass} /></Field>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--gold)] text-white text-sm font-medium"><GiftIcon size={14} /> Award Gift</button>
      </form>

      <div className="space-y-3"><h2 className="font-display text-xl text-[var(--heading)]">Awarded Gifts</h2>{gifts.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No gifts awarded yet.</p>}{gifts.slice().sort((a, b) => b.awardedAt.localeCompare(a.awardedAt)).map((g) => <div key={g.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4"><div><p className="font-medium text-[var(--ink)]">{students.find((s) => s.id === g.studentId)?.name ?? "Removed student"} · {g.title}</p><p className="text-xs text-[var(--ink-faint)] mt-1">{g.category} · {g.reason}</p></div><button onClick={() => deleteGift(g.id)} className="p-2 rounded-lg text-[var(--rose)] hover:bg-[var(--rose-tint)]" aria-label="Delete gift"><Trash2 size={15} /></button></div>)}</div>
    </div>
  );
}

function RuleCard({ rule, onSave, onDelete }: { rule: GiftRule; onSave: (rule: GiftRule) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(rule);
  return <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"><Field label="Category"><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputClass} /></Field><Field label="Title"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputClass} /></Field><Field label="Trigger"><select value={draft.triggerType} onChange={(e) => setDraft({ ...draft, triggerType: e.target.value as GiftRule["triggerType"] })} className={inputClass}><option value="result_percent">Result %</option><option value="weekly_performance">Weekly score</option></select></Field><Field label="Threshold"><input type="number" min={0} max={100} step="0.1" value={draft.threshold} onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) })} className={inputClass} /></Field><Field label="Section"><select value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value as GiftRule["section"] })} className={inputClass}><option value="both">Both</option><option value="quran">Quran</option><option value="academy">Academy</option></select></Field><label className="flex items-center gap-2 text-sm text-[var(--ink)] pb-2"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active</label></div><div className="mt-3 flex gap-2"><button type="button" onClick={() => onSave(draft)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-white text-xs font-medium"><Save size={13} /> Save Rule</button><button type="button" onClick={onDelete} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--rose)]/40 text-[var(--rose)] text-xs font-medium"><Trash2 size={13} /> Delete</button></div></div>;
}

const inputClass = "mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="text-xs font-medium text-[var(--ink-faint)]">{label}</label>{children}</div>; }
