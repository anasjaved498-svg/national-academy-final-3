import Link from "next/link";
import { ArrowRight, LineChart, ShieldCheck, Users } from "lucide-react";
import ArchFrame from "@/components/ArchFrame";

const courses = [
  {
    name: "Nazra",
    tagline: "Reading the Quran with correct pronunciation, letter by letter.",
    level: "Beginner",
  },
  {
    name: "Tajweed",
    tagline: "The rules that give recitation its rhythm, precision and beauty.",
    level: "Intermediate",
  },
  {
    name: "Qirat",
    tagline: "Melodic recitation styles — an enrichment track for advanced students.",
    level: "Advanced · Bonus",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pattern-dots">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 sm:pt-16 pb-12 sm:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="animate-fadeUp">
            <h1 className="font-display text-[clamp(2.1rem,9vw,3.15rem)] sm:text-5xl leading-[1.06] mt-0 sm:mt-5 text-[var(--heading)] max-w-[12ch]">
              Every letter matters.
              <br /> Every student is tracked.
            </h1>
            <p className="mt-4 sm:mt-5 text-[var(--ink-soft)] text-base sm:text-lg leading-[1.7] max-w-lg">
              National Academy of Science & Arts teaches Nazra, Tajweed and Qirat in person — and gives every
              parent a clear, honest window into their child&rsquo;s progress online.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/academy.html#contact"
                target="_top"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-colors"
              >
                Enroll a Student <ArrowRight size={16} />
              </a>
              <Link
                href="/quran/login"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3 rounded-full border border-[var(--line)] bg-[var(--surface)] font-medium hover:border-[var(--primary)] transition-colors"
              >
                View Student Portal
              </Link>
              <Link
                href="/quran/reviews"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3 rounded-full border border-[var(--line)] bg-[var(--surface)] font-medium hover:border-[var(--primary)] transition-colors"
              >
                Read Reviews
              </Link>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-md">
              <Stat label="Students taught" value="150+" />
              <Stat label="Years teaching" value="8+" />
              <Stat label="Core subjects" value="3" />
            </div>
          </div>

          <div className="flex justify-center animate-fadeUp">
            <ArchFrame tone="primary" className="w-52 h-64 sm:w-80 sm:h-96 shadow-xl">
              <span className="font-arabic text-5xl sm:text-7xl leading-none px-6 text-center">
                اقرأ
              </span>
            </ArchFrame>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">What we teach</p>
            <h2 className="font-display text-2xl sm:text-3xl mt-2 text-[var(--heading)]">Three subjects, one path</h2>
          </div>
          <Link href="/quran/courses" className="text-sm font-medium text-[var(--link)] hover:underline">
            View full syllabus →
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.name}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 hover:shadow-lg transition-shadow"
            >
              <ArchFrame tone="gold" className="w-14 h-16 mb-5">
                <span className="font-display text-xl">{c.name[0]}</span>
              </ArchFrame>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{c.level}</p>
              <h3 className="font-display text-xl mt-1 text-[var(--heading)]">{c.name}</h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">{c.tagline}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why the portal */}
      <section className="bg-[var(--primary-tint)] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 grid lg:grid-cols-3 gap-5 sm:gap-8">
          <Feature
            icon={<LineChart size={20} />}
            title="Real progress, in graphs"
            body="Every test result feeds a live chart — parents see growth in Nazra and Tajweed over time, not just a single number."
          />
          <Feature
            icon={<ShieldCheck size={20} />}
            title="Honest pass/fail rules"
            body="Nazra and Tajweed must individually meet the passing mark. Qirat is a bonus that only ever adds — never subtracts."
          />
          <Feature
            icon={<Users size={20} />}
            title="Built for parents too"
            body="Result pages are written for parents, not just students — clear, respectful, and easy to understand at a glance."
          />
        </div>
      </section>

      {/* Teacher */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-12 sm:pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Your Instructor</p>
          <h2 className="font-display text-2xl sm:text-3xl mt-2 text-[var(--heading)]">Meet Your Quran Teacher</h2>
        </div>
        <div className="max-w-md mx-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8 text-center hover:shadow-lg transition-shadow animate-fadeUp">
          <ArchFrame tone="primary" className="w-20 h-24 mx-auto">
            <span className="font-display text-2xl">AJ</span>
          </ArchFrame>
          <h3 className="font-display text-xl mt-4 text-[var(--heading)]">Anas Javed</h3>
          <p className="text-sm text-[var(--gold)] font-medium mt-1">Nazra, Tajweed & Qirat Instructor</p>
          <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
            Teaches Nazra, Tajweed and Qirat in person at the academy, with a focus on correct
            makhraj from the very first lesson and honest, structured progress tracking for every
            student.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 text-center">
        <h2 className="font-display text-2xl sm:text-3xl text-[var(--heading)]">
          Ready to begin your child&rsquo;s journey with the Quran?
        </h2>
        <p className="mt-3 text-[var(--ink-soft)]">
          Visit the academy in person, or send an inquiry and we&rsquo;ll get back to you.
        </p>
        <a
          href="/academy.html#contact"
          target="_top"
          className="inline-flex items-center gap-2 mt-7 px-7 py-3 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-colors"
        >
          Get in touch <ArrowRight size={16} />
        </a>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xl sm:text-2xl text-[var(--heading)]">{value}</p>
      <p className="text-[10px] sm:text-xs text-[var(--ink-faint)] mt-1 leading-tight">{label}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl p-7 border border-[var(--line)]">
      <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-display text-lg mt-4 text-[var(--heading)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">{body}</p>
    </div>
  );
}
