"use client";

import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import PortalShell from "@/components/PortalShell";
import { useStore } from "@/lib/store";
import { LayoutDashboard, Users, SlidersHorizontal, Megaphone, FileQuestion, Star, Activity } from "lucide-react";

const nav = [
  { href: "/quran/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quran/admin/students", label: "Students", icon: Users },
  { href: "/quran/admin/performance", label: "Daily Performance", icon: Activity },
  { href: "/quran/admin/tests", label: "Online Tests", icon: FileQuestion },
  { href: "/quran/admin/criteria", label: "Passing Criteria", icon: SlidersHorizontal },
  { href: "/quran/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/quran/admin/reviews", label: "Testimonials", icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <AdminShell>{children}</AdminShell>
    </RequireRole>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout } = useStore();
  const router = useRouter();

  return (
    <PortalShell
      eyebrow="Signed in as"
      title="Administrator"
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
