import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import GoalsPage from "./GoalsPage";
import { buildGoal } from "@/test/factories/goalFactory";
import type { UseGoalsReturn } from "@/hooks/useGoals";

vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/useTasks");
vi.mock("@/services/TaskService", () => ({
  TaskService: vi.fn().mockImplementation(() => ({
    getGoalTaskCounts: vi.fn().mockResolvedValue({}),
  })),
}));
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn().mockImplementation(() => ({})),
}));

import { useGoals } from "@/hooks/useGoals";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useTasks } from "@/hooks/useTasks";
import type { UseTasksReturn } from "@/hooks/useTasks";

const mockUseGoals = vi.mocked(useGoals);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUseTasks = vi.mocked(useTasks);

function buildGoalsHook(overrides: Partial<UseGoalsReturn> = {}): UseGoalsReturn {
  return {
    goals: [],
    isLoading: false,
    createGoal: vi.fn<UseGoalsReturn["createGoal"]>().mockResolvedValue(undefined),
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildTasksHook(overrides: Partial<UseTasksReturn> = {}): UseTasksReturn {
  return {
    tasks: [],
    isLoading: false,
    createTask: vi.fn().mockResolvedValue(undefined),
    completeTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue(undefined),
    reorderTasks: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderGoalsPage() {
  mockUsePanelSide.mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() });
  mockUsePanelOpen.mockReturnValue({ isPanelOpen: false, togglePanelOpen: vi.fn() });
  mockUseTasks.mockReturnValue(buildTasksHook());

  render(
    <MemoryRouter>
      <GoalsPage />
    </MemoryRouter>,
  );
}

describe("GoalsPage", () => {
  it("should render page with test-id 'goals-page'", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByTestId("goals-page")).toBeInTheDocument();
  });

  it("should render header 'Мои цели'", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByText("Мои цели")).toBeInTheDocument();
  });

  it("should render goal items for each active goal", () => {
    const goals = [buildGoal({ title: "Goal A" }), buildGoal({ title: "Goal B" })];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));
    renderGoalsPage();
    expect(screen.getByText("Goal A")).toBeInTheDocument();
    expect(screen.getByText("Goal B")).toBeInTheDocument();
  });

  it("should not render deleted goals", () => {
    const goals = [
      buildGoal({ title: "Active Goal" }),
      buildGoal({ title: "Deleted Goal", is_deleted: true }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));
    renderGoalsPage();
    expect(screen.getByText("Active Goal")).toBeInTheDocument();
    expect(screen.queryByText("Deleted Goal")).not.toBeInTheDocument();
  });

  it("should show empty state when no goals exist", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [] }));
    renderGoalsPage();
    expect(screen.getByTestId("empty-goals-message")).toBeInTheDocument();
  });

  it("should not show empty state when goals exist", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [buildGoal()] }));
    renderGoalsPage();
    expect(screen.queryByTestId("empty-goals-message")).not.toBeInTheDocument();
  });

  it("should render add goal button", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByTestId("add-goal-button")).toBeInTheDocument();
  });

  it("should render add task button", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });
});
