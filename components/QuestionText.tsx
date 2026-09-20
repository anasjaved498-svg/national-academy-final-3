// Question text authors wrap the Quranic word/phrase being asked about in
// plain double quotes, e.g. `"يَوۡمِ الدِّينِ" — کیا اس میں حرفِ مدّہ ہے؟`.
// This splits on those quotes and renders the quoted part bigger and bold
// so the actual Quranic text a student needs to read stands out clearly
// from the surrounding Urdu question — most students found the plain
// version hard to pick out at a glance.
export default function QuestionText({ text }: { text: string }) {
  const parts = text.split('"');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-bold text-xl sm:text-2xl mx-1 align-middle">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
