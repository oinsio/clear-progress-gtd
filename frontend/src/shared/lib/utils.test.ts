import { describe, it, expect } from "vitest";
import { formatCompletedAt } from "./utils";

function buildISOForTodayAt(hours: number, minutes: number): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function buildISOForYesterdayAt(hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function buildISOForDaysAgoAt(daysAgo: number, hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

describe("formatCompletedAt", () => {
  it("should return empty string for empty input", () => {
    expect(formatCompletedAt("")).toBe("");
  });

  it("should show 'Сегодня' with time for today's completion", () => {
    const todayISO = buildISOForTodayAt(21, 58);
    const result = formatCompletedAt(todayISO);
    expect(result).toMatch(/^Завершено: Сегодня \d{2}:\d{2}$/);
  });

  it("should show 'Вчера' with time for yesterday's completion", () => {
    const yesterdayISO = buildISOForYesterdayAt(14, 30);
    const result = formatCompletedAt(yesterdayISO);
    expect(result).toMatch(/^Завершено: Вчера \d{2}:\d{2}$/);
  });

  it("should show date and time for older completions", () => {
    const olderISO = buildISOForDaysAgoAt(5, 9, 0);
    const result = formatCompletedAt(olderISO);
    expect(result).toMatch(/^Завершено: .+ \d{2}:\d{2}$/);
    expect(result).not.toContain("Сегодня");
    expect(result).not.toContain("Вчера");
  });
});
