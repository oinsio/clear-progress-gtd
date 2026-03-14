import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskEditModal } from "./TaskEditModal";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { BOX } from "@/constants";

function renderModal(overrides = {}) {
  const task = buildTask();
  const props = {
    task,
    goals: [],
    isOpen: true,
    onClose: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(<TaskEditModal {...props} />);
  return props;
}

describe("TaskEditModal", () => {
  it("should not render when isOpen is false", () => {
    const task = buildTask();
    render(
      <TaskEditModal
        task={task}
        goals={[]}
        isOpen={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("task-edit-modal")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    renderModal();
    expect(screen.getByTestId("task-edit-modal")).toBeInTheDocument();
  });

  it("should show task title in input", () => {
    const task = buildTask({ title: "My important task" });
    renderModal({ task });
    expect(screen.getByDisplayValue("My important task")).toBeInTheDocument();
  });

  it("should show task notes in textarea", () => {
    const task = buildTask({ notes: "Some notes here" });
    renderModal({ task });
    expect(screen.getByDisplayValue("Some notes here")).toBeInTheDocument();
  });

  it("should call onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await userEvent.click(screen.getByTestId("task-edit-modal-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked", async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await userEvent.click(screen.getByRole("button", { name: /отмена/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onUpdate with updated title and notes when saved", async () => {
    const task = buildTask({ title: "Old title", notes: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderModal({ task, onUpdate, onClose });

    const titleInput = screen.getByDisplayValue("Old title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "New title");

    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ title: "New title" }),
    );
  });

  it("should call onClose after successful save", async () => {
    const task = buildTask();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderModal({ task, onUpdate, onClose });
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("should show goal selector with available goals", () => {
    const goal = buildGoal({ title: "Reach the top" });
    renderModal({ goals: [goal] });
    expect(screen.getByText("Reach the top")).toBeInTheDocument();
  });

  it("should show box selector with today, week, later options", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /сегодня/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /неделя/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /позже/i })).toBeInTheDocument();
  });

  it("should call onUpdate with selected box when saved", async () => {
    const task = buildTask({ box: BOX.TODAY });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderModal({ task, onUpdate });

    await userEvent.click(screen.getByRole("button", { name: /неделя/i }));
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ box: BOX.WEEK }),
    );
  });

  it("should call onUpdate with selected goal when saved", async () => {
    const goal = buildGoal({ title: "My goal" });
    const task = buildTask({ goal_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderModal({ task, goals: [goal], onUpdate });

    await userEvent.click(screen.getByText("My goal"));
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ goal_id: goal.id }),
    );
  });
});
