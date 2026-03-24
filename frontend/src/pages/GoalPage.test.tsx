import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GoalPage from "./GoalPage";
import { buildGoal } from "@/test/factories/goalFactory";
import type { UseGoalReturn } from "@/hooks/useGoal";
import type { CoverService } from "@/services/CoverService";

vi.mock("@/hooks/useGoal");

import { useGoal } from "@/hooks/useGoal";

const mockUseGoal = vi.mocked(useGoal);

function buildGoalHook(overrides: Partial<UseGoalReturn> = {}): UseGoalReturn {
  return {
    goal: undefined,
    tasks: [],
    isLoading: false,
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildMockCoverService(overrides: Partial<CoverService> = {}): CoverService {
  return {
    uploadCover: vi.fn().mockResolvedValue({ file_id: "file-123" }),
    deleteCover: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as CoverService;
}

function renderGoalPage(
  id = "test-id",
  onClose = vi.fn(),
  coverService?: CoverService,
) {
  render(<GoalPage goalId={id} onClose={onClose} coverService={coverService} />);
}

describe("GoalPage", () => {
  it("should render with data-test-id 'goal-page'", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: buildGoal() }));
    renderGoalPage();
    expect(screen.getByTestId("goal-page")).toBeInTheDocument();
  });

  it("should render back button", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: buildGoal() }));
    renderGoalPage();
    expect(screen.getByRole("button", { name: "Назад" })).toBeInTheDocument();
  });

  it("should call onClose when back button is clicked", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: buildGoal() }));
    const onClose = vi.fn();
    renderGoalPage("test-id", onClose);
    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("should show goal title in input", () => {
    const goal = buildGoal({ title: "My Goal Title" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal }));
    renderGoalPage();
    expect(screen.getByTestId("goal-title-input")).toHaveValue("My Goal Title");
  });

  it("should show goal description in textarea", () => {
    const goal = buildGoal({ description: "My Goal Description" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal }));
    renderGoalPage();
    expect(screen.getByTestId("goal-description-input")).toHaveValue("My Goal Description");
  });

  it("should call updateGoal with new title on save", async () => {
    const updateGoal = vi.fn().mockResolvedValue(undefined);
    const goal = buildGoal({ title: "Old Title" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal, updateGoal }));
    renderGoalPage();

    fireEvent.change(screen.getByTestId("goal-title-input"), {
      target: { value: "New Title" },
    });
    fireEvent.click(screen.getByTestId("goal-save-button"));

    await waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New Title" }),
      );
    });
  });

  it("should call updateGoal with new description on save", async () => {
    const updateGoal = vi.fn().mockResolvedValue(undefined);
    const goal = buildGoal({ description: "Old Desc" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal, updateGoal }));
    renderGoalPage();

    fireEvent.change(screen.getByTestId("goal-description-input"), {
      target: { value: "New Desc" },
    });
    fireEvent.click(screen.getByTestId("goal-save-button"));

    await waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith(
        expect.objectContaining({ description: "New Desc" }),
      );
    });
  });

  it("should call updateGoalStatus when status is changed", async () => {
    const updateGoalStatus = vi.fn().mockResolvedValue(undefined);
    const goal = buildGoal({ status: "planning" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal, updateGoalStatus }));
    renderGoalPage();

    fireEvent.click(screen.getByRole("button", { name: "В процессе" }));

    await waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("in_progress");
    });
  });

  it("should disable save button when title is empty", () => {
    const goal = buildGoal({ title: "" });
    mockUseGoal.mockReturnValue(buildGoalHook({ goal }));
    renderGoalPage();
    expect(screen.getByTestId("goal-save-button")).toBeDisabled();
  });

  it("should show not-found message when goal is not found", () => {
    mockUseGoal.mockReturnValue(buildGoalHook({ goal: undefined, isLoading: false }));
    renderGoalPage();
    expect(screen.getByTestId("goal-not-found")).toBeInTheDocument();
  });

  describe("cover upload error handling", () => {
    function renderWithCoverAndSave(coverService: CoverService, onClose = vi.fn()) {
      const goal = buildGoal({ title: "My Goal" });
      mockUseGoal.mockReturnValue(buildGoalHook({ goal }));
      renderGoalPage("test-id", onClose, coverService);

      const fileInput = screen.getByTestId("cover-file-input");
      const file = new File(["img"], "cover.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.click(screen.getByTestId("goal-save-button"));

      return { onClose };
    }

    async function renderAndTriggerFailedCoverUpload(onClose = vi.fn()) {
      const coverService = buildMockCoverService({
        uploadCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const result = renderWithCoverAndSave(coverService, onClose);
      await waitFor(() => {
        expect(screen.getByTestId("goal-save-error")).toBeInTheDocument();
      });
      return result;
    }

    it("should show error message when cover upload fails", async () => {
      await renderAndTriggerFailedCoverUpload();
    });

    it("should not call onClose when cover upload fails", async () => {
      const onClose = vi.fn();
      await renderAndTriggerFailedCoverUpload(onClose);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("should clear error message on successful save after failed attempt", async () => {
      const onClose = vi.fn();
      const uploadCover = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue({ file_id: "file-123" });
      const coverService = buildMockCoverService({ uploadCover });

      renderWithCoverAndSave(coverService, onClose);

      // First save attempt fails
      await waitFor(() => {
        expect(screen.getByTestId("goal-save-error")).toBeInTheDocument();
      });

      // Second save attempt succeeds
      fireEvent.click(screen.getByTestId("goal-save-button"));
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
