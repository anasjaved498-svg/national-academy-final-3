"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Star } from "lucide-react";

// Same webhook the main site's chatbot/reviews/admission forms already post
// to — set NEXT_PUBLIC_N8N_WEBHOOK_URL in .env.local / Vercel to override,
// otherwise falls back to the known production URL.
const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://automation1523.app.n8n.cloud/webhook/academy-chatbot";

type QuranReviewRow = {
  id: string;
  name: string;
  role: string | null;
  review: string;
  rating: number;
  approved: boolean;
  created_at: string;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function Testimonials() {
  // Local mock-store fallback — only used when Supabase isn't configured yet,
  // so this page still works during local dev without real credentials.
  const { quranReviews: mockReviews, addQuranReview: addMockReview } = useStore();

  const [liveReviews, setLiveReviews] = useState<QuranReviewRow[]>([]);
  const [loading, setLoading] = useState(supabaseConfigured);

  const approved = supabaseConfigured
    ? liveReviews.filter((r) => r.approved)
    : mockReviews.filter((r) => r.approved);

  const loadReviews = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data, error } = await supabase
      .from("quran_reviews")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: true });
    if (!error && data) setLiveReviews(data as QuranReviewRow[]);
    setLoading(false);
  }, []);

  // Initial load + realtime subscription — mirrors the main site's behavior:
  // when the admin approves a review, it appears here live, no refresh needed.
  useEffect(() => {
    if (!supabaseConfigured) return;
    loadReviews();
    const channel = supabase
      .channel("quran-reviews-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quran_reviews" },
        () => loadReviews()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReviews]);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !review || submitting) return;
    setSubmitting(true);

    if (!supabaseConfigured) {
      // Local dev fallback, no backend configured yet.
      addMockReview({ name, role, review, rating });
      setSent(true);
      setSubmitting(false);
      setName("");
      setRole("");
      setReview("");
      setRating(5);
      return;
    }

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_quran_review",
          sessionId: `quran_review_${Date.now()}`,
          data: { name, role, review, rating },
        }),
      });
      if (!res.ok) throw new Error(`n8n returned ${res.status}`);
      setSent(true);
    } catch {
      // Same fallback pattern as the main site: if the webhook is down,
      // write straight to Supabase so the submission isn't lost.
      try {
        const { error } = await supabase
          .from("quran_reviews")
          .insert({ name, role, review, rating, approved: false });
        if (error) throw error;
        setSent(true);
      } catch {
        alert("Something went wrong submitting your review — please try again in a moment.");
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
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
        {!loading && approved.length === 0 && (
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
            <button
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              ✨ {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
