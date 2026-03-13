import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InboxPage from "./InboxPage";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import type { UseTasksReturn } from "@/hooks/useTasks";
import type { UseGoalsReturn } from "@/hooks/useGoals";
import type { UseSearchReturn } from "@/hooks/useSearch";
import type { UseContextsReturn } from "@/hooks/useContexts";
import type { UseCategoriesReturn } from "@/hooks/useCategories";
import type { UseCompletedTasksReturn } from "@/hooks/useCompletedTasks";

vi.mock("@/hooks/useTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useSearch");
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/useCompletedTasks");

import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useSearch } from "@/hooks/useSearch";
import { useContexts } from "@/hooks/useContexts";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";

const mockUseTasks = vi.mocked(useTasks);
const mockUseGoals = vi.mocked(useGoals);
const mockUseSearch = vi.mocked(useSearch);
const mockUseContexts = vi.mocked(useContexts);
const mockUseCategories = vi.mocked(useCategories);
const mockUseCompletedTasks = vi.mocked(useCompletedTasks);

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

function buildContextsHook(overrides: Partial<UseContextsReturn> = {}): UseContextsReturn {
  return {
    contexts: [],
    isLoading: false,
    createContext: vi.fn(),
    updateContext: vi.fn(),
    deleteContext: vi.fn(),
    ...overrides,
  };
}

function buildCategoriesHook(overrides: Partial<UseCategoriesReturn> = {}): UseCategoriesReturn {
  return {
    categories: [],
    isLoading: false,
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    ...overrides,
  };
}

function buildCompletedTasksHook(
  overrides: Partial<UseCompletedTasksReturn> = {},
): UseCompletedTasksReturn {
  return {
    completedTasks: [],
    isLoading: false,
    reload: vi.fn(),
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

function openRightPanel() {
  fireEvent.click(screen.getByTestId("right-panel-toggle"));
}

describe("InboxPage", () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue(buildTasksHook());
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseSearch.mockReturnValue(buildSearchHook());
    mockUseContexts.mockReturnValue(buildContextsHook());
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
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

  it("should render right panel toggle button", () => {
    renderPage();
    expect(screen.getByTestId("right-panel-toggle")).toBeInTheDocument();
  });

  it("should show filter items when right panel is opened", () => {
    renderPage();
    openRightPanel();
    expect(screen.getByTestId("right-filter-goals")).toBeInTheDocument();
    expect(screen.getByTestId("right-filter-search")).toBeInTheDocument();
    expect(screen.getByTestId("right-filter-tasks")).toBeInTheDocument();
    expect(screen.getByTestId("right-filter-completed")).toBeInTheDocument();
    expect(screen.getByTestId("right-filter-contexts")).toBeInTheDocument();
    expect(screen.getByTestId("right-filter-categories")).toBeInTheDocument();
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

  it("should activate search mode when search filter is clicked", () => {
    renderPage();
    openRightPanel();
    fireEvent.click(screen.getByTestId("right-filter-search"));
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("should show goals sub-list when goals filter is clicked", () => {
    const goals = [buildGoal({ title: "My Goal" })];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));
    renderPage();
    openRightPanel();
    fireEvent.click(screen.getByTestId("right-filter-goals"));
    expect(screen.getByText("My Goal")).toBeInTheDocument();
  });

  it("should show search results when in search mode", () => {
    const foundTasks = [buildTask({ title: "Found task" })];
    mockUseSearch.mockReturnValue(buildSearchHook({ results: foundTasks }));
    renderPage();
    openRightPanel();
    fireEvent.click(screen.getByTestId("right-filter-search"));
    expect(screen.getByTestId("task-item")).toBeInTheDocument();
  });

  it("should show completed tasks when completed filter is selected", () => {
    const finishedTasks = [buildTask({ title: "Done task", is_completed: true })];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks: finishedTasks }),
    );
    renderPage();
    openRightPanel();
    fireEvent.click(screen.getByTestId("right-filter-completed"));
    expect(screen.getByTestId("task-item")).toBeInTheDocument();
  });

  it("should show inbox tasks when inbox filter is selected", () => {
    const inboxTasks = [buildTask({ title: "Inbox task", box: "inbox" })];
    mockUseTasks.mockImplementation((box) =>
      buildTasksHook({ tasks: box === "inbox" ? inboxTasks : [] }),
    );
    renderPage();
    openRightPanel();
    fireEvent.click(screen.getByTestId("right-filter-inbox"));
    expect(screen.getByTestId("task-item")).toBeInTheDocument();
  });

  it("should render account and settings buttons in open panel", () => {
    renderPage();
    openRightPanel();
    expect(screen.getByTestId("right-panel-account")).toBeInTheDocument();
    expect(screen.getByTestId("right-panel-settings")).toBeInTheDocument();
  });
});
