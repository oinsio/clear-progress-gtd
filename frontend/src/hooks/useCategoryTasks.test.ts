import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCategoryTasks } from "./useCategoryTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

describe("useCategoryTasks", () => {
  let mockTaskService: TaskService;
  const categoryId = "cat-1";

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are fetched", async () => {
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when category has no tasks", async () => {
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("should call getByCategoryId with the given categoryId", async () => {
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith(categoryId);
  });

  it("should return category tasks after loading", async () => {
    const tasks = [
      buildTask({ category_id: categoryId }),
      buildTask({ category_id: categoryId }),
    ];
    mockTaskService = createMockTaskService({
      getByCategoryId: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual(tasks);
  });

  it("should call create with category_id and reload when createTask is called", async () => {
    const mockGetByCategoryId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({ getByCategoryId: mockGetByCategoryId });
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      title: "New task",
      box: BOX.TODAY,
      notes: "",
      category_id: categoryId,
    });
    expect(mockGetByCategoryId).toHaveBeenCalledTimes(2);
  });

  async function setupHookWithTask() {
    const task = buildTask({ category_id: categoryId });
    const mockGetByCategoryId = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({ getByCategoryId: mockGetByCategoryId });
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    return { result, task, mockGetByCategoryId };
  }

  it("should call softDelete and reload when deleteTask is called", async () => {
    const { result, task, mockGetByCategoryId } = await setupHookWithTask();

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    expect(mockTaskService.softDelete).toHaveBeenCalledWith(task.id);
    expect(mockGetByCategoryId).toHaveBeenCalledTimes(2);
  });

  it("should call moveToBox and reload when moveTask is called", async () => {
    const { result, task, mockGetByCategoryId } = await setupHookWithTask();

    await act(async () => {
      await result.current.moveTask(task.id, BOX.WEEK);
    });

    expect(mockTaskService.moveToBox).toHaveBeenCalledWith(task.id, BOX.WEEK);
    expect(mockGetByCategoryId).toHaveBeenCalledTimes(2);
  });

  it("should call update and reload when updateTask is called", async () => {
    const { result, task, mockGetByCategoryId } = await setupHookWithTask();

    await act(async () => {
      await result.current.updateTask(task.id, { title: "Updated" });
    });

    expect(mockTaskService.update).toHaveBeenCalledWith(task.id, { title: "Updated" });
    expect(mockGetByCategoryId).toHaveBeenCalledTimes(2);
  });

  it("should have empty initial tasks before loading completes", () => {
    mockTaskService = createMockTaskService({
      getByCategoryId: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => useCategoryTasks(categoryId, mockTaskService));
    expect(result.current.tasks).toEqual([]);
  });

  it("should create task with updated categoryId after categoryId changes", async () => {
    const mockGetByCategoryId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({ getByCategoryId: mockGetByCategoryId });
    const { result, rerender } = renderHook(
      ({ catId }: { catId: string }) => useCategoryTasks(catId, mockTaskService),
      { initialProps: { catId: "cat-1" } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ catId: "cat-2" });
    await waitFor(() => expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith("cat-2"));

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      title: "New task",
      box: BOX.TODAY,
      notes: "",
      category_id: "cat-2",
    });
  });

  it("should refetch when categoryId changes", async () => {
    const { rerender } = renderHook(
      ({ catId }: { catId: string }) => useCategoryTasks(catId, mockTaskService),
      { initialProps: { catId: "cat-1" } },
    );
    await waitFor(() =>
      expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith("cat-1"),
    );

    rerender({ catId: "cat-2" });
    await waitFor(() =>
      expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith("cat-2"),
    );
  });
});
