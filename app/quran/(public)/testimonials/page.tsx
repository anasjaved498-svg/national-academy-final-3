"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Reviews() {
  const { quranReviews, addQuranReview } = useStore();
  const approved = useMemo(() => quranReviews.filter((r) => r.approved), [quranReviews]);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;

    const nextLeft = el.scrollLeft + direction * el.clientWidth;
    const maxLeft = el.scrollWidth - el.clientWidth;

    if (direction > 0 && nextLeft >= maxLeft - 8) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction < 0 && el.scrollLeft <= 8) {
      el.scrollTo({ left: maxLeft, behavior: "smooth" });
      return;
    }
    el.scrollTo({ left: Math.max(0, Math.min(nextLeft, maxLeft)), behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || approved.length <= 1) return;

    autoTimerRef.current = setInterval(() => scrollByPage(1), 5000);

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [approved.length]);

  const pauseAuto = () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
  };

  const resumeAuto = () => {
    if (approved.length <= 1) return;
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => scrollByPage(1), 5000);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !review.trim()) return;

    addQuranReview({
      name: name.trim(),
      role: role.trim(),
      review: review.trim(),
      rating,
    });

    setSent(true);
    setName("");
    setRole("");
    setReview("");
    setRating(5);
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-12 sm:py-20">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--link)]">Quran Academy Feedback</p>
        <h1 className="font-display text-4xl mt-2 text-[var(--heading)]">What Quran Families Say</h1>
        <p className="mt-3 text-[var(--ink-soft)] max-w-2xl mx-auto">
          Real feedback from parents and students about their Quran learning experience.
        </p>
      </div>

      <section className="mt-12" aria-label="Quran Academy reviews">
        <div
          ref={scrollerRef}
          onMouseEnter={pauseAuto}
          onMouseLeave={resumeAuto}
          onTouchStart={pauseAuto}
          onTouchEnd={resumeAuto}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {approved.length === 0 ? (
            <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--ink-faint)]">
              No Quran reviews yet. Be the first to share your experience below.
            </div>
          ) : (
            approved.map((t) => (
              <article
                key={t.id}
                className="group relative shrink-0 w-[88%] sm:w-[48%] lg:w-[32%] min-h-[235px] snap-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 flex flex-col hover:border-[var(--line-bright)] hover:-translate-y-0.5 transition-all"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--blue-rich), var(--blue-mid), var(--blue-bright))",
                  }}
                />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < t.rating ? "text-[var(--link)]" : "text-[var(--line)]"}
                      fill={i < t.rating ? "currentColor" : "none"}
                      strokeWidth={i < t.rating ? 0 : 1.5}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--ink-soft)] leading-relaxed italic min-h-[118px]">
                  &ldquo;{t.review}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {initials(t.name) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--ink)] truncate">{t.name}</p>
                    {t.role && <p className="text-xs text-[var(--ink-faint)] truncate">{t.role}</p>}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {approved.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              aria-label="Previous Quran reviews"
              className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center hover:border-[var(--primary)] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-[var(--ink-faint)]">Reviews auto-rotate</span>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              aria-label="Next Quran reviews"
              className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center hover:border-[var(--primary)] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

      <section className="mt-16 max-w-2xl mx-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6 sm:p-8">
        <h2 className="font-display text-xl text-[var(--heading)]">✍️ Share Your Quran Experience</h2>
        <p className="text-sm text-[var(--ink-faint)] mt-1">
          Parents and students are welcome to share honest feedback about their Quran learning journey.
        </p>

        {sent ? (
          <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--link)]">
            🎉 JazakAllah! Thank you for sharing your experience.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="flex gap-1" aria-label="Choose a rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className="p-0.5"
                >
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
              placeholder="Share your Quran learning experience..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)]"
            >
              ✨ Submit Review
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
