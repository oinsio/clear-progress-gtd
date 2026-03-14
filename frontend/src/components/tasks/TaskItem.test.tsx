import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskItem } from "./TaskItem";
import { buildTask } from "@/test/factories/taskFactory";

describe("TaskItem", () => {
  it("should render the task title", () => {
    const task = buildTask({ title: "Buy groceries" });
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("should have data-test-id='task-item'", () => {
    const task = buildTask();
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId("task-item")).toBeInTheDocument();
  });

  it("should apply line-through styling when task is completed", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    const titleElement = screen.getByTestId("task-item-title");
    expect(titleElement).toHaveClass("line-through");
  });

  it("should not apply line-through styling when task is not completed", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    const titleElement = screen.getByTestId("task-item-title");
    expect(titleElement).not.toHaveClass("line-through");
  });

  it("should apply base text-sm styling to title regardless of completion state", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId("task-item-title")).toHaveClass("text-sm");
  });

  it("should call onComplete with task id when complete button is clicked on incomplete task", async () => {
    const task = buildTask({ is_completed: false });
    const onComplete = vi.fn();
    render(<TaskItem task={task} onComplete={onComplete} onDelete={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /complete task/i }),
    );
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should call onComplete with task id when complete button is clicked on completed task", async () => {
    const task = buildTask({ is_completed: true });
    const onComplete = vi.fn();
    render(<TaskItem task={task} onComplete={onComplete} onDelete={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /uncomplete task/i }),
    );
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should have aria-label 'Complete task' when task is not completed", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /complete task/i })).toBeInTheDocument();
  });

  it("should have aria-label 'Noncomplete task' when task is completed", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /uncomplete task/i })).toBeInTheDocument();
  });

  it("should show filled complete button when task is completed", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={vi.fn()} />);
    const completeButton = screen.getByRole("button", { name: /uncomplete task/i });
    expect(completeButton).toHaveClass("bg-accent");
  });

  it("should call onDelete with task id when delete button is clicked", async () => {
    const task = buildTask();
    const onDelete = vi.fn();
    render(<TaskItem task={task} onComplete={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(
      screen.getByRole("button", { name: /delete task/i }),
    );
    expect(onDelete).toHaveBeenCalledWith(task.id);
  });
});
