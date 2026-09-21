"use client";

import { useStore } from "@/lib/store";
import { AlertTriangle, X } from "lucide-react";

/**
 * Sits at the top of every page. Makes database problems impossible to miss.
 *
 * Before this existed, a failed save was only written to the browser console,
 * so the admin would add a student, see it appear on screen, and have no idea
 * it never reached the database.
 */
export default function DbErrorBanner() {
  const { dbError, dismissDbError } = useStore();
  if (!dbError) return null;

  return (
    <div className="sticky top-0 z-50 bg-[var(--rose)] text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div className="flex-1 text-sm leading-relaxed">
          <p className="font-semibold">Database problem — your changes may not be saved</p>
          <p className="mt-1 opacity-95 break-words">{dbError}</p>
        </div>
        <button
          onClick={dismissDbError}
          aria-label="Dismiss"
          className="shrink-0 opacity-80 hover:opacity-100"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
