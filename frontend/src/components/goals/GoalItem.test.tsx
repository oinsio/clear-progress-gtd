import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { GoalItem } from "./GoalItem";
import { buildGoal } from "@/test/factories/goalFactory";

function renderGoalItem(overrides = {}) {
  const goal = buildGoal();
  const props = {
    goal,
    taskCount: 0,
    onNavigate: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <GoalItem {...props} />
    </MemoryRouter>,
  );
  return props;
}

describe("GoalItem", () => {
  it("should render goal title", () => {
    const goal = buildGoal({ title: "Learn guitar" });
    renderGoalItem({ goal });
    expect(screen.getByText("Learn guitar")).toBeInTheDocument();
  });

  it("should have data-test-id='goal-item'", () => {
    renderGoalItem();
    expect(screen.getByTestId("goal-item")).toBeInTheDocument();
  });

  it("should show task count when greater than zero", () => {
    renderGoalItem({ taskCount: 5 });
    expect(screen.getByTestId("goal-task-count")).toBeInTheDocument();
    expect(screen.getByTestId("goal-task-count").textContent).toContain("5");
  });

  it("should hide task count when zero", () => {
    renderGoalItem({ taskCount: 0 });
    expect(screen.queryByTestId("goal-task-count")).not.toBeInTheDocument();
  });

  it("should show goal status badge", () => {
    const goal = buildGoal({ status: "paused" });
    renderGoalItem({ goal });
    expect(screen.getByTestId("goal-status-badge")).toBeInTheDocument();
  });

  it("should call onNavigate with goal id on click", async () => {
    const goal = buildGoal();
    const onNavigate = vi.fn();
    renderGoalItem({ goal, onNavigate });
    await userEvent.click(screen.getByTestId("goal-item"));
    expect(onNavigate).toHaveBeenCalledWith(goal.id);
  });

  it("should show placeholder icon when no cover_file_id", () => {
    const goal = buildGoal({ cover_file_id: "" });
    renderGoalItem({ goal });
    expect(screen.getByTestId("goal-cover-placeholder")).toBeInTheDocument();
  });
});
