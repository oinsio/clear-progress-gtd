import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTasks } from "./useTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";
import type { Box } from "@/types/common";

function createMockTaskService(
  overrides: Partial<Record<keyof TaskService, unknown>> = {},
): TaskService {
  return {
    getByBox: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    complete: vi.fn().mockResolvedValue(undefined),
    uncomplete: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    moveToBox: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as TaskService;
}

describe("useTasks", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are fetched", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when box has no tasks", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("should call getByBox with the given box", async () => {
    const { result } = renderHook(() => useTasks(BOX.WEEK, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getByBox).toHaveBeenCalledWith(BOX.WEEK);
  });

  it("should return tasks after loading", async () => {
    const tasks = [buildTask({ box: "today" }), buildTask({ box: "today" })];
    mockTaskService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual(tasks);
  });

  it("should call complete and refresh when completeTask is called on an incomplete task", async () => {
    const task = buildTask({ box: "today", is_completed: false });
    const mockGetByBox = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({
      getByBox: mockGetByBox,
      getById: vi.fn().mockResolvedValue(task),
    });
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(mockTaskService.complete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call uncomplete and refresh when completeTask is called on a completed task", async () => {
    const task = buildTask({ box: "today", is_completed: true });
    const mockGetByBox = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({
      getByBox: mockGetByBox,
      getById: vi.fn().mockResolvedValue(task),
    });
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(mockTaskService.noncomplete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call softDelete and refresh when deleteTask is called", async () => {
    const task = buildTask({ box: "today" });
    const mockGetByBox = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({ getByBox: mockGetByBox });
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    expect(mockTaskService.softDelete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call moveToBox and refresh when moveTask is called", async () => {
    const task = buildTask({ box: "today" });
    const mockGetByBox = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({ getByBox: mockGetByBox });
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveTask(task.id, BOX.WEEK);
    });

    expect(mockTaskService.moveToBox).toHaveBeenCalledWith(task.id, BOX.WEEK);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should refetch when box changes", async () => {
    const { rerender } = renderHook(
      ({ box }: { box: Box }) => useTasks(box, mockTaskService),
      { initialProps: { box: BOX.TODAY as Box } },
    );
    await waitFor(() =>
      expect(mockTaskService.getByBox).toHaveBeenCalledWith(BOX.TODAY),
    );

    rerender({ box: BOX.WEEK });
    await waitFor(() =>
      expect(mockTaskService.getByBox).toHaveBeenCalledWith(BOX.WEEK),
    );
  });
});
