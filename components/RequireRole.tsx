"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function RequireRole({
  role,
  children,
}: {
  role: "admin" | "student";
  children: React.ReactNode;
}) {
  const { auth } = useStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Give the store a tick to hydrate from sessionStorage before deciding.
    const t = setTimeout(() => {
      if (auth.role !== role) router.replace("/quran/login");
      setChecked(true);
    }, 50);
    return () => clearTimeout(t);
  }, [auth.role, role, router]);

  if (!checked || auth.role !== role) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center text-sm text-[var(--ink-faint)]">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
