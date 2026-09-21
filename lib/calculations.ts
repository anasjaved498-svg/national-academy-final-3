import { Subject, TestResult, TestResultEntry, ResultField, Course, COURSE_CONFIG } from "./types";

export function pct(entry: TestResultEntry | null | undefined): number | null {
  if (!entry || entry.total === 0) return null;
  return Math.round((entry.obtained / entry.total) * 1000) / 10;
}

/**
 * Performance label for any complete-result field. This is informational only;
 * final Pass/Fail is decided from the overall percentage below.
 */
export type ResultPerformance = "Excellent" | "Good" | "Average" | "Not Good";

export function resultPerformance(obtained: number, total: number): ResultPerformance | null {
  if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0) return null;
  const percentage = (obtained / total) * 100;
  if (percentage >= 80) return "Excellent";
  if (percentage >= 60) return "Good";
  if (percentage >= 40) return "Average";
  return "Not Good";
}

export function getOverallResultStatus(result: Pick<TestResult, "overallObtained" | "overallTotal" | "requiredPercent">): "pass" | "fail" {
  if (result.overallTotal <= 0) return "fail";
  const overallPercentage = (result.overallObtained / result.overallTotal) * 100;
  return overallPercentage >= result.requiredPercent ? "pass" : "fail";
}

/**
 * Returns the flexible result rows used by the Complete Result screen.
 * Older records did not have resultFields, so they are reconstructed from
 * their existing fixed subject fields for backwards compatibility.
 */
export function getResultFields(result: TestResult): ResultField[] {
  if (Array.isArray(result.resultFields) && result.resultFields.length > 0) {
    return result.resultFields;
  }

  const fields: ResultField[] = [];
  if (result.nuraniQaida) {
    fields.push({ id: `legacy-nurani-${result.id}`, name: "Nurani Qaida", ...result.nuraniQaida });
  }
  if (result.nazra) {
    fields.push({ id: `legacy-nazra-${result.id}`, name: "Nazra", ...result.nazra });
  }
  if (result.tajweed) {
    fields.push({ id: `legacy-tajweed-${result.id}`, name: "Tajweed", ...result.tajweed });
  }
  return fields;
}

function normalizeFieldName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function standardEntry(fields: ResultField[], name: string): TestResultEntry | null {
  const target = normalizeFieldName(name);
  const field = fields.find((f) => normalizeFieldName(f.name) === target);
  return field ? { obtained: field.obtained, total: field.total } : null;
}

/**
 * Builds a full TestResult from the flexible set of Complete Result rows.
 * Every selected row contributes to the overall obtained/total calculation.
 * Nazra/Tajweed/Nurani Qaida remain the existing pass/fail subjects when
 * present; removing a subject simply removes it from this result instead of
 * treating the missing field as a failure.
 *
 * Qirat remains the existing bonus-only number and is intentionally kept out
 * of the dynamic obtained/total fields.
 */
export function computeResult(input: {
  id: string;
  testNumber: number;
  paperNumber: string;
  date: string;
  course: Course;
  resultFields: ResultField[];
  qiratBonus: number | null;
  requiredPercent: number; // overall
  // Optional per-subject overrides — a subject not listed here is judged
  // against requiredPercent (overall) instead.
  subjectRequiredPercents?: Partial<Record<Subject, number>>;
}): TestResult {
  const config = COURSE_CONFIG[input.course];
  const resultFields = input.resultFields
    .map((field, index) => ({
      ...field,
      id: field.id || `${input.id}-field-${index + 1}`,
      name: field.name.trim(),
      obtained: Number.isFinite(field.obtained) ? field.obtained : 0,
      total: Number.isFinite(field.total) ? field.total : 0,
    }))
    .filter((field) => field.name && field.total > 0);

  const nuraniQaida = standardEntry(resultFields, "Nurani Qaida");
  const nazra = standardEntry(resultFields, "Nazra");
  const tajweed = standardEntry(resultFields, "Tajweed");

  const nuraniQaidaPercent = pct(nuraniQaida);
  const nazraPercent = pct(nazra);
  const tajweedPercent = pct(tajweed);

  const percentBySubject: Record<Subject, number | null> = {
    nuraniQaida: nuraniQaidaPercent,
    nazra: nazraPercent,
    tajweed: tajweedPercent,
  };
  const entryBySubject: Record<Subject, TestResultEntry | null> = {
    nuraniQaida: nuraniQaida,
    nazra,
    tajweed,
  };

  // Only subjects that were actually included in this result can fail, and
  // each is judged against its own threshold if one was set, otherwise the
  // overall passing %.
  const failedSubjects: Subject[] = config.requiredSubjects.filter((subj) => {
    if (entryBySubject[subj] == null) return false;
    const threshold = input.subjectRequiredPercents?.[subj] ?? input.requiredPercent;
    return (percentBySubject[subj] ?? 0) < threshold;
  });

  let overallObtained = resultFields.reduce((sum, field) => sum + field.obtained, 0);
  const overallTotal = resultFields.reduce((sum, field) => sum + field.total, 0);
  if (config.showQiratBonus && input.qiratBonus) {
    overallObtained += input.qiratBonus;
  }

  const overallPercent = overallTotal > 0 ? Math.round((overallObtained / overallTotal) * 1000) / 10 : 0;
  // Advanced mode: passing requires BOTH the overall % to clear its own bar
  // AND no individual required subject falling under its own bar.
  const overallStatus: "pass" | "fail" =
    overallTotal > 0 && (overallObtained / overallTotal) * 100 >= input.requiredPercent && failedSubjects.length === 0
      ? "pass"
      : "fail";

  return {
    id: input.id,
    testNumber: input.testNumber,
    paperNumber: input.paperNumber,
    date: input.date,
    resultFields,
    nuraniQaida,
    nazra,
    tajweed,
    qiratBonus: input.qiratBonus,
    requiredPercent: input.requiredPercent,
    subjectRequiredPercents: input.subjectRequiredPercents,
    nuraniQaidaPercent,
    nazraPercent,
    tajweedPercent,
    overallObtained,
    overallTotal,
    overallPercent,
    status: overallStatus,
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
