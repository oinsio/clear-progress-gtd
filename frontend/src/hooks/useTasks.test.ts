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
    noncomplete: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    moveToBox: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as TaskService;
}

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
