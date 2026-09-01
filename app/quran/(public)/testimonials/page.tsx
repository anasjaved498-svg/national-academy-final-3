"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Star } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Testimonials() {
  const { quranReviews, addQuranReview } = useStore();
  const approved = quranReviews.filter((r) => r.approved);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !review) return;
    addQuranReview({ name, role, review, rating });
    setSent(true);
    setName("");
    setRole("");
    setReview("");
    setRating(5);
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-12 sm:py-20">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--link)]">Student Feedback</p>
        <h1 className="font-display text-4xl mt-2 text-[var(--heading)]">What Our Students Say</h1>
        <p className="mt-3 text-[var(--ink-soft)] max-w-xl mx-auto">
          Real feedback from real students and parents.
        </p>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {approved.length === 0 && (
          <p className="text-sm text-[var(--ink-faint)] sm:col-span-2 lg:col-span-4 text-center">
            No testimonials yet — be the first to share yours below.
          </p>
        )}
        {approved.map((t) => (
          <div
            key={t.id}
            className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 hover:border-[var(--line-bright)] hover:-translate-y-0.5 transition-all"
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, var(--blue-rich), var(--blue-mid), var(--blue-bright))",
              }}
            />
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={14} className="text-[var(--link)]" fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed italic">&ldquo;{t.review}&rdquo;</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {initials(t.name)}
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--ink)]">{t.name}</p>
                {t.role && <p className="text-xs text-[var(--ink-faint)]">{t.role}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 max-w-2xl mx-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-8">
        <h2 className="font-display text-xl text-[var(--heading)]">✍️ Share Your Experience</h2>
        <p className="text-sm text-[var(--ink-faint)] mt-1">
          Your honest feedback helps other families. Reviews go live after approval.
        </p>
        {sent ? (
          <p className="mt-5 text-sm text-[var(--link)]">
            🎉 JazakAllah! Your review has been submitted. It will go live after approval.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star
                    size={22}
                    className={n <= rating ? "text-[var(--link)]" : "text-[var(--line)]"}
                    fill={n <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name *"
                className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Parent · Nazra student"
                className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
            <textarea
              required
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
            <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]">
              ✨ Submit Review
            </button>
            <p className="text-xs text-[var(--ink-faint)]">✅ Reviews appear after admin approval.</p>
          </form>
        )}
      </div>
    </div>
  );
}
