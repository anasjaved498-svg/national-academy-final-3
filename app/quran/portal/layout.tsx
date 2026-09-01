"use client";

import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import PortalShell from "@/components/PortalShell";
import { useStore } from "@/lib/store";
import { LayoutDashboard, LineChart, FileText, Megaphone, ClipboardList, Award, Activity, Wallet, Mic } from "lucide-react";
import { portalAccess } from "@/lib/types";

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
  const { logout, students, auth } = useStore();
  const router = useRouter();
  const student = students.find((s) => s.id === auth.studentId);
  const access = student ? portalAccess(student) : null;
  const nav = [
    ...baseNav.filter((n) => {
      if (n.href === "/quran/portal/audio") return access?.showAudio ?? false;
      if (n.href === "/quran/portal/results") return access?.showResults ?? false;
      if (n.href === "/quran/portal/progress") return access?.showProgress ?? false;
      return true;
    }),
    ...(access?.showTests ? testsNav : []),
    ...tailNav,
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
      {children}
    </PortalShell>
  );
}
