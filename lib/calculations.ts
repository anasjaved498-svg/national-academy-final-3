import { Subject, TestResult, TestResultEntry, Course, COURSE_CONFIG } from "./types";

export function pct(entry: TestResultEntry | null | undefined): number | null {
  if (!entry || entry.total === 0) return null;
  return Math.round((entry.obtained / entry.total) * 1000) / 10;
}

/**
 * Builds a full TestResult with all derived fields from raw marks.
 * Which subjects are required (and therefore count toward pass/fail)
 * depends entirely on the student's course:
 *  - "Nurani Qaida" -> only nuraniQaida is required
 *  - "Nazra"        -> only nazra is required
 *  - "Tajweed"      -> only tajweed is required
 *  - "Qirat"        -> nothing required; qiratBonus is just a bonus number
 *  - "All"          -> nazra + tajweed required, qiratBonus is a bonus on top
 * qiratBonus is never entered as obtained/total — it's a single number the
 * admin assigns after listening, and it only ever adds to the overall score.
 */
export function computeResult(input: {
  id: string;
  testNumber: number;
  paperNumber: string;
  date: string;
  course: Course;
  nuraniQaida: TestResultEntry | null;
  nazra: TestResultEntry | null;
  tajweed: TestResultEntry | null;
  qiratBonus: number | null;
  requiredPercent: number;
}): TestResult {
  const config = COURSE_CONFIG[input.course];

  const nuraniQaidaPercent = pct(input.nuraniQaida);
  const nazraPercent = pct(input.nazra);
  const tajweedPercent = pct(input.tajweed);

  const percentBySubject: Record<Subject, number | null> = {
    nuraniQaida: nuraniQaidaPercent,
    nazra: nazraPercent,
    tajweed: tajweedPercent,
  };
  const entryBySubject: Record<Subject, TestResultEntry | null> = {
    nuraniQaida: input.nuraniQaida,
    nazra: input.nazra,
    tajweed: input.tajweed,
  };

  const failedSubjects: Subject[] = config.requiredSubjects.filter(
    (subj) => (percentBySubject[subj] ?? 0) < input.requiredPercent
  );

  let overallObtained = 0;
  let overallTotal = 0;
  for (const subj of config.requiredSubjects) {
    const entry = entryBySubject[subj];
    if (entry) {
      overallObtained += entry.obtained;
      overallTotal += entry.total;
    }
  }
  if (config.showQiratBonus && input.qiratBonus) {
    overallObtained += input.qiratBonus;
  }

  const overallPercent = overallTotal > 0 ? Math.round((overallObtained / overallTotal) * 1000) / 10 : 0;

  return {
    id: input.id,
    testNumber: input.testNumber,
    paperNumber: input.paperNumber,
    date: input.date,
    nuraniQaida: input.nuraniQaida,
    nazra: input.nazra,
    tajweed: input.tajweed,
    qiratBonus: input.qiratBonus,
    requiredPercent: input.requiredPercent,
    nuraniQaidaPercent,
    nazraPercent,
    tajweedPercent,
    overallObtained,
    overallTotal,
    overallPercent,
    status: failedSubjects.length > 0 ? "fail" : "pass",
    failedSubjects,
  };
}

/**
 * Recomputes the consecutive-fail streak from a chronological results list.
 * A pass resets the streak to 0 (only *consecutive* fails count).
 */
export function computeConsecutiveFails(results: TestResult[]): number {
  const sorted = [...results].sort((a, b) => a.testNumber - b.testNumber);
  let streak = 0;
  for (const r of sorted) {
    if (r.status === "fail") streak += 1;
    else streak = 0;
  }
  return streak;
}

export type WarningLevel = "none" | "warning" | "reject";

export function warningLevelForStreak(streak: number): WarningLevel {
  if (streak >= 3) return "reject";
  if (streak === 2) return "warning";
  return "none";
}
