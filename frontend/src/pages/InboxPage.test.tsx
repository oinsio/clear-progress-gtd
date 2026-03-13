import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InboxPage from "./InboxPage";
import { buildTask } from "@/test/factories/taskFactory";
import type { UseInboxTasksReturn } from "@/hooks/useInboxTasks";

vi.mock("@/hooks/useInboxTasks");

import { useInboxTasks } from "@/hooks/useInboxTasks";

const mockUseInboxTasks = vi.mocked(useInboxTasks);

function buildDefaultHookReturn(
  overrides: Partial<UseInboxTasksReturn> = {},
): UseInboxTasksReturn {
  return {
    tasks: [],
    isLoading: false,
    completeTask: vi.fn(),
    deleteTask: vi.fn(),
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
    mockUseInboxTasks.mockReturnValue(buildDefaultHookReturn());
  });

  it("should render loading state when isLoading is true", () => {
    mockUseInboxTasks.mockReturnValue(
      buildDefaultHookReturn({ isLoading: true }),
    );
    renderPage();
    expect(screen.getByTestId("inbox-loading")).toBeInTheDocument();
  });

  it("should not render page content when isLoading is true", () => {
    mockUseInboxTasks.mockReturnValue(
      buildDefaultHookReturn({ isLoading: true }),
    );
    renderPage();
    expect(screen.queryByTestId("inbox-page")).not.toBeInTheDocument();
  });

  it("should render page content when tasks are loaded", () => {
    renderPage();
    expect(screen.getByTestId("inbox-page")).toBeInTheDocument();
  });

  it("should render empty state when inbox has no tasks", () => {
    mockUseInboxTasks.mockReturnValue(
      buildDefaultHookReturn({ tasks: [], isLoading: false }),
    );
    renderPage();
    expect(screen.getByTestId("task-list-empty")).toBeInTheDocument();
  });

  it("should render task items when inbox has tasks", () => {
    const tasks = [buildTask(), buildTask()];
    mockUseInboxTasks.mockReturnValue(
      buildDefaultHookReturn({ tasks, isLoading: false }),
    );
    renderPage();
    expect(screen.getAllByTestId("task-item")).toHaveLength(2);
  });
});
