import ArchFrame from "@/components/ArchFrame";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">About us</p>
      <h1 className="font-display text-4xl mt-2 text-[var(--heading)]">
        A physical academy, taught with care
      </h1>
      <p className="mt-6 text-[var(--ink-soft)] leading-relaxed">
        National Academy of Science & Arts is a in-person Quran academy dedicated to teaching Nazra (Quran
        reading), Tajweed (rules of recitation) and Qirat (recitation styles) to students of all
        ages. Classes are held physically at the academy, where every student receives direct,
        one-on-one attention during recitation.
      </p>
      <p className="mt-4 text-[var(--ink-soft)] leading-relaxed">
        What sets us apart is not just how we teach, but how we track progress. Every student&rsquo;s
        test results are recorded and turned into clear, honest graphs — so parents always know
        exactly where their child stands, what has improved, and what needs more attention.
      </p>

      <div className="mt-12 grid sm:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7">
          <ArchFrame tone="gold" className="w-12 h-14 mb-4">
            <span className="font-display">1</span>
          </ArchFrame>
          <h3 className="font-display text-lg text-[var(--heading)]">Our approach</h3>
          <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
            Small groups, correct makhraj from day one, and a steady progression from Nazra into
            Tajweed — with Qirat offered as an enrichment path once the fundamentals are solid.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7">
          <ArchFrame tone="gold" className="w-12 h-14 mb-4">
            <span className="font-display">2</span>
          </ArchFrame>
          <h3 className="font-display text-lg text-[var(--heading)]">Our promise to parents</h3>
          <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
            No surprises. If a student is struggling, you&rsquo;ll see it in the portal early —
            with a clear explanation, not just a grade.
          </p>
        </div>
      </div>
    </div>
  );
}
