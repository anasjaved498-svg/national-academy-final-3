"use client";

import { useStore } from "@/lib/store";
import { Star, Check, Trash2 } from "lucide-react";

export default function AdminReviews() {
  const { quranReviews, approveQuranReview, deleteQuranReview } = useStore();
  const pending = quranReviews.filter((r) => !r.approved);
  const approved = quranReviews.filter((r) => r.approved);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Testimonials</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">Quran Section Reviews</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          This feed is separate from your main academy testimonials — only Quran parents/students submit here.
        </p>
      </div>

      <section>
        <h2 className="font-semibold text-[var(--ink)] mb-3">Pending approval ({pending.length})</h2>
        <div className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-[var(--ink-faint)]">Nothing waiting for review.</p>}
          {pending.map((r) => (
            <div key={r.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex gap-0.5 text-[var(--gold)]">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--ink-soft)] mt-2">&ldquo;{r.review}&rdquo;</p>
                  <p className="text-xs text-[var(--ink-faint)] mt-2">{r.name} · {r.role || "—"}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approveQuranReview(r.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-dark)]"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => deleteQuranReview(r.id)}
                    className="p-1.5 rounded-full text-[var(--rose)] hover:bg-[var(--rose-tint)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-[var(--ink)] mb-3">Live on site ({approved.length})</h2>
        <div className="space-y-3">
          {approved.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3">
              <div>
                <p className="text-sm text-[var(--ink)] font-medium">{r.name}</p>
                <p className="text-xs text-[var(--ink-faint)]">{r.role}</p>
              </div>
              <button
                onClick={() => deleteQuranReview(r.id)}
                className="p-1.5 rounded-full text-[var(--rose)] hover:bg-[var(--rose-tint)]"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
