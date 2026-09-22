"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useStore } from "@/lib/store";

const DISMISSED_KEY = "quran-public-announcement-dismissed";

export default function AnnouncementPopup() {
  const { announcements } = useStore();
  const latest = [...announcements]
    .filter((a) => a.audience === "all")
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date))[0];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!latest || typeof window === "undefined") {
      setVisible(false);
      return;
    }
    try {
      setVisible(window.localStorage.getItem(DISMISSED_KEY) !== latest.id);
    } catch {
      setVisible(true);
    }
  }, [latest?.id]);

  const dismiss = () => {
    if (latest && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(DISMISSED_KEY, latest.id);
      } catch {
        // Best-effort viewing preference only.
      }
    }
    setVisible(false);
  };

  if (!visible || !latest) return null;

  return (
    <div className="fixed inset-x-4 top-20 z-40 mx-auto max-w-lg rounded-2xl border border-[var(--gold)]/35 bg-[var(--surface)] shadow-2xl">
      <div className="flex items-start gap-3 p-5">
        <div className="w-10 h-10 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] flex items-center justify-center shrink-0">
          <BellRing size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold)]">New announcement</p>
          <h2 className="font-display text-xl mt-1 text-[var(--heading)]">{latest.title}</h2>
          <p className="text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed">{latest.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/quran/announcements"
              onClick={dismiss}
              className="px-4 py-2 rounded-full bg-[var(--primary)] text-white text-xs font-semibold"
            >
              View announcements
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="px-4 py-2 rounded-full border border-[var(--line)] text-xs font-semibold text-[var(--ink-soft)]"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Close announcement" className="text-[var(--ink-faint)] hover:text-[var(--ink)] shrink-0">
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
