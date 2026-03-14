import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskItem } from "./TaskItem";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";

function renderTaskItem(overrides = {}) {
  const task = buildTask();
  const props = {
    task,
    goals: [],
    onComplete: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(<TaskItem {...props} />);
  return props;
}

describe("TaskItem", () => {
  it("should render the task title", () => {
    const task = buildTask({ title: "Buy groceries" });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("should have data-test-id='task-item'", () => {
    renderTaskItem();
    expect(screen.getByTestId("task-item")).toBeInTheDocument();
  });

  it("should apply line-through styling when task is completed", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    const titleElement = screen.getByTestId("task-item-title");
    expect(titleElement).toHaveClass("line-through");
  });

  it("should not apply line-through styling when task is not completed", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    const titleElement = screen.getByTestId("task-item-title");
    expect(titleElement).not.toHaveClass("line-through");
  });

  it("should apply base text-sm styling to title regardless of completion state", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    expect(screen.getByTestId("task-item-title")).toHaveClass("text-sm");
  });

  it("should call onComplete with task id when complete button is clicked on incomplete task", async () => {
    const task = buildTask({ is_completed: false });
    const onComplete = vi.fn();
    render(<TaskItem task={task} goals={[]} onComplete={onComplete} onUpdate={vi.fn()} onMove={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /complete task/i }),
    );
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should NOT call onComplete immediately when complete button is clicked on completed task", async () => {
    const task = buildTask({ is_completed: true });
    const onComplete = vi.fn();
    render(<TaskItem task={task} goals={[]} onComplete={onComplete} onUpdate={vi.fn()} onMove={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /noncomplete task/i }),
    );
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should show restore confirmation when complete button is clicked on completed task", async () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /noncomplete task/i }),
    );
    expect(screen.getByTestId("restore-confirmation")).toBeInTheDocument();
  });

  it("should call onComplete with task id when 'Вернуть' button is clicked", async () => {
    const task = buildTask({ is_completed: true });
    const onComplete = vi.fn();
    render(<TaskItem task={task} goals={[]} onComplete={onComplete} onUpdate={vi.fn()} onMove={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /noncomplete task/i }));
    await userEvent.click(screen.getByRole("button", { name: /вернуть/i }));
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should hide restore confirmation after 'Вернуть' is clicked", async () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /noncomplete task/i }));
    await userEvent.click(screen.getByRole("button", { name: /вернуть/i }));
    expect(screen.queryByTestId("restore-confirmation")).not.toBeInTheDocument();
  });

  it("should hide restore confirmation when cancel button is clicked", async () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /noncomplete task/i }));
    await userEvent.click(screen.getByRole("button", { name: /отмена/i }));
    expect(screen.queryByTestId("restore-confirmation")).not.toBeInTheDocument();
  });

  it("should NOT call onComplete when cancel button is clicked", async () => {
    const task = buildTask({ is_completed: true });
    const onComplete = vi.fn();
    render(<TaskItem task={task} goals={[]} onComplete={onComplete} onUpdate={vi.fn()} onMove={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /noncomplete task/i }));
    await userEvent.click(screen.getByRole("button", { name: /отмена/i }));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should have aria-label 'Complete task' when task is not completed", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    expect(screen.getByRole("button", { name: /complete task/i })).toBeInTheDocument();
  });

  it("should have aria-label 'Noncomplete task' when task is completed", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    expect(screen.getByRole("button", { name: /noncomplete task/i })).toBeInTheDocument();
  });

  it("should show filled complete button when task is completed", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    const completeButton = screen.getByRole("button", { name: /noncomplete task/i });
    expect(completeButton).toHaveClass("bg-accent");
  });

  it("should show completed_at label when task is completed and has completed_at", () => {
    const task = buildTask({ is_completed: true, completed_at: new Date().toISOString() });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    expect(screen.getByTestId("task-item-completed-at")).toBeInTheDocument();
  });

  it("should not show completed_at label when task is not completed", () => {
    const task = buildTask({ is_completed: false, completed_at: "" });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    expect(screen.queryByTestId("task-item-completed-at")).not.toBeInTheDocument();
  });

  it("should not show completed_at label when task is completed but has no completed_at", () => {
    const task = buildTask({ is_completed: true, completed_at: "" });
    render(<TaskItem task={task} goals={[]} onComplete={vi.fn()} onUpdate={vi.fn()} onMove={vi.fn()} />);
    expect(screen.queryByTestId("task-item-completed-at")).not.toBeInTheDocument();
  });

  // Expand / collapse quick actions
  it("should not show quick actions initially", () => {
    renderTaskItem();
    expect(screen.queryByTestId("task-quick-actions")).not.toBeInTheDocument();
  });

  it("should show quick actions when task body is clicked", async () => {
    renderTaskItem();
    await userEvent.click(screen.getByTestId("task-item-body"));
    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();
  });

  it("should hide quick actions when task body is clicked again", async () => {
    renderTaskItem();
    await userEvent.click(screen.getByTestId("task-item-body"));
    await userEvent.click(screen.getByTestId("task-item-body"));
    expect(screen.queryByTestId("task-quick-actions")).not.toBeInTheDocument();
  });

  it("should pass goals to quick actions", async () => {
    const goal = buildGoal({ title: "My Goal" });
    renderTaskItem({ goals: [goal] });
    await userEvent.click(screen.getByTestId("task-item-body"));
    await userEvent.click(screen.getByRole("button", { name: /select goal/i }));
    expect(screen.getByText("My Goal")).toBeInTheDocument();
  });
});
