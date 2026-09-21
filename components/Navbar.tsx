"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { Menu, X, BookOpenText } from "lucide-react";

const links = [
  { href: "/quran", label: "Home" },
  { href: "/quran/about", label: "About" },
  { href: "/quran/courses", label: "Courses" },
  { href: "/quran/testimonials", label: "Testimonials" },
  { href: "/quran/announcements", label: "Announcements" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { auth } = useStore();

  const portalHref =
    auth.role === "admin" ? "/quran/admin" : auth.role === "student" ? "/quran/portal" : "/quran/login";
  const portalLabel =
    auth.role === "admin" ? "Admin Panel" : auth.role === "student" ? "My Portal" : "Portal Login";

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--line)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/quran" className="flex items-center gap-2 font-display text-lg text-[var(--heading)]">
          <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
            <BookOpenText size={16} />
          </span>
          Quran Section
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link href="/" className="text-[var(--ink-faint)] hover:text-[var(--heading)] transition-colors">
            ← Main Site
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition-colors ${
                pathname === l.href
                  ? "text-[var(--heading)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--heading)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="/academy.html#contact"
            target="_top"
            className="text-[var(--ink-soft)] hover:text-[var(--heading)] transition-colors"
          >
            Contact
          </a>
          <Link
            href={portalHref}
            className="px-4 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            {portalLabel}
          </Link>
        </nav>

        <button
          className="md:hidden text-[var(--ink)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--line)] bg-[var(--surface)] px-4 sm:px-5 py-4 flex flex-col gap-3 text-sm">
          <Link href="/" onClick={() => setOpen(false)} className="py-1 text-[var(--ink-faint)]">
            ← Main Site
          </Link>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-1 text-[var(--ink-soft)]">
              {l.label}
            </Link>
          ))}
          <a
            href="/academy.html#contact"
            target="_top"
            onClick={() => setOpen(false)}
            className="py-1 text-[var(--ink-soft)]"
          >
            Contact
          </a>
          <Link
            href={portalHref}
            onClick={() => setOpen(false)}
            className="mt-2 text-center px-4 py-2 rounded-full bg-[var(--primary)] text-white font-medium"
          >
            {portalLabel}
          </Link>
        </div>
      )}
    </header>
  );
}
