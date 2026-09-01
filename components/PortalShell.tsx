"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X, Globe, Home, Phone } from "lucide-react";
import Footer from "./Footer";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export default function PortalShell({
  eyebrow,
  title,
  nav,
  onLogout,
  children,
}: {
  eyebrow: string;
  title: string;
  nav: PortalNavItem[];
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10 w-full flex-1 min-w-0">
        {/* Mobile/tablet top bar. Desktop keeps the full sidebar. */}
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-[var(--ink-faint)] truncate">{eyebrow}</p>
            <p className="font-display text-lg text-[var(--heading)] truncate">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] shrink-0 shadow-sm"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-black/35 lg:hidden"
            />
            <aside
              aria-label="Portal navigation"
              className="fixed right-0 top-0 bottom-0 z-50 w-[min(88vw,340px)] bg-[var(--surface)] border-l border-[var(--line)] shadow-2xl lg:hidden overflow-y-auto overscroll-contain"
            >
              <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--line)] px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">Portal menu</p>
                  <p className="font-display text-lg text-[var(--heading)] truncate">{title}</p>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="w-9 h-9 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink)] shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="p-3 space-y-1">
                {nav.map((n) => {
                  const Icon = n.icon;
                  const active = pathname === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--ink-soft)] hover:bg-[var(--primary-tint)]"
                      }`}
                    >
                      <Icon size={17} /> {n.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mx-3 border-t border-[var(--line)] pt-3 pb-6">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--primary-tint)]"
                >
                  <Globe size={17} /> Visit Website
                </Link>
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--primary-tint)]"
                >
                  <Home size={17} /> Home
                </Link>
                <Link
                  href="/#contact"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--primary-tint)]"
                >
                  <Phone size={17} /> Contact
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--rose)] hover:bg-[var(--rose-tint)] mt-1"
                >
                  <LogOut size={17} /> Log out
                </button>
              </div>
            </aside>
          </>
        )}

        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8 min-w-0">
          {/* Desktop sidebar — unchanged navigation at lg+. */}
          <aside className="hidden lg:block lg:sticky lg:top-24 h-fit min-w-0">
            <div className="mb-6">
              <p className="text-xs text-[var(--ink-faint)]">{eyebrow}</p>
              <p className="font-display text-lg text-[var(--heading)]">{title}</p>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((n) => {
                const Icon = n.icon;
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--ink-soft)] hover:bg-[var(--primary-tint)]"
                    }`}
                  >
                    <Icon size={16} /> {n.label}
                  </Link>
                );
              })}
              <Link
                href="/"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--ink-faint)] hover:bg-[var(--primary-tint)]"
              >
                <Globe size={16} /> Visit Website
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--rose)] hover:bg-[var(--rose-tint)] mt-2"
              >
                <LogOut size={16} /> Log out
              </button>
            </nav>
          </aside>

          <div className="min-w-0 overflow-hidden">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
