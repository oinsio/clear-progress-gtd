import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskEditModal } from "./TaskEditModal";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildCategory } from "@/test/factories/categoryFactory";
import { BOX } from "@/constants";

function renderModal(overrides = {}) {
  const task = buildTask();
  const props = {
    task,
    goals: [],
    contexts: [],
    categories: [],
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
          contexts={[]}
          categories={[]}
          isOpen={false}
          onClose={vi.fn()}
          onUpdate={vi.fn()} />,
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

  it("should show goal drill-down row when goals are available", () => {
    const goal = buildGoal({ title: "Reach the top" });
    renderModal({ goals: [goal] });
    expect(screen.getByTestId("task-edit-goal-row")).toBeInTheDocument();
  });

  it("should show goal list inside selector sheet after clicking goal row", async () => {
    const goal = buildGoal({ title: "Reach the top" });
    renderModal({ goals: [goal] });
    await userEvent.click(screen.getByTestId("task-edit-goal-row"));
    expect(screen.getByText("Reach the top")).toBeInTheDocument();
  });

  it("should show context drill-down row when contexts are available", () => {
    const context = buildContext({ name: "@Office" });
    renderModal({ contexts: [context] });
    expect(screen.getByTestId("task-edit-context-row")).toBeInTheDocument();
  });

  it("should show context list inside selector sheet after clicking context row", async () => {
    const context = buildContext({ name: "@Office" });
    renderModal({ contexts: [context] });
    await userEvent.click(screen.getByTestId("task-edit-context-row"));
    expect(screen.getByText("@Office")).toBeInTheDocument();
  });

  it("should show category drill-down row when categories are available", () => {
    const category = buildCategory({ name: "Family" });
    renderModal({ categories: [category] });
    expect(screen.getByTestId("task-edit-category-row")).toBeInTheDocument();
  });

  it("should show category list inside selector sheet after clicking category row", async () => {
    const category = buildCategory({ name: "Family" });
    renderModal({ categories: [category] });
    await userEvent.click(screen.getByTestId("task-edit-category-row"));
    expect(screen.getByText("Family")).toBeInTheDocument();
  });

  it("should close selector sheet and return to main form after selecting a goal", async () => {
    const goal = buildGoal({ title: "My goal" });
    renderModal({ goals: [goal] });
    await userEvent.click(screen.getByTestId("task-edit-goal-row"));
    await userEvent.click(screen.getByText("My goal"));
    expect(screen.queryByTestId("task-edit-selector-sheet")).not.toBeInTheDocument();
  });

  it("should call onUpdate with selected goal when saved", async () => {
    const goal = buildGoal({ title: "My goal" });
    const task = buildTask({ goal_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderModal({ task, goals: [goal], onUpdate });

    await userEvent.click(screen.getByTestId("task-edit-goal-row"));
    await userEvent.click(screen.getByText("My goal"));
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ goal_id: goal.id }),
    );
  });

  it("should call onUpdate with selected context_id when saved", async () => {
    const context = buildContext({ name: "@Office" });
    const task = buildTask({ context_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderModal({ task, contexts: [context], onUpdate });

    await userEvent.click(screen.getByTestId("task-edit-context-row"));
    await userEvent.click(screen.getByText("@Office"));
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ context_id: context.id }),
    );
  });

  it("should call onUpdate with selected category_id when saved", async () => {
    const category = buildCategory({ name: "Family" });
    const task = buildTask({ category_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderModal({ task, categories: [category], onUpdate });

    await userEvent.click(screen.getByTestId("task-edit-category-row"));
    await userEvent.click(screen.getByText("Family"));
    await userEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ category_id: category.id }),
    );
  });

  it("should close selector sheet when back button is clicked", async () => {
    const goal = buildGoal({ title: "My goal" });
    renderModal({ goals: [goal] });
    await userEvent.click(screen.getByTestId("task-edit-goal-row"));
    expect(screen.getByTestId("task-edit-selector-sheet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /назад/i }));
    expect(screen.queryByTestId("task-edit-selector-sheet")).not.toBeInTheDocument();
  });
});
