import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ConfirmFullSyncDialog } from "./ConfirmFullSyncDialog";
import type { FullSyncStep } from "@/types/common";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderDialog(
  props: Partial<{
    isOpen: boolean;
    onClose: () => void;
    onSync: (onProgress: (step: FullSyncStep) => void) => Promise<void>;
  }> = {},
) {
  const defaultOnSync = vi.fn().mockResolvedValue(undefined);
  return render(
    <ConfirmFullSyncDialog
      isOpen={props.isOpen ?? true}
      onClose={props.onClose ?? vi.fn()}
      onSync={props.onSync ?? defaultOnSync}
    />,
  );
}

function createResolvingOnSync(steps: FullSyncStep[]): (onProgress: (step: FullSyncStep) => void) => Promise<void> {
  return vi.fn().mockImplementation((onProgress: (step: FullSyncStep) => void) => {
    for (const step of steps) onProgress(step);
    return Promise.resolve();
  });
}

function createHangingOnSync(): {
  onSync: (onProgress: (step: FullSyncStep) => void) => Promise<void>;
  sendProgress: (step: FullSyncStep) => void;
} {
  let capturedOnProgress: ((step: FullSyncStep) => void) | null = null;
  const onSync = vi.fn().mockImplementation(
    (onProgress: (step: FullSyncStep) => void) => {
      capturedOnProgress = onProgress;
      return new Promise<void>(() => {/* never resolves */});
    },
  );
  const sendProgress = (step: FullSyncStep) => { capturedOnProgress?.(step); };
  return { onSync, sendProgress };
}

describe("ConfirmFullSyncDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByTestId("full-sync-dialog")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    renderDialog({ isOpen: true });
    expect(screen.getByTestId("full-sync-dialog")).toBeInTheDocument();
  });

  it("should show confirmation title initially", () => {
    renderDialog();
    expect(screen.getByTestId("full-sync-dialog-title")).toHaveTextContent(
      "settings.fullSyncConfirmTitle",
    );
  });

  it("should show description text initially", () => {
    renderDialog();
    expect(screen.getByTestId("full-sync-dialog-description")).toBeInTheDocument();
  });

  it("should render cancel button initially", () => {
    renderDialog();
    expect(screen.getByTestId("full-sync-cancel-btn")).toBeInTheDocument();
  });

  it("should render start sync button initially", () => {
    renderDialog();
    expect(screen.getByTestId("full-sync-start-btn")).toBeInTheDocument();
  });

  it("should call onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByTestId("full-sync-cancel-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onSync when start button is clicked", async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSync });
    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-start-btn"));
    });
    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it("should show push step as active during push progress", async () => {
    const { onSync, sendProgress } = createHangingOnSync();
    renderDialog({ onSync });

    await act(async () => { fireEvent.click(screen.getByTestId("full-sync-start-btn")); });
    act(() => {
      sendProgress("upload_covers");
      sendProgress("push");
    });

    expect(screen.getByTestId("full-sync-step-push")).toHaveAttribute("data-active", "true");
  });

  it("should show pull step as active during pull progress", async () => {
    const { onSync, sendProgress } = createHangingOnSync();
    renderDialog({ onSync });

    await act(async () => { fireEvent.click(screen.getByTestId("full-sync-start-btn")); });
    act(() => {
      sendProgress("upload_covers");
      sendProgress("push");
      sendProgress("pull");
    });

    expect(screen.getByTestId("full-sync-step-pull")).toHaveAttribute("data-active", "true");
  });

  it("should show upload_covers step as active during upload_covers progress", async () => {
    const { onSync, sendProgress } = createHangingOnSync();
    renderDialog({ onSync });

    await act(async () => { fireEvent.click(screen.getByTestId("full-sync-start-btn")); });
    act(() => { sendProgress("upload_covers"); });

    expect(screen.getByTestId("full-sync-step-upload-covers")).toHaveAttribute("data-active", "true");
  });

  it("should show download_covers step as active during download_covers progress", async () => {
    const { onSync, sendProgress } = createHangingOnSync();
    renderDialog({ onSync });

    await act(async () => { fireEvent.click(screen.getByTestId("full-sync-start-btn")); });
    act(() => {
      sendProgress("upload_covers");
      sendProgress("push");
      sendProgress("pull");
      sendProgress("download_covers");
    });

    expect(screen.getByTestId("full-sync-step-download-covers")).toHaveAttribute("data-active", "true");
  });

  it("should show success message when done", async () => {
    const onSync = createResolvingOnSync(["upload_covers", "push", "pull", "download_covers", "done"]);
    renderDialog({ onSync });

    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-start-btn"));
    });

    expect(screen.getByTestId("full-sync-success")).toBeInTheDocument();
  });

  it("should show error message when sync fails", async () => {
    const onSync = createResolvingOnSync(["push", "error"]);
    renderDialog({ onSync });

    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-start-btn"));
    });

    expect(screen.getByTestId("full-sync-error")).toBeInTheDocument();
  });

  it("should show close button after done", async () => {
    const onSync = createResolvingOnSync(["done"]);
    renderDialog({ onSync });

    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-start-btn"));
    });

    expect(screen.getByTestId("full-sync-close-btn")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked after done", async () => {
    const onClose = vi.fn();
    const onSync = createResolvingOnSync(["done"]);
    renderDialog({ onClose, onSync });

    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-start-btn"));
    });

    fireEvent.click(screen.getByTestId("full-sync-close-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should disable start button while syncing", async () => {
    const { onSync, sendProgress } = createHangingOnSync();
    renderDialog({ onSync });

    await act(async () => { fireEvent.click(screen.getByTestId("full-sync-start-btn")); });
    act(() => { sendProgress("upload_covers"); });

    expect(screen.getByTestId("full-sync-start-btn")).toBeDisabled();
  });
});
