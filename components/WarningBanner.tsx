import { Student } from "@/lib/types";
import { AlertTriangle, Ban } from "lucide-react";

export default function WarningBanner({ student }: { student: Student }) {
  if (student.status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-[var(--rose-tint)] border border-[var(--rose)]/30 p-5">
        <Ban size={20} className="text-[var(--rose)] mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-[var(--rose)]">Portal access suspended</p>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            {student.name} has not met the required passing standard in Nazra/Tajweed for three
            consecutive tests. Please contact the academy directly to discuss next steps.
          </p>
        </div>
      </div>
    );
  }

  if (student.consecutiveFails === 2) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-[var(--gold-soft)] border border-[var(--gold)]/30 p-5">
        <AlertTriangle size={20} className="text-[var(--gold)] mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-[var(--heading)]">Notice: second consecutive fail</p>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Dear Parent, {student.name} has not met the required passing marks in Nazra and/or
            Tajweed for two tests in a row. One further fail may lead to removal from the academy
            portal. Extra practice at home is strongly encouraged before the next test.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
