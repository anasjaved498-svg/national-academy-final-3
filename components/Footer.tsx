import Link from "next/link";
import { Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 flex flex-col gap-10 sm:grid sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-[var(--heading)]">National Academy of Science & Arts</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
            Nurturing correct recitation and understanding of the Quran, one student at a time —
            taught in person, tracked with care.
          </p>
          <div className="mt-4 space-y-1.5 text-sm text-[var(--ink-soft)]">
            <p className="flex items-center gap-2">
              <Phone size={14} className="text-[var(--link)]" /> 0304-5884090 (Academy)
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} className="text-[var(--link)]" /> 0321-5124574 (Quran Section — Anas Javed)
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:contents">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)] mb-3">Explore</p>
            <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
              <li><Link href="/quran/courses" className="hover:text-[var(--heading)]">Courses</Link></li>
              <li><Link href="/quran/about" className="hover:text-[var(--heading)]">About the Academy</Link></li>
              <li><Link href="/quran/announcements" className="hover:text-[var(--heading)]">Announcements</Link></li>
              <li><a href="/academy.html#contact" target="_top" className="hover:text-[var(--heading)]">Contact & Enroll</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)] mb-3">Portal</p>
            <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
              <li><Link href="/quran/login" className="hover:text-[var(--heading)]">Student / Parent Login</Link></li>
              <li><Link href="/quran/login" className="hover:text-[var(--heading)]">Admin Login</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] py-5 text-center text-xs text-[var(--ink-faint)]">
        © {new Date().getFullYear()} National Academy of Science & Arts. All rights reserved.
      </div>
    </footer>
  );
}
