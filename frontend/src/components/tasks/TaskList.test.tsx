import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskList } from "./TaskList";
import { buildTask } from "@/test/factories/taskFactory";

describe("TaskList", () => {
  it("should render empty state when tasks array is empty", () => {
    render(
      <TaskList tasks={[]} goals={[]} contexts={[]} categories={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByTestId("task-list-empty")).toBeInTheDocument();
  });

  it("should display empty message text when tasks array is empty", () => {
    render(
      <TaskList tasks={[]} goals={[]} contexts={[]} categories={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Inbox is empty")).toBeInTheDocument();
  });

  it("should render a TaskItem for each task in the list", () => {
    const tasks = [buildTask(), buildTask(), buildTask()];
    render(
      <TaskList tasks={tasks} goals={[]} contexts={[]} categories={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getAllByTestId("task-item")).toHaveLength(3);
  });

  it("should not render empty state when tasks exist", () => {
    const tasks = [buildTask()];
    render(
      <TaskList tasks={tasks} goals={[]} contexts={[]} categories={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.queryByTestId("task-list-empty")).not.toBeInTheDocument();
  });
});
