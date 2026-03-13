import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInboxTasks } from "./useInboxTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import {BOX} from "@/constants";

function createMockTaskService(
  overrides: Partial<Record<keyof TaskService, unknown>> = {},
): TaskService {
  return {
    getByBox: vi.fn().mockResolvedValue([]),
    complete: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as TaskService;
}

describe("useInboxTasks", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
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

  it("should call complete and refresh tasks when completeTask is called", async () => {
    const task = buildTask({ box: "inbox" });
    const mockGetByBox = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({ getByBox: mockGetByBox });
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(mockTaskService.complete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
  });

  it("should call softDelete and refresh tasks when deleteTask is called", async () => {
    const task = buildTask({ box: "inbox" });
    const mockGetByBox = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({ getByBox: mockGetByBox });
    const { result } = renderHook(() => useInboxTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    expect(mockTaskService.softDelete).toHaveBeenCalledWith(task.id);
    expect(mockGetByBox).toHaveBeenCalledTimes(2);
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

  it("should use updated service when completeTask is called after service changes", async () => {
    const task = buildTask({ box: "inbox" });
    const firstService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([task]),
    });
    const secondService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([task]),
      complete: vi.fn().mockResolvedValue(undefined),
    });

    const { result, rerender } = renderHook(
      ({ service }: { service: TaskService }) => useInboxTasks(service),
      { initialProps: { service: firstService } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ service: secondService });
    await waitFor(() => expect(secondService.getByBox).toHaveBeenCalled());

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(secondService.complete).toHaveBeenCalledWith(task.id);
    expect(firstService.complete).not.toHaveBeenCalled();
  });

  it("should use updated service when deleteTask is called after service changes", async () => {
    const task = buildTask({ box: "inbox" });
    const firstService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([task]),
    });
    const secondService = createMockTaskService({
      getByBox: vi.fn().mockResolvedValue([task]),
      softDelete: vi.fn().mockResolvedValue(undefined),
    });

    const { result, rerender } = renderHook(
      ({ service }: { service: TaskService }) => useInboxTasks(service),
      { initialProps: { service: firstService } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ service: secondService });
    await waitFor(() => expect(secondService.getByBox).toHaveBeenCalled());

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    expect(secondService.softDelete).toHaveBeenCalledWith(task.id);
    expect(firstService.softDelete).not.toHaveBeenCalled();
  });
});