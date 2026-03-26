import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GoalDetailPage from "./GoalDetailPage";
import { buildGoal } from "@/test/factories/goalFactory";
import type { UseGoalReturn } from "@/hooks/useGoal";
import type { UseGoalTasksReturn } from "@/hooks/useGoalTasks";
import type { UseGoalsReturn } from "@/hooks/useGoals";
import type { UseSettingsReturn } from "@/hooks/useSettings";

vi.mock("@/hooks/useGoal");
vi.mock("@/hooks/useGoalTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/useRightPanelNavigation");
vi.mock("@/hooks/useIsDesktop");
vi.mock("@/hooks/usePanelSplit");
vi.mock("@/hooks/useCoverUrl");
vi.mock("@/hooks/useCoverPreview");
vi.mock("@/hooks/useSettings");

import { useGoal } from "@/hooks/useGoal";
import { useGoalTasks } from "@/hooks/useGoalTasks";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { useCategories } from "@/hooks/useCategories";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useRightPanelNavigation } from "@/hooks/useRightPanelNavigation";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import { useCoverPreview } from "@/hooks/useCoverPreview";
import { useSettings } from "@/hooks/useSettings";

const mockUseGoal = vi.mocked(useGoal);
const mockUseGoalTasks = vi.mocked(useGoalTasks);
const mockUseGoals = vi.mocked(useGoals);
const mockUseContexts = vi.mocked(useContexts);
const mockUseCategories = vi.mocked(useCategories);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUseRightPanelNavigation = vi.mocked(useRightPanelNavigation);
const mockUseIsDesktop = vi.mocked(useIsDesktop);
const mockUsePanelSplit = vi.mocked(usePanelSplit);
const mockUseCoverUrl = vi.mocked(useCoverUrl);
const mockUseCoverPreview = vi.mocked(useCoverPreview);
const mockUseSettings = vi.mocked(useSettings);

function buildGoalHook(overrides: Partial<UseGoalReturn> = {}): UseGoalReturn {
  return {
    goal: buildGoal({ title: "Моя цель" }),
    tasks: [],
    isLoading: false,
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildGoalTasksHook(overrides: Partial<UseGoalTasksReturn> = {}): UseGoalTasksReturn {
  return {
    tasks: [],
    completedTasks: [],
    isLoading: false,
    createTask: vi.fn().mockResolvedValue(undefined),
    completeTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildGoalsHook(overrides: Partial<UseGoalsReturn> = {}): UseGoalsReturn {
  return {
    goals: [],
    isLoading: false,
    reloadGoals: vi.fn().mockResolvedValue(undefined),
    createGoal: vi.fn().mockResolvedValue(undefined),
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    reorderGoals: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildSettingsHook(overrides: Partial<UseSettingsReturn> = {}): UseSettingsReturn {
  return {
    defaultBox: "inbox",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn().mockResolvedValue(undefined),
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/goals/test-id"]}>
      <Routes>
        <Route path="/goals/:id" element={<GoalDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GoalDetailPage — inline task creation", () => {
  beforeEach(() => {
    mockUseGoal.mockReturnValue(buildGoalHook());
    mockUseGoalTasks.mockReturnValue(buildGoalTasksHook());
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseContexts.mockReturnValue({ contexts: [], isLoading: false, createContext: vi.fn(), updateContext: vi.fn(), deleteContext: vi.fn(), reorderContexts: vi.fn() });
    mockUseCategories.mockReturnValue({ categories: [], isLoading: false, createCategory: vi.fn(), updateCategory: vi.fn(), deleteCategory: vi.fn(), reorderCategories: vi.fn() });
    mockUsePanelSide.mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() });
    mockUsePanelOpen.mockReturnValue({ isPanelOpen: false, togglePanelOpen: vi.fn() });
    mockUseRightPanelNavigation.mockReturnValue(vi.fn());
    mockUseIsDesktop.mockReturnValue(false);
    mockUsePanelSplit.mockReturnValue({
      ratio: 0.5,
      setRatio: vi.fn(),
      containerRef: { current: null },
      handleResizeMouseDown: vi.fn(),
    });
    mockUseCoverUrl.mockReturnValue({ url: null });
    mockUseCoverPreview.mockReturnValue(null);
    mockUseSettings.mockReturnValue(buildSettingsHook());
  });

  it("should render the FAB add-task button", () => {
    renderPage();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("should show inline input when FAB is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    expect(screen.getByTestId("add-task-input")).toBeInTheDocument();
  });

  it("should hide inline input after Escape", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
  });

  it("should call createTask with title and defaultBox when Enter is pressed", async () => {
    const createTask = vi.fn().mockResolvedValue(undefined);
    mockUseGoalTasks.mockReturnValue(buildGoalTasksHook({ createTask }));
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Новая задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith("Новая задача", "inbox", "");
    });
  });

  it("should hide inline input after successful task creation", async () => {
    const createTask = vi.fn().mockResolvedValue(undefined);
    mockUseGoalTasks.mockReturnValue(buildGoalTasksHook({ createTask }));
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
    });
  });
});
