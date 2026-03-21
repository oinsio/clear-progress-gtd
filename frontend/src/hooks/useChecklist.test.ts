import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChecklist } from "./useChecklist";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
  }),
}));
import type { ChecklistService } from "@/services/ChecklistService";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";

function createMockChecklistService(
  overrides: Partial<Record<keyof ChecklistService, unknown>> = {},
): ChecklistService {
  return {
    getByTaskId: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    toggle: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    getProgress: vi.fn().mockResolvedValue({ completed: 0, total: 0 }),
    ...overrides,
  } as unknown as ChecklistService;
}

describe("useChecklist", () => {
  let mockChecklistService: ChecklistService;

  beforeEach(() => {
    mockChecklistService = createMockChecklistService();
  });

  async function setupHookWithItem(taskId: string) {
    const item = buildChecklistItem({ task_id: taskId });
    const mockGetByTaskId = vi.fn().mockResolvedValue([item]);
    mockChecklistService = createMockChecklistService({
      getByTaskId: mockGetByTaskId,
    });
    const { result } = renderHook(() =>
      useChecklist(taskId, mockChecklistService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    return { item, mockGetByTaskId, result };
  }

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() =>
      useChecklist("task-1", mockChecklistService),
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after items are fetched", async () => {
    const { result } = renderHook(() =>
      useChecklist("task-1", mockChecklistService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when task has no checklist items", async () => {
    const { result } = renderHook(() =>
      useChecklist("task-1", mockChecklistService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it("should return items after loading", async () => {
    const taskId = "task-1";
    const items = [
      buildChecklistItem({ task_id: taskId }),
      buildChecklistItem({ task_id: taskId }),
    ];
    mockChecklistService = createMockChecklistService({
      getByTaskId: vi.fn().mockResolvedValue(items),
    });
    const { result } = renderHook(() =>
      useChecklist(taskId, mockChecklistService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual(items);
  });

  it("should return progress after loading", async () => {
    mockChecklistService = createMockChecklistService({
      getProgress: vi.fn().mockResolvedValue({ completed: 2, total: 5 }),
    });
    const { result } = renderHook(() =>
      useChecklist("task-1", mockChecklistService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.progress).toEqual({ completed: 2, total: 5 });
  });

  it("should call create and refresh when createItem is called", async () => {
    const mockGetByTaskId = vi.fn().mockResolvedValue([]);
    const mockGetProgress = vi.fn().mockResolvedValue({ completed: 0, total: 0 });
    mockChecklistService = createMockChecklistService({
      getByTaskId: mockGetByTaskId,
      getProgress: mockGetProgress,
    });
    const { result } = renderHook(() =>
      useChecklist("task-1", mockChecklistService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createItem("New item");
    });

    expect(mockChecklistService.create).toHaveBeenCalledWith(
      "task-1",
      "New item",
    );
    expect(mockGetByTaskId).toHaveBeenCalledTimes(2);
  });

  it("should call toggle and refresh when toggleItem is called", async () => {
    const { item, mockGetByTaskId, result } = await setupHookWithItem("task-1");

    await act(async () => {
      await result.current.toggleItem(item.id);
    });

    expect(mockChecklistService.toggle).toHaveBeenCalledWith(item.id);
    expect(mockGetByTaskId).toHaveBeenCalledTimes(2);
  });

  it("should call softDelete and refresh when deleteItem is called", async () => {
    const { item, mockGetByTaskId, result } = await setupHookWithItem("task-1");

    await act(async () => {
      await result.current.deleteItem(item.id);
    });

    expect(mockChecklistService.softDelete).toHaveBeenCalledWith(item.id);
    expect(mockGetByTaskId).toHaveBeenCalledTimes(2);
  });

  it("should call update and refresh when updateItem is called", async () => {
    const { item, mockGetByTaskId, result } = await setupHookWithItem("task-1");

    await act(async () => {
      await result.current.updateItem(item.id, "Updated title");
    });

    expect(mockChecklistService.update).toHaveBeenCalledWith(item.id, {
      title: "Updated title",
    });
    expect(mockGetByTaskId).toHaveBeenCalledTimes(2);
  });
});
