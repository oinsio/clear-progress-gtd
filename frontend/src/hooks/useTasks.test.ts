import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTasks } from "./useTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";
import type { Box } from "@/types/common";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

const syncState = { version: 0 };

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: syncState.version,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
  }),
}));

async function setup(
  taskOverrides: Parameters<typeof buildTask>[0] = {},
  serviceOverrides: Parameters<typeof createMockTaskService>[0] = {},
) {
  const task = buildTask({ box: "today", ...taskOverrides });
  const mockGetByBox = vi.fn().mockResolvedValue([task]);
  const service = createMockTaskService({ getByBox: mockGetByBox, ...serviceOverrides });
  const { result } = renderHook(() => useTasks(BOX.TODAY, service));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return { task, mockGetByBox, service, result };
}

describe("useTasks", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
    syncState.version = 0;
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
    const { task, mockGetByBox, service, result } = await setup({ is_completed: false }, {
      getById: vi.fn().mockImplementation(async () => task),
    });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(service.complete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call noncomplete and refresh when completeTask is called on a completed task", async () => {
    const { task, mockGetByBox, service, result } = await setup({ is_completed: true }, {
      getById: vi.fn().mockImplementation(async () => task),
    });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(service.noncomplete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call softDelete and refresh when deleteTask is called", async () => {
    const { task, mockGetByBox, service, result } = await setup();

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    expect(service.softDelete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call moveToBox and refresh when moveTask is called", async () => {
    const { task, mockGetByBox, service, result } = await setup();

    await act(async () => {
      await result.current.moveTask(task.id, BOX.WEEK);
    });

    expect(service.moveToBox).toHaveBeenCalledWith(task.id, BOX.WEEK);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call update and refresh when updateTask is called", async () => {
    const { task, mockGetByBox, service, result } = await setup();

    await act(async () => {
      await result.current.updateTask(task.id, { notes: "updated notes" });
    });

    expect(service.update).toHaveBeenCalledWith(task.id, { notes: "updated notes" });
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should return empty array for tasks in loading state before fetch completes", () => {
    mockTaskService = createMockTaskService({
      getByBox: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    expect(result.current.tasks).toEqual([]);
  });

  it("should call create and refresh when createTask is called", async () => {
    const { mockGetByBox, service, result } = await setup();

    await act(async () => {
      await result.current.createTask("New task");
    });

    expect(service.create).toHaveBeenCalledWith({ title: "New task", box: BOX.TODAY });
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should do nothing if task is not found when completeTask is called", async () => {
    mockTaskService = createMockTaskService({
      getById: vi.fn().mockResolvedValue(undefined),
    });
    const { result } = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask("nonexistent-id");
    });

    expect(mockTaskService.complete).not.toHaveBeenCalled();
    expect(mockTaskService.noncomplete).not.toHaveBeenCalled();
  });

  it("should return null from completeTask when task has no repeat_rule", async () => {
    const taskData = buildTask({ box: "today", is_completed: false, repeat_rule: "" });
    const service = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([taskData]),
      getById: vi.fn().mockResolvedValue(taskData),
      complete: vi.fn().mockResolvedValue({ completed: taskData, recurring: null }),
    });
    const { result } = renderHook(() => useTasks(BOX.TODAY, service));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let recurringId: string | null = "placeholder";
    await act(async () => {
      recurringId = await result.current.completeTask(taskData.id);
    });

    expect(recurringId).toBeNull();
    expect(service.complete).toHaveBeenCalledWith(taskData.id);
  });

  it("should return recurring task id from completeTask when task has repeat_rule", async () => {
    const taskData = buildTask({ box: "today", is_completed: false, repeat_rule: JSON.stringify({ type: "daily" }) });
    const recurringTask = buildTask({ id: "recurring-task-id" });
    const service = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([taskData]),
      getById: vi.fn().mockResolvedValue(taskData),
      complete: vi.fn().mockResolvedValue({ completed: taskData, recurring: recurringTask }),
    });
    const { result } = renderHook(() => useTasks(BOX.TODAY, service));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let recurringId: string | null = null;
    await act(async () => {
      recurringId = await result.current.completeTask(taskData.id);
    });

    expect(recurringId).toBe("recurring-task-id");
  });

  describe("reorderTasks", () => {
    let reorderResult: Awaited<ReturnType<typeof renderHook<ReturnType<typeof useTasks>, unknown>>>;
    let reorderedTasks: ReturnType<typeof buildTask>[];

    beforeEach(async () => {
      const taskA = buildTask({ box: "today", sort_order: 2 });
      const taskB = buildTask({ box: "today", sort_order: 1 });
      reorderedTasks = [taskB, taskA];
      mockTaskService = createMockTaskService({
        getByBox: vi.fn().mockResolvedValue([taskA, taskB]),
        reorderTasks: vi.fn().mockResolvedValue(undefined),
      });
      reorderResult = renderHook(() => useTasks(BOX.TODAY, mockTaskService));
      await waitFor(() => expect(reorderResult.result.current.isLoading).toBe(false));
      await act(async () => {
        await reorderResult.result.current.reorderTasks(reorderedTasks);
      });
    });

    it("should optimistically update tasks", () => {
      expect(reorderResult.result.current.tasks).toEqual(reorderedTasks);
    });

    it("should call reorderTasks service", () => {
      expect(mockTaskService.reorderTasks).toHaveBeenCalledWith(reorderedTasks);
    });
  });

  it("should reload when syncVersion changes", async () => {
    const mockGetByBox = vi.fn().mockResolvedValue([]);
    const service = createMockTaskService({ getByBox: mockGetByBox });

    const { rerender } = renderHook(() => useTasks(BOX.TODAY, service));
    await waitFor(() => expect(mockGetByBox).toHaveBeenCalledTimes(1));

    syncState.version = 1;
    rerender();

    await waitFor(() => expect(mockGetByBox).toHaveBeenCalledTimes(2));
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
