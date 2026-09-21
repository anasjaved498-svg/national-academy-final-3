"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import ArchFrame from "@/components/ArchFrame";
import { KeyRound, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [tab, setTab] = useState<"student" | "admin">("student");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginStudent, loginAdmin } = useStore();
  const router = useRouter();

  const submitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = loginStudent(code);
    if (ok) router.push("/quran/portal");
    else setError("Invalid access code, or this account has been suspended. Please contact the academy.");
  };

  const submitAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = loginAdmin(password);
    if (ok) router.push("/quran/admin");
    else setError("Incorrect admin password.");
  };

  return (
    <div className="max-w-md mx-auto px-5 py-12 sm:py-16">
      <div className="flex justify-center mb-6">
        <ArchFrame tone="primary" className="w-16 h-20">
          <KeyRound size={22} />
        </ArchFrame>
      </div>
      <h1 className="font-display text-3xl text-center text-[var(--heading)]">Portal Login</h1>

      <div className="mt-8 flex rounded-full bg-[var(--primary-tint)] p-1 text-sm font-medium">
        <button
          onClick={() => { setTab("student"); setError(""); }}
          className={`flex-1 py-2 rounded-full transition-colors ${tab === "student" ? "bg-[var(--surface)] text-[var(--heading)] shadow-sm" : "text-[var(--ink-soft)]"}`}
        >
          Student / Parent
        </button>
        <button
          onClick={() => { setTab("admin"); setError(""); }}
          className={`flex-1 py-2 rounded-full transition-colors ${tab === "admin" ? "bg-[var(--surface)] text-[var(--heading)] shadow-sm" : "text-[var(--ink-soft)]"}`}
        >
          Admin
        </button>
      </div>

      {tab === "student" ? (
        <form onSubmit={submitStudent} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Student access code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. AHM-101"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1.5 text-xs text-[var(--ink-faint)]">
              Provided to you by the academy when your child enrolled.
            </p>
          </div>
          {error && <ErrorMsg text={error} />}
          <button className="w-full px-6 py-3 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-colors">
            View Results & Progress
          </button>
        </form>
      ) : (
        <form onSubmit={submitAdmin} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink)]">Admin password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
          {error && <ErrorMsg text={error} />}
          <button className="w-full px-6 py-3 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-colors">
            Enter Admin Panel
          </button>
        </form>
      )}
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-[var(--rose)] bg-[var(--rose-tint)] rounded-xl px-4 py-3">
      <AlertCircle size={16} className="mt-0.5 shrink-0" /> {text}
    </div>
  );
}
