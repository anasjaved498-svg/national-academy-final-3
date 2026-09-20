"use client";

// Tracks which announcement/test ids a student has already seen, so the
// portal nav can show a small "new" dot without needing a real
// notifications system. This is deliberately kept in localStorage, not
// Supabase — it's a per-device viewing convenience, not student data, and
// it's fine if it resets when a student switches devices or clears their
// browser.

function storageKey(kind: string, studentId: string) {
  return `quran-seen-${kind}-${studentId}`;
}

export function getSeenIds(kind: string, studentId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(kind, studentId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markSeen(kind: string, studentId: string, ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const existing = getSeenIds(kind, studentId);
    ids.forEach((id) => existing.add(id));
    window.localStorage.setItem(storageKey(kind, studentId), JSON.stringify([...existing]));
  } catch {
    // Best-effort only — a badge that doesn't clear is a minor annoyance,
    // never worth crashing the page over.
  }
}
