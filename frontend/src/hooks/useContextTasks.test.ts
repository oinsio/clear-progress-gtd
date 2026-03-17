import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContextTasks } from "./useContextTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

describe("useContextTasks", () => {
  let mockTaskService: TaskService;
  const contextId = "ctx-1";

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are fetched", async () => {
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when context has no tasks", async () => {
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("should call getByContextId with the given contextId", async () => {
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getByContextId).toHaveBeenCalledWith(contextId);
  });

  it("should return context tasks after loading", async () => {
    const tasks = [
      buildTask({ context_id: contextId }),
      buildTask({ context_id: contextId }),
    ];
    mockTaskService = createMockTaskService({
      getByContextId: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual(tasks);
  });

  it("should call create with context_id and reload when createTask is called", async () => {
    const mockGetByContextId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({ getByContextId: mockGetByContextId });
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      title: "New task",
      box: BOX.TODAY,
      notes: "",
      context_id: contextId,
    });
    expect(mockGetByContextId).toHaveBeenCalledTimes(2);
  });

  async function setupHookWithTask() {
    const task = buildTask({ context_id: contextId });
    const mockGetByContextId = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({ getByContextId: mockGetByContextId });
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    return { result, task, mockGetByContextId };
  }

  it("should call softDelete and reload when deleteTask is called", async () => {
    const { result, task, mockGetByContextId } = await setupHookWithTask();

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    expect(mockTaskService.softDelete).toHaveBeenCalledWith(task.id);
    expect(mockGetByContextId).toHaveBeenCalledTimes(2);
  });

  it("should call moveToBox and reload when moveTask is called", async () => {
    const { result, task, mockGetByContextId } = await setupHookWithTask();

    await act(async () => {
      await result.current.moveTask(task.id, BOX.WEEK);
    });

    expect(mockTaskService.moveToBox).toHaveBeenCalledWith(task.id, BOX.WEEK);
    expect(mockGetByContextId).toHaveBeenCalledTimes(2);
  });

  it("should call update and reload when updateTask is called", async () => {
    const { result, task, mockGetByContextId } = await setupHookWithTask();

    await act(async () => {
      await result.current.updateTask(task.id, { title: "Updated" });
    });

    expect(mockTaskService.update).toHaveBeenCalledWith(task.id, { title: "Updated" });
    expect(mockGetByContextId).toHaveBeenCalledTimes(2);
  });

  it("should have empty initial tasks before loading completes", () => {
    mockTaskService = createMockTaskService({
      getByContextId: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => useContextTasks(contextId, mockTaskService));
    expect(result.current.tasks).toEqual([]);
  });

  it("should create task with updated contextId after contextId changes", async () => {
    const mockGetByContextId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({ getByContextId: mockGetByContextId });
    const { result, rerender } = renderHook(
      ({ ctxId }: { ctxId: string }) => useContextTasks(ctxId, mockTaskService),
      { initialProps: { ctxId: "ctx-1" } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ ctxId: "ctx-2" });
    await waitFor(() => expect(mockTaskService.getByContextId).toHaveBeenCalledWith("ctx-2"));

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      title: "New task",
      box: BOX.TODAY,
      notes: "",
      context_id: "ctx-2",
    });
  });

  it("should refetch when contextId changes", async () => {
    const { rerender } = renderHook(
      ({ ctxId }: { ctxId: string }) => useContextTasks(ctxId, mockTaskService),
      { initialProps: { ctxId: "ctx-1" } },
    );
    await waitFor(() =>
      expect(mockTaskService.getByContextId).toHaveBeenCalledWith("ctx-1"),
    );

    rerender({ ctxId: "ctx-2" });
    await waitFor(() =>
      expect(mockTaskService.getByContextId).toHaveBeenCalledWith("ctx-2"),
    );
  });
});
