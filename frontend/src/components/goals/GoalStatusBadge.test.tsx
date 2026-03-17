import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GoalStatusBadge } from "./GoalStatusBadge";
import type { GoalStatus } from "@/types/common";

describe("GoalStatusBadge", () => {
  it.each<[GoalStatus, string]>([
    ["not_started", "Не начата"],
    ["in_progress", "В процессе"],
    ["paused", "На паузе"],
    ["completed", "Завершена"],
    ["cancelled", "Отменена"],
  ])("should render Russian label for status '%s'", (status, expectedLabel) => {
    render(<GoalStatusBadge status={status} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it("should have data-test-id='goal-status-badge'", () => {
    render(<GoalStatusBadge status="not_started" />);
    expect(screen.getByTestId("goal-status-badge")).toBeInTheDocument();
  });

  it("should apply orange color for paused status", () => {
    render(<GoalStatusBadge status="paused" />);
    const badge = screen.getByTestId("goal-status-badge");
    expect(badge.className).toMatch(/orange/);
  });

  it("should apply green color for completed status", () => {
    render(<GoalStatusBadge status="completed" />);
    const badge = screen.getByTestId("goal-status-badge");
    expect(badge.className).toMatch(/green/);
  });

  it("should apply red color for cancelled status", () => {
    render(<GoalStatusBadge status="cancelled" />);
    const badge = screen.getByTestId("goal-status-badge");
    expect(badge.className).toMatch(/red/);
  });

  it("should apply blue color for in_progress status", () => {
    render(<GoalStatusBadge status="in_progress" />);
    const badge = screen.getByTestId("goal-status-badge");
    expect(badge.className).toMatch(/blue/);
  });

  it("should apply gray color for not_started status", () => {
    render(<GoalStatusBadge status="not_started" />);
    const badge = screen.getByTestId("goal-status-badge");
    expect(badge.className).toMatch(/gray/);
  });
});
