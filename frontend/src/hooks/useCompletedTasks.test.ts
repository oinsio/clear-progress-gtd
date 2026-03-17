import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCompletedTasks } from "./useCompletedTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

describe("useCompletedTasks", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useCompletedTasks(mockTaskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are fetched", async () => {
    const { result } = renderHook(() => useCompletedTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no completed tasks exist", async () => {
    const { result } = renderHook(() => useCompletedTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.completedTasks).toEqual([]);
  });

  it("should call getCompleted to fetch tasks", async () => {
    const { result } = renderHook(() => useCompletedTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getCompleted).toHaveBeenCalledOnce();
  });

  it("should return completed tasks after loading", async () => {
    const completedTasks = [
      buildTask({ is_completed: true, completed_at: "2025-01-01T10:00:00.000Z" }),
      buildTask({ is_completed: true, completed_at: "2025-01-02T10:00:00.000Z" }),
    ];
    mockTaskService = createMockTaskService({
      getCompleted: vi.fn().mockResolvedValue(completedTasks),
    });
    const { result } = renderHook(() => useCompletedTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.completedTasks).toEqual(completedTasks);
  });

  it("should refetch tasks when reload is called", async () => {
    const mockGetCompleted = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({ getCompleted: mockGetCompleted });
    const { result } = renderHook(() => useCompletedTasks(mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reload();
    });

    expect(mockGetCompleted).toHaveBeenCalledTimes(2);
  });

  it("should return empty array for completedTasks before fetch completes", () => {
    mockTaskService = createMockTaskService({
      getCompleted: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => useCompletedTasks(mockTaskService));
    expect(result.current.completedTasks).toEqual([]);
  });

  it("should refetch tasks when service changes", async () => {
    const firstService = createMockTaskService({
      getCompleted: vi.fn().mockResolvedValue([]),
    });
    const newTask = buildTask({ is_completed: true });
    const secondService = createMockTaskService({
      getCompleted: vi.fn().mockResolvedValue([newTask]),
    });

    const { result, rerender } = renderHook(
      ({ service }: { service: TaskService }) => useCompletedTasks(service),
      { initialProps: { service: firstService } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ service: secondService });
    await waitFor(() =>
      expect(secondService.getCompleted).toHaveBeenCalled(),
    );
    expect(result.current.completedTasks).toEqual([newTask]);
  });
});
