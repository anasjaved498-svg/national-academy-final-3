"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Review = {
  id: string;
  name: string;
  role?: string | null;
  review: string;
  rating: number;
  approved: boolean;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "#0d9488",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
  "#0284c7",
  "#d97706",
  "#be185d",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(hash)];
}

export default function Reviews() {
  const { quranReviews, addQuranReview } = useStore();

  const approved = useMemo(
    () => (quranReviews as Review[]).filter((review) => review.approved),
    [quranReviews],
  );

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);

  const [cardsVisible, setCardsVisible] = useState(3);
  const [position, setPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth <= 600) setCardsVisible(1);
      else if (window.innerWidth <= 960) setCardsVisible(2);
      else setCardsVisible(3);
    };

    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxPosition = Math.max(0, approved.length - cardsVisible);

  useEffect(() => {
    setPosition((current) => Math.min(current, maxPosition));
  }, [cardsVisible, maxPosition]);

  useEffect(() => {
    if (approved.length <= cardsVisible || isPaused) return;

    const timer = window.setInterval(() => {
      setPosition((current) => (current >= maxPosition ? 0 : current + 1));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [approved.length, cardsVisible, isPaused, maxPosition]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const gap = 20;
    const cardWidth =
      cardsVisible === 1
        ? track.clientWidth
        : (track.clientWidth - gap * (cardsVisible - 1)) / cardsVisible;

    track.style.transform = `translateX(-${position * (cardWidth + gap)}px)`;
  }, [cardsVisible, position, approved.length]);

  const next = () => {
    setPosition((current) => (current >= maxPosition ? 0 : current + 1));
  };

  const previous = () => {
    setPosition((current) => (current <= 0 ? maxPosition : current - 1));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !review.trim()) return;

    addQuranReview({
      name: name.trim(),
      role: role.trim(),
      review: review.trim(),
      rating,
    });

    setName("");
    setRole("");
    setReview("");
    setRating(5);
    setSent(true);
  };

  const dotCount = maxPosition + 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
      <div className="text-center">
        <div className="section-label text-xs font-semibold tracking-[0.28em] uppercase text-[var(--link)]">
          Quran Academy Feedback
        </div>
        <h1 className="font-display text-[clamp(2rem,5vw,2.75rem)] mt-2 text-[var(--heading)]">
          What Our Quran Students &amp; Parents Say
        </h1>
        <p className="mt-3 text-[var(--ink-soft)] max-w-2xl mx-auto">
          Real feedback from Quran students and parents about their learning experience.
        </p>
      </div>

      <section className="mt-12" aria-label="Quran Academy reviews">
        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {approved.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--ink-faint)]">
              No Quran reviews yet. Be the first to share your experience below.
            </div>
          ) : (
            <div
              ref={trackRef}
              className="flex gap-5 transition-transform duration-500 ease-out will-change-transform"
            >
              {approved.map((item) => (
                <article
                  key={item.id}
                  className="group relative shrink-0 w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333333%-13.333px)] min-h-[235px] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 flex flex-col overflow-hidden transition-all duration-300 hover:border-[var(--line-bright)] hover:-translate-y-1"
                  style={{ width: cardsVisible === 1 ? "100%" : cardsVisible === 2 ? "calc(50% - 10px)" : "calc(33.333333% - 13.333px)" }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                      background:
                        "linear-gradient(90deg,var(--teal-dark),var(--teal-light),var(--amber))",
                    }}
                  />

                  <div className="flex gap-1 mb-3 text-[15px]" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} aria-hidden="true">
                        {index < item.rating ? "⭐" : "☆"}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-[var(--ink-soft)] leading-[1.7] italic mb-[18px]">
                    {item.review}
                  </p>

                  <div className="mt-auto flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                      style={{ background: avatarColor(item.name) }}
                    >
                      {initials(item.name) || "?"}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm block text-[var(--ink)] truncate">
                        {item.name}
                      </span>
                      {item.role && (
                        <span className="text-[11px] text-[var(--ink-faint)] block truncate">
                          {item.role}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {approved.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous Quran review"
              className="w-10 h-10 rounded-full bg-[rgba(0,108,181,0.10)] border border-[var(--line-bright)] text-[var(--link)] flex items-center justify-center text-lg transition-all hover:bg-[rgba(0,108,181,0.22)] hover:scale-105"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1.5" aria-label="Review pages">
              {Array.from({ length: Math.min(dotCount, 10) }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPosition(index)}
                  aria-label={`Go to review position ${index + 1}`}
                  className={
                    index === position
                      ? "w-[18px] h-1.5 rounded-[3px] bg-[var(--link)] transition-all"
                      : "w-1.5 h-1.5 rounded-full bg-[rgba(0,108,181,0.25)] transition-all"
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next Quran review"
              className="w-10 h-10 rounded-full bg-[rgba(0,108,181,0.10)] border border-[var(--line-bright)] text-[var(--link)] flex items-center justify-center text-lg transition-all hover:bg-[rgba(0,108,181,0.22)] hover:scale-105"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

      <section className="mt-12 rounded-[20px] border border-[var(--line)] bg-[var(--surface-2)] p-6 sm:p-8 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg,var(--teal-dark),var(--teal-light),var(--amber))",
          }}
        />

        <h2 className="font-display text-xl text-[var(--heading)]">
          ✍️ Share Your Quran Experience
        </h2>
        <p className="text-sm text-[var(--ink-faint)] mt-1 mb-6">
          Parents and students are welcome to share honest feedback about their Quran learning journey.
        </p>

        <div className="flex gap-2 mb-6" aria-label="Choose a rating">
          {[1, 2, 3, 4, 5].map((number) => (
            <button
              type="button"
              key={number}
              onClick={() => setRating(number)}
              aria-label={`${number} star${number === 1 ? "" : "s"}`}
              className="text-2xl transition-transform hover:scale-110"
            >
              {number <= rating ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        {sent ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--link)]">
            🎉 Thank you! Your Quran review has been submitted.
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] tracking-[1.5px] uppercase text-[var(--ink-faint)] font-semibold">
                  Your Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Fatima A."
                  className="mt-1.5 w-full rounded-[9px] border border-[var(--line)] bg-white/80 px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--link)]"
                />
              </div>

              <div>
                <label className="text-[11px] tracking-[1.5px] uppercase text-[var(--ink-faint)] font-semibold">
                  Your Role
                </label>
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="e.g. Parent · Nazra student"
                  className="mt-1.5 w-full rounded-[9px] border border-[var(--line)] bg-white/80 px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--link)]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] tracking-[1.5px] uppercase text-[var(--ink-faint)] font-semibold">
                Your Review *
              </label>
              <textarea
                required
                rows={5}
                value={review}
                onChange={(event) => setReview(event.target.value)}
                placeholder="Share your Quran learning experience..."
                className="mt-1.5 w-full rounded-[9px] border border-[var(--line)] bg-white/80 px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none resize-y min-h-[110px] focus:border-[var(--link)]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white border-0 px-7 py-3 rounded-[10px] font-bold text-sm transition-all"
            >
              <span>✨</span>
              <span>Submit Review</span>
            </button>

            <p className="mt-3 text-xs text-[var(--ink-faint)]">
              ✅ Reviews appear after admin approval. JazakAllah for your feedback!
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
