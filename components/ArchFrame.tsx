import { ReactNode } from "react";

export default function ArchFrame({
  children,
  className = "",
  tone = "primary",
}: {
  children: ReactNode;
  className?: string;
  tone?: "primary" | "gold" | "surface";
}) {
  const tones: Record<string, string> = {
    primary: "bg-[var(--primary)] text-white",
    gold: "bg-[var(--gold-soft)] text-[var(--heading)]",
    surface: "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]",
  };
  return (
    <div
      className={`arch flex items-center justify-center ${tones[tone]} ${className}`}
      style={{ borderRadius: "999px 999px 14px 14px" }}
    >
      {children}
    </div>
  );
}
