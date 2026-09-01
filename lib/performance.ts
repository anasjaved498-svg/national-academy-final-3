import { DailyRating, DailyRatingEntry, WeekSummary } from "./types";

export const PERFORMANCE_RED_LINE = 40;
export const WEEK_START_SCORE = 70;
export const FINE_SCHEDULE = [50, 70, 90, 100]; // 1st, 2nd, 3rd, 4th offense this month

const RATING_DELTA: Record<DailyRating, number> = {
  excellent: 5,
  average: -1,
  not_good: -8,
};

export const RATING_LABEL: Record<DailyRating, string> = {
  excellent: "Excellent",
  average: "Average",
  not_good: "Not Good",
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/** Splits a month (YYYY-MM) into 4 fixed 7-day windows starting the 1st. */
export function monthWeekRanges(monthKey: string): { start: string; end: string }[] {
  const [y, m] = monthKey.split("-").map(Number);
  const ranges: { start: string; end: string }[] = [];
  for (let w = 0; w < 4; w++) {
    const start = new Date(Date.UTC(y, m - 1, 1 + w * 7));
    const end = new Date(Date.UTC(y, m - 1, 1 + w * 7 + 6));
    ranges.push({ start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
  }
  return ranges;
}

/**
 * Builds the 4-week performance summary for a student's given month from their
 * raw daily ratings. Each week starts at a baseline score; each day's rating
 * nudges it up/down. A week that ENDS below the red line is fined, escalating
 * per how many times this has happened already this month. If the score climbs
 * back above the red line before the week ends, that week is not fined even if
 * it dipped below mid-week (recovery avoids the fine).
 */
export function buildMonthSummary(
  monthKey: string,
  entries: DailyRatingEntry[]
): { weeks: WeekSummary[]; totalFines: number } {
  const ranges = monthWeekRanges(monthKey);
  const byDate = new Map(entries.map((e) => [e.date, e.rating]));
  let offenseCount = 0;

  const weeks: WeekSummary[] = ranges.map((range, idx) => {
    let score = WEEK_START_SCORE;
    let wentBelowRedLine = false;
    let recovered = false;
    const dailyScores: WeekSummary["dailyScores"] = [];

    const start = new Date(range.start + "T00:00:00Z");
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + d);
      const iso = date.toISOString().slice(0, 10);
      const rating = byDate.get(iso);
      if (rating) {
        score = clamp(score + RATING_DELTA[rating]);
        if (score < PERFORMANCE_RED_LINE) wentBelowRedLine = true;
        else if (wentBelowRedLine) recovered = true;
        dailyScores.push({ date: iso, rating, score });
      }
    }

    const endedBelowRedLine = score < PERFORMANCE_RED_LINE;
    const fined = endedBelowRedLine; // only an unrecovered end-of-week dip is fined
    let fineAmount = 0;
    if (fined) {
      fineAmount = FINE_SCHEDULE[Math.min(offenseCount, FINE_SCHEDULE.length - 1)];
      offenseCount += 1;
    }

    return {
      weekNumber: (idx + 1) as 1 | 2 | 3 | 4,
      startDate: range.start,
      endDate: range.end,
      score,
      dailyScores,
      fined,
      fineAmount,
      recoveredBeforeWeekEnd: recovered && !endedBelowRedLine,
    };
  });

  return { weeks, totalFines: weeks.reduce((sum, w) => sum + w.fineAmount, 0) };
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}
