import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatCompletedAt, groupCompletedTasks } from "./utils";
import { buildTask } from "@/test/factories/taskFactory";

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

describe("groupCompletedTasks", () => {
  // Fixed reference: 2025-03-19 15:00:00 local time
  const FIXED_NOW = new Date(2025, 2, 19, 15, 0, 0, 0);
  // Boundary helpers relative to FIXED_NOW
  const startOfToday = new Date(2025, 2, 19, 0, 0, 0, 0);
  const startOfYesterday = new Date(2025, 2, 18, 0, 0, 0, 0);
  const startOf7DaysAgo = new Date(2025, 2, 12, 0, 0, 0, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return all empty arrays when no tasks are provided", () => {
    const result = groupCompletedTasks([]);
    expect(result.todayTasks).toEqual([]);
    expect(result.yesterdayTasks).toEqual([]);
    expect(result.weekTasks).toEqual([]);
    expect(result.earlierTasks).toEqual([]);
  });

  it("should place task completed today into todayTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 19, 10, 0, 0).toISOString() });
    const result = groupCompletedTasks([task]);
    expect(result.todayTasks).toContain(task);
    expect(result.yesterdayTasks).toHaveLength(0);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed at midnight today into todayTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: startOfToday.toISOString() });
    const result = groupCompletedTasks([task]);
    expect(result.todayTasks).toContain(task);
  });

  it("should place task completed yesterday into yesterdayTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 18, 14, 0, 0).toISOString() });
    const result = groupCompletedTasks([task]);
    expect(result.yesterdayTasks).toContain(task);
    expect(result.todayTasks).toHaveLength(0);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed at midnight yesterday into yesterdayTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: startOfYesterday.toISOString() });
    const result = groupCompletedTasks([task]);
    expect(result.yesterdayTasks).toContain(task);
  });

  it("should place task completed 2 days ago into weekTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 17, 10, 0, 0).toISOString() });
    const result = groupCompletedTasks([task]);
    expect(result.weekTasks).toContain(task);
    expect(result.todayTasks).toHaveLength(0);
    expect(result.yesterdayTasks).toHaveLength(0);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed exactly 7 days ago (at midnight) into weekTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: startOf7DaysAgo.toISOString() });
    const result = groupCompletedTasks([task]);
    expect(result.weekTasks).toContain(task);
  });

  it("should place task completed more than 7 days ago into earlierTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 11, 23, 59, 0).toISOString() });
    const result = groupCompletedTasks([task]);
    expect(result.earlierTasks).toContain(task);
    expect(result.todayTasks).toHaveLength(0);
    expect(result.yesterdayTasks).toHaveLength(0);
    expect(result.weekTasks).toHaveLength(0);
  });

  it("should place task with empty completed_at into earlierTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: "" });
    const result = groupCompletedTasks([task]);
    expect(result.earlierTasks).toContain(task);
  });

  it("should distribute tasks correctly across all four groups", () => {
    const todayTask = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 19, 8, 0, 0).toISOString() });
    const yesterdayTask = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 18, 8, 0, 0).toISOString() });
    const weekTask = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 15, 8, 0, 0).toISOString() });
    const earlierTask = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 10, 8, 0, 0).toISOString() });
    const result = groupCompletedTasks([todayTask, yesterdayTask, weekTask, earlierTask]);
    expect(result.todayTasks).toEqual([todayTask]);
    expect(result.yesterdayTasks).toEqual([yesterdayTask]);
    expect(result.weekTasks).toEqual([weekTask]);
    expect(result.earlierTasks).toEqual([earlierTask]);
  });

  it("should not include yesterday task in weekTasks", () => {
    const yesterdayTask = buildTask({ is_completed: true, completed_at: new Date(2025, 2, 18, 20, 0, 0).toISOString() });
    const result = groupCompletedTasks([yesterdayTask]);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.yesterdayTasks).toContain(yesterdayTask);
  });
});
