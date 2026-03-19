import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GoalCreateSheet } from "./GoalCreateSheet";

function renderGoalCreateSheet(overrides: {
  onSave?: ReturnType<typeof vi.fn>;
  onClose?: ReturnType<typeof vi.fn>;
} = {}) {
  const onSave = overrides.onSave ?? vi.fn().mockResolvedValue(undefined);
  const onClose = overrides.onClose ?? vi.fn();
  render(<GoalCreateSheet onSave={onSave} onClose={onClose} />);
  return { onSave, onClose };
}

describe("GoalCreateSheet", () => {
  it("should render with data-test-id 'goal-create-sheet'", () => {
    renderGoalCreateSheet();
    expect(screen.getByTestId("goal-create-sheet")).toBeInTheDocument();
  });

  it("should render a backdrop", () => {
    renderGoalCreateSheet();
    expect(screen.getByTestId("goal-create-sheet-backdrop")).toBeInTheDocument();
  });

  it("should call onClose when backdrop is clicked", () => {
    const { onClose } = renderGoalCreateSheet();
    fireEvent.click(screen.getByTestId("goal-create-sheet-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should render close button with aria-label 'Закрыть'", () => {
    renderGoalCreateSheet();
    expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    const { onClose } = renderGoalCreateSheet();
    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should render title 'Новая цель' in header", () => {
    renderGoalCreateSheet();
    expect(screen.getByText("Новая цель")).toBeInTheDocument();
  });

  it("should render title input with label", () => {
    renderGoalCreateSheet();
    expect(screen.getByTestId("goal-create-title-input")).toBeInTheDocument();
    expect(screen.getByLabelText("Название")).toBeInTheDocument();
  });

  it("should render description input with label", () => {
    renderGoalCreateSheet();
    expect(screen.getByTestId("goal-create-description-input")).toBeInTheDocument();
    expect(screen.getByLabelText("Описание")).toBeInTheDocument();
  });

  it("should render status segmented control", () => {
    renderGoalCreateSheet();
    expect(screen.getByRole("button", { name: "Планирую" })).toBeInTheDocument();
  });

  it("should render 'Отмена' button in footer", () => {
    renderGoalCreateSheet();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("should call onClose when 'Отмена' button is clicked", () => {
    const { onClose } = renderGoalCreateSheet();
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should render 'Создать' button in footer", () => {
    renderGoalCreateSheet();
    expect(screen.getByTestId("goal-create-save-button")).toBeInTheDocument();
    expect(screen.getByTestId("goal-create-save-button")).toHaveTextContent("Создать");
  });

  it("should disable save button when title is empty", () => {
    renderGoalCreateSheet();
    expect(screen.getByTestId("goal-create-save-button")).toBeDisabled();
  });

  it("should enable save button when title is entered", () => {
    renderGoalCreateSheet();
    fireEvent.change(screen.getByTestId("goal-create-title-input"), {
      target: { value: "My Goal" },
    });
    expect(screen.getByTestId("goal-create-save-button")).not.toBeDisabled();
  });

  it("should call onSave with title, description and status on save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderGoalCreateSheet({ onSave });

    fireEvent.change(screen.getByTestId("goal-create-title-input"), {
      target: { value: "My Goal" },
    });
    fireEvent.change(screen.getByTestId("goal-create-description-input"), {
      target: { value: "My Description" },
    });
    fireEvent.click(screen.getByTestId("goal-create-save-button"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: "My Goal",
        description: "My Description",
        status: "planning",
        cover_file_id: "",
      });
    });
  });
});
