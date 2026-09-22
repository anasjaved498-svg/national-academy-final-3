"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import PortalShell from "@/components/PortalShell";
import { useStore } from "@/lib/store";
import { LayoutDashboard, LineChart, FileText, Megaphone, ClipboardList, Award, Activity, Wallet, Mic, StickyNote, Gift, BadgeDollarSign, BellRing } from "lucide-react";
import { portalAccess } from "@/lib/types";
import { getSeenIds } from "@/lib/seenTracker";

const baseNav = [
  { href: "/quran/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quran/portal/results", label: "Results", icon: FileText },
  { href: "/quran/portal/audio", label: "Recitation Audio", icon: Mic },
  { href: "/quran/portal/progress", label: "Progress", icon: LineChart },
  { href: "/quran/portal/performance", label: "Daily Performance", icon: Activity },
];
const testsNav = [
  { href: "/quran/portal/tests", label: "Online Tests", icon: ClipboardList },
  { href: "/quran/portal/test-results", label: "Test Results", icon: Award },
];
const tailNav = [
  { href: "/quran/portal/fines", label: "Fines", icon: Wallet },
  { href: "/quran/portal/notes", label: "Notes", icon: StickyNote },
  { href: "/quran/portal/gifts", label: "Gifts", icon: Gift },
  { href: "/quran/portal/fees", label: "Fees", icon: BadgeDollarSign },
  { href: "/quran/portal/announcements", label: "Announcements", icon: Megaphone },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="student">
      <PortalShellWrapper>{children}</PortalShellWrapper>
    </RequireRole>
  );
}

function PortalShellWrapper({ children }: { children: React.ReactNode }) {
  const { logout, students, auth, announcements, exams, notes, gifts, fees, attempts } = useStore();
  const router = useRouter();
  const student = students.find((s) => s.id === auth.studentId);
  const access = student ? portalAccess(student) : null;

  // Recomputed on every render from localStorage — cheap, and it means the
  // dot disappears immediately after visiting the page without needing a
  // page reload (the announcements/tests pages call markSeen() on mount).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Re-check once shortly after mount, in case a page's markSeen() call
    // (also on mount) hasn't run yet on first paint.
    const t = setTimeout(() => setTick((v) => v + 1), 300);
    return () => clearTimeout(t);
  }, []);

  let hasNewAnnouncement = false;
  let hasNewTest = false;
  let hasNewTestResult = false;
  let hasNewNote = false;
  let hasNewResult = false;
  let hasNewGift = false;
  let hasNewFee = false;
  let hasNewAnnouncementMessage: string | null = null;
  if (student) {
    const relevantAnnouncements = announcements.filter(
      (a) => a.audience === "all" || a.audience === student.id
    );
    const seenAnnouncementIds = getSeenIds("announcements", student.id);
    hasNewAnnouncement = relevantAnnouncements.some((a) => !seenAnnouncementIds.has(a.id));

    const relevantExams = exams.filter((e) => e.isPublished && student.sections.includes(e.section));
    const seenTestIds = getSeenIds("tests", student.id);
    hasNewTest = relevantExams.some((e) => !seenTestIds.has(e.id));

    const relevantNotes = notes.filter(
      (n) => (n.audience === "all" || n.audience === student.id) && student.sections.includes(n.section)
    );
    const seenNoteIds = getSeenIds("notes", student.id);
    hasNewNote = relevantNotes.some((n) => !seenNoteIds.has(n.id));

    const relevantResults = student.results;
    const seenResultIds = getSeenIds("results", student.id);
    hasNewResult = relevantResults.some((r) => !seenResultIds.has(r.id));

    const relevantAttempts = attempts.filter((a) => a.studentId === student.id && a.status !== "in_progress");
    const seenTestResultIds = getSeenIds("test-results", student.id);
    hasNewTestResult = relevantAttempts.some((a) => !seenTestResultIds.has(a.id));

    const relevantGifts = gifts.filter((g) => g.studentId === student.id && student.sections.includes(g.section));
    hasNewGift = relevantGifts.some((g) => !getSeenIds("gifts", student.id).has(g.id)) || !getSeenIds("features", student.id).has("gifts-v1");

    const relevantFees = fees.filter((f) => f.studentId === student.id && student.sections.includes(f.section));
    hasNewFee = relevantFees.some((f) => !getSeenIds("fees", student.id).has(f.id)) || !getSeenIds("features", student.id).has("fees-v1");

    const unreadAnnouncement = relevantAnnouncements.find((a) => !seenAnnouncementIds.has(a.id));
    hasNewAnnouncementMessage = unreadAnnouncement ? `New announcement: ${unreadAnnouncement.title}` : null;
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  void tick;

  const nav = [
    ...baseNav.filter((n) => {
      if (n.href === "/quran/portal/audio") return access?.showAudio ?? false;
      if (n.href === "/quran/portal/results") return access?.showResults ?? false;
      if (n.href === "/quran/portal/progress") return access?.showProgress ?? false;
      return true;
    }).map((n) => n.href === "/quran/portal/results" ? { ...n, badge: hasNewResult } : n),
    ...(access?.showTests
      ? testsNav.map((n) => n.href === "/quran/portal/tests"
        ? { ...n, badge: hasNewTest }
        : n.href === "/quran/portal/test-results"
        ? { ...n, badge: hasNewTestResult }
        : n)
      : []),
    ...tailNav.map((n) => {
      if (n.href === "/quran/portal/announcements") return { ...n, badge: hasNewAnnouncement };
      if (n.href === "/quran/portal/notes") return { ...n, badge: hasNewNote };
      if (n.href === "/quran/portal/gifts") return { ...n, badge: hasNewGift };
      if (n.href === "/quran/portal/fees") return { ...n, badge: hasNewFee };
      return n;
    }),
  ];

  return (
    <PortalShell
      eyebrow="Welcome,"
      title={student?.name ?? "Student"}
      nav={nav}
      onLogout={() => {
        logout();
        router.push("/quran");
      }}
    >
      {student && (hasNewAnnouncement || hasNewResult || hasNewNote || hasNewTest || hasNewTestResult || hasNewGift || hasNewFee) && (
        <div className="mb-5 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] px-4 py-3 flex items-start gap-3">
          <BellRing size={17} className="text-[var(--gold)] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--heading)]">{hasNewAnnouncementMessage ?? "You have new portal updates."}</p>
            <p className="text-xs text-[var(--ink-soft)] mt-1">Open the red-marked section to view the new item.</p>
          </div>
        </div>
      )}
      {children}
    </PortalShell>
  );
}
