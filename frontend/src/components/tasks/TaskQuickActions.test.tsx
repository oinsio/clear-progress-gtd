import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskQuickActions } from "./TaskQuickActions";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { BOX } from "@/constants";

function renderQuickActions(overrides = {}) {
  const task = buildTask();
  const props = {
    task,
    goals: [],
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    onOpenEdit: vi.fn(),
    ...overrides,
  };
  render(<TaskQuickActions {...props} />);
  return props;
}

describe("TaskQuickActions", () => {
  it("should render notes button", () => {
    renderQuickActions();
    expect(screen.getByRole("button", { name: /edit notes/i })).toBeInTheDocument();
  });

  it("should render goal button", () => {
    renderQuickActions();
    expect(screen.getByRole("button", { name: /select goal/i })).toBeInTheDocument();
  });

  it("should render box button", () => {
    renderQuickActions();
    expect(screen.getByRole("button", { name: /move to box/i })).toBeInTheDocument();
  });

  it("should render full edit button", () => {
    renderQuickActions();
    expect(screen.getByRole("button", { name: /full edit/i })).toBeInTheDocument();
  });

  it("should show notes textarea when notes button is clicked", async () => {
    renderQuickActions();
    await userEvent.click(screen.getByRole("button", { name: /edit notes/i }));
    expect(screen.getByTestId("quick-notes-input")).toBeInTheDocument();
  });

  it("should hide notes textarea when notes button is clicked again", async () => {
    renderQuickActions();
    await userEvent.click(screen.getByRole("button", { name: /edit notes/i }));
    await userEvent.click(screen.getByRole("button", { name: /edit notes/i }));
    expect(screen.queryByTestId("quick-notes-input")).not.toBeInTheDocument();
  });

  it("should prefill notes textarea with task notes", async () => {
    const task = buildTask({ notes: "existing notes" });
    renderQuickActions({ task });
    await userEvent.click(screen.getByRole("button", { name: /edit notes/i }));
    expect(screen.getByTestId("quick-notes-input")).toHaveValue("existing notes");
  });

  it("should call onUpdate with new notes when notes saved via Enter", async () => {
    const task = buildTask({ notes: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onUpdate });
    await userEvent.click(screen.getByRole("button", { name: /edit notes/i }));
    const textarea = screen.getByTestId("quick-notes-input");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "new notes");
    await userEvent.keyboard("{Enter}");
    expect(onUpdate).toHaveBeenCalledWith(task.id, { notes: "new notes" });
  });

  it("should show goal list when goal button is clicked", async () => {
    const goal = buildGoal({ title: "Launch app" });
    renderQuickActions({ goals: [goal] });
    await userEvent.click(screen.getByRole("button", { name: /select goal/i }));
    expect(screen.getByText("Launch app")).toBeInTheDocument();
  });

  it("should hide goal list when goal button is clicked again", async () => {
    const goal = buildGoal({ title: "Launch app" });
    renderQuickActions({ goals: [goal] });
    await userEvent.click(screen.getByRole("button", { name: /select goal/i }));
    await userEvent.click(screen.getByRole("button", { name: /select goal/i }));
    expect(screen.queryByText("Launch app")).not.toBeInTheDocument();
  });

  it("should call onUpdate with goal_id when goal selected", async () => {
    const goal = buildGoal({ title: "Launch app" });
    const task = buildTask({ goal_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, goals: [goal], onUpdate });
    await userEvent.click(screen.getByRole("button", { name: /select goal/i }));
    await userEvent.click(screen.getByText("Launch app"));
    expect(onUpdate).toHaveBeenCalledWith(task.id, { goal_id: goal.id });
  });

  it("should show box options when box button is clicked", async () => {
    renderQuickActions();
    await userEvent.click(screen.getByRole("button", { name: /move to box/i }));
    expect(screen.getByRole("button", { name: /сегодня/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /неделя/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /позже/i })).toBeInTheDocument();
  });

  it("should call onMove with today when today selected", async () => {
    const task = buildTask();
    const onMove = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onMove });
    await userEvent.click(screen.getByRole("button", { name: /move to box/i }));
    await userEvent.click(screen.getByRole("button", { name: /сегодня/i }));
    expect(onMove).toHaveBeenCalledWith(task.id, BOX.TODAY);
  });

  it("should call onMove with week when week selected", async () => {
    const task = buildTask();
    const onMove = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onMove });
    await userEvent.click(screen.getByRole("button", { name: /move to box/i }));
    await userEvent.click(screen.getByRole("button", { name: /неделя/i }));
    expect(onMove).toHaveBeenCalledWith(task.id, BOX.WEEK);
  });

  it("should call onMove with later when later selected", async () => {
    const task = buildTask();
    const onMove = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onMove });
    await userEvent.click(screen.getByRole("button", { name: /move to box/i }));
    await userEvent.click(screen.getByRole("button", { name: /позже/i }));
    expect(onMove).toHaveBeenCalledWith(task.id, BOX.LATER);
  });

  it("should call onOpenEdit when full edit button is clicked", async () => {
    const onOpenEdit = vi.fn();
    renderQuickActions({ onOpenEdit });
    await userEvent.click(screen.getByRole("button", { name: /full edit/i }));
    expect(onOpenEdit).toHaveBeenCalled();
  });

  it("should show no goal option in goal picker", async () => {
    renderQuickActions({ goals: [buildGoal()] });
    await userEvent.click(screen.getByRole("button", { name: /select goal/i }));
    expect(screen.getByRole("button", { name: /без цели/i })).toBeInTheDocument();
  });

  it("should call onUpdate with empty goal_id when no goal selected", async () => {
    const task = buildTask({ goal_id: "some-goal-id" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, goals: [buildGoal()], onUpdate });
    await userEvent.click(screen.getByRole("button", { name: /select goal/i }));
    await userEvent.click(screen.getByRole("button", { name: /без цели/i }));
    expect(onUpdate).toHaveBeenCalledWith(task.id, { goal_id: "" });
  });
});
