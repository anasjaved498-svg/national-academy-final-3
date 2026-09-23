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

/**
 * Performance weeks are Monday-Sunday.
 *
 * For a month whose first day is not Monday, the performance cycle starts on
 * the first Monday in that month. This gives a clean weekly cycle for the
 * admin portal. Example for September 2026:
 *   Week 1 = Sep 7-13
 *   Week 2 = Sep 14-20
 *   Week 3 = Sep 21-27
 *   Week 4 = Sep 28-Oct 4
 */
export function monthWeekRanges(monthKey: string): { start: string; end: string }[] {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));

  // 0 = Sunday, 1 = Monday, ... 6 = Saturday.
  const daysUntilMonday = (8 - firstDay.getUTCDay()) % 7;
  const firstMonday = new Date(firstDay);
  firstMonday.setUTCDate(firstMonday.getUTCDate() + daysUntilMonday);

  return Array.from({ length: 4 }, (_, index) => {
    const start = new Date(firstMonday);
    start.setUTCDate(firstMonday.getUTCDate() + index * 7);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  });
}

function isoDates(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);

  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Builds the 4-week performance summary.
 *
 * Rules:
 * 1. Every new week starts at WEEK_START_SCORE (70), so Week 3 does not
 *    continue from the ending score of Week 2.
 * 2. A completed past week gets an `average` rating (-1) for any missing day.
 *    This lets the graph finish the week instead of stopping on the last day
 *    that happened to have a recorded rating.
 * 3. The current week is never back-filled; only ratings actually entered are
 *    shown and scored.
 * 4. Only completed weeks can create an automatic performance fine.
 */
export function buildMonthSummary(
  monthKey: string,
  entries: DailyRatingEntry[]
): { weeks: WeekSummary[]; totalFines: number } {
  const ranges = monthWeekRanges(monthKey);
  const byDate = new Map(entries.map((entry) => [entry.date, entry.rating]));
  const today = new Date().toISOString().slice(0, 10);
  let offenseCount = 0;

  const weeks = ranges.map((range, index) => {
    let score = WEEK_START_SCORE;
    let wentBelowRedLine = false;
    let recovered = false;
    const dailyScores: WeekSummary["dailyScores"] = [];

    const completed = range.end < today;
    const dates = isoDates(range.start, range.end);

    for (const iso of dates) {
      let rating = byDate.get(iso);

      // Only completed weeks receive automatic average ratings for missing
      // days. Future/current missing days remain genuinely unrecorded.
      if (!rating && completed) {
        rating = "average";
      }

      if (!rating) continue;

      score = clamp(score + RATING_DELTA[rating]);

      if (score < PERFORMANCE_RED_LINE) {
        wentBelowRedLine = true;
      } else if (wentBelowRedLine) {
        recovered = true;
      }

      dailyScores.push({ date: iso, rating, score });
    }

    const endedBelowRedLine = score < PERFORMANCE_RED_LINE;
    const fined = completed && endedBelowRedLine;
    let fineAmount = 0;

    if (fined) {
      fineAmount = FINE_SCHEDULE[Math.min(offenseCount, FINE_SCHEDULE.length - 1)];
      offenseCount += 1;
    }

    return {
      weekNumber: (index + 1) as 1 | 2 | 3 | 4,
      startDate: range.start,
      endDate: range.end,
      score,
      dailyScores,
      fined,
      fineAmount,
      recoveredBeforeWeekEnd: recovered && !endedBelowRedLine,
      completed,
    };
  });

  return {
    weeks,
    totalFines: weeks.reduce((sum, week) => sum + week.fineAmount, 0),
  };
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}
