import ArchFrame from "@/components/ArchFrame";
import { CheckCircle2 } from "lucide-react";

const courses = [
  {
    name: "Nazra",
    level: "Beginner",
    required: true,
    description:
      "The foundation course — learning to read the Quran directly from the mus'haf with correct pronunciation (makhraj) of every letter.",
    topics: [
      "Arabic alphabet and correct articulation points",
      "Joining letters and reading fluently",
      "Basic recitation rules introduced gradually",
      "Daily reading practice with the teacher",
    ],
  },
  {
    name: "Tajweed",
    level: "Intermediate",
    required: true,
    description:
      "The rules that shape how the Quran is recited correctly — timing, elongation, and the proper sound of each letter in context.",
    topics: [
      "Rules of Noon Sakinah and Tanween",
      "Rules of Meem Sakinah",
      "Madd (elongation) rules",
      "Qalqalah and letter-specific rules",
      "Applied recitation with correction",
    ],
  },
  {
    name: "Qirat",
    level: "Advanced · Bonus track",
    required: false,
    description:
      "An enrichment track for students who have a strong grasp of Tajweed — focused on melodic, measured recitation. Qirat marks are bonus only and are never required to pass.",
    topics: [
      "Recitation styles and vocal control",
      "Pacing, pausing and breath control",
      "Group and individual recitation practice",
    ],
  },
];

export default function Courses() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Courses</p>
      <h1 className="font-display text-4xl mt-2 text-[var(--heading)]">What your child will learn</h1>
      <p className="mt-4 text-[var(--ink-soft)] max-w-2xl leading-relaxed">
        Nazra and Tajweed are the two core, required subjects — a student must meet the passing
        standard in both. Qirat is offered as an optional bonus subject that only ever adds extra
        marks.
      </p>

      <div className="mt-12 space-y-8">
        {courses.map((c) => (
          <div key={c.name} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 flex flex-col sm:flex-row gap-7">
            <ArchFrame tone="primary" className="w-16 h-20 shrink-0">
              <span className="font-display text-2xl">{c.name[0]}</span>
            </ArchFrame>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-display text-2xl text-[var(--heading)]">{c.name}</h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{c.level}</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    c.required
                      ? "bg-[var(--primary-tint)] text-[var(--heading)]"
                      : "bg-[var(--gold-soft)] text-[var(--gold)]"
                  }`}
                >
                  {c.required ? "Required" : "Bonus"}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">{c.description}</p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                {c.topics.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[var(--ink-soft)]">
                    <CheckCircle2 size={15} className="mt-0.5 text-[var(--link)] shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
