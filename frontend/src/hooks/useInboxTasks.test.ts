import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInboxTasks } from "./useInboxTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import {BOX} from "@/constants";
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

describe("useInboxTasks", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
    syncState.version = 0;
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are fetched", async () => {
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when inbox has no tasks", async () => {
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("should call getByBox with BOX.INBOX to fetch tasks", async () => {
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getByBox).toHaveBeenCalledWith(BOX.INBOX);
  });

  it("should return inbox tasks after loading", async () => {
    const inboxTasks = [
      buildTask({ box: "inbox", sort_order: 1 }),
      buildTask({ box: "inbox", sort_order: 2 }),
    ];
    mockTaskService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue(inboxTasks),
    });
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual(inboxTasks);
  });

  it.each([
    {
      label: "completeTask",
      hookAction: (hook: ReturnType<typeof useInboxTasks>, taskId: string) =>
        hook.completeTask(taskId),
      serviceMethod: "complete" as const,
    },
    {
      label: "deleteTask",
      hookAction: (hook: ReturnType<typeof useInboxTasks>, taskId: string) =>
        hook.deleteTask(taskId),
      serviceMethod: "softDelete" as const,
    },
  ])(
    "should call $serviceMethod and refresh tasks when $label is called",
    async ({ hookAction, serviceMethod }) => {
      const task = buildTask({ box: "inbox" });
      const mockGetByBox = vi.fn().mockResolvedValue([task]);
      mockTaskService = createMockTaskService({ getByBox: mockGetByBox });
      const { result } = renderHook(() => useInboxTasks(mockTaskService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await hookAction(result.current, task.id);
      });

      expect(mockTaskService[serviceMethod]).toHaveBeenCalledWith(task.id);
      expect(mockGetByBox).toHaveBeenCalledTimes(2);
    },
  );

  it("should reload when syncVersion changes", async () => {
    const mockGetByBox = vi.fn().mockResolvedValue([]);
    const service = createMockTaskService({ getByBox: mockGetByBox });

    const { rerender } = renderHook(() => useInboxTasks(service));
    await waitFor(() => expect(mockGetByBox).toHaveBeenCalledTimes(1));

    syncState.version = 1;
    rerender();

    await waitFor(() => expect(mockGetByBox).toHaveBeenCalledTimes(2));
  });

  it("should return empty array for tasks in loading state before fetch completes", () => {
    mockTaskService = createMockTaskService({
      getByBox: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    expect(result.current.tasks).toEqual([]);
  });

  it("should refetch tasks when taskService changes", async () => {
    const newTask = buildTask({ box: "inbox" });
    const firstService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([]),
    });
    const secondService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([newTask]),
    });

    const { result, rerender } = renderHook(
      ({ service }: { service: TaskService }) => useInboxTasks(service),
      { initialProps: { service: firstService } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ service: secondService });
    await waitFor(() =>
      expect(secondService.getByBox).toHaveBeenCalledWith(BOX.INBOX),
    );
    expect(result.current.tasks).toEqual([newTask]);
  });

  it.each([
    {
      label: "completeTask",
      serviceMethod: "complete" as const,
      hookAction: (hook: ReturnType<typeof useInboxTasks>, taskId: string) =>
        hook.completeTask(taskId),
    },
    {
      label: "deleteTask",
      serviceMethod: "softDelete" as const,
      hookAction: (hook: ReturnType<typeof useInboxTasks>, taskId: string) =>
        hook.deleteTask(taskId),
    },
  ])(
    "should use updated service when $label is called after service changes",
    async ({ serviceMethod, hookAction }) => {
      const task = buildTask({ box: "inbox" });
      const firstService = createMockTaskService({
        getByBox: vi.fn().mockResolvedValue([task]),
      });
      const secondService = createMockTaskService({
        getByBox: vi.fn().mockResolvedValue([task]),
        [serviceMethod]: vi.fn().mockResolvedValue(undefined),
      });

      const { result, rerender } = renderHook(
        ({ service }: { service: TaskService }) => useInboxTasks(service),
        { initialProps: { service: firstService } },
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      rerender({ service: secondService });
      await waitFor(() => expect(secondService.getByBox).toHaveBeenCalled());

      await act(async () => {
        await hookAction(result.current, task.id);
      });

      expect(secondService[serviceMethod]).toHaveBeenCalledWith(task.id);
      expect(firstService[serviceMethod]).not.toHaveBeenCalled();
    },
  );
});