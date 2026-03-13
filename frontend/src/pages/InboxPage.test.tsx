import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InboxPage from "./InboxPage";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import type { UseTasksReturn } from "@/hooks/useTasks";
import type { UseGoalsReturn } from "@/hooks/useGoals";
import type { UseSearchReturn } from "@/hooks/useSearch";

vi.mock("@/hooks/useTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useSearch");

import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useSearch } from "@/hooks/useSearch";

const mockUseTasks = vi.mocked(useTasks);
const mockUseGoals = vi.mocked(useGoals);
const mockUseSearch = vi.mocked(useSearch);

function buildTasksHook(overrides: Partial<UseTasksReturn> = {}): UseTasksReturn {
  return {
    tasks: [],
    isLoading: false,
    createTask: vi.fn(),
    completeTask: vi.fn(),
    deleteTask: vi.fn(),
    moveTask: vi.fn(),
    ...overrides,
  };
}

function buildGoalsHook(overrides: Partial<UseGoalsReturn> = {}): UseGoalsReturn {
  return {
    goals: [],
    isLoading: false,
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    updateGoalStatus: vi.fn(),
    deleteGoal: vi.fn(),
    ...overrides,
  };
}

function buildSearchHook(overrides: Partial<UseSearchReturn> = {}): UseSearchReturn {
  return {
    results: [],
    isSearching: false,
    search: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <InboxPage />
    </MemoryRouter>,
  );
}

describe("InboxPage", () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue(buildTasksHook());
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseSearch.mockReturnValue(buildSearchHook());
  });

  it("should render the main page container", () => {
    renderPage();
    expect(screen.getByTestId("inbox-page")).toBeInTheDocument();
  });

  it("should render box filter bar", () => {
    renderPage();
    expect(screen.getByTestId("box-filter-all")).toBeInTheDocument();
    expect(screen.getByTestId("box-filter-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("box-filter-today")).toBeInTheDocument();
    expect(screen.getByTestId("box-filter-week")).toBeInTheDocument();
    expect(screen.getByTestId("box-filter-later")).toBeInTheDocument();
  });

  it("should render add task button", () => {
    renderPage();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("should render right filter panel icons", () => {
    renderPage();
    expect(screen.getByTestId("right-filter-goals")).toBeInTheDocument();
    expect(screen.getByTestId("right-filter-search")).toBeInTheDocument();
  });

  it("should show empty state in all-tasks sections when no tasks", () => {
    renderPage();
    const emptySections = screen.getAllByTestId("task-list-empty");
    expect(emptySections.length).toBeGreaterThan(0);
  });

  it("should show today tasks in today section in all-box view", () => {
    const todayTasks = [buildTask({ box: "today" }), buildTask({ box: "today" })];
    mockUseTasks.mockImplementation((box) =>
      buildTasksHook({ tasks: box === "today" ? todayTasks : [] }),
    );
    renderPage();
    expect(screen.getAllByTestId("task-item")).toHaveLength(2);
  });

  it("should show add task input when add button is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    expect(screen.getByTestId("add-task-input")).toBeInTheDocument();
  });

  it("should activate search mode when search icon is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("right-filter-search"));
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("should show goals list in right panel when goals icon is clicked", () => {
    const goals = [buildGoal({ title: "My Goal" })];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));
    renderPage();
    fireEvent.click(screen.getByTestId("right-filter-goals"));
    expect(screen.getByText("My Goal")).toBeInTheDocument();
  });

  it("should show search results when in search mode", () => {
    const foundTasks = [buildTask({ title: "Found task" })];
    mockUseSearch.mockReturnValue(buildSearchHook({ results: foundTasks }));
    renderPage();
    fireEvent.click(screen.getByTestId("right-filter-search"));
    expect(screen.getByTestId("task-item")).toBeInTheDocument();
  });
});
