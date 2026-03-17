import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GoalPage from "./GoalPage";
import { buildGoal } from "@/test/factories/goalFactory";
import type { UseGoalReturn } from "@/hooks/useGoal";

vi.mock("@/hooks/useGoal");

import { useGoal } from "@/hooks/useGoal";

const mockUseGoal = vi.mocked(useGoal);

function buildGoalHook(overrides: Partial<UseGoalReturn> = {}): UseGoalReturn {
  return {
    goal: undefined,
    tasks: [],
    isLoading: false,
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderGoalPage(id = "test-id") {
  render(
    <MemoryRouter initialEntries={[`/goals/${id}`]}>
      <Routes>
        <Route path="/goals/:id" element={<GoalPage />} />
        <Route path="/goals" element={<div data-testid="goals-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GoalPage", () => {
  it("should render with data-test-id 'goal-page'", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: buildGoal() }));
    renderGoalPage();
    expect(screen.getByTestId("goal-page")).toBeInTheDocument();
  });

  it("should render back button", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: buildGoal() }));
    renderGoalPage();
    expect(screen.getByRole("button", { name: "Назад" })).toBeInTheDocument();
  });

  it("should navigate to goals list when back button is clicked", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: buildGoal() }));
    renderGoalPage();
    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    expect(screen.getByTestId("goals-page")).toBeInTheDocument();
  });

  it("should show goal title in input", () => {
    const goal = buildGoal({ title: "My Goal Title" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal }));
    renderGoalPage();
    expect(screen.getByTestId("goal-title-input")).toHaveValue("My Goal Title");
  });

  it("should show goal description in textarea", () => {
    const goal = buildGoal({ description: "My Goal Description" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal }));
    renderGoalPage();
    expect(screen.getByTestId("goal-description-input")).toHaveValue("My Goal Description");
  });

  it("should call updateGoal with new title on save", async () => {
    const updateGoal = vi.fn().mockResolvedValue(undefined);
    const goal = buildGoal({ title: "Old Title" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal, updateGoal }));
    renderGoalPage();

    fireEvent.change(screen.getByTestId("goal-title-input"), {
      target: { value: "New Title" },
    });
    fireEvent.click(screen.getByTestId("goal-save-button"));

    await waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New Title" }),
      );
    });
  });

  it("should call updateGoal with new description on save", async () => {
    const updateGoal = vi.fn().mockResolvedValue(undefined);
    const goal = buildGoal({ description: "Old Desc" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal, updateGoal }));
    renderGoalPage();

    fireEvent.change(screen.getByTestId("goal-description-input"), {
      target: { value: "New Desc" },
    });
    fireEvent.click(screen.getByTestId("goal-save-button"));

    await waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith(
        expect.objectContaining({ description: "New Desc" }),
      );
    });
  });

  it("should call updateGoalStatus when status is changed", async () => {
    const updateGoalStatus = vi.fn().mockResolvedValue(undefined);
    const goal = buildGoal({ status: "planning" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal, updateGoalStatus }));
    renderGoalPage();

    fireEvent.click(screen.getByRole("button", { name: "В процессе" }));

    await waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("in_progress");
    });
  });

  it("should disable save button when title is empty", () => {
    const goal = buildGoal({ title: "" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal }));
    renderGoalPage();
    expect(screen.getByTestId("goal-save-button")).toBeDisabled();
  });

  it("should show not-found message when goal is not found", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: undefined, isLoading: false }));
    renderGoalPage();
    expect(screen.getByTestId("goal-not-found")).toBeInTheDocument();
  });
});
