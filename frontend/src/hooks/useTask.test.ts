import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTask } from "./useTask";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";

function createMockTaskService(
  overrides: Partial<Record<keyof TaskService, unknown>> = {},
): TaskService {
  return {
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    complete: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    moveToBox: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as TaskService;
}

describe("useTask", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() =>
      useTask("task-1", mockTaskService),
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after task is fetched", async () => {
    const { result } = renderHook(() =>
      useTask("task-1", mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return undefined when task is not found", async () => {
    const { result } = renderHook(() =>
      useTask("nonexistent", mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.task).toBeUndefined();
  });

  it("should return the task after loading", async () => {
    const task = buildTask();
    mockTaskService = createMockTaskService({
      getById: vi.fn().mockResolvedValue(task),
    });
    const { result } = renderHook(() =>
      useTask(task.id, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.task).toEqual(task);
  });

  it("should call getById with the given id", async () => {
    const { result } = renderHook(() =>
      useTask("task-abc", mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getById).toHaveBeenCalledWith("task-abc");
  });

  it("should call update and refresh when updateTask is called", async () => {
    const task = buildTask();
    const updatedTask = { ...task, title: "Updated" };
    const mockGetById = vi
      .fn()
      .mockResolvedValueOnce(task)
      .mockResolvedValueOnce(updatedTask);
    mockTaskService = createMockTaskService({ getById: mockGetById });
    const { result } = renderHook(() =>
      useTask(task.id, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateTask({ title: "Updated" });
    });

    expect(mockTaskService.update).toHaveBeenCalledWith(task.id, {
      title: "Updated",
    });
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("should call complete and refresh when completeTask is called", async () => {
    const task = buildTask();
    const mockGetById = vi.fn().mockResolvedValue(task);
    mockTaskService = createMockTaskService({ getById: mockGetById });
    const { result } = renderHook(() =>
      useTask(task.id, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask();
    });

    expect(mockTaskService.complete).toHaveBeenCalledWith(task.id);
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("should call softDelete when deleteTask is called", async () => {
    const task = buildTask();
    mockTaskService = createMockTaskService({
      getById: vi.fn().mockResolvedValue(task),
    });
    const { result } = renderHook(() =>
      useTask(task.id, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTask();
    });

    expect(mockTaskService.softDelete).toHaveBeenCalledWith(task.id);
  });

  it("should call moveToBox and refresh when moveTask is called", async () => {
    const task = buildTask({ box: "inbox" });
    const mockGetById = vi.fn().mockResolvedValue(task);
    mockTaskService = createMockTaskService({ getById: mockGetById });
    const { result } = renderHook(() =>
      useTask(task.id, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveTask(BOX.TODAY);
    });

    expect(mockTaskService.moveToBox).toHaveBeenCalledWith(task.id, BOX.TODAY);
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("should not call update when task is undefined", async () => {
    const { result } = renderHook(() =>
      useTask("nonexistent", mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateTask({ title: "X" });
    });

    expect(mockTaskService.update).not.toHaveBeenCalled();
  });
});
