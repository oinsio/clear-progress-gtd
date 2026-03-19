import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskEditModal } from "./TaskEditModal";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import type { ChecklistItem } from "@/types/entities";
import type { ChecklistService } from "@/services/ChecklistService";
import { BOX } from "@/constants";

function buildMockChecklistService(items: ChecklistItem[] = []): ChecklistService {
  const completedCount = items.filter((item) => item.is_completed).length;
  return {
    getByTaskId: vi.fn().mockResolvedValue(items),
    getById: vi.fn(),
    create: vi.fn().mockImplementation(async (_taskId: string, title: string) =>
      buildChecklistItem({ title }),
    ),
    update: vi.fn(),
    toggle: vi.fn().mockImplementation(async (id: string) => {
      const found = items.find((item) => item.id === id);
      return found ? { ...found, is_completed: !found.is_completed } : null;
    }),
    softDelete: vi.fn().mockImplementation(async (id: string) => {
      const found = items.find((item) => item.id === id);
      return found ? { ...found, is_deleted: true } : null;
    }),
    getProgress: vi.fn().mockResolvedValue({ completed: completedCount, total: items.length }),
  } as unknown as ChecklistService;
}

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
    onDelete: vi.fn(),
    checklistService: buildMockChecklistService(),
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
          onUpdate={vi.fn()}
          onDelete={vi.fn()} />,
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

describe("TaskEditModal — checklist tab", () => {
  it("should show Детали and Чеклист tabs", async () => {
    renderModal({ checklistService: buildMockChecklistService() });
    expect(screen.getByTestId("task-edit-tab-details")).toBeInTheDocument();
    expect(screen.getByTestId("task-edit-tab-checklist")).toBeInTheDocument();
  });

  it("should show details content by default when Детали tab is active", () => {
    renderModal({ checklistService: buildMockChecklistService() });
    expect(screen.getByTestId("task-edit-title")).toBeInTheDocument();
    expect(screen.queryByTestId("task-edit-checklist-panel")).not.toBeInTheDocument();
  });

  it("should show checklist panel when Чеклист tab is clicked", async () => {
    renderModal({ checklistService: buildMockChecklistService() });
    await userEvent.click(screen.getByTestId("task-edit-tab-checklist"));
    expect(screen.getByTestId("task-edit-checklist-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("task-edit-title")).not.toBeInTheDocument();
  });

  it("should show progress in checklist tab label when items exist", async () => {
    const taskId = crypto.randomUUID();
    const task = buildTask({ id: taskId });
    const items = [
      buildChecklistItem({ task_id: taskId, is_completed: true }),
      buildChecklistItem({ task_id: taskId, is_completed: true }),
      buildChecklistItem({ task_id: taskId, is_completed: false }),
      buildChecklistItem({ task_id: taskId, is_completed: false }),
    ];
    renderModal({ task, checklistService: buildMockChecklistService(items) });
    expect(await screen.findByTestId("task-edit-tab-checklist")).toHaveTextContent("Чеклист (2/4)");
  });

  it("should show Чеклист without progress when no items", async () => {
    renderModal({ checklistService: buildMockChecklistService([]) });
    expect(await screen.findByTestId("task-edit-tab-checklist")).toHaveTextContent("Чеклист");
    expect(screen.getByTestId("task-edit-tab-checklist")).not.toHaveTextContent("(");
  });

  it("should show active items in Активно section", async () => {
    const taskId = crypto.randomUUID();
    const task = buildTask({ id: taskId });
    const items = [
      buildChecklistItem({ task_id: taskId, title: "Пункт 1", is_completed: false }),
      buildChecklistItem({ task_id: taskId, title: "Пункт 2", is_completed: true }),
    ];
    renderModal({ task, checklistService: buildMockChecklistService(items) });
    await userEvent.click(screen.getByTestId("task-edit-tab-checklist"));
    expect(await screen.findByTestId("task-edit-checklist-active-section")).toBeInTheDocument();
    expect(screen.getByText("Пункт 1")).toBeInTheDocument();
  });

  it("should show completed items in Готово section", async () => {
    const taskId = crypto.randomUUID();
    const task = buildTask({ id: taskId });
    const items = [
      buildChecklistItem({ task_id: taskId, title: "Пункт готов", is_completed: true }),
    ];
    renderModal({ task, checklistService: buildMockChecklistService(items) });
    await userEvent.click(screen.getByTestId("task-edit-tab-checklist"));
    expect(await screen.findByTestId("task-edit-checklist-done-section")).toBeInTheDocument();
    expect(screen.getByText("Пункт готов")).toBeInTheDocument();
  });

  it("should call toggle when checkbox of active item is clicked", async () => {
    const taskId = crypto.randomUUID();
    const task = buildTask({ id: taskId });
    const items = [buildChecklistItem({ task_id: taskId, title: "Пункт", is_completed: false })];
    const mockService = buildMockChecklistService(items);
    renderModal({ task, checklistService: mockService });
    await userEvent.click(screen.getByTestId("task-edit-tab-checklist"));
    const checkbox = await screen.findByTestId(`checklist-item-checkbox-${items[0].id}`);
    await userEvent.click(checkbox);
    expect(mockService.toggle).toHaveBeenCalledWith(items[0].id);
  });

  it("should create new item when text is entered and Enter is pressed", async () => {
    const taskId = crypto.randomUUID();
    const task = buildTask({ id: taskId });
    const mockService = buildMockChecklistService([]);
    renderModal({ task, checklistService: mockService });
    await userEvent.click(screen.getByTestId("task-edit-tab-checklist"));
    const input = await screen.findByTestId("task-edit-checklist-new-item-input");
    await userEvent.type(input, "Новый пункт{Enter}");
    expect(mockService.create).toHaveBeenCalledWith(taskId, "Новый пункт");
  });
});
