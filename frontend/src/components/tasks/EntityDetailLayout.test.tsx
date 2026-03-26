import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MapPin } from "lucide-react";
import { EntityDetailLayout, type EntityDetailLayoutProps } from "./EntityDetailLayout";
import type { UseSettingsReturn } from "@/hooks/useSettings";

vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/useIsUnsynced");
vi.mock("@/hooks/useIsDesktop");
vi.mock("@/hooks/usePanelSplit");
vi.mock("@/hooks/useSettings");

import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSettings } from "@/hooks/useSettings";

const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUseIsUnsynced = vi.mocked(useIsUnsynced);
const mockUseIsDesktop = vi.mocked(useIsDesktop);
const mockUsePanelSplit = vi.mocked(usePanelSplit);
const mockUseSettings = vi.mocked(useSettings);

function buildSettingsHook(overrides: Partial<UseSettingsReturn> = {}): UseSettingsReturn {
  return {
    defaultBox: "inbox",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn().mockResolvedValue(undefined),
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildProps(overrides: Partial<EntityDetailLayoutProps> = {}): EntityDetailLayoutProps {
  return {
    entity: { name: "Работа", updated_at: "2025-01-01T00:00:00.000Z" },
    isLoading: false,
    tasks: [],
    goals: [],
    contexts: [],
    categories: [],
    icon: MapPin,
    panelMode: null,
    backRoute: "/contexts",
    testIdPrefix: "context",
    i18nKeys: {
      back: "context.back",
      title: "context.title",
      notFound: "context.notFound",
      deleteLabel: "context.deleteLabel",
      editName: "context.editName",
      saveName: "context.saveName",
    },
    onSaveEntity: vi.fn().mockResolvedValue(undefined),
    onDeleteEntity: vi.fn().mockResolvedValue(undefined),
    onCreateTask: vi.fn().mockResolvedValue(undefined),
    onCompleteTask: vi.fn(),
    onUpdateTask: vi.fn().mockResolvedValue(undefined),
    onMoveTask: vi.fn().mockResolvedValue(undefined),
    onDeleteTask: vi.fn(),
    onModeChange: vi.fn(),
    ...overrides,
  };
}

function renderLayout(overrides: Partial<EntityDetailLayoutProps> = {}) {
  const props = buildProps(overrides);
  render(
    <MemoryRouter>
      <EntityDetailLayout {...props} />
    </MemoryRouter>,
  );
  return props;
}

describe("EntityDetailLayout — inline task creation", () => {
  beforeEach(() => {
    mockUsePanelSide.mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() });
    mockUsePanelOpen.mockReturnValue({ isPanelOpen: false, togglePanelOpen: vi.fn() });
    mockUseIsUnsynced.mockReturnValue(false);
    mockUseIsDesktop.mockReturnValue(false);
    mockUsePanelSplit.mockReturnValue({
      ratio: 0.5,
      setRatio: vi.fn(),
      containerRef: { current: null },
      handleResizeMouseDown: vi.fn(),
    });
    mockUseSettings.mockReturnValue(buildSettingsHook());
  });

  it("should render the FAB add-task button", () => {
    renderLayout();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("should show inline input when FAB is clicked", () => {
    renderLayout();
    fireEvent.click(screen.getByTestId("add-task-button"));
    expect(screen.getByTestId("add-task-input")).toBeInTheDocument();
  });

  it("should hide inline input after Escape", () => {
    renderLayout();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
  });

  it("should call onCreateTask with title and defaultBox when Enter is pressed", async () => {
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    renderLayout({ onCreateTask });
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Новая задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(onCreateTask).toHaveBeenCalledWith("Новая задача", "inbox", "");
    });
  });

  it("should hide inline input after successful task creation", async () => {
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    renderLayout({ onCreateTask });
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
    });
  });
});
